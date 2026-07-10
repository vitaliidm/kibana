/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GetWatchResponse, ListWatchesResponse, Watch, WorkerRef } from '../../common/watches';
import { coverageFromSchedule } from '../../common/watches';

/**
 * Throughline-seeded in-memory catalog for the Watches POC.
 * Not persisted — restarts reset to this seed.
 */

const SEED_WATCHES: Watch[] = [
  {
    id: 'floor',
    name: 'Watch Floor',
    color: '#16b3a6',
    icon: 'alert',
    enabled: true,
    draft: false,
    mandate: 'Frontline triage',
    description:
      'Triages everything new on both surfaces — investigates alerts and events, dedupes noise, drafts cases for review. Never acts on its own.',
    schedule: {
      set: true,
      mode: 'always',
      from: 8,
      to: 18,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'officer',
    },
    coverage: [[0, 24]],
    scopeSummary: 'Security indices · APM · logs',
    scopes: [
      { name: 'Security indices', access: 'full', label: 'Read' },
      { name: 'APM · logs · SLOs', access: 'full', label: 'Read' },
      { name: 'Finance PII', access: 'masked', label: 'Masked' },
    ],
    skillIds: ['alert-triage', 'case-assembly', 'slo-review'],
    workflowIds: ['wf-triage', 'wf-noise', 'wf-slo'],
    autonomyLevel: 3,
    metrics: { runs7d: 309, acceptedPct: 87, timeSaved: '22h', lastRun: '2m ago' },
    recentRuns: [
      {
        time: '09:21',
        workflow: 'Alert triage',
        action: 'draft',
        what: 'Drafted a case — mailbox exfil rule on r.patel',
        outcome: 'Awaiting review',
      },
      {
        time: '09:20',
        workflow: 'Noise suppression',
        action: 'auto',
        what: 'Auto-closed 47 duplicate scanner alerts',
        outcome: 'Resolved autonomously',
      },
      {
        time: '08:48',
        workflow: 'Alert triage',
        action: 'read',
        what: 'Read DS replication events on FIN-WS-09',
        outcome: 'Auto-run',
      },
    ],
  },
  {
    id: 'officer',
    name: 'Watch Officer',
    color: '#3b82f6',
    icon: 'bell',
    enabled: true,
    draft: false,
    mandate: 'Escalation & briefs',
    description:
      'Owns what needs a human — escalates criticals, pages on-call, assembles the shift briefs, and proposes response actions for approval.',
    schedule: {
      set: true,
      mode: 'always',
      from: 8,
      to: 18,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'oncall',
    },
    coverage: [[0, 24]],
    scopeSummary: 'Open threads · on-call · deploys',
    scopes: [
      { name: 'Open threads · cases', access: 'full', label: 'Read' },
      { name: 'On-call schedule', access: 'full', label: 'Read' },
      { name: 'Deploy history', access: 'full', label: 'Read' },
    ],
    skillIds: ['brief-generation', 'case-assembly', 'alert-triage'],
    workflowIds: ['wf-critical', 'wf-brief-am', 'wf-brief-night', 'wf-rollback'],
    autonomyLevel: 4,
    metrics: { runs7d: 58, acceptedPct: 81, timeSaved: '9h', lastRun: '08:50' },
    recentRuns: [
      {
        time: '08:50',
        workflow: 'Critical escalation',
        action: 'gated',
        what: 'Proposed isolate FIN-WS-09',
        outcome: 'Awaiting your review',
      },
      {
        time: '06:00',
        workflow: 'Morning brief',
        action: 'draft',
        what: 'Drafted the shift brief',
        outcome: 'Delivered',
      },
      {
        time: '02:41',
        workflow: 'Rollback proposals',
        action: 'gated',
        what: 'Escalated the NightShift rollback proposal',
        outcome: 'Held for your review',
      },
    ],
  },
  {
    id: 'dark',
    name: 'Dark Watch',
    color: '#f59e0b',
    icon: 'bolt',
    enabled: true,
    draft: false,
    mandate: 'Overnight autonomous response',
    description:
      'Covers the hours nobody’s on. Acts on allow-listed containment — mailbox rules, brute-force blocks — every action reversible and audited, receipts filed to the morning brief.',
    schedule: {
      set: true,
      mode: 'window',
      from: 22,
      to: 6,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'brief',
    },
    coverage: [
      [22, 24],
      [0, 6],
    ],
    scopeSummary: 'Mail · IdP · edge / VPN',
    scopes: [
      { name: 'Mail · IdP', access: 'full', label: 'Read + act' },
      { name: 'Edge / VPN', access: 'full', label: 'Read + act' },
      { name: 'Customer data', access: 'denied', label: 'No access' },
    ],
    skillIds: ['alert-triage', 'case-assembly', 'brief-generation'],
    workflowIds: ['wf-mailbox', 'wf-edge', 'wf-handoff'],
    autonomyLevel: 5,
    metrics: { runs7d: 31, acceptedPct: 97, timeSaved: '9h', lastRun: '05:45' },
    recentRuns: [
      {
        time: '05:45',
        workflow: 'Morning hand-off',
        action: 'draft',
        what: 'Filed 2 receipts to the morning brief',
        outcome: 'Delivered',
      },
      {
        time: '04:47',
        workflow: 'Edge brute-force',
        action: 'auto',
        what: 'Blocked VPN brute-force range · CASE-2044',
        outcome: 'Resolved autonomously',
      },
      {
        time: '03:12',
        workflow: 'Mailbox rules',
        action: 'auto',
        what: 'Removed exfil forwarding rule · CASE-2043',
        outcome: 'Resolved autonomously',
      },
    ],
  },
  {
    id: 'deep',
    name: 'Deep Watch',
    color: '#8b5cf6',
    icon: 'console',
    enabled: true,
    draft: false,
    mandate: 'Deep investigation & hunts',
    description:
      'Long-running investigations and hypothesis hunts — powers the Deep Watch workbench, drafts findings, and proposes detection tuning.',
    schedule: {
      set: true,
      mode: 'window',
      from: 8,
      to: 18,
      onDemand: true,
      cadence: 'manual',
      every: 60,
      handoff: 'records',
    },
    coverage: [[8, 18]],
    scopeSummary: 'Security indices · EDR · DNS',
    scopes: [
      { name: 'Security indices', access: 'full', label: 'Read' },
      { name: 'EDR telemetry', access: 'full', label: 'Read' },
      { name: 'DNS · netflow', access: 'full', label: 'Read' },
    ],
    skillIds: ['threat-hunt', 'case-assembly', 'detection-tuning'],
    workflowIds: ['wf-hunts', 'wf-beacon'],
    autonomyLevel: 3,
    metrics: { runs7d: 46, acceptedPct: 83, timeSaved: '8h', lastRun: '09:09' },
    recentRuns: [
      {
        time: '09:09',
        workflow: 'Manual session',
        action: 'read',
        what: 'Pulled process lineage for FIN-DB-02',
        outcome: 'Auto-run',
      },
      {
        time: 'Mon 10:00',
        workflow: 'Hypothesis hunts',
        action: 'draft',
        what: 'Completed hunt: LOLBins in CI/CD',
        outcome: 'Findings filed',
      },
    ],
  },
  {
    id: 'fraud',
    name: 'Fraud signals',
    color: '#6b7280',
    icon: 'sparkles',
    enabled: false,
    draft: true,
    mandate: 'Risk & fraud',
    description:
      'Draft — watches transaction and session streams for velocity anomalies and account-takeover patterns. Finish scoping to activate.',
    schedule: {
      set: false,
      mode: 'window',
      from: 9,
      to: 17,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'none',
    },
    coverage: [],
    scopeSummary: 'Transactions · sessions',
    scopes: [
      { name: 'Transactions', access: 'full', label: 'Read' },
      { name: 'Sessions', access: 'masked', label: 'Masked' },
    ],
    skillIds: ['alert-triage'],
    workflowIds: ['wf-anomtx'],
    autonomyLevel: 1,
    metrics: { runs7d: null, acceptedPct: null, timeSaved: null, lastRun: null },
    recentRuns: [],
  },
];

