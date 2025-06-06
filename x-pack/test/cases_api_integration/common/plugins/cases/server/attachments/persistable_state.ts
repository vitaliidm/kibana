/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PersistableStateAttachmentTypeSetup } from '@kbn/cases-plugin/server/attachment_framework/types';

export const getPersistableStateAttachment = (): PersistableStateAttachmentTypeSetup => ({
  id: '.test',
  inject: (state, references) => ({
    ...state,
    persistableStateAttachmentState: {
      ...state.persistableStateAttachmentState,
      injectedId: 'testRef',
    },
  }),
  extract: (state) => ({
    state: {
      ...state,
      persistableStateAttachmentTypeId: '.test',
      persistableStateAttachmentState: { foo: 'foo' },
    },
    references: [{ id: 'testRef', name: 'myTestReference', type: 'test-so' }],
  }),
});
