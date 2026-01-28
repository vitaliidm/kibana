/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiButton, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { toMountPoint } from '@kbn/react-kibana-mount';
import type { RuleResponse } from '../../../../../common/api/detection_engine/model/rule_schema';
import type { useKibana as UseKibanaType } from '../../../../common/lib/kibana';
import * as i18n from './translations';

interface AiRuleConfirmationToastProps {
  ruleResponse: RuleResponse;
  onApply: () => void;
  onDismiss: () => void;
}

const AiRuleConfirmationToastContent: React.FC<AiRuleConfirmationToastProps> = ({
  ruleResponse,
  onApply,
  onDismiss,
}) => {
  return (
    <EuiFlexGroup direction="column" alignItems="flexEnd" gutterSize="s">
      <EuiFlexItem>
        <EuiText size="s">{i18n.AI_RULE_READY_TEXT(ruleResponse.name)}</EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" onClick={onDismiss}>
              {i18n.DISMISS}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" color="success" fill onClick={onApply}>
              {i18n.APPLY}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const showAiRuleConfirmationToast = ({
  ruleResponse,
  onApply,
  services,
}: {
  ruleResponse: RuleResponse;
  onApply: (rule: RuleResponse) => void;
  onDismiss: () => void;
  services: ReturnType<typeof UseKibanaType>['services'];
}) => {
  const { notifications, theme, i18n: i18nService } = services;

  const toast = notifications.toasts.addSuccess({
    color: 'success',
    iconType: 'check',
    toastLifeTimeMs: 1000 * 60 * 5,
    title: i18n.AI_RULE_READY_TITLE,
    text: toMountPoint(
      <AiRuleConfirmationToastContent
        ruleResponse={ruleResponse}
        onApply={() => {
          notifications.toasts.remove(toast);
          onApply(ruleResponse);
        }}
        onDismiss={() => {
          notifications.toasts.remove(toast);
        }}
      />,
      { theme, i18n: i18nService }
    ),
  });

  return toast;
};
