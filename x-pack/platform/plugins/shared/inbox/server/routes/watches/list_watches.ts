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
import { getWatchesMockStore } from '../../services/watches_mock_store';

export const registerListWatchesRoute = ({ router, logger }: RouteDependencies) => {
  router.versioned
    .get({
      path: INBOX_WATCHES_URL,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: { requiredPrivileges: [INBOX_API_PRIVILEGE_READ] },
      },
      summary: 'List watches (POC)',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {},
        },
      },
      async (_context, _request, response) => {
        try {
          const body: ListWatchesResponse = getWatchesMockStore().list();
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
