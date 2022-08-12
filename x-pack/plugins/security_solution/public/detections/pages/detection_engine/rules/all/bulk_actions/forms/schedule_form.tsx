/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { EuiCallOut } from '@elastic/eui';

import { useForm, UseField, FormSchema } from '../../../../../../../shared_imports';
import { ScheduleItem } from '../../../../../../components/rules/schedule_item_form';
import {
  BulkActionEditType,
  BulkActionEditPayload,
} from '../../../../../../../../common/detection_engine/schemas/common/schemas';

import { BulkEditFormWrapper } from './bulk_edit_form_wrapper';
import { bulkUpdateRuleSchedules as i18n } from '../translations';

export interface ScheduleFormData {
  interval: string;
  from: string;
}

const formSchema: FormSchema<ScheduleFormData> = {
  interval: {
    label: i18n.INTERVAL_LABEL,
    helpText: i18n.INTERVAL_HELP_TEXT,
  },
  from: {
    label: i18n.FROM_LABEL,
    helpText: i18n.FROM_HELP_TEXT,
  },
};

const defaultFormData: ScheduleFormData = {
  interval: '5m',
  from: '1m',
};

interface ScheduleFormProps {
  rulesCount: number;
  onClose: () => void;
  onConfirm: (bulkActionEditPayload: BulkActionEditPayload) => void;
}

const ScheduleFormComponent = (props: ScheduleFormProps) => {
  const { rulesCount, onClose, onConfirm } = props;

  const { form } = useForm({
    schema: formSchema,
    defaultValue: defaultFormData,
  });

  const handleSubmit = useCallback(async () => {
    const { data, isValid } = await form.submit();
    if (!isValid) {
      return;
    }

    const timelineId = data.timeline.id || '';
    const timelineTitle = timelineId ? data.timeline.title : '';

    onConfirm({
      type: BulkActionEditType.set_timeline,
      value: {
        timeline_id: timelineId,
        timeline_title: timelineTitle,
      },
    });
  }, [form, onConfirm]);

  const warningCallout = (
    <EuiCallOut color="warning" data-test-subj="bulkEditRulesScheduleWarning">
      {i18n.warningCalloutMessage(rulesCount)}
    </EuiCallOut>
  );

  return (
    <BulkEditFormWrapper
      form={form}
      title={i18n.FORM_TITLE}
      banner={warningCallout}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {/* Timeline template selector
      <UseField
        path="timeline"
        component={PickTimeline}
        componentProps={{
          idAria: 'bulkEditRulesScheduleSelector',
          dataTestSubj: 'bulkEditRulesScheduleSelector',
        }}
      /> */}

      <UseField
        path="interval"
        component={ScheduleItem}
        componentProps={{
          idAria: 'bulkEditRulesScheduleRuleInterval',
          dataTestSubj: 'bulkEditRulesScheduleRuleInterval',
        }}
      />
      <UseField
        path="from"
        component={ScheduleItem}
        componentProps={{
          idAria: 'bulkEditRulesScheduleRuleFrom',
          dataTestSubj: 'bulkEditRulesScheduleRuleFrom',
          minimumValue: 1,
        }}
      />
    </BulkEditFormWrapper>
  );
};

export const ScheduleForm = React.memo(ScheduleFormComponent);
ScheduleForm.displayName = 'ScheduleForm';
