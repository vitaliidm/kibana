/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { WorkflowListItemDto, WorkflowYaml } from '@kbn/workflows';
import {
  extractWatchPolicy,
  projectCallablesFromDefinition,
  projectSchedule,
  projectTriggers,
  projectWorkflowToWatch,
} from './project_watch';

const floorDefinition = {
  name: 'Watch Floor',
  enabled: true,
  tags: ['watch', 'watch-floor'],
  triggers: [{ type: 'alert' }, { type: 'manual' }],
  steps: [
    {
      name: 'watch_policy',
      type: 'data.set',
      with: {
        watch: {
          mandate: 'Frontline triage',
          autonomyLevel: 3,
          handoff: 'officer',
          onDemand: false,
          draft: false,
          cadence: 'stream',
          mode: 'always',
          ui: { color: '#16b3a6', icon: 'alert', order: 10 },
          scopeSummary: 'Security indices',
          scopes: [{ name: 'Security indices', access: 'full', label: 'Read' }],
          callables: [
            {
              id: 'alert-analysis',
              name: 'Alert analysis',
              kind: 'skill',
              summary: 'On alert · classifies FP / TP / inconclusive',
              gated: false,
              enabled: true,
            },
            {
              id: 'noise-suppress',
              name: 'Noise suppression',
              kind: 'skill',
              summary: 'Should not appear — not in the graph',
              gated: false,
              enabled: true,
            },
          ],
        },
      },
    },
    {
      name: 'triage_alerts',
      type: 'ai.agent',
      with: {
        message:
          'Use the [/alert-analysis](skill://alert-analysis) skill to triage: {{ event | json }}',
      },
    },
  ],
} as unknown as WorkflowYaml;

describe('project_watch', () => {
  it('extracts watch policy from data.set step', () => {
    const policy = extractWatchPolicy(floorDefinition);
    expect(policy?.mandate).toBe('Frontline triage');
    expect(policy?.autonomyLevel).toBe(3);
  });

  it('projects triggers from workflow definition', () => {
    expect(projectTriggers(floorDefinition)).toEqual([
      { type: 'event', summary: 'On alert' },
      { type: 'manual', summary: 'Manual / on demand' },
    ]);
  });

  it('projects always-on schedule for alert-driven watches', () => {
    const triggers = projectTriggers(floorDefinition);
    const schedule = projectSchedule(triggers, extractWatchPolicy(floorDefinition));
    expect(schedule.mode).toBe('always');
    expect(schedule.set).toBe(true);
  });

  it('derives callables from ai.agent skill URIs and applies overrides', () => {
    const callables = projectCallablesFromDefinition(
      floorDefinition,
      extractWatchPolicy(floorDefinition)
    );
    expect(callables).toHaveLength(1);
    expect(callables[0]).toMatchObject({
      id: 'alert-analysis',
      name: 'Alert analysis',
      kind: 'skill',
      summary: 'On alert · classifies FP / TP / inconclusive',
    });
  });

  it('derives workflow.execute targets as workflow callables', () => {
    const definition = {
      steps: [
        {
          name: 'handoff',
          type: 'workflow.executeAsync',
          with: { 'workflow-id': 'system-inbox-watch-officer' },
        },
      ],
    } as unknown as WorkflowYaml;
    const callables = projectCallablesFromDefinition(definition, undefined);
    expect(callables).toEqual([
      expect.objectContaining({
        id: 'system-inbox-watch-officer',
        kind: 'workflow',
      }),
    ]);
  });

  it('projects a WorkflowListItem into a Watch', () => {
    const item: WorkflowListItemDto = {
      id: 'system-inbox-watch-floor',
      name: 'Watch Floor',
      description: 'Tier-1',
      enabled: true,
      managed: true,
      definition: floorDefinition,
      createdAt: '2026-01-01T00:00:00Z',
      tags: ['watch', 'watch-floor'],
      valid: true,
      history: [],
    };
    const watch = projectWorkflowToWatch(item);
    expect(watch.id).toBe('system-inbox-watch-floor');
    expect(watch.tags).toContain('watch');
    expect(watch.managed).toBe(true);
    expect(watch.sortOrder).toBe(10);
    expect(watch.callables.map((c) => c.id)).toEqual(['alert-analysis']);
    expect(watch.coverage).toEqual([[0, 24]]);
  });

  it('falls back to definition.tags when list DTO omits top-level tags', () => {
    const item: WorkflowListItemDto = {
      id: 'system-inbox-watch-floor',
      name: 'Watch Floor',
      description: 'Tier-1',
      enabled: true,
      definition: floorDefinition,
      createdAt: '2026-01-01T00:00:00Z',
      valid: true,
      history: [],
    };
    const watch = projectWorkflowToWatch(item);
    expect(watch.tags).toEqual(['watch', 'watch-floor']);
  });
});