const SEED_WORKERS: WorkerRef[] = [
  {
    id: 'wf-triage',
    name: 'Alert triage',
    watchIds: ['floor'],
    trigger: { type: 'event', summary: 'On alert · any severity' },
    skillId: 'alert-triage',
    outcome: 'Proposes a case',
    gated: false,
    enabled: true,
    lastRun: '09:21',
  },
  {
    id: 'wf-noise',
    name: 'Noise suppression',
    watchIds: ['floor'],
    trigger: { type: 'event', summary: 'On duplicate · known FPs' },
    skillId: 'alert-triage',
    outcome: 'Auto-closes duplicates',
    gated: false,
    enabled: true,
    lastRun: '25m ago',
  },
  {
    id: 'wf-slo',
    name: 'SLO regression review',
    watchIds: ['floor'],
    trigger: { type: 'schedule', summary: 'Schedule · hourly' },
    skillId: 'slo-review',
    outcome: 'Flags regressions, drafts findings',
    gated: false,
    enabled: true,
    lastRun: '09:00',
  },
  {
    id: 'wf-critical',
    name: 'Critical escalation',
    watchIds: ['officer'],
    trigger: { type: 'event', summary: 'On alert · severity = critical' },
    skillId: 'alert-triage',
    outcome: 'Pages on-call, proposes response',
    gated: true,
    enabled: true,
    lastRun: '08:50',
  },
  {
    id: 'wf-brief-am',
    name: 'Morning brief',
    watchIds: ['officer'],
    trigger: { type: 'schedule', summary: 'Schedule · 06:00 daily' },
    skillId: 'brief-generation',
    outcome: 'Drafts the shift brief',
    gated: false,
    enabled: true,
    lastRun: 'today 06:00',
  },
  {
    id: 'wf-brief-night',
    name: 'Overnight brief',
    watchIds: ['officer'],
    trigger: { type: 'schedule', summary: 'Schedule · 00:00 daily' },
    skillId: 'brief-generation',
    outcome: 'Drafts the overnight brief',
    gated: false,
    enabled: true,
    lastRun: 'today 00:00',
  },
  {
    id: 'wf-rollback',
    name: 'Rollback proposals',
    watchIds: ['officer'],
    trigger: { type: 'event', summary: 'On deploy · error-budget burn' },
    skillId: 'case-assembly',
    outcome: 'Proposes a rollback',
    gated: true,
    enabled: true,
    lastRun: '02:41',
  },
  {
    id: 'wf-mailbox',
    name: 'Mailbox rules',
    watchIds: ['dark'],
    trigger: { type: 'event', summary: 'On change · New-InboxRule' },
    skillId: 'alert-triage',
    outcome: 'Removes exfil rules · allow-listed',
    gated: false,
    enabled: true,
    lastRun: '03:12',
  },
  {
    id: 'wf-edge',
    name: 'Edge brute-force',
    watchIds: ['dark'],
    trigger: { type: 'event', summary: 'On spray · botnet-listed IPs' },
    skillId: 'alert-triage',
    outcome: 'Blocks the range · allow-listed',
    gated: false,
    enabled: true,
    lastRun: '04:47',
  },
  {
    id: 'wf-handoff',
    name: 'Morning hand-off',
    watchIds: ['dark'],
    trigger: { type: 'schedule', summary: 'Schedule · 05:45 daily' },
    skillId: 'brief-generation',
    outcome: 'Files receipts to the brief',
    gated: false,
    enabled: true,
    lastRun: 'today 05:45',
  },
  {
    id: 'wf-hunts',
    name: 'Hypothesis hunts',
    watchIds: ['deep'],
    trigger: { type: 'schedule', summary: 'Schedule · weekly + on demand' },
    skillId: 'threat-hunt',
    outcome: 'Drafts findings to Records',
    gated: false,
    enabled: true,
    lastRun: 'Mon 10:00',
  },
  {
    id: 'wf-beacon',
    name: 'Beacon watch',
    watchIds: ['deep', 'dark'],
    trigger: { type: 'event', summary: 'On beacon · low-reputation domain' },
    skillId: 'threat-hunt',
    outcome: 'Snooze + add to watchlist',
    gated: false,
    enabled: false,
    lastRun: null,
  },
  {
    id: 'wf-anomtx',
    name: 'Anomalous transactions',
    watchIds: ['fraud'],
    trigger: { type: 'event', summary: 'On pattern · velocity anomaly' },
    skillId: 'alert-triage',
    outcome: 'Proposes a review',
    gated: false,
    enabled: false,
    lastRun: null,
  },
];

export class WatchesMockStore {
  private readonly watches: Watch[];
  private readonly workers: WorkerRef[];

  constructor(watches: Watch[] = SEED_WATCHES, workers: WorkerRef[] = SEED_WORKERS) {
    this.watches = watches.map((w) => ({
      ...w,
      coverage: w.coverage.length ? w.coverage : coverageFromSchedule(w.schedule),
    }));
    this.workers = workers;
  }

  list(): ListWatchesResponse {
    return {
      watches: this.watches.map((w) => ({ ...w })),
      workers: this.workers.map((w) => ({ ...w })),
    };
  }

  get(watchId: string): GetWatchResponse | undefined {
    const watch = this.watches.find((w) => w.id === watchId);
    if (!watch) return undefined;
    const workers = this.workers.filter((worker) => worker.watchIds.includes(watchId));
    return {
      watch: { ...watch },
      workers: workers.map((w) => ({ ...w })),
    };
  }
}

let singleton: WatchesMockStore | undefined;

export const getWatchesMockStore = (): WatchesMockStore => {
  if (!singleton) {
    singleton = new WatchesMockStore();
  }
  return singleton;
};

/** Test helper — reset the singleton between suites. */
export const resetWatchesMockStore = (): void => {
  singleton = undefined;
};
