/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Seeds everything needed to demo the FPR Watch backtest end-to-end:
 *   1. Creates a broad detection rule that fires on `event.kind: event`
 *   2. Indexes synthetic raw events into ES so the rule has data to match
 *   3. Triggers the rule immediately via `_run_soon`
 *   4. Polls until alerts appear (usually <30s)
 *   5. Marks N alerts as `false_positive` so Stage 3 picks them up
 *   6. Triggers a manual run of `watch-floor-fpr`
 *
 * When Stage 3 runs, it calls investigate-rule for the demo rule, produces a
 * query proposal, then runs before/after preview backtests (invocationCount: 24)
 * so the HITL gate shows concrete alert counts.
 *
 * Usage:
 *   node --import tsx x-pack/platform/plugins/shared/inbox/scripts/demo/seed_fpr_demo.ts
 *
 * Flags:
 *   --reset         Delete the demo rule and its alerts before re-seeding (idempotent re-runs)
 *   --fp-count <n>  How many alerts to mark false_positive (default: 5)
 *
 * Env overrides (defaults match `yarn start --no-base-path`):
 *   KIBANA_URL=http://localhost:5601
 *   KIBANA_USERNAME=elastic
 *   KIBANA_PASSWORD=changeme
 *   ES_URL=http://localhost:9200
 *
 * Pre-req: `xpack.inbox.enabled: true` so watch-floor-fpr is installed as a managed workflow.
 */

interface SeedConfig {
  kibanaUrl: string;
  esUrl: string;
  username: string;
  password: string;
  spaceId: string;
}

const CONFIG: SeedConfig = {
  kibanaUrl: process.env.KIBANA_URL ?? 'http://localhost:5601',
  esUrl: process.env.ES_URL ?? 'http://localhost:9200',
  username: process.env.KIBANA_USERNAME ?? 'elastic',
  password: process.env.KIBANA_PASSWORD ?? 'changeme',
  spaceId: process.env.KIBANA_SPACE_ID ?? 'default',
};

const ARGS = process.argv.slice(2);
const SHOULD_RESET = ARGS.includes('--reset');
const FP_COUNT = (() => {
  const idx = ARGS.indexOf('--fp-count');
  return idx !== -1 && ARGS[idx + 1] ? parseInt(ARGS[idx + 1], 10) : 5;
})();

const DEMO_RULE_ID = 'fpr-demo-noise-rule';
const DEMO_RULE_NAME = 'FPR Demo — Noise Rule';
const DEMO_EVENT_INDEX = 'logs-fpr-demo-default';
const WATCH_WORKFLOW_ID = 'system-inbox-watch-floor-fpr';
const POLL_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 5_000;

const spacePrefix = (config: SeedConfig) =>
  config.spaceId === 'default' ? '' : `/s/${config.spaceId}`;

const authHeader = (config: SeedConfig) =>
  `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;

const kbHeaders = (config: SeedConfig, apiVersion = '2023-10-31') => ({
  Authorization: authHeader(config),
  'kbn-xsrf': 'true',
  'Content-Type': 'application/json',
  'elastic-api-version': apiVersion,
  'x-elastic-internal-origin': 'kibana',
});

const esHeaders = (config: SeedConfig) => ({
  Authorization: authHeader(config),
  'Content-Type': 'application/json',
});

const log = (msg: string) => console.log(msg); // eslint-disable-line no-console
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------

const getRuleByRuleId = async (config: SeedConfig): Promise<{ id: string } | null> => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(config)}/api/detection_engine/rules?rule_id=${DEMO_RULE_ID}`,
    { headers: kbHeaders(config) }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get rule failed: ${res.status} ${await res.text()}`);
  return res.json();
};

const deleteRule = async (config: SeedConfig, id: string) => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(config)}/api/detection_engine/rules?id=${id}`,
    { method: 'DELETE', headers: kbHeaders(config) }
  );
  if (!res.ok) throw new Error(`Delete rule failed: ${res.status} ${await res.text()}`);
};

const createRule = async (config: SeedConfig): Promise<{ id: string }> => {
  const res = await fetch(`${config.kibanaUrl}${spacePrefix(config)}/api/detection_engine/rules`, {
    method: 'POST',
    headers: kbHeaders(config),
    body: JSON.stringify({
      type: 'query',
      rule_id: DEMO_RULE_ID,
      name: DEMO_RULE_NAME,
      description: 'Broad demo rule for FPR Watch backtest seeding — intentionally noisy.',
      enabled: true,
      risk_score: 21,
      severity: 'low',
      interval: '5m',
      from: 'now-1h',
      query: 'event.kind: event',
      language: 'kuery',
      index: [DEMO_EVENT_INDEX],
      actions: [],
    }),
  });
  if (!res.ok) throw new Error(`Create rule failed: ${res.status} ${await res.text()}`);
  return res.json();
};

