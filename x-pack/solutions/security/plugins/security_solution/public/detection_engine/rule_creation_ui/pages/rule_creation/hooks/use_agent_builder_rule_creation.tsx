/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toMountPoint } from '@kbn/react-kibana-mount';
import type { BrowserChatEvent } from '@kbn/agent-builder-browser/events';
import {
  isToolProgressEvent,
  isToolResultEvent,
  isToolCallEvent,
  isReasoningEvent,
  isThinkingCompleteEvent,
  isConversationCreatedEvent,
  isConversationUpdatedEvent,
  isRoundCompleteEvent,
  type ConversationIdSetEvent,
  type ConversationCreatedEvent,
  type ConversationUpdatedEvent,
  type RoundCompleteEvent,
} from '@kbn/agent-builder-common';
import { isConversationIdSetEvent } from '@kbn/agent-builder-common/chat/events';
import type { VersionedAttachment } from '@kbn/agent-builder-common/attachments';
import { stringifyZodError } from '@kbn/zod-helpers';
import { v4 as uuidv4 } from 'uuid';
import type { ActionTypeRegistryContract } from '@kbn/triggers-actions-ui-plugin/public';
import { useKibana } from '../../../../../common/lib/kibana';
import { useAppToasts } from '../../../../../common/hooks/use_app_toasts';
import {
  RuleResponse,
  type RuleCreateProps,
} from '../../../../../../common/api/detection_engine/model/rule_schema';
import { getStepsData } from '../../../../common/helpers';
import type { FormHook } from '../../../../../shared_imports';
import type {
  DefineStepRule,
  AboutStepRule,
  ScheduleStepRule,
  ActionsStepRule,
} from '../../../../common/types';
import { RuleUpdateConfirmationToast } from '../components/rule_update_confirmation_toast';
import {
  THREAT_HUNTING_AGENT_ID,
  SecurityAgentBuilderAttachments,
} from '../../../../../../common/constants';
import { formatRule } from '../helpers';

const SECURITY_CREATE_DETECTION_RULE_TOOL_ID = 'security.create_detection_rule';

const parseRuleResponse = (
  ruleData: unknown
): { success: boolean; data?: RuleResponse; error?: unknown } => {
  if (typeof ruleData !== 'object' || ruleData == null) {
    return { success: false, error: 'Invalid rule data' };
  }

  const now = new Date().toISOString();
  // Values required by rule response schema
  const placeholderFields = {
    version: 1,
    enabled: false,
    id: uuidv4(),
    rule_id: uuidv4(),
    immutable: false,
    rule_source: {
      type: 'internal',
    },
    updated_at: now,
    updated_by: 'AI Rule Creation',
    created_at: now,
    created_by: 'AI Rule Creation',
    revision: 0,
  };

  const parseResult = RuleResponse.safeParse({ ...ruleData, ...placeholderFields });
  if (parseResult.success) {
    return { success: true, data: parseResult.data };
  }
  return { success: false, error: parseResult.error };
};

export interface UseAgentBuilderRuleCreationResult {
  isThinking: boolean;
  shouldShowSkeleton: boolean;
  updateRuleFromAgentBuilder: (rule: RuleResponse) => void;
}

