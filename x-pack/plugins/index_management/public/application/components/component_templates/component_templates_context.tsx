/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { createContext, useContext } from 'react';
import { UiCounterMetricType } from '@kbn/analytics';

import {
  HttpSetup,
  DocLinksStart,
  NotificationsSetup,
  CoreStart,
  ExecutionContextStart,
} from '@kbn/core/public';
import { IndexManagementStartServices } from '../../../types';
import { getApi, getUseRequest, getSendRequest, getDocumentation } from './lib';

const ComponentTemplatesContext = createContext<Context | undefined>(undefined);

interface Props {
  httpClient: HttpSetup;
  apiBasePath: string;
  trackMetric: (type: UiCounterMetricType, eventName: string) => void;
  docLinks: DocLinksStart;
  toasts: NotificationsSetup['toasts'];
  getUrlForApp: CoreStart['application']['getUrlForApp'];
  executionContext: ExecutionContextStart;
  startServices: IndexManagementStartServices;
}

interface Context {
  httpClient: HttpSetup;
  apiBasePath: string;
  api: ReturnType<typeof getApi>;
  documentation: ReturnType<typeof getDocumentation>;
  trackMetric: (type: UiCounterMetricType, eventName: string) => void;
  toasts: NotificationsSetup['toasts'];
  getUrlForApp: CoreStart['application']['getUrlForApp'];
  executionContext: ExecutionContextStart;
  startServices: IndexManagementStartServices;
}

export const ComponentTemplatesProvider = ({
  children,
  value,
}: {
  value: Props;
  children: React.ReactNode;
}) => {
  const {
    httpClient,
    apiBasePath,
    trackMetric,
    docLinks,
    toasts,
    getUrlForApp,
    executionContext,
    startServices,
  } = value;

  const useRequest = getUseRequest(httpClient);
  const sendRequest = getSendRequest(httpClient);

  const api = getApi(useRequest, sendRequest, apiBasePath, trackMetric);
  const documentation = getDocumentation(docLinks);

  return (
    <ComponentTemplatesContext.Provider
      value={{
        api,
        documentation,
        trackMetric,
        toasts,
        httpClient,
        apiBasePath,
        getUrlForApp,
        executionContext,
        startServices,
      }}
    >
      {children}
    </ComponentTemplatesContext.Provider>
  );
};

export const useComponentTemplatesContext = () => {
  const ctx = useContext(ComponentTemplatesContext);
  if (!ctx) {
    throw new Error(
      '"useComponentTemplatesContext" can only be called inside of ComponentTemplatesProvider!'
    );
  }
  return ctx;
};

export const useApi = () => useComponentTemplatesContext().api;
