/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import WATCH_DARK_YAML from './watch_dark.yaml';
import WATCH_DEEP_YAML from './watch_deep.yaml';
import WATCH_FLOOR_YAML from './watch_floor.yaml';
import WATCH_OFFICER_YAML from './watch_officer.yaml';
import type { ManagedWorkflowDefinition } from '../../types';

export const INBOX_WATCH_FLOOR_WORKFLOW_ID = 'system-inbox-watch-floor';
export const INBOX_WATCH_OFFICER_WORKFLOW_ID = 'system-inbox-watch-officer';
export const INBOX_WATCH_DARK_WORKFLOW_ID = 'system-inbox-watch-dark';
export const INBOX_WATCH_DEEP_WORKFLOW_ID = 'system-inbox-watch-deep';

const MANAGEMENT = {
  enablement: 'restorable',
  lifecycle: 'static',
  versionStrategy: 'auto',
} as const;

const PLUGIN_ID = 'inbox';

export const INBOX_WATCH_FLOOR_WORKFLOW = {
  billable: false,
  id: INBOX_WATCH_FLOOR_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 3,
  yaml: WATCH_FLOOR_YAML,
} as const satisfies ManagedWorkflowDefinition;

export const INBOX_WATCH_OFFICER_WORKFLOW = {
  billable: false,
  id: INBOX_WATCH_OFFICER_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 3,
  yaml: WATCH_OFFICER_YAML,
} as const satisfies ManagedWorkflowDefinition;

export const INBOX_WATCH_DARK_WORKFLOW = {
  billable: false,
  id: INBOX_WATCH_DARK_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 3,
  yaml: WATCH_DARK_YAML,
} as const satisfies ManagedWorkflowDefinition;

export const INBOX_WATCH_DEEP_WORKFLOW = {
  billable: false,
  id: INBOX_WATCH_DEEP_WORKFLOW_ID,
  management: MANAGEMENT,
  pluginId: PLUGIN_ID,
  version: 3,
  yaml: WATCH_DEEP_YAML,
} as const satisfies ManagedWorkflowDefinition;

export const INBOX_WATCH_WORKFLOWS = [
  INBOX_WATCH_FLOOR_WORKFLOW,
  INBOX_WATCH_OFFICER_WORKFLOW,
  INBOX_WATCH_DARK_WORKFLOW,
  INBOX_WATCH_DEEP_WORKFLOW,
] as const;

export const INBOX_WATCH_WORKFLOW_IDS = [
  INBOX_WATCH_FLOOR_WORKFLOW_ID,
  INBOX_WATCH_OFFICER_WORKFLOW_ID,
  INBOX_WATCH_DARK_WORKFLOW_ID,
  INBOX_WATCH_DEEP_WORKFLOW_ID,
] as const;
