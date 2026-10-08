import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './attendance';

/** Retry network blips and 5xx twice, but never retry a 4xx: the answer will not change. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export const queryClient = createQueryClient();
