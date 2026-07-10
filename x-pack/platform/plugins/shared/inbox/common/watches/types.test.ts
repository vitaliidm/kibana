/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { coverageFromSchedule, isOnDutyNow } from './types';
import type { WatchSchedule } from './types';

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
