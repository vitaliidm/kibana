/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const PAGE_TITLE = i18n.translate('xpack.inbox.watches.pageTitle', {
  defaultMessage: 'Watches',
});

export const PAGE_SUBTITLE = i18n.translate('xpack.inbox.watches.pageSubtitle', {
  defaultMessage: 'Coverage, autonomy & schedule',
});

export const COVERAGE_TITLE = i18n.translate('xpack.inbox.watches.coverage.title', {
  defaultMessage: 'Coverage',
});

export const COVERAGE_SUBTITLE = i18n.translate('xpack.inbox.watches.coverage.subtitle', {
  defaultMessage: "who's on duty across 24 hours",
});

export const onDutyNowLabel = (onDuty: number, total: number) =>
  i18n.translate('xpack.inbox.watches.coverage.onDutyNow', {
    defaultMessage: '{onDuty} of {total} on duty now',
    values: { onDuty, total },
  });

export const WATCHES_SECTION_TITLE = i18n.translate('xpack.inbox.watches.sectionTitle', {
  defaultMessage: 'Watches',
});

export const watchesSectionCount = (active: number, drafts: number, paused: number) => {
  const bits: string[] = [
    i18n.translate('xpack.inbox.watches.count.active', {
      defaultMessage: '{active} active',
      values: { active },
    }),
  ];
  if (paused > 0) {
    bits.push(
      i18n.translate('xpack.inbox.watches.count.paused', {
        defaultMessage: '{paused} paused',
        values: { paused },
      })
    );
  }
  if (drafts > 0) {
    bits.push(
      i18n.translate('xpack.inbox.watches.count.draft', {
        defaultMessage: '{drafts} draft',
        values: { drafts },
      })
    );
  }
  return i18n.translate('xpack.inbox.watches.sectionCount', {
    defaultMessage: '{bits} — click a card to configure',
    values: { bits: bits.join(' · ') },
  });
};

export const ALWAYS_ON = i18n.translate('xpack.inbox.watches.schedule.alwaysOn', {
  defaultMessage: 'Always on',
});

export const ON_DEMAND = i18n.translate('xpack.inbox.watches.schedule.onDemand', {
  defaultMessage: 'On demand',
});

export const TIME_BASED = i18n.translate('xpack.inbox.watches.schedule.timeBased', {
  defaultMessage: 'Time-based',
});

export const DRAFT_BADGE = i18n.translate('xpack.inbox.watches.badge.draft', {
  defaultMessage: 'Draft',
});

export const ACTIVE_BADGE = i18n.translate('xpack.inbox.watches.badge.active', {
  defaultMessage: 'Active',
});

export const PAUSED_BADGE = i18n.translate('xpack.inbox.watches.badge.paused', {
  defaultMessage: 'Paused',
});

export const lastRunLabel = (lastRun: string) =>
  i18n.translate('xpack.inbox.watches.card.lastRun', {
    defaultMessage: 'Last run {lastRun}',
    values: { lastRun },
  });

export const NEVER_RUN = i18n.translate('xpack.inbox.watches.card.neverRun', {
  defaultMessage: 'Never run',
});

export const RUNS_7D = i18n.translate('xpack.inbox.watches.card.runs7d', {
  defaultMessage: 'Runs · 7d',
});

export const ACCEPTED = i18n.translate('xpack.inbox.watches.card.accepted', {
  defaultMessage: 'Accepted',
});

export const TIME_SAVED = i18n.translate('xpack.inbox.watches.card.timeSaved', {
  defaultMessage: 'Time saved',
});

export const AUTONOMY = i18n.translate('xpack.inbox.watches.card.autonomy', {
  defaultMessage: 'Autonomy',
});

export const DATA_SCOPE = i18n.translate('xpack.inbox.watches.card.dataScope', {
  defaultMessage: 'Data scope',
});

export const NEW_WATCH_TITLE = i18n.translate('xpack.inbox.watches.newWatch.title', {
  defaultMessage: 'New watch',
});

export const NEW_WATCH_DESCRIPTION = i18n.translate('xpack.inbox.watches.newWatch.description', {
  defaultMessage: 'Define a mandate, schedule, autonomy and skills',
});

