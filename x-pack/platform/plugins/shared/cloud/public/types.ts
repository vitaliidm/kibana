/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SolutionId } from '@kbn/core-chrome-browser';
import type { KibanaProductTier, KibanaSolution } from '@kbn/projects-solutions-groups';
import type { FC, PropsWithChildren } from 'react';

export interface CloudStart {
  /**
   * A React component that provides a pre-wired `React.Context` which connects components to Cloud services.
   */
  CloudContextProvider: FC<PropsWithChildren<unknown>>;
  /**
   * `true` when Kibana is running on Elastic Cloud.
   */
  isCloudEnabled: boolean;
  /**
   * Cloud ID. Undefined if not running on Cloud.
   */
  cloudId?: string;
  /**
   * This is the path to the Cloud deployments management page. The value is already prepended with `baseUrl`.
   *
   * @example `{baseUrl}/deployments`
   */
  deploymentsUrl?: string;
  /**
   * This is the path to the Cloud deployment management page for the deployment to which the Kibana instance belongs. The value is already prepended with `baseUrl`.
   *
   * @example `{baseUrl}/deployments/bfdad4ef99a24212a06d387593686d63`
   */
  deploymentUrl?: string;
  /**
   * The full URL to the user profile page on Elastic Cloud. Undefined if not running on Cloud.
   */
  profileUrl?: string;
  /**
   * The full URL to the billing page on Elastic Cloud. Undefined if not running on Cloud.
   */
  billingUrl?: string;
  /**
   * The full URL to the organization management page on Elastic Cloud. Undefined if not running on Cloud.
   */
  organizationUrl?: string;
  /**
   * The full URL to the performance page on Elastic Cloud. Undefined if not running on Cloud.
   */
  performanceUrl?: string;
  /**
   * The full URL to the users and roles page on Elastic Cloud. Undefined if not running on Cloud.
   */
  usersAndRolesUrl?: string;
  /**
   * The full URL to the serverless projects page on Elastic Cloud. Undefined if not running in Serverless.
   */
  projectsUrl?: string;
  /**
   * Fetches the full URL to the elasticsearch cluster.
   */
  fetchElasticsearchConfig: () => Promise<PublicElasticsearchConfigType>;
  /**
   * The full URL to the Kibana deployment.
   */
  kibanaUrl?: string;
  /**
   * `true` when running on Serverless Elastic Cloud
   * Note that `isCloudEnabled` will always be true when `isServerlessEnabled` is.
   */
  isServerlessEnabled: boolean;
  /**
   * Serverless configuration
   */
  serverless: {
    /**
     * The serverless projectId.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectId?: string;
    /**
     * The serverless project name.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectName?: string;
    /**
     * The serverless project type.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectType?: KibanaSolution;
  };
}

export interface CloudSetup {
  /**
   * Cloud ID. Undefined if not running on Cloud.
   */
  cloudId?: string;
  /**
   * The Elastic Cloud Organization that owns this deployment/project.
   */
  organizationId?: string;
  /**
   * The deployment's ID. Only available when running on Elastic Cloud.
   */
  deploymentId?: string;
  /**
   * This value is the same as `baseUrl` on ESS but can be customized on ECE.
   *
   * @example `cloud.elastic.co`
   */
  cname?: string;
  /**
   * The cloud service provider identifier.
   *
   * @note Expected to be one of `aws`, `gcp` or `azure`, but could be something different.
   */
  csp?: string;
  /**
   * This is the URL of the Cloud interface.
   */
  baseUrl?: string;
  /**
   * The full URL to the deployment management page on Elastic Cloud. Undefined if not running on Cloud.
   *
   * @example `{baseUrl}/deployments/bfdad4ef99a24212a06d387593686d63`
   */
  deploymentUrl?: string;
  /**
   * The full URL to the serverless projects page on Elastic Cloud. Undefined if not running in Serverless.
   */
  projectsUrl?: string;
  /**
   * This is the path to the Cloud User Profile page. The value is already prepended with `baseUrl`.
   *
   * @example `{baseUrl}/user/settings/`
   */
  profileUrl?: string;
  /**
   * This is the path to the Cloud Account and Billing page. The value is already prepended with `baseUrl`.
   *
   * @example `{baseUrl}/account/`
   */
  organizationUrl?: string;
  /**
   * This is the path to the Snapshots page for the deployment to which the Kibana instance belongs. The value is already prepended with `deploymentUrl`.
   *
   * @example `{deploymentUrl}/elasticsearch/snapshots`
   */
  snapshotsUrl?: string;
  /**
   * Fetches the full URL to the elasticsearch cluster.
   */
  fetchElasticsearchConfig: () => Promise<PublicElasticsearchConfigType>;
  /**
   * The full URL to the Kibana deployment.
   */
  kibanaUrl?: string;
  /**
   * {host} from the deployment url https://<deploymentId>.<application>.<host><?:port>
   */
  cloudHost?: string;
  /**
   * {port} from the deployment url https://<deploymentId>.<application>.<host><?:port>
   */
  cloudDefaultPort?: string;
  /**
   * `true` when Kibana is running on Elastic Cloud.
   */
  isCloudEnabled: boolean;
  /**
   * The end date for the Elastic Cloud trial. Only available on Elastic Cloud.
   *
   * @example `2020-10-14T10:40:22Z`
   */
  trialEndDate?: Date;
  /**
   * `true` if the Elastic Cloud organization that owns this deployment is owned by an Elastician. Only available when running on Elastic Cloud.
   */
  isElasticStaffOwned?: boolean;
  /**
   * Registers CloudServiceProviders so start's `CloudContextProvider` hooks them.
   *
   * @param contextProvider The React component from the Service Provider.
   */
  registerCloudService: (contextProvider: FC) => void;
  /**
   * Onboarding configuration
   */
  onboarding: {
    /**
     * The default solution selected during onboarding.
     */
    defaultSolution?: SolutionId;
  };
  /**
   * `true` when running on Serverless Elastic Cloud
   * Note that `isCloudEnabled` will always be true when `isServerlessEnabled` is.
   */
  isServerlessEnabled: boolean;
  /**
   * Serverless configuration
   */
  serverless: {
    /**
     * The serverless projectId.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectId?: string;
    /**
     * The serverless project name.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectName?: string;
    /**
     * The serverless project type.
     * Will always be present if `isServerlessEnabled` is `true`
     */
    projectType?: KibanaSolution;
    /**
     * The serverless product tier.
     * Only present if the current project type has product tiers defined.
     * @remarks This field is only exposed for informational purposes. Use the `core.pricing` when checking if a feature if available for the current product tier.
     * @internal
     */
    productTier?: KibanaProductTier;
    /**
     * The serverless orchestrator target. The potential values are `canary` or `non-canary`
     * Will always be present if `isServerlessEnabled` is `true`
     */
    orchestratorTarget?: string;
  };
}

export interface PublicElasticsearchConfigType {
  /**
   * The URL to the Elasticsearch cluster, derived from elasticsearch.publicBaseUrl if populated
   * Otherwise this is based on the cloudId
   * If neither is populated, this will be undefined
   */
  elasticsearchUrl?: string;
}
