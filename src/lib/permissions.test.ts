import { describe, expect, it } from 'vitest';
import {
  filterByPermission,
  filterDepartments,
  hasAnyPermission,
  hasPermission,
} from './permissions';
import {
  filterPermissionGroups,
  getActionBadgeInfo,
  getActionType,
  getModuleLabel,
  getResourceLabel,
  groupPermissionCatalog,
} from './permissions/groupPermissionCatalog';
import { getRequiredPermissionsForPath } from './routePermissions';

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

    const mockDepartments = [
      {
        title: 'HRM',
        items: [{ permission: 'hrm.candidates.view:all' }],
      },
      {
        title: 'ADMIN',
        items: [{ permission: 'admin.users.view:all' }],
      },
    ];
    const visible = filterDepartments(mockDepartments, hrPermissions);
    expect(visible.some(d => d.title === 'HRM')).toBe(true);
    expect(visible.some(d => d.title === 'ADMIN')).toBe(false);
  });
});

describe('routePermissions', () => {
  it('maps pilot routes to permission keys', () => {
    expect(getRequiredPermissionsForPath('/warehouse/dashboard')).toEqual(['wms.projects.view:all']);
    expect(getRequiredPermissionsForPath('/warehouse/import')).toEqual(['wms.imports.view:all']);
    expect(getRequiredPermissionsForPath('/members/new')).toEqual(['hrm.employees.create']);
    expect(getRequiredPermissionsForPath('/members/settings')).toEqual([
      'hrm.members.settings.view',
      'hrm.recruitment.positions.view',
    ]);
    expect(getRequiredPermissionsForPath('/members/settings/departments')).toEqual([
      'hrm.members.settings.view',
    ]);
    expect(getRequiredPermissionsForPath('/members/settings/branches')).toEqual([
      'hrm.members.settings.view',
    ]);
    expect(getRequiredPermissionsForPath('/members/settings/recruitment')).toEqual([
      'hrm.recruitment.positions.view',
    ]);
    expect(getRequiredPermissionsForPath('/admin/settings/roles/admin/permissions')).toEqual(['admin.roles.view:all']);
    expect(getRequiredPermissionsForPath('/unknown')).toBeNull();
    expect(getRequiredPermissionsForPath('/')).toEqual([]);
    expect(getRequiredPermissionsForPath('/stocktake/settings')).toEqual(['wms.stocktakes.view:all']);
    expect(getRequiredPermissionsForPath('/purchasing/settings')).toEqual(['purchasing.dashboard.view']);
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
    expect(getRequiredPermissionsForPath('/operations/estimate-procurement')).toEqual([
      'purchasing.estimates.view',
      'purchasing.rfq.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/estimate-procurement/abc')).toEqual([
      'purchasing.estimates.view',
    ]);
    expect(getRequiredPermissionsForPath('/operations/estimate-procurement/abc')).toEqual([
      'purchasing.estimates.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/price-book')).toEqual([
      'purchasing.pricebook.view',
    ]);
    expect(getRequiredPermissionsForPath('/operations/price-book')).toEqual([
      'purchasing.pricebook.view',
    ]);
    expect(getRequiredPermissionsForPath('/purchasing/price-history')).toEqual([
      'purchasing.pricebook.view',
      'wms.suppliers.view:all',
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
      { key: 'purchasing.plans.view', module: 'Purchasing', resource: 'Plans', label: 'Xem kế hoạch mua' },
    ]);
    expect(groups.map(g => g.module)).toEqual(['Core', 'Admin', 'HRM', 'Purchasing']);
    expect(groups.map(g => g.moduleLabel)).toEqual(['Hệ thống', 'Quản trị', 'Nhân sự', 'Mua hàng']);
    expect(groups[0]?.resources[0]?.resourceLabel).toBe('Tổng quan');
    expect(groups[0]?.resources[0]?.entries).toHaveLength(1);
  });

  it('filters by Vietnamese module and resource labels', () => {
    const groups = groupPermissionCatalog([
      { key: 'wms.stock.view:all', module: 'WMS', resource: 'Stock', label: 'Xem tồn kho' },
      { key: 'admin.users.view:all', module: 'Admin', resource: 'Users', label: 'Xem user' },
    ]);
    expect(filterPermissionGroups(groups, 'kho').map(g => g.module)).toEqual(['WMS']);
    expect(filterPermissionGroups(groups, 'tồn').map(g => g.module)).toEqual(['WMS']);
    expect(filterPermissionGroups(groups, 'quản trị').map(g => g.module)).toEqual(['Admin']);
  });
});

