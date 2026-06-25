import { beforeEach, describe, expect, it } from 'vitest';
import { USE_MOCK } from './config';
import { employeesService } from '../services/employeesService';
import { adminUsersService } from '../services/adminUsersService';
import { candidatesService } from '../services/candidatesService';
import { authService } from '../services/authService';

describe('mock services smoke (resolveMock)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('USE_MOCK is enabled in test env', () => {
    expect(USE_MOCK).toBe(true);
  });

  it('employeesService.list returns seeded employees', async () => {
    const items = await employeesService.list();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({
      id: expect.any(String),
      fullName: expect.any(String),
    });
  });

  it('employeesService.getById loads a known employee', async () => {
    const items = await employeesService.list();
    const first = items[0];
    const loaded = await employeesService.getById(first.id);
    expect(loaded.id).toBe(first.id);
    expect(loaded.fullName).toBe(first.fullName);
  });

  it('adminUsersService.list returns paged admin rows', async () => {
    const res = await adminUsersService.list({ page: 1, pageSize: 10 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.totalCount).toBeGreaterThanOrEqual(res.items.length);
    expect(res.summary).toMatchObject({
      total: expect.any(Number),
      pending: expect.any(Number),
      active: expect.any(Number),
    });
  });

  it('candidatesService.list returns paged candidates', async () => {
    const res = await candidatesService.list({ page: 1, pageSize: 5 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.totalCount).toBeGreaterThan(0);
  });

  it('authService mock session helpers', async () => {
    expect(authService.isLoggedIn()).toBe(false);
    localStorage.setItem('nv-logged-in', 'true');
    expect(authService.isLoggedIn()).toBe(true);
    expect(await authService.ensureSession()).toBe(true);
    expect(await authService.refreshSession()).toBe(true);
  });

  it('mock quick-login user exists and can login', async () => {
    const { getUserById, canUserLogin } = await import('../constants/systemUsers');
    const { SEED_SYSTEM_USERS } = await import('./data/systemUsersSeed');
    const seedUser = SEED_SYSTEM_USERS[0];
    const user = getUserById(seedUser.id);
    expect(user).toBeDefined();
    expect(canUserLogin(user!)).toBe(true);
  });
});
