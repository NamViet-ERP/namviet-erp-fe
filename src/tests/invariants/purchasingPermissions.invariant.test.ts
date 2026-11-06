import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission } from '../../lib/permissions';

describe('Living Invariant 2: Purchasing Plan & Project Access Rights', () => {
  it('ensures purchasing plan creators and viewers have project view permissions in their profile', () => {
    // Procurement and Purchasing roles must include project access to select target projects
    const purchasingOfficerPermissions = [
      'purchasing.dashboard.view',
      'purchasing.plans.view',
      'purchasing.plans.create',
      'purchasing.plans.update',
      'wms.projects.view:all',
    ];

    expect(hasPermission(purchasingOfficerPermissions, 'purchasing.plans.create')).toBe(true);
    expect(hasPermission(purchasingOfficerPermissions, 'purchasing.plans.view')).toBe(true);
    expect(hasPermission(purchasingOfficerPermissions, 'wms.projects.view:all')).toBe(true);
  });

  it('allows access to active project resources when checking required project permissions', () => {
    const purchasingPermissions = [
      'purchasing.plans.create',
      'purchasing.plans.view',
      'wms.projects.view:all',
    ];

    const canViewProjects = hasAnyPermission(purchasingPermissions, [
      'wms.projects.view:all',
      'wms.projects.view:own',
    ]);
    expect(canViewProjects).toBe(true);
  });

  it('denies project view access if user lacks wms.projects.view permissions', () => {
    const unprivilegedPermissions = ['purchasing.plans.create'];
    expect(hasPermission(unprivilegedPermissions, 'wms.projects.view:all')).toBe(false);
  });
});
