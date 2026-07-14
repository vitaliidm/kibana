/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { API_VERSIONS, INTERNAL_API_ACCESS } from '@kbn/inbox-common';
import { INBOX_API_PRIVILEGE_READ } from '../../../common';
import { INBOX_WATCHES_URL, type ListWatchesResponse } from '../../../common/watches';
import type { RouteDependencies } from '../register_routes';

export const registerListWatchesRoute = ({
  router,
  logger,
  getSpaceId,
  getWatchProjection,
}: RouteDependencies) => {
  router.versioned
    .get({
      path: INBOX_WATCHES_URL,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: { requiredPrivileges: [INBOX_API_PRIVILEGE_READ] },
      },
      summary: 'List watches (workflow projection)',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {},
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
          const body: ListWatchesResponse = await projection.list(getSpaceId(request));
          return response.ok({ body });
        } catch (error) {
          logger.error(`Failed to list watches: ${error}`);
          return response.customError({
            statusCode: 500,
            body: { message: 'Failed to list watches' },
          });
        }
      }
    );
};
