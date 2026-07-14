/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Triggers manual runs for installed watch workflows so Recent runs has data.
 * Definitions themselves are installed by the Inbox plugin when enabled
 * (managed workflows) — this script only populates execution history.
 *
 * Usage:
 *   node --import tsx x-pack/platform/plugins/shared/inbox/scripts/demo/seed_watch_runs.ts
 *
 * Env overrides:
 *   KIBANA_URL=http://localhost:5601
 *   KIBANA_USERNAME=elastic
 *   KIBANA_PASSWORD=changeme
 *
 * Pre-req: `xpack.inbox.enabled: true` so managed watches are installed.
 */

interface SeedConfig {
  kibanaUrl: string;
  username: string;
  password: string;
  spaceId: string;
}

const CONFIG: SeedConfig = {
  kibanaUrl: process.env.KIBANA_URL ?? 'http://localhost:5601',
  username: process.env.KIBANA_USERNAME ?? 'elastic',
  password: process.env.KIBANA_PASSWORD ?? 'changeme',
  spaceId: process.env.KIBANA_SPACE_ID ?? 'default',
};

const spacePrefix = (config: SeedConfig) =>
  config.spaceId && config.spaceId !== 'default' ? `/s/${config.spaceId}` : '';

const headers = (config: SeedConfig) => ({
  Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
  'kbn-xsrf': 'true',
  'content-type': 'application/json',
  'elastic-api-version': '2023-10-31',
});

const listWatchWorkflows = async (config: SeedConfig) => {
  const url = new URL(`${config.kibanaUrl}${spacePrefix(config)}/api/workflows`);
  url.searchParams.set('tags', 'watch');
  url.searchParams.set('size', '50');
  url.searchParams.set('page', '1');
  const response = await fetch(url, { headers: headers(config) });
  if (!response.ok) {
    throw new Error(`List workflows failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as {
    results: Array<{ id: string; name: string; enabled: boolean; tags?: string[] }>;
  };
};

const runWorkflow = async (config: SeedConfig, workflowId: string) => {
  const url = `${config.kibanaUrl}${spacePrefix(config)}/api/workflows/workflow/${workflowId}/run`;
  const response = await fetch(url, {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({ inputs: {} }),
  });
  if (!response.ok) {
    throw new Error(`Run ${workflowId} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
};

const main = async () => {
  const listed = await listWatchWorkflows(CONFIG);
  const runnable = listed.results.filter((w) => w.enabled);
  if (runnable.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      'No enabled watch-tagged workflows found. Is Inbox enabled and have managed watches installed?'
    );
    return;
  }

  for (const workflow of runnable) {
    try {
      const result = await runWorkflow(CONFIG, workflow.id);
      // eslint-disable-next-line no-console
      console.log(`Triggered ${workflow.name} (${workflow.id})`, result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed ${workflow.name}:`, error);
    }
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
