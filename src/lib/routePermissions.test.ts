import { describe, expect, it } from 'vitest';
import {
  getFallbackRoute,
  getRequiredPermissionsForPath,
  getRouteAccess,
} from './routePermissions';

describe('routePermissions', () => {
  describe('getRouteAccess', () => {
    it('returns required permissions for /operations/services and subpaths', () => {
      const expectedPermissions = [
        'wms.projects.view:all',
        'wms.materials.view:all',
        'purchasing.plans.view',
        'admin.roles.view:all',
      ];
      expect(getRouteAccess('/operations/services')).toEqual({
        kind: 'permissions',
        permissions: expectedPermissions,
      });
      expect(getRouteAccess('/operations/services/')).toEqual({
        kind: 'permissions',
        permissions: expectedPermissions,
      });
      expect(getRouteAccess('/operations/services?search=test')).toEqual({
        kind: 'permissions',
        permissions: expectedPermissions,
      });
    });

    it('returns correct permissions for basic operations routes', () => {
      expect(getRouteAccess('/operations/materials')).toEqual({
        kind: 'permissions',
        permissions: ['wms.materials.view:all'],
      });

      expect(getRouteAccess('/operations/dashboard')).toEqual({
        kind: 'permissions',
        permissions: ['wms.projects.view:all'],
      });
    });

    it('returns authenticated kind for root path', () => {
      expect(getRouteAccess('/')).toEqual({ kind: 'authenticated' });
    });

    it('returns unknown kind for unregistered routes', () => {
      expect(getRouteAccess('/unknown/route')).toEqual({ kind: 'unknown' });
      expect(getRouteAccess('/operations/non-existent-subpath')).toEqual({ kind: 'unknown' });
    });
  });

  describe('getRequiredPermissionsForPath', () => {
    it('returns permission array for /operations/services', () => {
      expect(getRequiredPermissionsForPath('/operations/services')).toEqual([
        'wms.projects.view:all',
        'wms.materials.view:all',
        'purchasing.plans.view',
        'admin.roles.view:all',
      ]);
    });

    it('returns empty array for authenticated-only routes', () => {
      expect(getRequiredPermissionsForPath('/')).toEqual([]);
    });

    it('returns null for unknown routes', () => {
      expect(getRequiredPermissionsForPath('/unknown/route')).toBeNull();
    });
  });

  describe('getFallbackRoute', () => {
    it('returns /operations/dashboard when user has wms.projects.view:all', () => {
      expect(getFallbackRoute(['wms.projects.view:all'])).toBe('/operations/dashboard');
    });

    it('returns /warehouse/dashboard-warehouse when user only has wms.dashboard.view', () => {
      expect(getFallbackRoute(['wms.dashboard.view'])).toBe('/warehouse/dashboard-warehouse');
    });

    it('returns /purchasing/dashboard when user only has purchasing.dashboard.view', () => {
      expect(getFallbackRoute(['purchasing.dashboard.view'])).toBe('/purchasing/dashboard');
    });

    it('returns /profile when user only has core.profile.view', () => {
      expect(getFallbackRoute(['core.profile.view'])).toBe('/profile');
    });

    it('returns /login when no permissions match', () => {
      expect(getFallbackRoute([])).toBe('/login');
    });

    it('returns /operations/dashboard for BOD and Department_Manager roles', () => {
      const bodPermissions = ['wms.projects.view:all', 'purchasing.plans.approve_l2', 'wms.prices.view'];
      const managerPermissions = ['wms.projects.view:all', 'purchasing.plans.approve_l1'];

      expect(getFallbackRoute(bodPermissions)).toBe('/operations/dashboard');
      expect(getFallbackRoute(managerPermissions)).toBe('/operations/dashboard');
    });
  });
});