export const useAgentBuilderRuleCreation = (
  defineStepForm: FormHook<DefineStepRule, DefineStepRule>,
  aboutStepForm: FormHook<AboutStepRule, AboutStepRule>,
  scheduleStepForm: FormHook<ScheduleStepRule, ScheduleStepRule>,
  actionsStepForm: FormHook<ActionsStepRule, ActionsStepRule>,
  actionTypeRegistry: ActionTypeRegistryContract
): UseAgentBuilderRuleCreationResult => {
  const { services } = useKibana();
  const { agentBuilder, i18n: i18nStart, theme } = services;
  const { addSuccess, addWarning, api: toasts } = useAppToasts();
  const location = useLocation();
  const [isThinking, setIsThinking] = useState(false);
  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const pendingRuleRef = useRef<RuleResponse | null>(null);
  const isFirstRuleCreationRef = useRef(true);
  const formUpdatedRef = useRef(false);
  const detectionRuleToolCallIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const ruleAttachmentIdRef = useRef<string | null>(null);
  const pendingRuleForAttachmentRef = useRef<RuleResponse | null>(null);
  const updateAttachmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAttachmentVersionRef = useRef<number | null>(null);
  const isUpdatingFromAttachmentRef = useRef(false);

  // Check if page was opened from AI rule creation dropdown
  const isFromAiRuleCreation = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('fromAiRuleCreation') === 'true';
  }, [location.search]);

  const updateRuleFromAgentBuilder = useCallback(
    (rule: RuleResponse) => {
      const stepsData = getStepsData({ rule });

      // Update all form steps with the rule data
      defineStepForm.updateFieldValues(stepsData.defineRuleData);
      aboutStepForm.updateFieldValues(stepsData.aboutRuleData);
      scheduleStepForm.updateFieldValues(stepsData.scheduleRuleData);
      actionsStepForm.updateFieldValues(stepsData.ruleActionsData);

      addSuccess({
        title: 'Rule form updated',
        text: 'The rule form has been automatically updated with the AI-generated rule.',
      });
    },
    [defineStepForm, aboutStepForm, scheduleStepForm, actionsStepForm, addSuccess]
  );

  const findAndUpdateRuleAttachment = useCallback(
    (rule: RuleResponse) => {
      if (!agentBuilder?.setConversationFlyoutActiveConfig) {
        // eslint-disable-next-line no-console
        console.warn(
          '[useAgentBuilderRuleCreation] setConversationFlyoutActiveConfig not available for rule attachment update'
        );
        return;
      }

      try {
        // Get the attachment ID from ref (set when conversation is created)
        const attachmentId = ruleAttachmentIdRef.current;

        if (!attachmentId) {
          // eslint-disable-next-line no-console
          console.warn('[useAgentBuilderRuleCreation] No rule attachment ID found to update', {
            rule_name: rule.name,
          });
          return;
        }

        // Update the attachment with the new rule data
        const ruleData = {
          text: JSON.stringify(rule),
          attachmentLabel: rule.name || 'Detection Rule',
        };

        // Update the active chat flyout configuration with the updated attachment
        // Preserve existing config (sessionTag, agentId) to avoid resetting the conversation
        agentBuilder.setConversationFlyoutActiveConfig({
          sessionTag: 'security',
          agentId: THREAT_HUNTING_AGENT_ID,
          newConversation: false,
          attachments: [
            {
              id: attachmentId,
              type: SecurityAgentBuilderAttachments.rule,
              data: ruleData,
            },
          ],
        });

        // eslint-disable-next-line no-console
        console.log('[useAgentBuilderRuleCreation] Updated rule attachment via flyout config:', {
          attachment_id: attachmentId,
          rule_name: rule.name,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[useAgentBuilderRuleCreation] Failed to update rule attachment:', error, {
          rule_name: rule.name,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [agentBuilder]
  );

  // Update attachment from form data
  const updateAttachmentFromForm = useCallback(() => {
    const attachmentId = ruleAttachmentIdRef.current;

    if (!attachmentId || !isFromAiRuleCreation) {
      // eslint-disable-next-line no-console
      console.log('[useAgentBuilderRuleCreation] Skipping attachment update - missing refs:', {
        hasAttachmentId: !!attachmentId,
        isFromAiRuleCreation,
      });
      return;
    }

    // Prevent infinite loop: don't update attachment if we're currently updating from attachment
    if (isUpdatingFromAttachmentRef.current) {
      // eslint-disable-next-line no-console
      console.log(
        '[useAgentBuilderRuleCreation] Skipping attachment update - currently updating from attachment'
      );
      return;
    }

    if (!agentBuilder?.setConversationFlyoutActiveConfig) {
      // eslint-disable-next-line no-console
      console.warn('[useAgentBuilderRuleCreation] setConversationFlyoutActiveConfig not available');
      return;
    }

    try {
      // Get current form values
      const defineStepData = defineStepForm.getFormData();
      const aboutStepData = aboutStepForm.getFormData();
      const scheduleStepData = scheduleStepForm.getFormData();
      const actionsStepData = actionsStepForm.getFormData();

      // Convert form data to rule using formatRule
      const ruleData = formatRule<RuleCreateProps>(
        defineStepData,
        aboutStepData,
        scheduleStepData,
        actionsStepData,
        actionTypeRegistry
      );

      // Update attachment data
      const attachmentData = {
        text: JSON.stringify(ruleData),
        attachmentLabel: ruleData.name || 'Detection Rule',
      };

      // eslint-disable-next-line no-console
      console.log(
        '[useAgentBuilderRuleCreation] Updating attachment from form via flyout config:',
        {
          attachment_id: attachmentId,
          rule_name: ruleData.name,
        }
      );

      // Update the active chat flyout configuration with the updated attachment
      // This ensures the chat UI reflects the latest attachment state immediately
      // Preserve existing config (sessionTag, agentId) to avoid resetting the conversation
      agentBuilder.setConversationFlyoutActiveConfig({
        sessionTag: 'security',
        agentId: THREAT_HUNTING_AGENT_ID,
        newConversation: false,
        attachments: [
          {
            id: attachmentId,
            type: SecurityAgentBuilderAttachments.rule,
            data: attachmentData,
          },
        ],
      });

      // eslint-disable-next-line no-console
      console.log(
        '[useAgentBuilderRuleCreation] Updated active chat flyout configuration with attachment',
        JSON.stringify(
          {
            attachments: [
              {
                id: attachmentId,
                type: SecurityAgentBuilderAttachments.rule,
                data: attachmentData,
              },
            ],
          },
          null,
          2
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[useAgentBuilderRuleCreation] Failed to convert form to rule:', error);
    }
  }, [
    defineStepForm,
    aboutStepForm,
    scheduleStepForm,
    actionsStepForm,
    actionTypeRegistry,
    isFromAiRuleCreation,
    agentBuilder,
  ]);

  const handleToolResult = useCallback(
    (result: { type: string; data?: unknown }) => {
      if (result?.type === 'error') {
        addWarning({
          title: 'Rule creation failed',
          text:
            (result.data as { message?: string })?.message ?? 'Unknown error during rule creation.',
        });
        return;
      }

      if (result?.type !== 'other' || !result.data) {
        return;
      }

      const resultData = result.data as { success?: boolean; rule?: unknown };
      if (!resultData.success || !resultData.rule) {
        return;
      }

      const parseResult = parseRuleResponse(resultData.rule);
      if (!parseResult.success || !parseResult.data) {
        const errorMessage =
          parseResult.error &&
          typeof parseResult.error === 'object' &&
          'issues' in parseResult.error
            ? stringifyZodError(parseResult.error as Parameters<typeof stringifyZodError>[0])
            : String(parseResult.error);
        addWarning({
          title: 'Invalid rule data',
          text: `Failed to parse rule: ${errorMessage}`,
        });
        return;
      }

      const rule = parseResult.data;
      const isFirstCreation = isFirstRuleCreationRef.current;
      const formAlreadyUpdated = formUpdatedRef.current;

      // Store the rule to update attachment when conversation is created
      // We'll update the attachment when we receive the conversationCreated event
      pendingRuleForAttachmentRef.current = rule;

      if (isFirstCreation && !formAlreadyUpdated) {
        // First rule creation - automatically update form
        formUpdatedRef.current = true;
        isFirstRuleCreationRef.current = false;
        setShouldShowSkeleton(false);

        // Update form - use setTimeout to ensure it happens after state updates
        setTimeout(() => {
          try {
            updateRuleFromAgentBuilder(rule);
          } catch (error) {
            // Reset flags on error so user can try again
            formUpdatedRef.current = false;
            isFirstRuleCreationRef.current = true;
            setShouldShowSkeleton(true);
          }
        }, 0);
      } else {
        // Subsequent rule creations - ask for confirmation
        pendingRuleRef.current = rule;

        const toast = addSuccess({
          title: 'Rule created successfully',
          text: toMountPoint(
            <RuleUpdateConfirmationToast
              onUpdate={() => {
                if (pendingRuleRef.current) {
                  updateRuleFromAgentBuilder(pendingRuleRef.current);
                  pendingRuleRef.current = null;
                  formUpdatedRef.current = true;
                }
                toasts.remove(toast);
              }}
              onDismiss={() => {
                pendingRuleRef.current = null;
                toasts.remove(toast);
              }}
            />,
            { i18n: i18nStart, theme }
          ),
          toastLifeTimeMs: 60_000,
          'data-test-subj': 'ai-rule-creation-success-toast',
        });
      }
    },
    [updateRuleFromAgentBuilder, addSuccess, addWarning, i18nStart, theme, toasts]
  );

  // Handle conversation ID set event
  const handleConversationIdSet = useCallback((event: ConversationIdSetEvent) => {
    const conversationId = event.data?.conversation_id;
    if (conversationId) {
      conversationIdRef.current = conversationId;
    }
    // eslint-disable-next-line no-console
    console.log('[useAgentBuilderRuleCreation] Conversation ID set:', {
      conversation_id: conversationId,
      event_type: event.type,
    });
  }, []);

  // Handle conversation created event
  const handleConversationCreated = useCallback(
    (event: ConversationCreatedEvent) => {
      const conversationId = event.data?.conversation_id;
      if (conversationId) {
        conversationIdRef.current = conversationId;
        // When conversation is created, update the attachment if we have a pending rule
        const pendingRule = pendingRuleForAttachmentRef.current;
        if (pendingRule) {
          try {
            findAndUpdateRuleAttachment(pendingRule);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              '[useAgentBuilderRuleCreation] Error updating rule attachment after conversation created:',
              error
            );
          }
          pendingRuleForAttachmentRef.current = null;
        }
      }
      // eslint-disable-next-line no-console
      console.log('[useAgentBuilderRuleCreation] Conversation created:', {
        conversation_id: conversationId,
        title: event.data?.title,
        event_type: event.type,
      });
    },
    [findAndUpdateRuleAttachment]
  );

  // Handle conversation updated event
  const handleConversationUpdated = useCallback((event: ConversationUpdatedEvent) => {
    // eslint-disable-next-line no-console
    console.log('[useAgentBuilderRuleCreation] Conversation updated:', {
      conversation_id: event.data?.conversation_id,
      title: event.data?.title,
      event_type: event.type,
    });
  }, []);

  // Handle rule attachment update from round complete event
  const handleRuleAttachmentUpdate = useCallback(
    (ruleAttachment: VersionedAttachment) => {
      const currentVersion = ruleAttachment.current_version;
      const lastVersion = lastAttachmentVersionRef.current;

      if (lastVersion !== null && currentVersion <= lastVersion) {
        return; // No new version
      }

      const latestVersion = ruleAttachment.versions.find(
        (v: { version: number }) => v.version === currentVersion
      );
      if (!latestVersion?.data) {
        return;
      }

      try {
        const attachmentData = latestVersion.data as { text?: string };
        if (!attachmentData.text) {
          return;
        }

        const ruleJson = JSON.parse(attachmentData.text);
        const parseResult = parseRuleResponse(ruleJson);

        if (!parseResult.success || !parseResult.data) {
          return;
        }

        // Prevent infinite loop: don't update form if we're currently updating from form
        if (isUpdatingFromAttachmentRef.current) {
          return;
        }

        isUpdatingFromAttachmentRef.current = true;
        lastAttachmentVersionRef.current = currentVersion;
        ruleAttachmentIdRef.current = ruleAttachment.id;

        // Update form with the rule from attachment
        const ruleData = parseResult.data;
        setTimeout(() => {
          try {
            updateRuleFromAgentBuilder(ruleData);
          } finally {
            // Reset flag after a delay to allow form updates to complete
            setTimeout(() => {
              isUpdatingFromAttachmentRef.current = false;
            }, 1000);
          }
        }, 0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          '[useAgentBuilderRuleCreation] Failed to parse rule from attachment update:',
          error
        );
      }
    },
    [updateRuleFromAgentBuilder]
  );

  // Handle round complete event
  const handleRoundComplete = useCallback(
    (event: RoundCompleteEvent) => {
      const attachments = event.data?.attachments;
      if (!attachments || attachments.length === 0 || !isFromAiRuleCreation) {
        return;
      }

      const ruleAttachment = attachments.find(
        (attachment) =>
          attachment.type === SecurityAgentBuilderAttachments.rule && attachment.active !== false
      );

      if (ruleAttachment) {
        // Store the attachment ID if we don't have it yet
        if (!ruleAttachmentIdRef.current) {
          ruleAttachmentIdRef.current = ruleAttachment.id;
          // eslint-disable-next-line no-console
          console.log(
            '[useAgentBuilderRuleCreation] Stored rule attachment ID from round complete:',
            {
              attachment_id: ruleAttachment.id,
            }
          );
        }
        handleRuleAttachmentUpdate(ruleAttachment);
      }
    },
    [isFromAiRuleCreation, handleRuleAttachmentUpdate]
  );

  // Handle tool call event
  const handleToolCall = useCallback((event: BrowserChatEvent) => {
    if (!isToolCallEvent(event)) {
      return;
    }
    const toolId = event.data?.tool_id;
    if (toolId === SECURITY_CREATE_DETECTION_RULE_TOOL_ID) {
      detectionRuleToolCallIdRef.current = event.data?.tool_call_id ?? null;
    }
  }, []);

  // Handle tool progress event
  const handleToolProgress = useCallback(
    (event: BrowserChatEvent) => {
      if (!isToolProgressEvent(event)) {
        return;
      }
      const toolCallId = event.data?.tool_call_id;
      if (
        toolCallId === detectionRuleToolCallIdRef.current &&
        isFromAiRuleCreation &&
        isFirstRuleCreationRef.current &&
        !formUpdatedRef.current
      ) {
        setIsThinking(true);
        setShouldShowSkeleton(true);
      }
    },
    [isFromAiRuleCreation]
  );

  // Handle tool result event
  const handleToolResultEvent = useCallback(
    (event: BrowserChatEvent) => {
      if (!isToolResultEvent(event)) {
        return;
      }
      const toolId = event.data?.tool_id;
      const results = event.data?.results;

      if (toolId === SECURITY_CREATE_DETECTION_RULE_TOOL_ID && results && results.length > 0) {
        setIsThinking(false);
        detectionRuleToolCallIdRef.current = null;
        handleToolResult(results[0]);
      }
    },
    [handleToolResult]
  );

  useEffect(() => {
    if (!agentBuilder?.events?.chat$) {
      return;
    }

    const subscription = agentBuilder.events.chat$.subscribe({
      next: (event: BrowserChatEvent) => {
        if (isConversationIdSetEvent(event)) {
          handleConversationIdSet(event as ConversationIdSetEvent);
        } else if (isConversationCreatedEvent(event)) {
          handleConversationCreated(event as ConversationCreatedEvent);
        } else if (isConversationUpdatedEvent(event)) {
          handleConversationUpdated(event as ConversationUpdatedEvent);
        } else if (isRoundCompleteEvent(event)) {
          handleRoundComplete(event as RoundCompleteEvent);
        } else if (isToolCallEvent(event)) {
          handleToolCall(event);
        } else if (isToolProgressEvent(event)) {
          handleToolProgress(event);
        } else if (isReasoningEvent(event)) {
          setIsThinking(true);
        } else if (isThinkingCompleteEvent(event)) {
          setIsThinking(false);
        } else if (isToolResultEvent(event)) {
          handleToolResultEvent(event);
        }
      },
      error: (error) => {
        // eslint-disable-next-line no-console
        console.error('[useAgentBuilderRuleCreation] Error in event subscription:', error);
      },
    });

    subscriptionRef.current = subscription;

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [
    agentBuilder,
    handleConversationIdSet,
    handleConversationCreated,
    handleConversationUpdated,
    handleRoundComplete,
    handleToolCall,
    handleToolProgress,
    handleToolResultEvent,
  ]);

  // Watch form changes and update attachment with debounce
  useEffect(() => {
    if (!isFromAiRuleCreation) {
      return;
    }

    // Debounce attachment updates to avoid too many API calls
    const DEBOUNCE_DELAY = 2000; // 2 seconds

    const handleFormChange = () => {
      // Check if refs are available before scheduling update
      if (!conversationIdRef.current || !ruleAttachmentIdRef.current) {
        // eslint-disable-next-line no-console
        console.log(
          '[useAgentBuilderRuleCreation] Form changed but refs not ready, will retry on next change',
          {
            hasConversationId: !!conversationIdRef.current,
            hasAttachmentId: !!ruleAttachmentIdRef.current,
          }
        );
        return;
      }

      if (updateAttachmentTimeoutRef.current) {
        clearTimeout(updateAttachmentTimeoutRef.current);
      }
      updateAttachmentTimeoutRef.current = setTimeout(() => {
        updateAttachmentFromForm();
      }, DEBOUNCE_DELAY);
    };

    const defineStepSubscription = defineStepForm.__getFormData$().subscribe(handleFormChange);
    const aboutStepSubscription = aboutStepForm.__getFormData$().subscribe(handleFormChange);
    const scheduleStepSubscription = scheduleStepForm.__getFormData$().subscribe(handleFormChange);
    const actionsStepSubscription = actionsStepForm.__getFormData$().subscribe(handleFormChange);

    return () => {
      defineStepSubscription.unsubscribe();
      aboutStepSubscription.unsubscribe();
      scheduleStepSubscription.unsubscribe();
      actionsStepSubscription.unsubscribe();
      if (updateAttachmentTimeoutRef.current) {
        clearTimeout(updateAttachmentTimeoutRef.current);
      }
    };
  }, [
    isFromAiRuleCreation,
    defineStepForm,
    aboutStepForm,
    scheduleStepForm,
    actionsStepForm,
    updateAttachmentFromForm,
  ]);

  return {
    isThinking,
    shouldShowSkeleton,
    updateRuleFromAgentBuilder,
  };
};