describe('permission catalog labels', () => {
  it('maps known modules and resources to Vietnamese', () => {
    expect(getModuleLabel('Purchasing')).toBe('Mua hàng');
    expect(getResourceLabel('Employees')).toBe('Nhân viên');
    expect(getResourceLabel('UNKNOWN_ALLCAPS')).toBe('Unknown_allcaps');
  });

  it('orders WMS and Purchasing resources by business workflow priority', () => {
    const wmsCatalog = [
      { key: 'wms.settings.view', module: 'WMS', resource: 'Settings', label: 'Thiết lập kho' },
      { key: 'wms.stock.view:all', module: 'WMS', resource: 'Stock', label: 'Xem tồn kho' },
      { key: 'wms.projects.view:all', module: 'WMS', resource: 'Projects', label: 'Xem dự án' },
      { key: 'wms.imports.view:all', module: 'WMS', resource: 'Imports', label: 'Xem phiếu nhập' },
      { key: 'wms.prices.view', module: 'WMS', resource: 'Prices', label: 'Xem đơn giá' },
    ];
    const grouped = groupPermissionCatalog(wmsCatalog);
    const resources = grouped[0]!.resources.map(r => r.resource);
    expect(resources).toEqual(['Projects', 'Stock', 'Imports', 'Prices', 'Settings']);
  });

  it('classifies permission action types accurately', () => {
    expect(getActionType('core.dashboard.view')).toBe('view');
    expect(getActionType('wms.projects.view:all')).toBe('view');
    expect(getActionType('hrm.employees.view:own')).toBe('view');
    expect(getActionType('wms.materials.create')).toBe('create');
    expect(getActionType('wms.materials.update')).toBe('update');
    expect(getActionType('wms.materials.delete')).toBe('delete');
    expect(getActionType('wms.imports.approve')).toBe('approve');
    expect(getActionType('purchasing.plans.approve_l1')).toBe('approve');
    expect(getActionType('purchasing.plans.approve_l2')).toBe('approve');
    expect(getActionType('purchasing.plans.reject')).toBe('approve');
    expect(getActionType('purchasing.plans.submit')).toBe('approve');
    expect(getActionType('wms.reports.export')).toBe('export');
    expect(getActionType('purchasing.plans.import')).toBe('export');
    expect(getActionType('wms.prices.view')).toBe('price');
    expect(getActionType('purchasing.pricebook.view')).toBe('price');
    expect(getActionType('purchasing.pricebook.update')).toBe('price');
    expect(getActionType('admin.users.lock')).toBe('lock');
  });

  it('provides action badge info and flags sensitive permissions', () => {
    const priceBadge = getActionBadgeInfo('wms.prices.view', 'Xem đơn giá');
    expect(priceBadge.label).toBe('GIÁ');
    expect(priceBadge.isSensitive).toBe(true);

    const viewBadge = getActionBadgeInfo('wms.stock.view:all', 'Xem tồn kho');
    expect(viewBadge.label).toBe('XEM');
    expect(viewBadge.isSensitive).toBe(false);

    const createBadge = getActionBadgeInfo('wms.materials.create', 'Tạo vật tư');
    expect(createBadge.label).toBe('TẠO');

    const approveBadge = getActionBadgeInfo('wms.imports.approve', 'Duyệt phiếu nhập');
    expect(approveBadge.label).toBe('DUYỆT');
  });

  it('filters permissions by status and action type options', () => {
    const catalog = [
      { key: 'wms.projects.view:all', module: 'WMS', resource: 'Projects', label: 'Xem dự án' },
      { key: 'wms.projects.create', module: 'WMS', resource: 'Projects', label: 'Tạo dự án' },
      { key: 'wms.prices.view', module: 'WMS', resource: 'Prices', label: 'Xem đơn giá' },
      { key: 'wms.imports.approve', module: 'WMS', resource: 'Imports', label: 'Duyệt nhập' },
    ];
    const grouped = groupPermissionCatalog(catalog);
    const selected = new Set(['wms.projects.view:all']);

    // Filter by granted status
    const grantedOnly = filterPermissionGroups(grouped, {
      status: 'granted',
      selectedKeys: selected,
    });
    expect(grantedOnly[0]!.resources[0]!.entries.map(e => e.key)).toEqual(['wms.projects.view:all']);

    // Filter by ungranted status
    const ungrantedOnly = filterPermissionGroups(grouped, {
      status: 'ungranted',
      selectedKeys: selected,
    });
    const ungrantedKeys = ungrantedOnly[0]!.resources.flatMap(r => r.entries.map(e => e.key));
    expect(ungrantedKeys).not.toContain('wms.projects.view:all');
    expect(ungrantedKeys).toContain('wms.projects.create');

    // Filter by action type: approve
    const approveOnly = filterPermissionGroups(grouped, {
      actionFilter: 'approve',
    });
    expect(approveOnly[0]!.resources[0]!.entries[0]!.key).toBe('wms.imports.approve');

    // Filter by action type: price_report
    const priceOnly = filterPermissionGroups(grouped, {
      actionFilter: 'price_report',
    });
    expect(priceOnly[0]!.resources[0]!.entries[0]!.key).toBe('wms.prices.view');
  });
  });