const ensureDataStream = async (config: SeedConfig) => {
  // Create the data stream if it doesn't already exist. Logs data streams use
  // the `logs-*-*` ILM policy by default; PUT _data_stream is idempotent.
  const res = await fetch(`${config.esUrl}/_data_stream/${DEMO_EVENT_INDEX}`, {
    method: 'PUT',
    headers: esHeaders(config),
  });
  // 400 means it already exists — that's fine.
  if (!res.ok && res.status !== 400) {
    throw new Error(`Create data stream failed: ${res.status} ${await res.text()}`);
  }
};

// Legitimate-looking PowerShell commands that are NOT false positives.
// These should still fire after the proposed query tightening (no -enc flag).
const LEGITIMATE_COMMANDS = [
  'powershell.exe -NoProfile Get-Process',
  'powershell.exe -NonInteractive -Command Invoke-WebRequest',
  'powershell.exe Get-EventLog -LogName Security',
  'powershell.exe -File C:\\scripts\\backup.ps1',
  'powershell.exe Set-ExecutionPolicy RemoteSigned',
];

const seedRawEvents = async (config: SeedConfig, fpCount = 20, legitimateCount = 5) => {
  const now = Date.now();
  const lines: string[] = [];

  // FP events: encoded commands that the proposed query will exclude
  for (let i = 0; i < fpCount; i++) {
    lines.push(JSON.stringify({ create: { _index: DEMO_EVENT_INDEX } }));
    lines.push(
      JSON.stringify({
        '@timestamp': new Date(now - i * 60_000).toISOString(),
        'event.kind': 'event',
        'event.category': ['process'],
        'event.type': ['start'],
        'host.name': `demo-host-${(i % 3) + 1}`,
        'user.name': `demo-user-${(i % 2) + 1}`,
        'process.name': 'powershell.exe',
        'process.command_line': `powershell.exe -enc ${Buffer.from(`demo-command-${i}`).toString(
          'base64'
        )}`,
        message: `FPR demo event ${i}`,
      })
    );
  }

  // Legitimate events: real-looking commands the proposed query still catches
  for (let i = 0; i < legitimateCount; i++) {
    lines.push(JSON.stringify({ create: { _index: DEMO_EVENT_INDEX } }));
    lines.push(
      JSON.stringify({
        '@timestamp': new Date(now - (fpCount + i) * 60_000).toISOString(),
        'event.kind': 'event',
        'event.category': ['process'],
        'event.type': ['start'],
        'host.name': `prod-host-${(i % 2) + 1}`,
        'user.name': `analyst-${i + 1}`,
        'process.name': 'powershell.exe',
        'process.command_line': LEGITIMATE_COMMANDS[i % LEGITIMATE_COMMANDS.length],
        message: `Legitimate PowerShell event ${i}`,
      })
    );
  }

  const res = await fetch(`${config.esUrl}/_bulk`, {
    method: 'POST',
    headers: esHeaders(config),
    body: lines.join('\n') + '\n',
  });
  if (!res.ok) throw new Error(`Bulk index failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  if (body.errors) {
    const firstError = body.items.find((i: { index?: { error?: unknown } }) => i.index?.error);
    throw new Error(`Bulk index had errors: ${JSON.stringify(firstError?.index?.error)}`);
  }
};

const runRuleSoon = async (config: SeedConfig, ruleId: string) => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(config)}/internal/alerting/rule/${ruleId}/_run_soon`,
    { method: 'POST', headers: kbHeaders(config) }
  );
  if (!res.ok) throw new Error(`_run_soon failed: ${res.status} ${await res.text()}`);
};

