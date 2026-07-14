/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { compareWatchesForDisplay, coverageFromSchedule, isOnDutyNow } from './types';
import type { Watch, WatchSchedule } from './types';

describe('coverageFromSchedule', () => {
  it('returns empty coverage when schedule is unset', () => {
    const schedule: WatchSchedule = {
      set: false,
      mode: 'window',
      from: 9,
      to: 17,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'none',
    };
    expect(coverageFromSchedule(schedule)).toEqual([]);
  });

  it('returns full-day coverage for always mode', () => {
    const schedule: WatchSchedule = {
      set: true,
      mode: 'always',
      from: 8,
      to: 18,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'officer',
    };
    expect(coverageFromSchedule(schedule)).toEqual([[0, 24]]);
  });

  it('splits midnight-wrapping windows', () => {
    const schedule: WatchSchedule = {
      set: true,
      mode: 'window',
      from: 22,
      to: 6,
      onDemand: false,
      cadence: 'stream',
      every: 60,
      handoff: 'brief',
    };
    expect(coverageFromSchedule(schedule)).toEqual([
      [22, 24],
      [0, 6],
    ]);
  });
});

describe('isOnDutyNow', () => {
  it('detects on-duty within a segment', () => {
    expect(isOnDutyNow([[8, 18]], 10.5)).toBe(true);
    expect(isOnDutyNow([[8, 18]], 20)).toBe(false);
  });

  it('handles wrap segments', () => {
    expect(
      isOnDutyNow(
        [
          [22, 24],
          [0, 6],
        ],
        23
      )
    ).toBe(true);
    expect(
      isOnDutyNow(
        [
          [22, 24],
          [0, 6],
        ],
        3
      )
    ).toBe(true);
    expect(
      isOnDutyNow(
        [
          [22, 24],
          [0, 6],
        ],
        12
      )
    ).toBe(false);
  });
});

describe('compareWatchesForDisplay', () => {
  const base = {
    tags: ['watch'],
    color: '#000',
    icon: 'alert',
    enabled: true,
    draft: false,
    managed: true,
    mandate: 'm',
    description: '',
    schedule: {
      set: true,
      mode: 'always' as const,
      from: 0,
      to: 24,
      onDemand: false,
      cadence: 'stream' as const,
      every: 60,
      handoff: 'none' as const,
    },
    triggers: [],
    coverage: [[0, 24]] as Array<[number, number]>,
    scopeSummary: '—',
    scopes: [],
    callables: [],
    autonomyLevel: 1 as const,
    metrics: { runs7d: null, acceptedPct: null, timeSaved: null, lastRun: null },
    recentRuns: [],
  };

  it('orders by sortOrder then name', () => {
    const watches: Watch[] = [
      { ...base, id: 'c', name: 'Custom', managed: false, sortOrder: Number.MAX_SAFE_INTEGER },
      { ...base, id: 'd', name: 'Dark Watch', sortOrder: 30 },
      { ...base, id: 'f', name: 'Watch Floor', sortOrder: 10 },
      { ...base, id: 'o', name: 'Watch Officer', sortOrder: 20 },
    ];
    expect(watches.sort(compareWatchesForDisplay).map((w) => w.id)).toEqual(['f', 'o', 'd', 'c']);
  });
});
