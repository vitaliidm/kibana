/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Watch POC types — Watch === workflow (1:1).
 *
 * Mirrors the CWL collaboration contract in:
 * `docs/working-groups/common-worker-layer/artifacts/watch-worker-contract.ts`
 *
 * Each Watch is a projection of a workflow tagged `watch`. Policy extras live
 * temporarily on a `watch_policy` data.set step (`with.watch`). "Worker" is
 * engineering shorthand only — not a peer API object.
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

/**
 * Projected schedule for UI. Derived from workflow triggers (+ temporary
 * window metadata in agent-step attrs). NotDaybreak does not add a separate
 * scheduler.
 */
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

export interface WatchRecentRunStep {
  name: string;
  type?: string;
  status?: string;
}

/**
 * Projected from workflow execution history (multi-step, not a single skill).
 */
export interface WatchRecentRun {
  executionId: string;
  startedAt: string;
  status: string;
  triggerType?: string;
  /** Ordered step summaries when available from the execution trace. */
  steps: WatchRecentRunStep[];
  /** Best-effort headline for cards/tables. */
  summary: string;
  /** @deprecated Prefer steps/summary — kept for transitional UI copy. */
  action?: WatchRunAction;
}

export interface WatchMetrics {
  runs7d: number | null;
  acceptedPct: number | null;
  timeSaved: string | null;
  lastRun: string | null;
}

/**
 * Temporary policy bag hung off the workflow `watch_policy` data.set step
 * (`with.watch`). Not a final schema — parking catalog attrs here while storage settles.
 */
export interface WatchAgentStepAttrs {
  mandate: string;
  autonomyLevel: AutonomyLevel;
  handoff: ScheduleHandoff;
  scopes: WatchScope[];
  onDemand: boolean;
  draft?: boolean;
  from?: number;
  to?: number;
  mode?: ScheduleMode;
  cadence?: ScheduleCadence;
  every?: number;
  scopeSummary?: string;
  ui?: {
    color?: string;
    icon?: string;
    /**
     * Catalog display order (lower first). Managed watches set this;
     * custom watches omit it and sort after the catalog.
     */
    order?: number;
  };
  /**
   * Optional display overrides keyed by capability id. Executable callables are
   * derived from the workflow graph (`ai.agent` skill:// mentions and
   * `workflow.execute*` targets); entries here only refine name/summary/gated
   * for ids that the graph actually invokes.
   */
  callables?: WatchCallableRef[];
}

/**
 * Skill or nested workflow the watch actually invokes (projected from YAML steps).
 * Capabilities of one watch workflow — not sibling watches.
 */
export interface WatchCallableRef {
  id: string;
  name: string;
  kind: 'skill' | 'workflow';
  summary: string;
  gated: boolean;
  enabled: boolean;
  lastRun: string | null;
}

export type WorkflowTriggerType = 'event' | 'schedule' | 'manual';

export interface WatchTriggerProjection {
  type: WorkflowTriggerType;
  summary: string;
}

/**
 * Watch — workflow-backed unit of agentic security work (1:1 with a workflow).
 * Throughline-friendly projection for the Inbox POC UI.
 */
export interface Watch {
  id: string;
  name: string;
  /** Always includes `watch`, plus a tier tag when known. */
  tags: string[];
  color: string;
  icon: string;
  enabled: boolean;
  draft: boolean;
  /** True for Inbox-managed catalog watches — not deletable from this UI. */
  managed: boolean;
  /** Catalog sort key; `Number.MAX_SAFE_INTEGER` when unset (customs last). */
  sortOrder: number;
  mandate: string;
  description: string;
  schedule: WatchSchedule;
  triggers: WatchTriggerProjection[];
  coverage: Array<[number, number]>;
  scopeSummary: string;
  scopes: WatchScope[];
  callables: WatchCallableRef[];
  autonomyLevel: AutonomyLevel;
  metrics: WatchMetrics;
  recentRuns: WatchRecentRun[];
}

export interface ListWatchesResponse {
  watches: Watch[];
}

export interface GetWatchResponse {
  watch: Watch;
}

export interface CreateWatchRequest {
  name: string;
  description?: string;
}

export interface CreateWatchResponse {
  watch: Watch;
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

/** Sort watches for coverage strip + cards: catalog order, then name. */
export function compareWatchesForDisplay(a: Watch, b: Watch): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name);
}

export function autonomyLabel(level: AutonomyLevel): AutonomyLabel {
  return AUTONOMY_LABELS[level - 1];
}

export const SKILL_LABELS: Record<string, string> = {
  'alert-analysis': 'Alert analysis',
  'alert-triage': 'Alert triage',
  'case-assembly': 'Case assembly',
  'slo-review': 'SLO review',
  'brief-generation': 'Brief generation',
  'threat-hunt': 'Threat hunt (TTP)',
  'detection-tuning': 'Detection tuning',
  'noise-suppress': 'Noise suppression',
  'mailbox-rules': 'Mailbox rules',
  'edge-block': 'Edge brute-force',
  'beacon-watch': 'Beacon watch',
  'anom-tx': 'Anomalous transactions',
};

export function skillLabel(skillId: string): string {
  return SKILL_LABELS[skillId] ?? skillId;
}

export const WATCH_TAG = 'watch' as const;
export const WATCH_CUSTOM_TAG = 'watch-custom' as const;
