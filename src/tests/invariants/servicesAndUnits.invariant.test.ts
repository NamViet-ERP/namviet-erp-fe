import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteAccess, getRequiredPermissionsForPath } from '../../lib/routePermissions';
import { hasAnyPermission } from '../../lib/permissions';
import { operationsMenu } from '../../constants/sidebarMenus';
import { materialUnitsService } from '../../services/materialUnitsService';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('Living Invariants: Services and Material Units Excel Import', () => {
  describe('Invariant 1: /operations/services Route & Permission Access', () => {
    it('allows access to /operations/services and subpaths for EPC Project, Purchasing and Admin roles', () => {
      expect(getRequiredPermissionsForPath('/operations/services')).toEqual([
        'wms.projects.view:all',
        'wms.materials.view:all',
        'purchasing.plans.view',
        'admin.roles.view:all',
      ]);

      const paths = [
        '/operations/services',
        '/operations/services/',
        '/operations/services?search=thiet-bi',
      ];

      for (const p of paths) {
        const access = getRouteAccess(p);
        expect(access.kind).toBe('permissions');
        if (access.kind === 'permissions') {
          // Users with only wms.projects.view:all can access
          expect(hasAnyPermission(['wms.projects.view:all'], access.permissions)).toBe(true);

          // Users with purchasing.plans.view can access
          expect(hasAnyPermission(['purchasing.plans.view'], access.permissions)).toBe(true);

          // Users with wms.materials.view:all can access
          expect(hasAnyPermission(['wms.materials.view:all'], access.permissions)).toBe(true);

          // Users with admin.roles.view:all can access
          expect(hasAnyPermission(['admin.roles.view:all'], access.permissions)).toBe(true);
        }
      }
    });

    it('operationsMenu includes ops-services with proper permissions', () => {
      const serviceItem = operationsMenu.find(item => item.id === 'ops-services');
      expect(serviceItem).toBeDefined();
      expect(serviceItem?.path).toBe('/operations/services');
      expect(serviceItem?.permission).toEqual([
        'wms.projects.view:all',
        'wms.materials.view:all',
        'purchasing.plans.view',
      ]);
    });
  });

  describe('Invariant 2: Physical On-Disk Code & UI Components', () => {
    it('ServicesExpensesPage contains Nhập Excel button and mounts ServiceExpenseImportModal', () => {
      const pagePath = path.resolve(currentDir, '../../pages/operations/ServicesExpensesPage.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      const content = fs.readFileSync(pagePath, 'utf-8');

      // Verify Nhập Excel button
      expect(content).toContain('Nhập Excel');
      expect(content).toMatch(/<Upload\s+size=\{16\}/);
      expect(content).toContain('setImportModalOpen(true)');

      // Verify modal mounting
      expect(content).toContain('<ServiceExpenseImportModal');
      expect(content).toContain('isOpen={importModalOpen}');
    });

    it('MaterialUnitsSettingsPanel contains Nhập Excel button and mounts MaterialUnitImportModal', () => {
      const panelPath = path.resolve(currentDir, '../../pages/warehouse/MaterialUnitsSettingsPanel.tsx');
      expect(fs.existsSync(panelPath)).toBe(true);
      const content = fs.readFileSync(panelPath, 'utf-8');

      // Verify Nhập Excel button in header and/or form
      expect(content).toContain('Nhập Excel');
      expect(content).toMatch(/<Upload\s+size=\{16\}/);
      expect(content).toContain('setImportModalOpen(true)');

      // Verify modal mounting
      expect(content).toContain('<MaterialUnitImportModal');
      expect(content).toContain('isOpen={importModalOpen}');
    });

    it('materialUnitsService exposes Excel import API endpoints', () => {
      expect(typeof materialUnitsService.downloadImportTemplate).toBe('function');
      expect(typeof materialUnitsService.parseImportFile).toBe('function');
      expect(typeof materialUnitsService.importBatch).toBe('function');
    });
  });
});
