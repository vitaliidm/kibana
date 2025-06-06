/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
/* eslint-disable max-classes-per-file */

import type { FleetErrorType } from './types';

export class FleetError<TMeta = unknown> extends Error {
  attributes?: { type: FleetErrorType };
  constructor(message?: string, public readonly meta?: TMeta) {
    super(message);
    this.name = this.constructor.name; // for stack traces

    if (meta instanceof Error) {
      this.stack += `\n----- original error -----\n${meta.stack}`;
    }
  }
}

export class PolicyNamespaceValidationError extends FleetError {}
export class PackagePolicyValidationError extends FleetError {}

export class MessageSigningError extends FleetError {}

export class FleetActionsError extends FleetError {}
export class FleetActionsClientError extends FleetError {}
export class UninstallTokenError extends FleetError {}

export class AgentRequestInvalidError extends FleetError {}
export class OutputInvalidError extends FleetError {}

export class AgentlessAgentCreateOverProvisionedError extends FleetError<{ limit?: number }> {
  constructor(message: string, limit?: number) {
    super(`Error creating agentless agent in Fleet, ${message}`, { limit });
  }
}
