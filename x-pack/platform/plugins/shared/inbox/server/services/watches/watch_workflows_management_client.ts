/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaRequest } from '@kbn/core/server';
import type {
  WorkflowDetailDto,
  WorkflowExecutionDto,
  WorkflowExecutionListDto,
  WorkflowListDto,
} from '@kbn/workflows';

/**
 * Structural subset of WorkflowsManagementApi used by the Watches projection.
 * Typed locally to avoid a tsconfig project-reference cycle:
 * inbox → workflows_management → inbox.
 */
export interface WatchWorkflowsManagementClient {
  getWorkflows(
    params: {
      tags?: string[];
      size?: number;
      page?: number;
      enabled?: boolean[];
      managedFilter?: 'all' | 'managed' | 'unmanaged';
    },
    spaceId: string,
    options?: { includeExecutionHistory?: boolean; includeManagedExecutionHistory?: boolean }
  ): Promise<WorkflowListDto>;

  getWorkflow(id: string, spaceId: string): Promise<WorkflowDetailDto | null>;

  getWorkflowExecutions(
    params: { workflowId: string; page?: number; size?: number },
    spaceId: string
  ): Promise<WorkflowExecutionListDto>;

  getWorkflowExecution(
    workflowExecutionId: string,
    spaceId: string
  ): Promise<WorkflowExecutionDto | null>;

  createWorkflow(
    workflow: { yaml: string },
    spaceId: string,
    request: KibanaRequest
  ): Promise<WorkflowDetailDto>;

  deleteWorkflows(
    workflowIds: string[],
    spaceId: string,
    request: KibanaRequest,
    options?: { force?: boolean }
  ): Promise<{ successfulIds?: string[] }>;
}
