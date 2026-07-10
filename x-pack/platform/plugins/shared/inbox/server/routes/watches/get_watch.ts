/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from '@kbn/zod/v4';
import { API_VERSIONS, INTERNAL_API_ACCESS } from '@kbn/inbox-common';
import { buildRouteValidationWithZod } from '@kbn/zod-helpers/v4';
import { INBOX_API_PRIVILEGE_READ } from '../../../common';
import { INBOX_WATCH_URL_TEMPLATE, type GetWatchResponse } from '../../../common/watches';
import type { RouteDependencies } from '../register_routes';
import { getWatchesMockStore } from '../../services/watches_mock_store';

const GetWatchRequestParams = z.object({
  watchId: z.string().min(1).max(128),
});

export const registerGetWatchRoute = ({ router, logger }: RouteDependencies) => {
  router.versioned
    .get({
      path: INBOX_WATCH_URL_TEMPLATE,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: { requiredPrivileges: [INBOX_API_PRIVILEGE_READ] },
      },
      summary: 'Get a watch by id (POC)',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {
            params: buildRouteValidationWithZod(GetWatchRequestParams),
          },
        },
      },
      async (_context, request, response) => {
        try {
          const { watchId } = request.params;
          const result = getWatchesMockStore().get(watchId);
          if (!result) {
            return response.notFound({
              body: { message: `Watch "${watchId}" not found` },
            });
          }
          const body: GetWatchResponse = result;
          return response.ok({ body });
        } catch (error) {
          logger.error(`Failed to get watch: ${error}`);
          return response.customError({
            statusCode: 500,
            body: { message: 'Failed to get watch' },
          });
        }
      }
    );
};
