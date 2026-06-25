import { clone } from './clone';

/** Simulate network latency so loading states are exercised in mock mode. */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms));
}
