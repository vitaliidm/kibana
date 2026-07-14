/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { httpServiceMock, httpServerMock } from '@kbn/core/server/mocks';
import { loggerMock } from '@kbn/logging-mocks';
import { API_VERSIONS } from '@kbn/inbox-common';
import { INBOX_WATCHES_URL, type ListWatchesResponse } from '../../../common/watches';
import { registerListWatchesRoute } from './list_watches';
import { InboxActionRegistry } from '../../services/inbox_action_registry';
import type { WatchWorkflowProjectionService } from '../../services/watches/watch_workflow_projection_service';

const getSpaceId = () => 'default';

type Router = ReturnType<typeof httpServiceMock.createRouter>;

const getHandler = (router: Router) => {
  const route = router.versioned.getRoute('get', INBOX_WATCHES_URL);
  const version = route.versions[API_VERSIONS.internal.v1];
  if (!version) {
    throw new Error(`No version '${API_VERSIONS.internal.v1}' registered for ${INBOX_WATCHES_URL}`);
  }
  return version.handler;
};

describe('GET /internal/inbox/watches', () => {
  let router: Router;
  let logger: ReturnType<typeof loggerMock.create>;
  let registry: InboxActionRegistry;
  let projection: { list: jest.Mock };

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    logger = loggerMock.create();
    registry = new InboxActionRegistry(logger);
    projection = {
      list: jest.fn().mockResolvedValue({
        watches: [
          {
            id: 'system-inbox-watch-floor',
            name: 'Watch Floor',
            tags: ['watch', 'watch-floor'],
            callables: [{ id: 'alert-triage' }],
          },
        ],
      }),
    };
    registerListWatchesRoute({
      router,
      logger,
      registry,
      getSpaceId,
      getWatchProjection: () => projection as unknown as WatchWorkflowProjectionService,
    });
  });

  it('returns projected watches', async () => {
    const handler = getHandler(router);
    const request = httpServerMock.createKibanaRequest({
      method: 'get',
      path: INBOX_WATCHES_URL,
    });
    const response = httpServerMock.createResponseFactory();
    await handler({} as never, request, response);

    expect(response.ok).toHaveBeenCalled();
    const [[{ body }]] = response.ok.mock.calls as unknown as [[{ body: ListWatchesResponse }]];
    expect(body.watches[0].id).toBe('system-inbox-watch-floor');
    expect(body).not.toHaveProperty('workers');
  });
});