export const LOADING_WATCHES = i18n.translate('xpack.inbox.watches.loading', {
  defaultMessage: 'Loading watches…',
});

export const LOAD_ERROR_TITLE = i18n.translate('xpack.inbox.watches.loadError.title', {
  defaultMessage: 'Unable to load watches',
});

export const LOAD_ERROR_BODY = i18n.translate('xpack.inbox.watches.loadError.body', {
  defaultMessage: 'Something went wrong while fetching the watch catalog.',
});

export const RETRY = i18n.translate('xpack.inbox.watches.retry', {
  defaultMessage: 'Retry',
});

export const BACK_TO_WATCHES = i18n.translate('xpack.inbox.watches.detail.back', {
  defaultMessage: 'Back to watches',
});

export const SAVE = i18n.translate('xpack.inbox.watches.detail.save', {
  defaultMessage: 'Save',
});

export const DISCARD = i18n.translate('xpack.inbox.watches.detail.discard', {
  defaultMessage: 'Discard',
});

export const IDENTITY_TITLE = i18n.translate('xpack.inbox.watches.detail.identity.title', {
  defaultMessage: 'Identity',
});

export const IDENTITY_SUBTITLE = i18n.translate('xpack.inbox.watches.detail.identity.subtitle', {
  defaultMessage: 'how this watch appears on cards, briefs & records',
});

export const DESCRIPTION_LABEL = i18n.translate('xpack.inbox.watches.detail.description', {
  defaultMessage: 'Description',
});

export const AUTONOMY_TITLE = i18n.translate('xpack.inbox.watches.detail.autonomy.title', {
  defaultMessage: 'Autonomy',
});

export const AUTONOMY_SUBTITLE = i18n.translate('xpack.inbox.watches.detail.autonomy.subtitle', {
  defaultMessage: 'applies to this watch only',
});

export const AUTONOMY_LEVEL = i18n.translate('xpack.inbox.watches.detail.autonomy.level', {
  defaultMessage: 'Level',
});

export const AUTONOMY_GUARDRAILS_NOTE = i18n.translate(
  'xpack.inbox.watches.detail.autonomy.guardrailsNote',
  {
    defaultMessage:
      'Org guardrails still apply — actions outside the allow-list stay gated at any level.',
  }
);

export const SCHEDULE_TITLE = i18n.translate('xpack.inbox.watches.detail.schedule.title', {
  defaultMessage: 'Schedule',
});

export const SCHEDULE_SUBTITLE = i18n.translate('xpack.inbox.watches.detail.schedule.subtitle', {
  defaultMessage: "when it's on duty, how it sweeps, where work goes after",
});

export const CADENCE_LABEL = i18n.translate('xpack.inbox.watches.detail.schedule.cadence', {
  defaultMessage: 'Cadence',
});

export const HANDOFF_LABEL = i18n.translate('xpack.inbox.watches.detail.schedule.handoff', {
  defaultMessage: 'Hand-off',
});

export const ASSIGNED_WORKFLOWS_TITLE = i18n.translate(
  'xpack.inbox.watches.detail.workflows.heading',
  {
    defaultMessage: 'Assigned workflows',
  }
);

export const assignedWorkflowsSubtitle = (on: number, total: number) =>
  i18n.translate('xpack.inbox.watches.detail.workflows.subtitle', {
    defaultMessage: '{on} of {total} on — run under this watch’s schedule and autonomy',
    values: { on, total },
  });

export const ASSIGN_WORKFLOW = i18n.translate('xpack.inbox.watches.detail.workflows.assign', {
  defaultMessage: 'Assign',
});

export const SKILLS_TITLE = i18n.translate('xpack.inbox.watches.detail.skills.title', {
  defaultMessage: 'Skills',
});

export const SKILLS_SUBTITLE = i18n.translate('xpack.inbox.watches.detail.skills.subtitle', {
  defaultMessage: 'what its agents can do',
});

export const DATA_BOUNDARIES_TITLE = i18n.translate(
  'xpack.inbox.watches.detail.dataBoundaries.title',
  {
    defaultMessage: 'Data boundaries',
  }
);

export const RECENT_RUNS_TITLE = i18n.translate('xpack.inbox.watches.detail.recentRuns.title', {
  defaultMessage: 'Recent runs',
});

