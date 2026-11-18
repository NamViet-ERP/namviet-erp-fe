import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission } from '../../lib/permissions';
import { getFallbackRoute, getRouteAccess } from '../../lib/routePermissions';
import { canViewWmsPrices } from '../../lib/wms/priceVisibility';
import { isNavItemAccessible } from '../../lib/protectedNavigation';
import { executiveMenu, adminMenu, unifiedSidebarMenu } from '../../constants/sidebarMenus';

/**
 * Standard Permission Sets according to SPEC_ROLES_BOD_MANAGER.md
 */
export const BOD_PERMISSIONS = [
  // Core
  'core.profile.view',
  'core.profile.update',

  // WMS View-all
  'wms.dashboard.view',
  'wms.projects.view:all',
  'wms.materials.view:all',
  'wms.stock.view:all',
  'wms.imports.view:all',
  'wms.exports.view:all',
  'wms.transfers.view:all',
  'wms.export_returns.view:all',
  'wms.defects.view:all',
  'wms.reports.view:all',
  'wms.stocktakes.view:all',
  'wms.suppliers.view:all',
  'wms.categories.view:all',
  'wms.material_units.view:all',
  'wms.material_origins.view:all',

  // Purchasing View-all
  'purchasing.dashboard.view',
  'purchasing.plans.view',
  'purchasing.orders.view',
  'purchasing.suppliers.view',
  'purchasing.contracts.view',
  'purchasing.documents.view',
  'purchasing.warranties.view',
  'purchasing.payments.view',
  'purchasing.estimates.view',
  'purchasing.rfq.view',
  'purchasing.arrival_plans.view',

  // HRM View-all
  'hrm.employees.view:all',
  'hrm.leaves.view',
  'hrm.timesheet.view',
  'hrm.kpi.view',
  'hrm.recruitment.costs.view',
  'hrm.reports.view',

  // BOD Specific Approvals & Sensitive Prices
  'wms.prices.view',
  'purchasing.pricebook.view',
  'purchasing.plans.approve_l2',
  'purchasing.plans.reject',
  'purchasing.estimates.approve_l2',
  'wms.suppliers.approve',
  'purchasing.orders.approve',
  'purchasing.payments.pay',
  'hrm.leaves.approve',
  'wms.transactions.approve',
];

export const DEPARTMENT_MANAGER_PERMISSIONS = [
  // Core
  'core.profile.view',
  'core.profile.update',

  // WMS View-all
  'wms.dashboard.view',
  'wms.projects.view:all',
  'wms.materials.view:all',
  'wms.stock.view:all',
  'wms.imports.view:all',
  'wms.exports.view:all',
  'wms.transfers.view:all',
  'wms.export_returns.view:all',
  'wms.defects.view:all',
  'wms.reports.view:all',
  'wms.stocktakes.view:all',
  'wms.suppliers.view:all',
  'wms.categories.view:all',
  'wms.material_units.view:all',
  'wms.material_origins.view:all',

  // Purchasing View-all
  'purchasing.dashboard.view',
  'purchasing.plans.view',
  'purchasing.orders.view',
  'purchasing.suppliers.view',
  'purchasing.contracts.view',
  'purchasing.documents.view',
  'purchasing.warranties.view',
  'purchasing.payments.view',
  'purchasing.estimates.view',
  'purchasing.rfq.view',
  'purchasing.arrival_plans.view',

  // HRM Department Scope
  'hrm.employees.view:all',
  'hrm.leaves.view',
  'hrm.leaves.create',
  'hrm.leaves.approve',

  // Department Manager Specific Approvals & Project management
  'purchasing.plans.approve_l1',
  'purchasing.plans.reject',
  'purchasing.estimates.approve_l1',
  'wms.projects.create',
  'wms.projects.update',
];

function canAccessRoute(permissions: readonly string[], path: string): boolean {
  const access = getRouteAccess(path);
  if (access.kind === 'unknown') return false;
  if (access.kind === 'authenticated') return true;
  return hasAnyPermission(permissions, access.permissions);
}