const searchAlerts = async (
  config: SeedConfig,
  status: string,
  size: number
): Promise<Array<{ _id: string }>> => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(config)}/internal/detection_engine/unified_alerts/search`,
    {
      method: 'POST',
      headers: kbHeaders(config, '1'),
      body: JSON.stringify({
        query: {
          bool: {
            filter: [
              { term: { 'kibana.alert.rule.rule_id': DEMO_RULE_ID } },
              { term: { 'kibana.alert.workflow_status': status } },
            ],
          },
        },
        size,
        sort: [{ '@timestamp': { order: 'desc' } }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Search alerts failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body.hits?.hits ?? [];
};

const markAlertsFalsePositive = async (config: SeedConfig, ids: string[]) => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(
      config
    )}/internal/detection_engine/unified_alerts/workflow_status`,
    {
      method: 'POST',
      headers: kbHeaders(config, '1'),
      body: JSON.stringify({ status: 'closed', reason: 'false_positive', signal_ids: ids }),
    }
  );
  if (!res.ok) throw new Error(`Mark FP failed: ${res.status} ${await res.text()}`);
};

const runWorkflow = async (config: SeedConfig, workflowId: string): Promise<string> => {
  const res = await fetch(
    `${config.kibanaUrl}${spacePrefix(config)}/api/workflows/workflow/${workflowId}/run`,
    {
      method: 'POST',
      headers: kbHeaders(config),
      body: JSON.stringify({ inputs: {} }),
    }
  );
  if (!res.ok) throw new Error(`Run workflow failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body.workflowExecutionId;
};

// ---------------------------------------------------------------------------

const main = async () => {
  log(`\n==> FPR Watch demo seeder`);
  log(`    KB:        ${CONFIG.kibanaUrl}`);
  log(`    ES:        ${CONFIG.esUrl}`);
  log(`    Space:     ${CONFIG.spaceId}`);
  log(`    FP count:  ${FP_COUNT}`);
  log(`    Reset:     ${SHOULD_RESET}\n`);

  if (SHOULD_RESET) {
    log('==> 1. Resetting demo rule...');
    const existing = await getRuleByRuleId(CONFIG);
    if (existing) {
      await deleteRule(CONFIG, existing.id);
      log(`   Deleted rule ${existing.id}`);
    } else {
      log('   No existing rule found.');
    }
  }

  log('==> 2. Ensuring demo detection rule exists...');
  let rule = await getRuleByRuleId(CONFIG);
  if (!rule) {
    rule = await createRule(CONFIG);
    log(`   Created rule: ${rule.id}`);
  } else {
    log(`   Reusing existing rule: ${rule.id}`);
  }

  log('\n==> 3. Indexing synthetic events into ES...');
  await ensureDataStream(CONFIG);
  await seedRawEvents(CONFIG, 20, 5);
  log('   Indexed 25 events (20 FP-pattern encoded commands + 5 legitimate).');

  log('\n==> 4. Triggering rule execution now...');
  await runRuleSoon(CONFIG, rule.id);
  log('   Rule scheduled to run immediately.');

  log(`\n==> 5. Waiting for open alerts (up to ${POLL_TIMEOUT_MS / 1000}s)...`);
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let openAlerts: Array<{ _id: string }> = [];

  while (Date.now() < deadline) {
    openAlerts = await searchAlerts(CONFIG, 'open', FP_COUNT);
    if (openAlerts.length >= 1) {
      log(`   Found ${openAlerts.length} open alert(s).`);
      break;
    }
    log(`   No alerts yet, retrying in ${POLL_INTERVAL_MS / 1000}s...`);
    await sleep(POLL_INTERVAL_MS);
  }

  if (openAlerts.length === 0) {
    throw new Error(
      `No alerts appeared after ${POLL_TIMEOUT_MS / 1000}s. ` +
        `Check that the rule is enabled and the detection engine is running.`
    );
  }

  log(`\n==> 6. Marking ${Math.min(FP_COUNT, openAlerts.length)} alert(s) as false_positive...`);
  const toMark = openAlerts.slice(0, FP_COUNT).map((h) => h._id);
  await markAlertsFalsePositive(CONFIG, toMark);
  log('   Done.');

  log(`\n==> 7. Triggering ${WATCH_WORKFLOW_ID}...`);
  const executionId = await runWorkflow(CONFIG, WATCH_WORKFLOW_ID);
  log(`   Execution ID: ${executionId}`);

  log(`
==> All done!

    Stage 3 will pick up ${toMark.length} FP-marked alert(s) for "${DEMO_RULE_NAME}",
    call investigate-rule to produce a query proposal, then run before/after
    preview backtests (invocationCount: 24) so the HITL gate shows concrete
    alert counts.

    Watch the execution at:
      ${CONFIG.kibanaUrl}/app/workflows
  `);
};

main().catch((error) => {
  console.error(error); // eslint-disable-line no-console
  process.exitCode = 1;
});
