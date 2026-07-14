/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from '@kbn/zod/v4';
import { API_VERSIONS, INTERNAL_API_ACCESS } from '@kbn/inbox-common';
import { buildRouteValidationWithZod } from '@kbn/zod-helpers/v4';
import { INBOX_API_PRIVILEGE_RESPOND } from '../../../common';
import { INBOX_WATCH_URL_TEMPLATE } from '../../../common/watches';
import type { RouteDependencies } from '../register_routes';
import {
  isWatchDeleteForbiddenError,
  isWatchNotFoundError,
} from '../../services/watches/watch_errors';

const DeleteWatchRequestParams = z.object({
  watchId: z.string().min(1).max(128),
});

export const registerDeleteWatchRoute = ({
  router,
  logger,
  getSpaceId,
  getWatchProjection,
}: RouteDependencies) => {
  router.versioned
    .delete({
      path: INBOX_WATCH_URL_TEMPLATE,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: { requiredPrivileges: [INBOX_API_PRIVILEGE_RESPOND] },
      },
      summary: 'Delete a custom (unmanaged) watch workflow',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {
            params: buildRouteValidationWithZod(DeleteWatchRequestParams),
          },
        },
      },
      async (_context, request, response) => {
        try {
          const projection = getWatchProjection?.();
          if (!projection) {
            return response.customError({
              statusCode: 503,
              body: { message: 'Watch projection service is not available' },
            });
          }
          const { watchId } = request.params;
          await projection.deleteCustom(request, watchId, getSpaceId(request));
          return response.noContent();
        } catch (error) {
          if (isWatchNotFoundError(error)) {
            return response.notFound({ body: { message: error.message } });
          }
          if (isWatchDeleteForbiddenError(error)) {
            return response.forbidden({ body: { message: error.message } });
          }
          logger.error(`Failed to delete watch: ${error}`);
          return response.customError({
            statusCode: 500,
            body: { message: 'Failed to delete watch' },
          });
        }
      }
    );
};
