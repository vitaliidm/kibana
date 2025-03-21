/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { schema } from '@kbn/config-schema';

import { SavedObjectsErrorHelpers } from '@kbn/core-saved-objects-server';
import { IUiSettingsClient } from '@kbn/core-ui-settings-server';
import { KibanaRequest, KibanaResponseFactory } from '@kbn/core-http-server';
import type { InternalUiSettingsRouter } from '../internal_types';
import { CannotOverrideError } from '../ui_settings_errors';
import { InternalUiSettingsRequestHandlerContext } from '../internal_types';

const validate = {
  params: schema.object({
    key: schema.string(),
  }),
};

export function registerDeleteRoute(router: InternalUiSettingsRouter) {
  const deleteFromRequest = async (
    uiSettingsClient: IUiSettingsClient,
    context: InternalUiSettingsRequestHandlerContext,
    request: KibanaRequest<Readonly<{} & { key: string }>, unknown, unknown, 'delete'>,
    response: KibanaResponseFactory
  ) => {
    try {
      await uiSettingsClient.remove(request.params.key);

      return response.ok({
        body: {
          settings: await uiSettingsClient.getUserProvided(),
        },
      });
    } catch (error) {
      if (SavedObjectsErrorHelpers.isSavedObjectsClientError(error)) {
        return response.customError({
          body: error,
          statusCode: error.output.statusCode,
        });
      }

      if (error instanceof CannotOverrideError) {
        return response.badRequest({ body: error });
      }

      throw error;
    }
  };
  router.delete(
    {
      path: '/api/kibana/settings/{key}',
      validate,
      security: {
        authz: {
          enabled: false,
          reason: 'This route delegates authorization to the UI Settings Client',
        },
      },
    },
    async (context, request, response) => {
      const uiSettingsClient = (await context.core).uiSettings.client;
      return await deleteFromRequest(uiSettingsClient, context, request, response);
    }
  );
  router.delete(
    {
      path: '/api/kibana/global_settings/{key}',
      validate,
      security: {
        authz: {
          enabled: false,
          reason: 'This route delegates authorization to the UI Settings Client',
        },
      },
    },
    async (context, request, response) => {
      const uiSettingsClient = (await context.core).uiSettings.globalClient;
      return await deleteFromRequest(uiSettingsClient, context, request, response);
    }
  );
}
