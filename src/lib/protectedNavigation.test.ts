import { describe, expect, it } from 'vitest';
import { isNavItemAccessible } from './protectedNavigation';

describe('protectedNavigation', () => {
  const staffPermissions = [
    'core.dashboard.view',
    'hrm.employees.view:own',
    'wms.dashboard.view',
    'wms.stock.view:all',
  ];

  it('treats items without path as not accessible', () => {
    expect(isNavItemAccessible(staffPermissions, { label: 'C & B' })).toBe(false);
  });

  it('allows navigation when permission matches', () => {
    expect(
      isNavItemAccessible(staffPermissions, {
        label: 'Tồn kho',
        path: '/warehouse/stock',
        permission: 'wms.stock.view:all',
      }),
    ).toBe(true);
  });

  it('locks navigation when permission is missing', () => {
    expect(
      isNavItemAccessible(staffPermissions, {
        label: 'Nhân Viên',
        path: '/members/list',
        permission: 'hrm.employees.view:all',
      }),
    ).toBe(false);
  });

  it('allows items without permission metadata', () => {
    expect(
      isNavItemAccessible(staffPermissions, {
        label: 'Legacy',
        path: '/legacy',
      }),
    ).toBe(true);
  });
});
