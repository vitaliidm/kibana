/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { css } from '@emotion/react';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSwitch,
  EuiText,
  useEuiTheme,
} from '@elastic/eui';
import { skillLabel, type WorkerRef } from '../../../../common/watches';
import * as i18n from '../translations';

interface WorkflowAssignmentListProps {
  workers: WorkerRef[];
  onToggle?: (workerId: string) => void;
}

export const WorkflowAssignmentList: React.FC<WorkflowAssignmentListProps> = ({
  workers,
  onToggle,
}) => {
  const { euiTheme } = useEuiTheme();

  if (workers.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        —
      </EuiText>
    );
  }

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: ${euiTheme.size.s};
      `}
    >
      {workers.map((worker) => (
        <EuiPanel
          key={worker.id}
          hasBorder
          paddingSize="m"
          css={css`
            opacity: ${worker.enabled ? 1 : 0.55};
          `}
        >
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>{worker.name}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {worker.lastRun
                      ? `${i18n.LAST_RUN_PREFIX} ${worker.lastRun}`
                      : i18n.NEVER_RUN_WORKFLOW}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSwitch
                    label=""
                    checked={worker.enabled}
                    onChange={() => onToggle?.(worker.id)}
                    compressed
                    showLabel={false}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            responsive={false}
            css={css`
              margin-top: ${euiTheme.size.s};
              flex-wrap: wrap;
            `}
          >
            <EuiFlexItem grow={false}>
              <EuiBadge
                color="hollow"
                iconType={worker.trigger.type === 'schedule' ? 'clock' : 'bolt'}
              >
                {worker.trigger.summary}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIcon type="arrowRight" size="s" color="subdued" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="primary">{skillLabel(worker.skillId)}</EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIcon type="arrowRight" size="s" color="subdued" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="success">
                {worker.outcome}
                {worker.gated ? ` · ${i18n.GATED_BADGE}` : ''}
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      ))}
    </div>
  );
};
