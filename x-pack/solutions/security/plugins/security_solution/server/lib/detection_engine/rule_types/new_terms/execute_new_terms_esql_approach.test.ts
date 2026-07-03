/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EsqlTable } from '../esql/esql_request';
import {
  buildNewTermsEsqlQuery,
  parseNewTermsCombinationsFromEsqlResponse,
} from './execute_new_terms_esql_approach';

describe('buildNewTermsEsqlQuery', () => {
  const ruleIntervalFrom = '2026-06-17T14:00:00.000Z';

  it('builds a single-field query without the timestamp-override branch', () => {
    const query = buildNewTermsEsqlQuery({
      inputIndex: ['logs-*'],
      newTermsFields: ['host.name'],
      aggregatableTimestampField: '@timestamp',
      primaryTimestamp: '@timestamp',
      secondaryTimestamp: undefined,
      ruleIntervalFrom,
    });

    expect(query).toBe(
      'FROM logs-* | WHERE `host.name` IS NOT NULL | MV_EXPAND `host.name` | ' +
        'STATS first_seen = MIN(@timestamp) BY `host.name` | ' +
        'WHERE first_seen > "2026-06-17T14:00:00.000Z"'
    );
    expect(query).not.toContain('EVAL');
    expect(query).not.toContain('CASE');
  });

  it('builds a multi-field query with the timestamp-override branch', () => {
    const query = buildNewTermsEsqlQuery({
      inputIndex: ['logs-*', 'logs-2-*'],
      newTermsFields: ['host.name', 'user.name'],
      aggregatableTimestampField: 'kibana.combined_timestamp',
      primaryTimestamp: 'event.ingested',
      secondaryTimestamp: '@timestamp',
      ruleIntervalFrom,
    });

    expect(query).toBe(
      'FROM logs-*, logs-2-* | ' +
        'EVAL `kibana.combined_timestamp` = CASE(`event.ingested` IS NOT NULL, `event.ingested`, @timestamp) | ' +
        'WHERE `host.name` IS NOT NULL | WHERE `user.name` IS NOT NULL | ' +
        'MV_EXPAND `host.name` | MV_EXPAND `user.name` | ' +
        'STATS first_seen = MIN(`kibana.combined_timestamp`) BY `host.name`, `user.name` | ' +
        'WHERE first_seen > "2026-06-17T14:00:00.000Z"'
    );
  });

  it('does not add the override branch when the timestamp field is combined but there is no secondary timestamp', () => {
    const query = buildNewTermsEsqlQuery({
      inputIndex: ['logs-*'],
      newTermsFields: ['host.name'],
      aggregatableTimestampField: 'kibana.combined_timestamp',
      primaryTimestamp: '@timestamp',
      secondaryTimestamp: undefined,
      ruleIntervalFrom,
    });

    expect(query).not.toContain('EVAL');
    expect(query).not.toContain('CASE');
  });
});

describe('parseNewTermsCombinationsFromEsqlResponse', () => {
  const table = (
    columns: Array<{ name: string; type: string }>,
    values: Array<Array<string | number | boolean | null>>
  ): EsqlTable => ({ columns, values } as unknown as EsqlTable);

  it('maps rows to combinations keyed by new terms field for a single field', () => {
    const response = table([{ name: 'host.name', type: 'keyword' }], [['host-0'], ['host-1']]);

    expect(parseNewTermsCombinationsFromEsqlResponse(response, ['host.name'])).toEqual([
      { 'host.name': 'host-0' },
      { 'host.name': 'host-1' },
    ]);
  });

  it('maps multi-field rows and preserves non-string value types', () => {
    const response = table(
      [
        { name: 'host.name', type: 'keyword' },
        { name: 'host.port', type: 'long' },
        { name: 'host.trusted', type: 'boolean' },
      ],
      [['host-0', 443, true]]
    );

    expect(
      parseNewTermsCombinationsFromEsqlResponse(response, [
        'host.name',
        'host.port',
        'host.trusted',
      ])
    ).toEqual([{ 'host.name': 'host-0', 'host.port': 443, 'host.trusted': true }]);
  });

  it('drops rows with a null value so partial combinations are not reported', () => {
    const response = table(
      [
        { name: 'host.name', type: 'keyword' },
        { name: 'user.name', type: 'keyword' },
      ],
      [
        ['host-0', 'user-0'],
        ['host-1', null],
      ]
    );

    expect(parseNewTermsCombinationsFromEsqlResponse(response, ['host.name', 'user.name'])).toEqual(
      [{ 'host.name': 'host-0', 'user.name': 'user-0' }]
    );
  });

  it('drops rows when a requested field is missing from the response columns', () => {
    const response = table([{ name: 'host.name', type: 'keyword' }], [['host-0']]);

    expect(parseNewTermsCombinationsFromEsqlResponse(response, ['host.name', 'user.name'])).toEqual(
      []
    );
  });
});
