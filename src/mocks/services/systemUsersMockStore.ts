import { createMockLocalStore, type MockLocalStore } from '../localStore';
import type { SystemUser } from '../../types/systemUser';

let store: MockLocalStore<SystemUser> | null = null;

export async function loadSystemUsersMockStore(): Promise<MockLocalStore<SystemUser>> {
  if (store) return store;
  const { SEED_SYSTEM_USERS } = await import('../data/systemUsersSeed');
  store = createMockLocalStore('nv-system-users', SEED_SYSTEM_USERS);
  return store;
}

export function getLoadedSystemUsersMockStore(): MockLocalStore<SystemUser> | null {
  return store;
}

export function resetSystemUsersMockStore(): void {
  store = null;
}
