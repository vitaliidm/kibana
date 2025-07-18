/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { UserAtSpaceScenarios } from '../../../../scenarios';
import { getUrlPrefix, ObjectRemover } from '../../../../../common/lib';
import type { FtrProviderContext } from '../../../../../common/ftr_provider_context';

export default function findMaintenanceWindowTests({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const supertestWithoutAuth = getService('supertestWithoutAuth');

  describe('findMaintenanceWindow', () => {
    const objectRemover = new ObjectRemover(supertest);
    const createParams = {
      title: 'test-maintenance-window',
      duration: 60 * 60 * 1000, // 1 hr
      r_rule: {
        dtstart: new Date().toISOString(),
        tzid: 'UTC',
        freq: 2, // weekly
      },
    };

    afterEach(() => objectRemover.removeAll());

    for (const scenario of UserAtSpaceScenarios) {
      const { user, space } = scenario;
      describe(scenario.id, () => {
        it('should handle find maintenance window request appropriately', async () => {
          const { body: createdMaintenanceWindow1 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send(createParams);

          const { body: createdMaintenanceWindow2 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send(createParams);

          objectRemover.add(
            space.id,
            createdMaintenanceWindow1.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            createdMaintenanceWindow2.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window/_find`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(2);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].title).to.eql('test-maintenance-window');
              expect(response.body.data[0].duration).to.eql(3600000);
              expect(response.body.data[0].r_rule.dtstart).to.eql(createParams.r_rule.dtstart);
              expect(response.body.data[0].events.length).to.be.greaterThan(0);
              expect(response.body.data[0].status).to.eql('running');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should handle find maintenance window request with pagination', async () => {
          const { body: createdMaintenanceWindow1 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send(createParams);

          const { body: createdMaintenanceWindow2 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({ ...createParams, title: 'test-maintenance-window2' });

          objectRemover.add(
            space.id,
            createdMaintenanceWindow1.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            createdMaintenanceWindow2.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=1&per_page=1`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=1&per_page=1] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(2);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].id).to.eql(createdMaintenanceWindow2.id);
              expect(response.body.data[0].title).to.eql('test-maintenance-window2');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('throw an error for find maintenance window request with pagination if docs count more 10k', async () => {
          const { body: createdMaintenanceWindow1 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send(createParams);

          objectRemover.add(
            space.id,
            createdMaintenanceWindow1.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=101&per_page=100`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=101&per_page=100] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body).to.eql({
                statusCode: 400,
                error: 'Bad Request',
                message:
                  '[request query]: The number of documents is too high. Paginating through more than 10000 documents is not possible.',
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should filter maintenance windows based on search text', async () => {
          const { body: createdMaintenanceWindow1 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send(createParams);

          const { body: createdMaintenanceWindow2 } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({ ...createParams, title: 'search-name' });

          objectRemover.add(
            space.id,
            createdMaintenanceWindow1.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            createdMaintenanceWindow2.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=1&per_page=1&search=search-name`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=1&per_page=1&search=search-name] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(1);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].id).to.eql(createdMaintenanceWindow2.id);
              expect(response.body.data[0].title).to.eql('search-name');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should filter maintenance windows based on running status', async () => {
          const { body: runningMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({ ...createParams, title: 'test-running-maintenance-window' });

          const { body: upcomingMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-upcoming-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
                tzid: 'UTC',
                freq: 2, // weekly
              },
            });
          const { body: finishedMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-finished-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date('05-01-2023').toISOString(),
                tzid: 'UTC',
                freq: 1,
                count: 1,
              },
            });

          objectRemover.add(
            space.id,
            runningMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            upcomingMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            finishedMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=running`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=running] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(1);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].title).to.eql('test-running-maintenance-window');
              expect(response.body.data[0].status).to.eql('running');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should filter maintenance windows based on upcomimg status', async () => {
          const { body: runningMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({ ...createParams, title: 'test-running-maintenance-window' });

          const { body: upcomingMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-upcoming-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
                tzid: 'UTC',
                freq: 2, // weekly
              },
            });
          const { body: finishedMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-finished-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date('05-01-2023').toISOString(),
                tzid: 'UTC',
                freq: 1,
                count: 1,
              },
            });

          objectRemover.add(
            space.id,
            runningMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            upcomingMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            finishedMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=upcoming`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=upcoming] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(1);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].title).to.eql('test-upcoming-maintenance-window');
              expect(response.body.data[0].status).to.eql('upcoming');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should filter maintenance windows based on finished and running status', async () => {
          const { body: runningMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({ ...createParams, title: 'test-running-maintenance-window' });

          const { body: upcomingMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-upcoming-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
                tzid: 'UTC',
                freq: 2, // weekly
              },
            });
          const { body: finishedMaintenanceWindow } = await supertest
            .post(`${getUrlPrefix(space.id)}/internal/alerting/rules/maintenance_window`)
            .set('kbn-xsrf', 'foo')
            .send({
              title: 'test-finished-maintenance-window',
              duration: 60 * 60 * 1000, // 1 hr
              r_rule: {
                dtstart: new Date('05-01-2023').toISOString(),
                tzid: 'UTC',
                freq: 1,
                count: 1,
              },
            });

          objectRemover.add(
            space.id,
            runningMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            upcomingMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );
          objectRemover.add(
            space.id,
            finishedMaintenanceWindow.id,
            'rules/maintenance_window',
            'alerting',
            true
          );

          const response = await supertestWithoutAuth
            .get(
              `${getUrlPrefix(
                space.id
              )}/internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=running&status=finished`
            )
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'space_1_all_with_restricted_fixture at space1':
            case 'space_1_all_alerts_none_actions at space1':
              expect(response.statusCode).to.eql(403);
              expect(response.body).to.eql({
                error: 'Forbidden',
                message:
                  'API [GET /internal/alerting/rules/maintenance_window/_find?page=1&per_page=10&status=running&status=finished] is unauthorized for user, this action is granted by the Kibana privileges [read-maintenance-window]',
                statusCode: 403,
              });
              break;
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.body.total).to.eql(2);
              expect(response.statusCode).to.eql(200);
              expect(response.body.data[0].title).to.eql('test-finished-maintenance-window');
              expect(response.body.data[0].status).to.eql('finished');
              expect(response.body.data[1].title).to.eql('test-running-maintenance-window');
              expect(response.body.data[1].status).to.eql('running');
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });
      });
    }
  });
}
