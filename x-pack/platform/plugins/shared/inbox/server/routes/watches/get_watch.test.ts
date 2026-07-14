/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { httpServiceMock, httpServerMock } from '@kbn/core/server/mocks';
import { loggerMock } from '@kbn/logging-mocks';
import { API_VERSIONS } from '@kbn/inbox-common';
import {
  INBOX_WATCH_URL_TEMPLATE,
  buildWatchUrl,
  type GetWatchResponse,
} from '../../../common/watches';
import { registerGetWatchRoute } from './get_watch';
import { InboxActionRegistry } from '../../services/inbox_action_registry';
import type { WatchWorkflowProjectionService } from '../../services/watches/watch_workflow_projection_service';

const getSpaceId = () => 'default';

type Router = ReturnType<typeof httpServiceMock.createRouter>;

const getHandler = (router: Router) => {
  const route = router.versioned.getRoute('get', INBOX_WATCH_URL_TEMPLATE);
  const version = route.versions[API_VERSIONS.internal.v1];
  if (!version) {
    throw new Error(
      `No version '${API_VERSIONS.internal.v1}' registered for ${INBOX_WATCH_URL_TEMPLATE}`
    );
  }
  return version.handler;
};

describe('GET /internal/inbox/watches/{watchId}', () => {
  let router: Router;
  let logger: ReturnType<typeof loggerMock.create>;
  let registry: InboxActionRegistry;
  let projection: { get: jest.Mock };

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    logger = loggerMock.create();
    registry = new InboxActionRegistry(logger);
    projection = {
      get: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'missing') return undefined;
        return {
          watch: {
            id,
            name: 'Watch Floor',
            callables: [{ id: 'alert-triage' }],
            recentRuns: [],
          },
        };
      }),
    };
    registerGetWatchRoute({
      router,
      logger,
      registry,
      getSpaceId,
      getWatchProjection: () => projection as unknown as WatchWorkflowProjectionService,
    });
  });

  it('returns a projected watch', async () => {
    const handler = getHandler(router);
    const request = httpServerMock.createKibanaRequest({
      method: 'get',
      path: buildWatchUrl('system-inbox-watch-floor'),
      params: { watchId: 'system-inbox-watch-floor' },
    });
    const response = httpServerMock.createResponseFactory();
    await handler({} as never, request, response);

    expect(response.ok).toHaveBeenCalled();
    const [[{ body }]] = response.ok.mock.calls as unknown as [[{ body: GetWatchResponse }]];
    expect(body.watch.id).toBe('system-inbox-watch-floor');
    expect(body).not.toHaveProperty('workers');
  });

  it('returns 404 for unknown watches', async () => {
    const handler = getHandler(router);
    const request = httpServerMock.createKibanaRequest({
      method: 'get',
      path: buildWatchUrl('missing'),
      params: { watchId: 'missing' },
    });
    const response = httpServerMock.createResponseFactory();
    await handler({} as never, request, response);

    expect(response.notFound).toHaveBeenCalled();
  });
});
