import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/core/apiError";

const HTTP_UNAUTHORIZED = 401;
const MAX_NETWORK_RETRY = 2;

/**
 * アプリの QueryClient を作る。api が 401 を返したら（アカウントが見つからない・トークンが無効）`onUnauthorized` を呼ぶ。
 * api が返したエラーは再試行せず、通信そのものの失敗だけを再試行する。
 */
export const createAppQueryClient = (onUnauthorized: () => void): QueryClient => {
  const handleError = (error: Error) => {
    if (error instanceof ApiError && error.status === HTTP_UNAUTHORIZED) onUnauthorized();
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < MAX_NETWORK_RETRY
      }
    }
  });
};