export const VIEW_ALL_RUNS = i18n.translate('xpack.inbox.watches.detail.recentRuns.viewAll', {
  defaultMessage: 'View all runs',
});

export const NO_RUNS_YET = i18n.translate('xpack.inbox.watches.detail.recentRuns.empty', {
  defaultMessage: "No runs yet — this watch hasn't been activated.",
});

export const COL_TIME = i18n.translate('xpack.inbox.watches.detail.recentRuns.col.time', {
  defaultMessage: 'Time',
});

export const COL_WORKFLOW = i18n.translate('xpack.inbox.watches.detail.recentRuns.col.workflow', {
  defaultMessage: 'Workflow',
});

export const COL_ACTION = i18n.translate('xpack.inbox.watches.detail.recentRuns.col.action', {
  defaultMessage: 'Action',
});

export const COL_WHAT = i18n.translate('xpack.inbox.watches.detail.recentRuns.col.what', {
  defaultMessage: 'What',
});

export const COL_OUTCOME = i18n.translate('xpack.inbox.watches.detail.recentRuns.col.outcome', {
  defaultMessage: 'Outcome',
});

export const ACTION_READ = i18n.translate('xpack.inbox.watches.action.read', {
  defaultMessage: 'Read',
});

export const ACTION_DRAFT = i18n.translate('xpack.inbox.watches.action.draft', {
  defaultMessage: 'Draft',
});

export const ACTION_GATED = i18n.translate('xpack.inbox.watches.action.gated', {
  defaultMessage: 'Gated action',
});

export const ACTION_AUTO = i18n.translate('xpack.inbox.watches.action.auto', {
  defaultMessage: 'Auto-executed',
});

export const NAV_INBOX = i18n.translate('xpack.inbox.watches.nav.inbox', {
  defaultMessage: 'Inbox',
});

export const NAV_WATCHES = i18n.translate('xpack.inbox.watches.nav.watches', {
  defaultMessage: 'Watches',
});

export const WATCH_NOT_FOUND_TITLE = i18n.translate('xpack.inbox.watches.notFound.title', {
  defaultMessage: 'Watch not found',
});

export const WATCH_NOT_FOUND_BODY = i18n.translate('xpack.inbox.watches.notFound.body', {
  defaultMessage: 'This watch may have been removed or the id is invalid.',
});

export const POC_STUB_TOAST = i18n.translate('xpack.inbox.watches.pocStub', {
  defaultMessage: 'POC stub — changes are not persisted yet.',
});

export const CADENCE_STREAM = i18n.translate('xpack.inbox.watches.cadence.stream', {
  defaultMessage: 'Streaming',
});

export const CADENCE_SWEEP = i18n.translate('xpack.inbox.watches.cadence.sweep', {
  defaultMessage: 'Interval sweeps',
});

export const CADENCE_MANUAL = i18n.translate('xpack.inbox.watches.cadence.manual', {
  defaultMessage: 'Manual sessions',
});

export const HANDOFF_OFFICER = i18n.translate('xpack.inbox.watches.handoff.officer', {
  defaultMessage: 'Escalates to Watch Officer',
});

export const HANDOFF_ONCALL = i18n.translate('xpack.inbox.watches.handoff.oncall', {
  defaultMessage: 'Pages on-call for criticals',
});

export const HANDOFF_BRIEF = i18n.translate('xpack.inbox.watches.handoff.brief', {
  defaultMessage: 'Receipts to the morning brief',
});

export const HANDOFF_RECORDS = i18n.translate('xpack.inbox.watches.handoff.records', {
  defaultMessage: 'Findings to Records',
});

export const HANDOFF_NONE = i18n.translate('xpack.inbox.watches.handoff.none', {
  defaultMessage: 'No hand-off',
});

export const LAST_RUN_PREFIX = i18n.translate('xpack.inbox.watches.workflow.lastRunPrefix', {
  defaultMessage: 'last run',
});

export const NEVER_RUN_WORKFLOW = i18n.translate('xpack.inbox.watches.workflow.neverRun', {
  defaultMessage: 'never run',
});

export const GATED_BADGE = i18n.translate('xpack.inbox.watches.workflow.gated', {
  defaultMessage: 'gated',
});
