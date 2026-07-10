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
import { resetWatchesMockStore } from '../../services/watches_mock_store';

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

  beforeEach(() => {
    resetWatchesMockStore();
    router = httpServiceMock.createRouter();
    logger = loggerMock.create();
    registry = new InboxActionRegistry(logger);
    registerListWatchesRoute({ router, logger, registry, getSpaceId });
  });

  it('returns seeded watches and workers', async () => {
    const handler = getHandler(router);
    const request = httpServerMock.createKibanaRequest({
      method: 'get',
      path: INBOX_WATCHES_URL,
    });
    const response = httpServerMock.createResponseFactory();
    await handler({} as never, request, response);

    expect(response.ok).toHaveBeenCalled();
    const [[{ body }]] = response.ok.mock.calls as unknown as [[{ body: ListWatchesResponse }]];
    expect(body.watches.length).toBeGreaterThanOrEqual(5);
    expect(body.workers.length).toBeGreaterThan(0);
  });
});
