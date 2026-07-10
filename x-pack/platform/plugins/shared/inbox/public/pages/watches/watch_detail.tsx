/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiPageSection,
  EuiPanel,
  EuiRange,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTextArea,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { useHistory, useParams } from 'react-router-dom';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import {
  AUTONOMY_LABELS,
  coverageFromSchedule,
  skillLabel,
  type AutonomyLevel,
  type Watch,
  type WatchSchedule,
  type WorkerRef,
} from '../../../common/watches';
import { useWatch } from '../../hooks/use_watches_api';
import { AutonomyMeter } from './components/autonomy_meter';
import { InboxWatchesNav } from './components/inbox_watches_nav';
import { RecentRunsTable } from './components/recent_runs_table';
import { RunSparkline } from './components/run_sparkline';
import { SchedulePanel } from './components/schedule_panel';
import { WorkflowAssignmentList } from './components/workflow_assignment_list';
import * as i18n from './translations';

const SCOPE_COLOR: Record<string, string> = {
  full: '#16b3a6',
  masked: '#f59e0b',
  denied: '#ef4444',
};

export const WatchDetailPage: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const history = useHistory();
  const { watchId } = useParams<{ watchId: string }>();
  const { services } = useKibana();
  const { data, isLoading, error, refetch } = useWatch(watchId);

  const [localWatch, setLocalWatch] = useState<Watch | null>(null);
  const [localWorkers, setLocalWorkers] = useState<WorkerRef[]>([]);

  useEffect(() => {
    if (data) {
      setLocalWatch(data.watch);
      setLocalWorkers(data.workers);
    }
  }, [data]);

  const stubToast = useCallback(() => {
    services.notifications?.toasts.addInfo(i18n.POC_STUB_TOAST);
  }, [services.notifications]);

  const onScheduleChange = useCallback((schedule: WatchSchedule) => {
    setLocalWatch((prev) =>
      prev
        ? {
            ...prev,
            schedule,
            coverage: coverageFromSchedule(schedule),
          }
        : prev
    );
  }, []);

  const onAutonomyChange = useCallback((level: AutonomyLevel) => {
    setLocalWatch((prev) => (prev ? { ...prev, autonomyLevel: level } : prev));
  }, []);

  const onToggleWorker = useCallback(
    (workerId: string) => {
      setLocalWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, enabled: !w.enabled } : w))
      );
      stubToast();
    },
    [stubToast]
  );

  const workersOn = useMemo(() => localWorkers.filter((w) => w.enabled).length, [localWorkers]);

  if (isLoading && !localWatch) {
    return (
      <EuiPageSection paddingSize="l">
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 240 }}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageSection>
    );
  }

  if (error || (!isLoading && !localWatch)) {
    return (
      <EuiPageSection paddingSize="l">
        <InboxWatchesNav active="watches" />
        <EuiSpacer size="m" />
        <EuiEmptyPrompt
          iconType="search"
          title={<h2>{i18n.WATCH_NOT_FOUND_TITLE}</h2>}
          body={<p>{i18n.WATCH_NOT_FOUND_BODY}</p>}
          actions={
            <EuiFlexGroup gutterSize="s" justifyContent="center">
              <EuiFlexItem grow={false}>
                <EuiButton onClick={() => history.push('/watches')}>
                  {i18n.BACK_TO_WATCHES}
                </EuiButton>
              </EuiFlexItem>
              {error ? (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={() => refetch()}>{i18n.RETRY}</EuiButtonEmpty>
                </EuiFlexItem>
              ) : null}
            </EuiFlexGroup>
          }
        />
      </EuiPageSection>
    );
  }

  const watch = localWatch!;

  return (
    <EuiPageSection
      paddingSize="l"
      css={css`
        padding-top: ${euiTheme.size.l};
        --wt: ${watch.color};
      `}
    >
      <InboxWatchesNav active="watches" />
      <EuiSpacer size="m" />

      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="arrowLeft"
                onClick={() => history.push('/watches')}
                flush="left"
              >
                {i18n.BACK_TO_WATCHES}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={stubToast}>
                {i18n.SAVE}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={() => history.push('/watches')}>
                {i18n.DISCARD}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="l">
            <h1>{watch.name}</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {watch.draft ? (
            <EuiBadge color="warning">{i18n.DRAFT_BADGE}</EuiBadge>
          ) : watch.enabled ? (
            <EuiBadge color="success">{i18n.ACTIVE_BADGE}</EuiBadge>
          ) : (
            <EuiBadge color="default">{i18n.PAUSED_BADGE}</EuiBadge>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiText color="subdued" size="s">
        <p>{watch.mandate}</p>
      </EuiText>
      <EuiText size="s">
        <p>{watch.description}</p>
      </EuiText>

      <EuiSpacer size="m" />

      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: ${euiTheme.size.m};
          max-width: 480px;
          opacity: ${watch.metrics.runs7d == null ? 0.4 : 1};
        `}
      >
        <div>
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="m">
                <strong>{watch.metrics.runs7d ?? '—'}</strong>
              </EuiText>
            </EuiFlexItem>
            {watch.metrics.runs7d != null ? (
              <EuiFlexItem grow={false}>
                <RunSparkline seed={watch.id} color={watch.color} />
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
          <EuiText size="xs" color="subdued">
            {i18n.RUNS_7D}
          </EuiText>
        </div>
        <div>
          <EuiText size="m">
            <strong>
              {watch.metrics.acceptedPct != null ? `${watch.metrics.acceptedPct}%` : '—'}
            </strong>
          </EuiText>
          <EuiText size="xs" color="subdued">
            {i18n.ACCEPTED}
          </EuiText>
        </div>
        <div>
          <EuiText size="m">
            <strong>{watch.metrics.timeSaved ?? '—'}</strong>
          </EuiText>
          <EuiText size="xs" color="subdued">
            {i18n.TIME_SAVED}
          </EuiText>
        </div>
      </div>

      <EuiSpacer size="xl" />

      {/* Identity */}
      <SectionHeading title={i18n.IDENTITY_TITLE} subtitle={i18n.IDENTITY_SUBTITLE} />
      <EuiPanel hasBorder paddingSize="m">
        <EuiFormRow label={i18n.DESCRIPTION_LABEL} fullWidth>
          <EuiTextArea
            value={watch.description}
            onChange={(e) =>
              setLocalWatch((prev) => (prev ? { ...prev, description: e.target.value } : prev))
            }
            rows={2}
            fullWidth
            compressed
          />
        </EuiFormRow>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Autonomy */}
      <SectionHeading title={i18n.AUTONOMY_TITLE} subtitle={i18n.AUTONOMY_SUBTITLE} />
      <EuiPanel hasBorder paddingSize="m">
        <EuiFormRow label={i18n.AUTONOMY_LEVEL} fullWidth>
          <div>
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <AutonomyMeter level={watch.autonomyLevel} color={watch.color} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">
                  {watch.autonomyLevel} / 5
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiRange
              min={1}
              max={5}
              step={1}
              value={watch.autonomyLevel}
              onChange={(e) =>
                onAutonomyChange(Number((e.target as HTMLInputElement).value) as AutonomyLevel)
              }
              showTicks
              ticks={AUTONOMY_LABELS.map((label, i) => ({
                value: i + 1,
                label: i === 0 || i === 4 ? label : '',
              }))}
              fullWidth
              compressed
            />
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              {i18n.AUTONOMY_GUARDRAILS_NOTE}
            </EuiText>
          </div>
        </EuiFormRow>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Schedule */}
      <SectionHeading title={i18n.SCHEDULE_TITLE} subtitle={i18n.SCHEDULE_SUBTITLE} />
      <SchedulePanel watch={watch} onScheduleChange={onScheduleChange} />

      <EuiSpacer size="l" />

      {/* Assigned workflows */}
      <EuiFlexGroup alignItems="baseline" justifyContent="spaceBetween" gutterSize="s">
        <EuiFlexItem>
          <SectionHeading
            title={i18n.ASSIGNED_WORKFLOWS_TITLE}
            subtitle={i18n.assignedWorkflowsSubtitle(workersOn, localWorkers.length)}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" iconType="plusInCircle" onClick={stubToast}>
            {i18n.ASSIGN_WORKFLOW}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <WorkflowAssignmentList workers={localWorkers} onToggle={onToggleWorker} />

      <EuiSpacer size="l" />

      {/* Skills */}
      <SectionHeading title={i18n.SKILLS_TITLE} subtitle={i18n.SKILLS_SUBTITLE} />
      <EuiPanel hasBorder paddingSize="m">
        <EuiFlexGroup direction="column" gutterSize="s">
          {watch.skillIds.map((id) => (
            <EuiFlexItem key={id}>
              <EuiSwitch label={skillLabel(id)} checked={true} onChange={stubToast} compressed />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Data boundaries */}
      <SectionHeading title={i18n.DATA_BOUNDARIES_TITLE} />
      <EuiFlexGroup gutterSize="s" wrap responsive={false}>
        {watch.scopes.map((scope) => (
          <EuiFlexItem grow={false} key={scope.name}>
            <EuiBadge
              color="hollow"
              css={css`
                border-left: 3px solid ${SCOPE_COLOR[scope.access] ?? euiTheme.colors.lightShade};
              `}
            >
              {scope.name} — {scope.label}
            </EuiBadge>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Recent runs */}
      <EuiFlexGroup alignItems="baseline" justifyContent="spaceBetween" gutterSize="s">
        <EuiFlexItem grow={false}>
          <SectionHeading title={i18n.RECENT_RUNS_TITLE} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" onClick={stubToast}>
            {i18n.VIEW_ALL_RUNS}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel hasBorder paddingSize="m">
        <RecentRunsTable runs={watch.recentRuns} />
      </EuiPanel>
    </EuiPageSection>
  );
};

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup
      alignItems="baseline"
      gutterSize="s"
      css={css`
        margin-bottom: ${euiTheme.size.s};
      `}
    >
      <EuiFlexItem grow={false}>
        <EuiTitle size="xs">
          <h3>{title}</h3>
        </EuiTitle>
      </EuiFlexItem>
      {subtitle ? (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {subtitle}
          </EuiText>
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );
};
