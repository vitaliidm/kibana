/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginInitializer, PluginInitializerContext } from '@kbn/core/public';
import { Plugin } from './plugin';
import type {
  InfraClientSetupExports,
  InfraClientStartExports,
  InfraClientSetupDeps,
  InfraClientStartDeps,
} from './types';

export const plugin: PluginInitializer<
  InfraClientSetupExports,
  InfraClientStartExports,
  InfraClientSetupDeps,
  InfraClientStartDeps
> = (context: PluginInitializerContext) => {
  return new Plugin(context);
};

// Shared components
export type { InfraClientStartExports } from './types';
