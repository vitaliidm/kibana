/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMutation, useQuery, useQueryClient } from '@kbn/react-query';
import { isHttpFetchError } from '@kbn/core-http-browser';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { API_VERSIONS } from '@kbn/inbox-common';
import {
  INBOX_WATCHES_URL,
  buildWatchUrl,
  type CreateWatchRequest,
  type CreateWatchResponse,
  type GetWatchResponse,
  type ListWatchesResponse,
} from '../../common/watches';
import { queryKeys } from '../query_keys';

const retryOnTransientError = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 3) {
    return false;
  }
  if (isHttpFetchError(error)) {
    return !error.response?.status || error.response.status >= 500;
  }
  return true;
};

export const useWatches = () => {
  const { services } = useKibana();

  return useQuery({
    queryKey: queryKeys.watches.list(),
    queryFn: async (): Promise<ListWatchesResponse> =>
      services.http!.get<ListWatchesResponse>(INBOX_WATCHES_URL, {
        version: API_VERSIONS.internal.v1,
      }),
    keepPreviousData: true,
    retry: retryOnTransientError,
  });
};

export const useWatch = (watchId: string | undefined) => {
  const { services } = useKibana();

  return useQuery({
    queryKey: queryKeys.watches.detail(watchId),
    queryFn: async (): Promise<GetWatchResponse> => {
      if (!watchId) {
        throw new Error('watchId is required');
      }
      return services.http!.get<GetWatchResponse>(buildWatchUrl(watchId), {
        version: API_VERSIONS.internal.v1,
      });
    },
    enabled: Boolean(watchId),
    retry: retryOnTransientError,
  });
};

export const useCreateWatch = () => {
  const { services } = useKibana();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateWatchRequest): Promise<CreateWatchResponse> =>
      services.http!.post<CreateWatchResponse>(INBOX_WATCHES_URL, {
        version: API_VERSIONS.internal.v1,
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.watches.list() });
    },
  });
};

export const useDeleteWatch = () => {
  const { services } = useKibana();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (watchId: string): Promise<void> => {
      await services.http!.delete(buildWatchUrl(watchId), {
        version: API_VERSIONS.internal.v1,
      });
    },
    onSuccess: async (_data, watchId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.watches.list() });
      await queryClient.removeQueries({ queryKey: queryKeys.watches.detail(watchId) });
    },
  });
};
