import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

/** Shared TanStack Query client with sensible defaults for this app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => {
        // Không retry các lỗi 4xx phía client (401, 403, 404, 422, v.v.)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

