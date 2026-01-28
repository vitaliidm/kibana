/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const AI_RULE_READY_TITLE = i18n.translate(
  'xpack.securitySolution.detectionEngine.aiRuleConfirmationToast.title',
  {
    defaultMessage: 'AI-generated rule ready',
  }
);

export const AI_RULE_READY_TEXT = (ruleName: string) =>
  i18n.translate('xpack.securitySolution.detectionEngine.aiRuleConfirmationToast.text', {
    values: { ruleName },
    defaultMessage: 'Updated rule has been generated. Apply it to the form?',
  });

export const APPLY = i18n.translate(
  'xpack.securitySolution.detectionEngine.aiRuleConfirmationToast.apply',
  {
    defaultMessage: 'Apply',
  }
);

export const DISMISS = i18n.translate(
  'xpack.securitySolution.detectionEngine.aiRuleConfirmationToast.dismiss',
  {
    defaultMessage: 'Dismiss',
  }
);
