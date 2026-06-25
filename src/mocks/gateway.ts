import { USE_MOCK } from './config';

/**
 * Route a service call to its mock or real implementation.
 * Keeps mock branching in one place instead of per-method if/else.
 */
export async function resolveMock<T>(
  mockFn: () => Promise<T>,
  realFn: () => Promise<T>,
): Promise<T> {
  if (USE_MOCK) return mockFn();
  return realFn();
}
