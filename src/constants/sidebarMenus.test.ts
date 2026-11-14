import { describe, it, expect } from 'vitest';
import {
  operationsMenu,
  purchasingMenu,
  suppliersMenu,
  warehouseMenu,
  hrmMenu,
  unifiedSidebarMenu,
  stocktakeMenu,
  HRM_MODULE_ENABLED,
} from './sidebarMenus';

describe('sidebarMenus navigation structure', () => {
  it('operationsMenu follows the EPC value chain ordering', () => {
    const ids = operationsMenu.map(item => item.id);
    expect(ids).toEqual([
      'ops-dashboard',
      'ops-project-list',
      'ops-projects',
      'ops-estimate-procurement',
      'ops-materials',
      'ops-settings',
    ]);
  });

  it('purchasingMenu follows the procurement lifecycle ordering', () => {
    const ids = purchasingMenu.map(item => item.id);
    expect(ids).toEqual([
      'pur-dashboard',
      'pur-plan',
      'pur-adhoc',
      'pur-orders',
      'pur-contracts',
      'pur-documents',
      'pur-payment-plans',
      'pur-payments',
      'pur-price-history',
      'pur-warranties',
    ]);
  });

  it('suppliersMenu follows the SRM lifecycle ordering', () => {
    const ids = suppliersMenu.map(item => item.id);
    expect(ids).toEqual([
      'sup-dashboard',
      'sup-directory',
      'sup-groups',
      'sup-contacts',
      'sup-evaluate',
      'sup-debt',
      'sup-spend',
      'sup-blacklist',
    ]);
  });

  it('warehouseMenu integrates stocktake seamlessly in the physical flow', () => {
    const ids = warehouseMenu.map(item => item.id);
    expect(ids).toEqual([
      'dashboard',
      'projects',
      'stock',
      'arrival-plans',
      'import',
      'export',
      'transfer',
      'material-return',
      'stocktake',
      'defects',
      'reports',
    ]);
  });

  it('stocktakeMenu continues to be exported for compatibility', () => {
    expect(stocktakeMenu).toHaveLength(1);
    expect(stocktakeMenu[0].id).toBe('stocktake');
  });

  it('hrmMenu groups recruitment seamlessly before statistics and reports', () => {
    const ids = hrmMenu.map(item => item.id);
    expect(ids).toEqual([
      'recruitment-dashboard',
      'members-list',
      'recruitment-plans',
      'candidates-list',
      'recruitment-calendar',
      'recruitment-costs',
      'recruitment-hr-stats',
      'recruitment-reports',
      'members-settings',
    ]);
  });

  it('unifiedSidebarMenu maintains high-level module hierarchy', () => {
    const ids = unifiedSidebarMenu.map(item => item.id);
    const expected = [
      'mod-executive',
      'mod-operations',
      'mod-purchasing',
      'mod-suppliers',
      'mod-warehouse',
      'mod-cskh',
      ...(HRM_MODULE_ENABLED ? ['mod-hrm'] : []),
      'mod-admin',
    ];
    expect(ids).toEqual(expected);
  });

  it('unifiedSidebarMenu excludes mod-hrm when HRM_MODULE_ENABLED is false', () => {
    const ids = unifiedSidebarMenu.map(item => item.id);
    if (!HRM_MODULE_ENABLED) {
      expect(ids).not.toContain('mod-hrm');
    } else {
      expect(ids).toContain('mod-hrm');
    }
  });
});
