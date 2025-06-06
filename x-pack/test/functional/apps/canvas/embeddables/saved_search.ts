/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const { canvas, discover } = getPageObjects(['canvas', 'discover']);
  const testSubjects = getService('testSubjects');
  const kibanaServer = getService('kibanaServer');
  const dashboardAddPanel = getService('dashboardAddPanel');
  const dashboardPanelActions = getService('dashboardPanelActions');

  describe('saved search in canvas', function () {
    before(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/dashboard/current/kibana'
      );
      // canvas application is only available when installation contains canvas workpads
      await kibanaServer.importExport.load(
        'x-pack/test/functional/fixtures/kbn_archiver/canvas/default'
      );
      // open canvas home
      await canvas.goToListingPage();
      // create new workpad
      await canvas.createNewWorkpad();
      await canvas.setWorkpadName('saved search tests');
    });

    after(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
    });

    describe('by-reference', () => {
      it('adds existing saved search embeddable from the visualize library', async () => {
        await canvas.clickAddFromLibrary();
        await dashboardAddPanel.addSavedSearch('Rendering-Test:-saved-search');
        await testSubjects.existOrFail('embeddablePanelHeading-RenderingTest:savedsearch');
      });

      it('edits saved search by-reference embeddable', async () => {
        await dashboardPanelActions.editPanelByTitle('Rendering Test: saved search');
        await discover.saveSearch('Rendering Test: saved search v2');
        await canvas.goToListingPage();
        await canvas.loadFirstWorkpad('saved search tests');
        await testSubjects.existOrFail('embeddablePanelHeading-RenderingTest:savedsearchv2');
      });
    });
  });
}
