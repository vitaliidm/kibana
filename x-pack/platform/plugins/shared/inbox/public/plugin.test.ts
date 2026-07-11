/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { coreMock } from '@kbn/core/public/mocks';
import { InboxPublicPlugin } from './plugin';
import type { InboxClientConfig, InboxSetupDependencies } from './types';
import { APP_PATH, PLUGIN_ID } from '../common';

const createPlugin = (config: InboxClientConfig = { enabled: false }) => {
  const context = coreMock.createPluginInitializerContext(config);
  return new InboxPublicPlugin(context);
};

const noopSetupDeps: InboxSetupDependencies = {} as InboxSetupDependencies;

describe('InboxPublicPlugin', () => {
  describe('setup()', () => {
    it('registers the Inbox application even when config.enabled is false (POC always-on)', () => {
      const coreSetup = coreMock.createSetup();
      const plugin = createPlugin({ enabled: false });

      const contract = plugin.setup(coreSetup, noopSetupDeps);

      expect(coreSetup.application.register).toHaveBeenCalledTimes(1);
      expect(contract).toMatchObject({
        registerActionDetailRenderer: expect.any(Function),
      });
    });

    it('registers a standalone Inbox application at APP_PATH', () => {
      const coreSetup = coreMock.createSetup();
      const plugin = createPlugin({ enabled: true });

      plugin.setup(coreSetup, noopSetupDeps);

      expect(coreSetup.application.register).toHaveBeenCalledTimes(1);
      const [registration] = coreSetup.application.register.mock.calls[0];
      expect(registration).toEqual(
        expect.objectContaining({
          id: PLUGIN_ID,
          appRoute: APP_PATH,
          euiIconType: 'email',
          mount: expect.any(Function),
        })
      );
    });

    it('exposes the app in the side nav and global search so it can be linked from Security Solution', () => {
      const coreSetup = coreMock.createSetup();
      const plugin = createPlugin({ enabled: true });

      plugin.setup(coreSetup, noopSetupDeps);

      const [registration] = coreSetup.application.register.mock.calls[0];
      expect(registration.visibleIn).toEqual(
        expect.arrayContaining(['classicSideNav', 'projectSideNav', 'globalSearch'])
      );
    });

    it('exposes registerActionDetailRenderer', () => {
      const coreSetup = coreMock.createSetup();
      const contract = createPlugin({ enabled: true }).setup(coreSetup, noopSetupDeps);

      expect(typeof contract.registerActionDetailRenderer).toBe('function');
    });

    it('throws when the same sourceApp is registered twice', () => {
      const coreSetup = coreMock.createSetup();
      const contract = createPlugin({ enabled: true }).setup(coreSetup, noopSetupDeps);
      const loader = async () => (() => null) as unknown as never;

      contract.registerActionDetailRenderer('workflows', loader);
      expect(() => contract.registerActionDetailRenderer('workflows', loader)).toThrow(
        /already registered/
      );
    });
  });

  describe('start()', () => {
    it('exposes getActionDetailRenderer that returns the registered loader', () => {
      const coreSetup = coreMock.createSetup();
      const plugin = createPlugin({ enabled: true });
      const contract = plugin.setup(coreSetup, noopSetupDeps);
      const loader = async () => (() => null) as unknown as never;
      contract.registerActionDetailRenderer('workflows', loader);

      const coreStart = coreMock.createStart();
      const start = plugin.start(coreStart, {});

      expect(start.getActionDetailRenderer('workflows')).toBe(loader);
      expect(start.getActionDetailRenderer('unknown')).toBeUndefined();
    });
  });
});
