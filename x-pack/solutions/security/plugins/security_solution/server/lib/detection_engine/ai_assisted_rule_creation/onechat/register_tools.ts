/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, Logger } from '@kbn/core/server';
import type { StaticToolRegistration } from '@kbn/onechat-server';

import type {
  SecuritySolutionPluginSetupDependencies,
  SecuritySolutionPluginStart,
  SecuritySolutionPluginStartDependencies,
} from '../../../../plugin_contract';

import {  createDetectionRuleTool } from './tools';

export async function registerTools({
  core,
  plugins,
  logger,
}: {
  core: CoreSetup<SecuritySolutionPluginStartDependencies, SecuritySolutionPluginStart>;
  plugins: SecuritySolutionPluginSetupDependencies;
  logger: Logger;
}) {
  const tools: StaticToolRegistration<any>[] = [
    createDetectionRuleTool({ core, plugins, logger }),
  ];

  for (const tool of tools) {
    plugins.onechat.tools.register(tool);
  }
}
