/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Watch / Worker POC types.
 *
 * Mirrors the CWL collaboration contract in:
 * `docs/working-groups/common-worker-layer/artifacts/watch-worker-contract.ts`
 */

/** Throughline UI-facing autonomy levels (POC). */
export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Labels for {@link AutonomyLevel}.
 * 1 Suggest only · 2 Reads auto · 3 Drafts auto · 4 Acts · gated · 5 Acts · trusted
 */
export const AUTONOMY_LABELS = [
  'Suggest only',
  'Reads auto',
  'Drafts auto',
  'Acts · gated',
  'Acts · trusted',
] as const;

export type AutonomyLabel = (typeof AUTONOMY_LABELS)[number];

export type ScheduleMode = 'always' | 'window' | 'demand';
export type ScheduleCadence = 'stream' | 'sweep' | 'manual';
export type ScheduleHandoff = 'officer' | 'oncall' | 'brief' | 'records' | 'none';

export interface WatchSchedule {
  set: boolean;
  mode: ScheduleMode;
  from: number;
  to: number;
  onDemand: boolean;
  cadence: ScheduleCadence;
  every: number;
  handoff: ScheduleHandoff;
}

export type ScopeAccess = 'full' | 'masked' | 'denied';

export interface WatchScope {
  name: string;
  access: ScopeAccess;
  label: string;
}

export type WatchRunAction = 'read' | 'draft' | 'gated' | 'auto';

export interface WatchRecentRun {
  time: string;
  workflow: string;
  action: WatchRunAction;
  what: string;
  outcome: string;
}

export interface WatchMetrics {
  runs7d: number | null;
  acceptedPct: number | null;
  timeSaved: string | null;
  lastRun: string | null;
}

export interface Watch {
  id: string;
  name: string;
  color: string;
  icon: string;
  enabled: boolean;
  draft: boolean;
  mandate: string;
  description: string;
  schedule: WatchSchedule;
  coverage: Array<[number, number]>;
  scopeSummary: string;
  scopes: WatchScope[];
  skillIds: string[];
  workflowIds: string[];
  autonomyLevel: AutonomyLevel;
  metrics: WatchMetrics;
  recentRuns: WatchRecentRun[];
}

export type WorkerTriggerType = 'event' | 'schedule';

export interface WorkerRef {
  id: string;
  name: string;
  watchIds: string[];
  trigger: {
    type: WorkerTriggerType;
    summary: string;
  };
  skillId: string;
  outcome: string;
  gated: boolean;
  enabled: boolean;
  lastRun: string | null;
}

export interface ListWatchesResponse {
  watches: Watch[];
  workers: WorkerRef[];
}

export interface GetWatchResponse {
  watch: Watch;
  workers: WorkerRef[];
}

export function coverageFromSchedule(schedule: WatchSchedule): Array<[number, number]> {
  if (!schedule.set) return [];
  if (schedule.mode === 'always') return [[0, 24]];
  if (schedule.mode === 'demand') return [];
  const { from, to } = schedule;
  if (from < to) return [[from, to]];
  if (from > to)
    return [
      [from, 24],
      [0, to],
    ];
  return [[0, 24]];
}

export function isOnDutyNow(coverage: Array<[number, number]>, hourFractional: number): boolean {
  return coverage.some(([a, b]) => hourFractional >= a && hourFractional < b);
}

export function autonomyLabel(level: AutonomyLevel): AutonomyLabel {
  return AUTONOMY_LABELS[level - 1];
}

export const SKILL_LABELS: Record<string, string> = {
  'alert-triage': 'Alert triage',
  'case-assembly': 'Case assembly',
  'slo-review': 'SLO review',
  'brief-generation': 'Brief generation',
  'threat-hunt': 'Threat hunt (TTP)',
  'detection-tuning': 'Detection tuning',
};

export function skillLabel(skillId: string): string {
  return SKILL_LABELS[skillId] ?? skillId;
}
