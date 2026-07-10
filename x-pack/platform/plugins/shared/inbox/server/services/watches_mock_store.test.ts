/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { WatchesMockStore, resetWatchesMockStore } from './watches_mock_store';

describe('WatchesMockStore', () => {
  beforeEach(() => {
    resetWatchesMockStore();
  });

  it('lists seeded watches and workers', () => {
    const store = new WatchesMockStore();
    const { watches, workers } = store.list();
    expect(watches.length).toBeGreaterThanOrEqual(5);
    expect(watches.map((w) => w.id)).toEqual(
      expect.arrayContaining(['floor', 'officer', 'dark', 'deep', 'fraud'])
    );
    expect(workers.length).toBeGreaterThan(0);
  });

  it('returns a watch with its assigned workers', () => {
    const store = new WatchesMockStore();
    const result = store.get('floor');
    expect(result).toBeDefined();
    expect(result!.watch.name).toBe('Watch Floor');
    expect(result!.workers.every((w) => w.watchIds.includes('floor'))).toBe(true);
    expect(result!.workers.map((w) => w.id)).toEqual(
      expect.arrayContaining(['wf-triage', 'wf-noise', 'wf-slo'])
    );
  });

  it('returns undefined for unknown watch ids', () => {
    const store = new WatchesMockStore();
    expect(store.get('missing')).toBeUndefined();
  });
});
