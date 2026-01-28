/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect } from 'react';
import { isToolResultEvent } from '@kbn/agent-builder-common';
import type { BrowserChatEvent } from '@kbn/agent-builder-browser/events';
import { useKibana } from '../../../common/lib/kibana';
import type { RuleResponse } from '../../../../common/api/detection_engine/model/rule_schema';

const SECURITY_CREATE_DETECTION_RULE_TOOL_ID = 'security.create_detection_rule';

export interface RuleCreationResult {
  success: boolean;
  rule?: RuleResponse;
  error?: string;
}

export interface UseAgentBuilderRuleUpdateParams {
  onRuleUpdate?: (result: RuleCreationResult) => void;
}

/**
 * Hook that subscribes to global agent builder events and filters for
 * create detection rule tool results to update the form.
 *
 * @param params.onRuleUpdate - Callback function invoked when a rule is created via agent builder
 */
export const useAgentBuilderRuleUpdate = ({ onRuleUpdate }: UseAgentBuilderRuleUpdateParams) => {
  const { agentBuilder } = useKibana().services;

  useEffect(() => {
    if (!agentBuilder?.events?.chat$) {
      // eslint-disable-next-line no-console
      console.log('[useAgentBuilderRuleUpdate] Agent builder events not available');
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[useAgentBuilderRuleUpdate] Subscribing to agent builder events');

    const subscription = agentBuilder.events.chat$.subscribe({
      next: (event: BrowserChatEvent) => {
        // Log all events for debugging
        // eslint-disable-next-line no-console
        console.log('[useAgentBuilderRuleUpdate] Event received:', event);

        // Filter for tool result events from create detection rule tool
        if (isToolResultEvent(event)) {

          if (event.data.tool_id === SECURITY_CREATE_DETECTION_RULE_TOOL_ID) {
            // eslint-disable-next-line no-console
            console.log(
              '[useAgentBuilderRuleUpdate] Create detection rule tool result:',
              event.data
            );

            // Extract the rule from the results
            const results = event.data.results;
            if (results && results.length > 0) {
              const firstResult = results[0];

              if (firstResult.type === 'other' && firstResult.data) {
                const resultData = firstResult.data as RuleCreationResult;

                // Invoke the callback with the rule data
                if (onRuleUpdate) {
                  onRuleUpdate(resultData);
                }
              }
            }
          }
        }
      },
      error: (error) => {
        // eslint-disable-next-line no-console
        console.error('[useAgentBuilderRuleUpdate] Error in event stream:', error);
      },
    });

    return () => {
      // eslint-disable-next-line no-console
      console.log('[useAgentBuilderRuleUpdate] Unsubscribing from agent builder events');
      subscription.unsubscribe();
    };
  }, [agentBuilder, onRuleUpdate]);
};

