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
import {
  INBOX_WATCHES_URL,
  type CreateWatchRequest,
  type CreateWatchResponse,
} from '../../../common/watches';
import type { RouteDependencies } from '../register_routes';

const CreateWatchRequestBody = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(2000).optional(),
});

export const registerCreateWatchRoute = ({
  router,
  logger,
  getSpaceId,
  getWatchProjection,
}: RouteDependencies) => {
  router.versioned
    .post({
      path: INBOX_WATCHES_URL,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: { requiredPrivileges: [INBOX_API_PRIVILEGE_RESPOND] },
      },
      summary: 'Create a custom watch workflow (POC)',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {
            body: buildRouteValidationWithZod(CreateWatchRequestBody),
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
          const bodyReq = request.body as CreateWatchRequest;
          const created = await projection.createCustom(request, getSpaceId(request), bodyReq);
          const body: CreateWatchResponse = created;
          return response.ok({ body });
        } catch (error) {
          logger.error(`Failed to create watch: ${error}`);
          return response.customError({
            statusCode: 500,
            body: { message: 'Failed to create watch' },
          });
        }
      }
    );
};
