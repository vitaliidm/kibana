/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { range } from 'lodash';

import { run } from '@kbn/dev-cli-runner';
import { Client as ListsClient } from '@kbn/securitysolution-lists-common/api/quickstart_client.gen';
import { Client as ExceptionsClient } from '@kbn/securitysolution-exceptions-common/api/quickstart_client.gen';
import { concurrentlyExec } from '@kbn/securitysolution-utils/src/client_concurrency';
import { HORIZONTAL_LINE } from '../endpoint/common/constants';
import { createEsClient, createKbnClient } from '../endpoint/common/stack_services';
import { createToolingLogger } from '../../common/endpoint/data_loaders/utils';
import { Client as DetectionsClient } from '../../common/api/quickstart_client.gen';
import { duplicateRuleParams } from './modules/rules';
import { basicRule } from './modules/rules/new_terms/basic_rule';
import { index } from './constants';

import {
  addPropertiesToMapping,
  getEcsMapping,
  generateLargeMappingProperties,
  buildLargeDocument,
  getSettings,
  addTimestampToDoc,
  addFieldToDoc,
  getBasicRuleMetadata,
  buildLargeNestedDocument,
} from './modules';

export const cli = () => {
  run(
    async (cliContext) => {
      /**
       * START Client setup - Generic Kibana Client, ES Client, and Detections/Lists/Exceptions specific clients
       */
      createToolingLogger.setDefaultLogLevelFromCliFlags(cliContext.flags);

      const log = cliContext.log;

      const kbnClient = createKbnClient({
        log,
        url: cliContext.flags.kibana as string,
        username: cliContext.flags.username as string,
        password: cliContext.flags.password as string,
        apiKey: cliContext.flags.apikey as string,
      });

      const esClient = createEsClient({
        log,
        url: cliContext.flags.elasticsearch as string,
        username: cliContext.flags.username as string,
        password: cliContext.flags.password as string,
        apiKey: cliContext.flags.apikey as string,
      });

      const detectionsClient = new DetectionsClient({ kbnClient, log });
      const listsClient = new ListsClient({ kbnClient, log });
      const exceptionsClient = new ExceptionsClient({ kbnClient, log });

      log.info(`${HORIZONTAL_LINE}
 Environment Data Loader
${HORIZONTAL_LINE}
`);

      log.info(`Loading data to: ${kbnClient.resolveUrl('')}`);

      /**
       * END Client setup
       * START Custom data loader logic
       */

      // PREVIEW
      const previewPromises = range(1).map(
        (idx) => () =>
          detectionsClient.rulePreview({
            body: {
              ...getBasicRuleMetadata(),
              type: 'query',
              timeframeEnd: '2024-08-21T20:37:37.114Z',
              invocationCount: 1,
              from: 'now-6m',
              interval: '5m',
              index: [index],
              query: 'host.name:"test host"',
            },
          })
      );

      // PREVIEW packetbeat
      // const previewPromises = range(10).map(
      //   (idx) => () =>
      //     detectionsClient.rulePreview({
      //       body: {
      //         ...getBasicRuleMetadata(),
      //         type: 'query',
      //         timeframeEnd: new Date().toISOString(),
      //         invocationCount: 1,
      //         from: 'now-30m',
      //         interval: '25m',
      //         index: ['packet*'],
      //         query: '*',
      //       },
      //     })
      // );

      const results = (await concurrentlyExec(previewPromises, 1)).map(
        (result) => result.data.logs
      );
      console.log(JSON.stringify(results));
      console.log(`\n${results[0][0].duration}`);

      /**
       * END Custom data loader logic
       */
    },

    // Options
    {
      description: `Loads data into an environment for testing/development`,
      flags: {
        string: ['kibana', 'username', 'password', 'apikey'],
        default: {
          kibana: 'http://127.0.0.1:5601',
          elasticsearch: 'http://127.0.0.1:9200',
          username: 'elastic',
          password: 'changeme',
        },
        allowUnexpected: false,
        help: `
        --username                      User name to be used for auth against elasticsearch and
                                        kibana (Default: elastic).
        --password                      User name Password (Default: changeme)
        --kibana                        The url to Kibana (Default: http://127.0.0.1:5601)
        --apikey                        The API key for authentication, overrides username/password
      `,
      },
    }
  );
};
