/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { mathAgg } from './math';
import { stdMetric } from './std_metric';

describe('math(resp, panel, series)', () => {
  let panel;
  let series;
  let resp;
  beforeEach(() => {
    panel = {
      time_field: 'timestamp',
    };
    series = {
      chart_type: 'line',
      stacked: false,
      line_width: 1,
      point_size: 1,
      fill: 0,
      id: 'test',
      label: 'Math',
      split_mode: 'terms',
      split_color_mode: 'gradient',
      color: '#F00',
      metrics: [
        {
          id: 'avgcpu',
          type: 'avg',
          field: 'cpu',
        },
        {
          id: 'mincpu',
          type: 'min',
          field: 'cpu',
        },
        {
          id: 'mathagg',
          type: 'math',
          script: 'divide(params.a, params.b)',
          variables: [
            { name: 'a', field: 'avgcpu' },
            { name: 'b', field: 'mincpu' },
          ],
        },
      ],
    };
    resp = {
      aggregations: {
        test: {
          meta: {
            intervalString: '5s',
          },
          buckets: [
            {
              key: 'example-01',
              timeseries: {
                buckets: [
                  {
                    key: 1,
                    avgcpu: { value: 0.25 },
                    mincpu: { value: 0.125 },
                  },
                  {
                    key: 2,
                    avgcpu: { value: 0.25 },
                    mincpu: { value: 0.25 },
                  },
                ],
              },
            },
          ],
        },
      },
    };
  });

  test('calls next when finished', async () => {
    const next = jest.fn();
    await mathAgg(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
  });

  test('creates a series', async () => {
    const next = await mathAgg(resp, panel, series)((results) => results);
    const results = await stdMetric(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);

    expect(results[0]).toEqual({
      id: 'test╰┄►example-01',
      label: 'example-01',
      color: '#ff0000',
      stack: false,
      seriesId: 'test',
      lines: { show: true, fill: 0, lineWidth: 1, steps: false },
      points: { show: true, radius: 1, lineWidth: 1 },
      bars: { fill: 0, lineWidth: 1, show: false },
      data: [
        [1, 2],
        [2, 1],
      ],
    });
  });

  test('works with percentiles and percentile rank', async () => {
    series.metrics = [
      {
        id: 'percentile_cpu',
        type: 'percentile',
        field: 'cpu',
        percentiles: [{ value: 50, id: 'p50' }],
      },
      {
        id: 'rank_cpu',
        type: 'percentile_rank',
        field: 'cpu',
        percentiles: [{ value: 500, id: 'p500' }],
      },
      {
        id: 'mathagg',
        type: 'math',
        script: 'divide(params.a, params.b)',
        variables: [
          { name: 'a', field: 'percentile_cpu[50.0]' },
          { name: 'b', field: 'rank_cpu[500.0]' },
        ],
      },
    ];
    resp.aggregations.test.buckets[0].timeseries.buckets[0].percentile_cpu = {
      values: { '50.0': 0.25 },
    };
    resp.aggregations.test.buckets[0].timeseries.buckets[0].rank_cpu = {
      values: { '500.0': 0.125 },
    };
    resp.aggregations.test.buckets[0].timeseries.buckets[1].percentile_cpu = {
      values: { '50.0': 0.25 },
    };
    resp.aggregations.test.buckets[0].timeseries.buckets[1].rank_cpu = {
      values: { '500.0': 0.25 },
    };

    const next = await mathAgg(resp, panel, series)((results) => results);
    const results = await stdMetric(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);

    expect(results[0]).toEqual({
      id: 'test╰┄►example-01',
      label: 'example-01',
      color: '#ff0000',
      stack: false,
      seriesId: 'test',
      lines: { show: true, fill: 0, lineWidth: 1, steps: false },
      points: { show: true, radius: 1, lineWidth: 1 },
      bars: { fill: 0, lineWidth: 1, show: false },
      data: [
        [1, 2],
        [2, 1],
      ],
    });
  });

  test('handles math even if there is a series agg', async () => {
    series.metrics.push({
      id: 'myid',
      type: 'series_agg',
      function: 'sum',
    });
    const next = await mathAgg(resp, panel, series)((results) => results);
    const results = await stdMetric(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);

    expect(results[0]).toEqual({
      id: 'test╰┄►example-01',
      label: 'example-01',
      color: '#ff0000',
      stack: false,
      seriesId: 'test',
      lines: { show: true, fill: 0, lineWidth: 1, steps: false },
      points: { show: true, radius: 1, lineWidth: 1 },
      bars: { fill: 0, lineWidth: 1, show: false },
      data: [
        [1, 2],
        [2, 1],
      ],
    });
  });

  test('turns division by zero into null values', async () => {
    resp.aggregations.test.buckets[0].timeseries.buckets[0].mincpu = 0;
    const next = await mathAgg(resp, panel, series)((results) => results);
    const results = await stdMetric(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        data: [
          [1, null],
          [2, 1],
        ],
      })
    );
  });

  test('should works with predefined variables (params._interval)', async () => {
    const expectedInterval = 5000;

    series.metrics[2].script = 'params._interval';

    const next = await mathAgg(resp, panel, series)((results) => results);
    const results = await stdMetric(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        data: [
          [1, expectedInterval],
          [2, expectedInterval],
        ],
      })
    );
  });

  test('throws on actual tinymath expression errors #1', async () => {
    series.metrics[2].script = 'notExistingFn(params.a)';

    try {
      await stdMetric(
        resp,
        panel,
        series
      )(await mathAgg(resp, panel, series)((results) => results))([]);
    } catch (e) {
      expect(e.message).toEqual('No such function: notExistingFn');
    }
  });

  test('throws on actual tinymath expression errors #2', async () => {
    series.metrics[2].script = 'divide(params.a, params.b';

    try {
      await stdMetric(
        resp,
        panel,
        series
      )(await mathAgg(resp, panel, series)((results) => results))([]);
    } catch (e) {
      expect(e.message).toMatchInlineSnapshot(
        `"Failed to parse expression. Expected \\"=\\", [*/], [+\\\\-], [<>], end of input, or whitespace but \\"(\\" found."`
      );
    }
  });
});