describe('Living Invariant: BOD & Department_Manager Role Verification', () => {
  describe('BOD (Ban Giám Đốc / Giám đốc)', () => {
    it('grants full access to all WMS routes', () => {
      const wmsRoutes = [
        '/warehouse/dashboard-warehouse',
        '/warehouse/projects',
        '/warehouse/projects/proj-001',
        '/warehouse/materials',
        '/warehouse/stock',
        '/warehouse/arrival-plans',
        '/warehouse/import',
        '/warehouse/export',
        '/warehouse/transfer',
        '/warehouse/material-return',
        '/warehouse/defects',
        '/warehouse/reports',
        '/stocktake/list',
        '/stocktake/settings',
        '/warehouse/settings',
        '/warehouse/settings/material-categories',
        '/warehouse/settings/material-units',
        '/warehouse/settings/material-origins',
      ];

      for (const route of wmsRoutes) {
        expect(canAccessRoute(BOD_PERMISSIONS, route), `BOD should access ${route}`).toBe(true);
      }
    });

    it('grants full access to all Purchasing & Supplier routes', () => {
      const purRoutes = [
        '/purchasing',
        '/purchasing/dashboard',
        '/purchasing/plans',
        '/purchasing/plans/KHMH-001',
        '/purchasing/adhoc',
        '/purchasing/orders',
        '/purchasing/contracts',
        '/purchasing/documents',
        '/purchasing/payments',
        '/purchasing/payment-plans',
        '/purchasing/estimate-procurement',
        '/purchasing/price-book',
        '/purchasing/price-history',
        '/purchasing/warranties',
        '/suppliers/list',
        '/suppliers/dashboard',
        '/purchasing/suppliers',
      ];

      for (const route of purRoutes) {
        expect(canAccessRoute(BOD_PERMISSIONS, route), `BOD should access ${route}`).toBe(true);
      }
    });

    it('grants access to Operations & Executive Center routes', () => {
      const opsRoutes = [
        '/dashboard',
        '/operations',
        '/operations/dashboard',
        '/operations/projects',
        '/operations/project-list',
        '/operations/materials',
        '/operations/services',
        '/operations/executive-360',
        '/operations/price-book',
      ];

      for (const route of opsRoutes) {
        expect(canAccessRoute(BOD_PERMISSIONS, route), `BOD should access ${route}`).toBe(true);
      }
    });

    it('grants access to Members viewing', () => {
      expect(canAccessRoute(BOD_PERMISSIONS, '/members/list')).toBe(true);
      expect(canAccessRoute(BOD_PERMISSIONS, '/members/emp-001')).toBe(true);
    });

    it('strictly isolates Admin IT configuration routes from BOD', () => {
      expect(canAccessRoute(BOD_PERMISSIONS, '/admin/users')).toBe(false);
      expect(canAccessRoute(BOD_PERMISSIONS, '/admin/settings')).toBe(false);
      expect(canAccessRoute(BOD_PERMISSIONS, '/admin/settings/roles/BOD/permissions')).toBe(false);
      expect(canAccessRoute(BOD_PERMISSIONS, '/members/new')).toBe(false);
    });

    it('allows BOD to view unit prices and stock value in WMS', () => {
      expect(canViewWmsPrices(BOD_PERMISSIONS, 'bod')).toBe(true);
      expect(canViewWmsPrices(BOD_PERMISSIONS, 'BOD')).toBe(true);
    });

    it('has executive level approvals and reject rights', () => {
      expect(hasPermission(BOD_PERMISSIONS, 'purchasing.plans.approve_l2')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'purchasing.plans.reject')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'purchasing.estimates.approve_l2')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'wms.suppliers.approve')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'purchasing.orders.approve')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'purchasing.payments.pay')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'hrm.leaves.approve')).toBe(true);
      expect(hasPermission(BOD_PERMISSIONS, 'wms.transactions.approve')).toBe(true);
    });

    it('returns /operations/dashboard as fallback route for BOD', () => {
      expect(getFallbackRoute(BOD_PERMISSIONS)).toBe('/operations/dashboard');
    });

    it('can access all executive menu items in sidebar', () => {
      const exec360 = executiveMenu.find(m => m.id === 'exec-360')!;
      const execPriceBook = executiveMenu.find(m => m.id === 'exec-price-book')!;

      expect(isNavItemAccessible(BOD_PERMISSIONS, exec360)).toBe(true);
      expect(isNavItemAccessible(BOD_PERMISSIONS, execPriceBook)).toBe(true);
    });

    it('locks Admin module group and unlocks operational module groups in sidebar', () => {
      const isModuleLocked = (perms: readonly string[], item: typeof unifiedSidebarMenu[0]) => {
        if (item.children && item.children.length > 0) {
          return !item.children.some(c => isNavItemAccessible(perms, c));
        }
        return !isNavItemAccessible(perms, item);
      };

      const execMod = unifiedSidebarMenu.find(m => m.id === 'mod-executive')!;
      const opsMod = unifiedSidebarMenu.find(m => m.id === 'mod-operations')!;
      const purMod = unifiedSidebarMenu.find(m => m.id === 'mod-purchasing')!;
      const whMod = unifiedSidebarMenu.find(m => m.id === 'mod-warehouse')!;
      const adminMod = unifiedSidebarMenu.find(m => m.id === 'mod-admin')!;

      // BOD: operational unlocked, admin locked
      expect(isModuleLocked(BOD_PERMISSIONS, execMod)).toBe(false);
      expect(isModuleLocked(BOD_PERMISSIONS, opsMod)).toBe(false);
      expect(isModuleLocked(BOD_PERMISSIONS, purMod)).toBe(false);
      expect(isModuleLocked(BOD_PERMISSIONS, whMod)).toBe(false);
      expect(isModuleLocked(BOD_PERMISSIONS, adminMod)).toBe(true);

      // Department_Manager: operational unlocked, admin locked
      expect(isModuleLocked(DEPARTMENT_MANAGER_PERMISSIONS, execMod)).toBe(false);
      expect(isModuleLocked(DEPARTMENT_MANAGER_PERMISSIONS, opsMod)).toBe(false);
      expect(isModuleLocked(DEPARTMENT_MANAGER_PERMISSIONS, purMod)).toBe(false);
      expect(isModuleLocked(DEPARTMENT_MANAGER_PERMISSIONS, whMod)).toBe(false);
      expect(isModuleLocked(DEPARTMENT_MANAGER_PERMISSIONS, adminMod)).toBe(true);
    });
  });

  describe('Department_Manager (Trưởng phòng)', () => {
    it('grants access to WMS tracking routes', () => {
      const wmsRoutes = [
        '/warehouse/dashboard-warehouse',
        '/warehouse/projects',
        '/warehouse/materials',
        '/warehouse/stock',
        '/warehouse/arrival-plans',
        '/warehouse/import',
        '/warehouse/export',
        '/warehouse/transfer',
        '/warehouse/reports',
      ];

      for (const route of wmsRoutes) {
        expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, route), `Dept Manager should access ${route}`).toBe(true);
      }
    });

    it('grants access to Purchasing tracking routes', () => {
      const purRoutes = [
        '/purchasing',
        '/purchasing/dashboard',
        '/purchasing/plans',
        '/purchasing/adhoc',
        '/purchasing/orders',
        '/purchasing/contracts',
        '/purchasing/documents',
        '/purchasing/payments',
        '/purchasing/payment-plans',
        '/purchasing/estimate-procurement',
        '/purchasing/warranties',
        '/suppliers/list',
      ];

      for (const route of purRoutes) {
        expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, route), `Dept Manager should access ${route}`).toBe(true);
      }
    });

    it('grants access to Operations & 360 overview routes', () => {
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/dashboard')).toBe(true);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/projects')).toBe(true);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/materials')).toBe(true);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/services')).toBe(true);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/executive-360')).toBe(true);
    });

    it('grants access to Members viewing', () => {
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/members/list')).toBe(true);
    });

    it('denies access to sensitive tender price book', () => {
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/purchasing/price-book')).toBe(false);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/operations/price-book')).toBe(false);
    });

    it('denies access to Admin IT configuration routes', () => {
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/admin/users')).toBe(false);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/admin/settings')).toBe(false);
      expect(canAccessRoute(DEPARTMENT_MANAGER_PERMISSIONS, '/members/new')).toBe(false);
    });

    it('denies WMS price visibility by default without explicit wms.prices.view', () => {
      expect(canViewWmsPrices(DEPARTMENT_MANAGER_PERMISSIONS, 'department_manager')).toBe(false);
    });

    it('has Level 1 approvals and reject rights', () => {
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.plans.approve_l1')).toBe(true);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.plans.reject')).toBe(true);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.estimates.approve_l1')).toBe(true);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'hrm.leaves.approve')).toBe(true);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'wms.projects.create')).toBe(true);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'wms.projects.update')).toBe(true);

      // Should not have Level 2 approvals or payment execution
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.plans.approve_l2')).toBe(false);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.estimates.approve_l2')).toBe(false);
      expect(hasPermission(DEPARTMENT_MANAGER_PERMISSIONS, 'purchasing.payments.pay')).toBe(false);
    });

    it('returns /operations/dashboard as fallback route for Department_Manager', () => {
      expect(getFallbackRoute(DEPARTMENT_MANAGER_PERMISSIONS)).toBe('/operations/dashboard');
    });

    it('can access executive 360 but not price book in executive menu', () => {
      const exec360 = executiveMenu.find(m => m.id === 'exec-360')!;
      const execPriceBook = executiveMenu.find(m => m.id === 'exec-price-book')!;

      expect(isNavItemAccessible(DEPARTMENT_MANAGER_PERMISSIONS, exec360)).toBe(true);
      expect(isNavItemAccessible(DEPARTMENT_MANAGER_PERMISSIONS, execPriceBook)).toBe(false);
    });

    it('cannot access admin menu in sidebar', () => {
      const adminUsers = adminMenu.find(m => m.id === 'admin-users')!;
      const adminSettings = adminMenu.find(m => m.id === 'admin-settings')!;

      expect(isNavItemAccessible(DEPARTMENT_MANAGER_PERMISSIONS, adminUsers)).toBe(false);
      expect(isNavItemAccessible(DEPARTMENT_MANAGER_PERMISSIONS, adminSettings)).toBe(false);
      expect(isNavItemAccessible(BOD_PERMISSIONS, adminUsers)).toBe(false);
      expect(isNavItemAccessible(BOD_PERMISSIONS, adminSettings)).toBe(false);
    });
  });
});
