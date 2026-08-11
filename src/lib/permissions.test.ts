import { describe, expect, it } from 'vitest';
import {
  filterByPermission,
  filterDepartments,
  hasAnyPermission,
  hasPermission,
} from './permissions';
import { groupPermissionCatalog } from './permissions/groupPermissionCatalog';
import { getRequiredPermissionsForPath } from './routePermissions';
import { departments } from '../constants/departments';

describe('permissions', () => {
  const hrPermissions = [
    'core.dashboard.view',
    'hrm.employees.view:all',
    'hrm.candidates.view:all',
  ];

  it('checks single permission membership', () => {
    expect(hasPermission(hrPermissions, 'hrm.candidates.view:all')).toBe(true);
    expect(hasPermission(hrPermissions, 'admin.users.view:all')).toBe(false);
  });

  it('checks any-of permission requirements', () => {
    expect(hasAnyPermission(hrPermissions, ['hrm.employees.view:all', 'hrm.employees.view:own'])).toBe(true);
    expect(hasAnyPermission(hrPermissions, ['admin.users.view:all', 'wms.dashboard.view'])).toBe(false);
  });

  it('filters menu items and departments by permission when using filter helpers', () => {
    const items = filterByPermission(
      [
        { id: 'a', permission: 'hrm.candidates.view:all' },
        { id: 'b', permission: 'admin.users.view:all' },
      ],
      hrPermissions,
    );
    expect(items.map(i => i.id)).toEqual(['a']);

    const visible = filterDepartments(departments, hrPermissions);
    expect(visible.some(d => d.title === 'HRM')).toBe(true);
    expect(visible.some(d => d.title === 'ADMIN')).toBe(false);
  });
});

describe('routePermissions', () => {
  it('maps pilot routes to permission keys', () => {
    expect(getRequiredPermissionsForPath('/warehouse/dashboard')).toEqual(['core.dashboard.view']);
    expect(getRequiredPermissionsForPath('/warehouse/import')).toEqual(['wms.imports.view:all']);
    expect(getRequiredPermissionsForPath('/members/new')).toEqual(['hrm.employees.create']);
    expect(getRequiredPermissionsForPath('/admin/settings/roles/admin/permissions')).toEqual(['admin.roles.view:all']);
    expect(getRequiredPermissionsForPath('/unknown')).toBeNull();
  });

  it('maps material return route to export return permission', () => {
    expect(getRequiredPermissionsForPath('/warehouse/material-return')).toEqual([
      'wms.export_returns.view:all',
    ]);
    expect(getRequiredPermissionsForPath('/warehouse/defects')).toEqual([
      'wms.defects.view:all',
    ]);
  });

  it('maps warehouse arrival plans route', () => {
    expect(getRequiredPermissionsForPath('/warehouse/arrival-plans')).toEqual([
      'purchasing.arrival_plans.view',
    ]);
  });

  it('maps purchasing routes to permission keys', () => {
    expect(getRequiredPermissionsForPath('/purchasing/dashboard')).toEqual(['purchasing.dashboard.view']);
    expect(getRequiredPermissionsForPath('/purchasing/plans')).toEqual(['purchasing.plans.view']);
    expect(getRequiredPermissionsForPath('/purchasing/plans/KH-001')).toEqual(['purchasing.plans.view']);
    expect(getRequiredPermissionsForPath('/purchasing/orders')).toEqual(['purchasing.orders.view']);
    expect(getRequiredPermissionsForPath('/purchasing/orders/new')).toEqual([
      'purchasing.orders.create',
      'purchasing.orders.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/orders/PO-001')).toEqual(['purchasing.orders.view']);
    expect(getRequiredPermissionsForPath('/purchasing/estimate-procurement')).toEqual([
      'purchasing.estimates.view',
      'purchasing.rfq.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/estimate-procurement/abc')).toEqual([
      'purchasing.estimates.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/price-book')).toEqual([
      'purchasing.pricebook.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/payments')).toEqual(['purchasing.payments.view']);
    expect(getRequiredPermissionsForPath('/purchasing/payments/new')).toEqual([
      'purchasing.payments.create',
      'purchasing.payments.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/payments/DNTT-0001')).toEqual(['purchasing.payments.view']);
  });
});

describe('groupPermissionCatalog', () => {
  it('groups catalog entries by module and resource', () => {
    const groups = groupPermissionCatalog([
      { key: 'core.dashboard.view', module: 'Core', resource: 'Dashboard', label: 'Xem dashboard' },
      { key: 'admin.users.view:all', module: 'Admin', resource: 'Users', label: 'Xem user' },
      { key: 'hrm.employees.view:all', module: 'HRM', resource: 'Employees', label: 'Xem NV' },
    ]);
    expect(groups.map(g => g.module)).toEqual(['Core', 'Admin', 'HRM']);
    expect(groups[0]?.resources[0]?.entries).toHaveLength(1);
  });
});
