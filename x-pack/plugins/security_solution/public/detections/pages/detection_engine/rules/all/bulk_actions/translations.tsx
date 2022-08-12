/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

export const bulkApplyTimelineTemplate = {
  FORM_TITLE: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.formTitle',
    {
      defaultMessage: 'Apply Timeline template',
    }
  ),

  TEMPLATE_SELECTOR_LABEL: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.templateSelectorLabel',
    {
      defaultMessage: 'Apply Timeline template to selected rules',
    }
  ),

  TEMPLATE_SELECTOR_HELP_TEXT: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.templateSelectorHelpText',
    {
      defaultMessage:
        'Select which Timeline to apply to selected rules when investigating generated alerts.',
    }
  ),

  TEMPLATE_SELECTOR_PLACEHOLDER: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.templateSelectorPlaceholder',
    {
      defaultMessage: 'Search Timeline template',
    }
  ),

  TEMPLATE_SELECTOR_DEFAULT_VALUE: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.templateSelectorDefaultValue',
    {
      defaultMessage: 'None',
    }
  ),

  warningCalloutMessage: (rulesCount: number): JSX.Element => (
    <FormattedMessage
      id="xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.applyTimelineTemplate.warningCalloutMessage"
      defaultMessage="You're about to apply changes to {rulesCount, plural, one {# selected rule} other {# selected rules}}.
      If you previously applied Timeline templates to these rules, they will be overwritten or (if you select 'None') reset to none."
      values={{ rulesCount }}
    />
  ),
};

export const bulkUpdateRuleSchedules = {
  FORM_TITLE: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.formTitle',
    {
      defaultMessage: 'Update rule schedules',
    }
  ),

  INTERVAL_LABEL: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.intervalLabel',
    {
      defaultMessage: 'Runs every',
    }
  ),

  INTERVAL_HELP_TEXT: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.intervalHelpText',
    {
      defaultMessage: 'Rules run periodically and detect alerts within the specified time frame.',
    }
  ),

  FROM_LABEL: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.fromLabel',
    {
      defaultMessage: 'Additional look-back time',
    }
  ),

  FROM_HELP_TEXT: i18n.translate(
    'xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.fromHelpText',
    {
      defaultMessage: 'Adds time to the look-back period to prevent missed alerts.',
    }
  ),

  warningCalloutMessage: (rulesCount: number): JSX.Element => (
    <FormattedMessage
      id="xpack.securitySolution.detectionEngine.rules.allRules.bulkActions.edit.updateRuleSchedules.warningCalloutMessage"
      defaultMessage="You're about to apply changes to {rulesCount, plural, one {# selected rule} other {# selected rules}}.
      The changes you made will be overwritten to the existing Rule schedules and additional look-back time (if any). "
      values={{ rulesCount }}
    />
  ),
};
