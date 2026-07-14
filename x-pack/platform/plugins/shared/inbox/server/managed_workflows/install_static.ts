/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { INBOX_WATCH_WORKFLOW_IDS } from '@kbn/workflows/managed';
import { GLOBAL_WORKFLOW_SPACE_ID } from '@kbn/workflows/server';
import type { Logger } from '@kbn/logging';
import type { WorkflowsExtensionsServerPluginStart } from '@kbn/workflows-extensions/server';
import { PLUGIN_ID } from '../../common';

export const installStaticWatchWorkflows = async ({
  enabled,
  workflowsExtensions,
  logger,
}: {
  enabled: boolean;
  workflowsExtensions: WorkflowsExtensionsServerPluginStart;
  logger: Logger;
}): Promise<{ failedIds: string[] }> => {
  if (!enabled) {
    return { failedIds: [] };
  }

  const client = await workflowsExtensions.initManagedWorkflowsClient(PLUGIN_ID);
  const failedIds: string[] = [];

  for (const id of INBOX_WATCH_WORKFLOW_IDS) {
    try {
      await client.install(id, { spaceId: GLOBAL_WORKFLOW_SPACE_ID });
    } catch (error) {
      failedIds.push(id);
      logger.error(
        `Failed to install managed watch workflow "${id}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  await client.ready();
  return { failedIds };
};
