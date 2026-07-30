/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonEmpty,
  EuiText,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import type { WatchRecentRun } from '../../../../common/watches';
import * as i18n from '../translations';

const CANCELLABLE_STATUSES = new Set(['running', 'waiting_for_input']);

interface RecentRunsTableProps {
  runs: WatchRecentRun[];
  onCancel?: (executionId: string) => void;
  cancellingId?: string | null;
}

export const RecentRunsTable: React.FC<RecentRunsTableProps> = ({
  runs,
  onCancel,
  cancellingId,
}) => {
  const columns = useMemo<Array<EuiBasicTableColumn<WatchRecentRun>>>(
    () => [
      {
        field: 'startedAt',
        name: i18n.COL_TIME,
        width: '160px',
        render: (startedAt: string) => (
          <EuiText size="s">
            <code>{startedAt}</code>
          </EuiText>
        ),
      },
      {
        field: 'status',
        name: i18n.COL_STATUS,
        width: '120px',
        render: (status: string) => <EuiBadge color="hollow">{status}</EuiBadge>,
      },
      {
        field: 'summary',
        name: i18n.COL_SUMMARY,
        truncateText: true,
        render: (_summary: string, run: WatchRecentRun) => {
          if (run.steps.length > 0) {
            return run.steps.map((s) => s.name).join(' → ');
          }
          return run.summary;
        },
      },
      {
        field: 'triggerType',
        name: i18n.COL_TRIGGER,
        width: '120px',
        render: (triggerType: string | undefined) => triggerType ?? '—',
      },
      ...(onCancel
        ? [
            {
              name: '',
              width: '80px',
              render: (run: WatchRecentRun) => {
                if (!CANCELLABLE_STATUSES.has(run.status)) return null;
                return (
                  <EuiButtonEmpty
                    size="xs"
                    color="danger"
                    isLoading={cancellingId === run.executionId}
                    onClick={() => onCancel(run.executionId)}
                  >
                    {i18n.CANCEL_RUN}
                  </EuiButtonEmpty>
                );
              },
            } as EuiBasicTableColumn<WatchRecentRun>,
          ]
        : []),
    ],
    [onCancel, cancellingId]
  );

  if (runs.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        {i18n.NO_RUNS_YET}
      </EuiText>
    );
  }

  return (
    <EuiBasicTable
      tableCaption={i18n.RECENT_RUNS_TITLE}
      items={runs}
      columns={columns}
      tableLayout="auto"
    />
  );
};
