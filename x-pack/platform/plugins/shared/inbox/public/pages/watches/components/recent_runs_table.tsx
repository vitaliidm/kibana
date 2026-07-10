/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiBadge, EuiBasicTable, EuiText, type EuiBasicTableColumn } from '@elastic/eui';
import type { WatchRecentRun, WatchRunAction } from '../../../../common/watches';
import * as i18n from '../translations';

interface RecentRunsTableProps {
  runs: WatchRecentRun[];
}

const ACTION_LABEL: Record<WatchRunAction, string> = {
  read: i18n.ACTION_READ,
  draft: i18n.ACTION_DRAFT,
  gated: i18n.ACTION_GATED,
  auto: i18n.ACTION_AUTO,
};

const ACTION_COLOR: Record<WatchRunAction, 'success' | 'primary' | 'warning' | 'accent'> = {
  read: 'success',
  draft: 'primary',
  gated: 'warning',
  auto: 'accent',
};

export const RecentRunsTable: React.FC<RecentRunsTableProps> = ({ runs }) => {
  const columns = useMemo<Array<EuiBasicTableColumn<WatchRecentRun>>>(
    () => [
      {
        field: 'time',
        name: i18n.COL_TIME,
        width: '90px',
        render: (time: string) => (
          <EuiText size="s">
            <code>{time}</code>
          </EuiText>
        ),
      },
      {
        field: 'workflow',
        name: i18n.COL_WORKFLOW,
        truncateText: true,
      },
      {
        field: 'action',
        name: i18n.COL_ACTION,
        width: '140px',
        render: (action: WatchRunAction) => (
          <EuiBadge color={ACTION_COLOR[action]}>{ACTION_LABEL[action]}</EuiBadge>
        ),
      },
      {
        field: 'what',
        name: i18n.COL_WHAT,
        truncateText: true,
      },
      {
        field: 'outcome',
        name: i18n.COL_OUTCOME,
        truncateText: true,
      },
    ],
    []
  );

  if (runs.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        {i18n.NO_RUNS_YET}
      </EuiText>
    );
  }

  return <EuiBasicTable items={runs} columns={columns} tableLayout="auto" />;
};
