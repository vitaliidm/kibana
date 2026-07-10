/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { INBOX_INTERNAL_URL } from '@kbn/inbox-common';

export const INBOX_WATCHES_URL = `${INBOX_INTERNAL_URL}/watches` as const;
export const INBOX_WATCH_URL_TEMPLATE = `${INBOX_WATCHES_URL}/{watchId}` as const;

export const buildWatchUrl = (watchId: string) =>
  `${INBOX_WATCHES_URL}/${encodeURIComponent(watchId)}`;
