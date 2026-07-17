import type { PermissionKey } from './permissions';

export interface RoutePermissionRule {
  match: (pathname: string) => boolean;
  permissions: PermissionKey[];
}

export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { match: p => p === '/dashboard', permissions: ['core.dashboard.view'] },
  { match: p => p === '/warehouse/dashboard', permissions: ['core.dashboard.view'] },
  { match: p => p === '/profile', permissions: ['core.profile.view'] },

  { match: p => p === '/warehouse/dashboard-warehouse', permissions: ['wms.dashboard.view'] },
  { match: p => p === '/warehouse/stock', permissions: ['wms.stock.view:all'] },
  { match: p => p === '/warehouse/projects', permissions: ['wms.projects.view:all'] },
  { match: p => p.startsWith('/warehouse/projects/'), permissions: ['wms.projects.view:all'] },
  { match: p => p === '/warehouse/materials', permissions: ['wms.materials.view:all'] },
  { match: p => p === '/warehouse/import', permissions: ['wms.imports.view:all'] },
  { match: p => p === '/warehouse/export', permissions: ['wms.exports.view:all'] },
  { match: p => p === '/warehouse/transfer', permissions: ['wms.transfers.view:all'] },
  { match: p => p === '/warehouse/material-return', permissions: ['wms.export_returns.view:all'] },
  {
    match: p => p === '/warehouse/settings/material-categories',
    permissions: ['wms.categories.view:all'],
  },
  {
    match: p => p === '/warehouse/settings/material-units',
    permissions: ['wms.material_units.view:all'],
  },
  {
    match: p => p === '/warehouse/settings/suppliers',
    permissions: ['wms.suppliers.view:all'],
  },
  {
    match: p => p === '/warehouse/settings/price-books',
    permissions: ['wms.price_books.view:all'],
  },
  { match: p => p === '/warehouse/reports', permissions: ['wms.reports.view:all'] },

  { match: p => p === '/stocktake/list', permissions: ['wms.stocktakes.view:all'] },
  { match: p => p === '/stocktake/settings', permissions: ['wms.stocktakes.settings.view'] },

  { match: p => p === '/members/list', permissions: ['hrm.employees.view:all'] },
  { match: p => p === '/members/new', permissions: ['hrm.employees.create'] },
  { match: p => p === '/members/settings', permissions: ['hrm.members.settings.view'] },
  {
    match: p => /^\/members\/[^/]+$/.test(p) && p !== '/members/new' && p !== '/members/settings',
    permissions: ['hrm.employees.view:all', 'hrm.employees.view:own'],
  },
  { match: p => p === '/recruitment/dashboard', permissions: ['hrm.candidates.view:all'] },
  { match: p => p === '/recruitment/plans', permissions: ['hrm.recruitment.plans.view'] },
  { match: p => p === '/recruitment/costs', permissions: ['hrm.recruitment.costs.view'] },
  { match: p => p === '/recruitment/candidates', permissions: ['hrm.candidates.view:all'] },
  {
    match: p => p.startsWith('/recruitment/candidates/'),
    permissions: ['hrm.candidates.view:all'],
  },
  { match: p => p === '/recruitment/calendar', permissions: ['hrm.candidates.view:all'] },
  { match: p => p === '/recruitment/reports', permissions: ['hrm.recruitment.reports.view'] },
  { match: p => p === '/recruitment/hr-stats', permissions: ['hrm.candidates.view:all', 'hrm.employees.view:all'] },
  { match: p => p === '/recruitment/settings', permissions: ['hrm.recruitment.positions.view'] },

  { match: p => p === '/admin/users', permissions: ['admin.users.view:all'] },
  {
    match: p => p.startsWith('/admin/users/'),
    permissions: ['admin.users.view:all'],
  },
  { match: p => p === '/admin/settings', permissions: ['admin.roles.view:all'] },
  {
    match: p => /^\/admin\/settings\/roles\/[^/]+\/permissions$/.test(p),
    permissions: ['admin.roles.view:all'],
  },
];

export function getRequiredPermissionsForPath(pathname: string): PermissionKey[] | null {
  const rule = ROUTE_PERMISSION_RULES.find(r => r.match(pathname));
  return rule?.permissions ?? null;
}

export function getFallbackRoute(permissions: readonly PermissionKey[]): string {
  if (permissions.includes('core.dashboard.view')) return '/dashboard';
  if (permissions.includes('wms.dashboard.view')) return '/warehouse/dashboard-warehouse';
  if (permissions.includes('core.profile.view')) return '/profile';
  return '/login';
}
