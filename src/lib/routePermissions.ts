import type { PermissionKey } from './permissions';
import { CSKH_MODULE_ENABLED, CSKH_MODULE_LOCKED } from '../constants/cskh';

export interface RoutePermissionRule {
  match: (pathname: string) => boolean;
  /** Omit = any authenticated user (redirect aliases, home). */
  permissions?: PermissionKey[];
}

export type RouteAccess =
  | { kind: 'unknown' }
  | { kind: 'authenticated' }
  | { kind: 'permissions'; permissions: PermissionKey[] };

const WMS_PROJECTS: PermissionKey[] = ['wms.projects.view:all'];
const WMS_MATERIALS: PermissionKey[] = ['wms.materials.view:all'];
const WMS_CATEGORIES: PermissionKey[] = ['wms.categories.view:all'];
const WMS_UNITS: PermissionKey[] = ['wms.material_units.view:all'];
const WMS_ORIGINS: PermissionKey[] = ['wms.material_origins.view:all', 'wms.material_units.view:all', 'wms.categories.view:all'];
const SUPPLIERS: PermissionKey[] = ['purchasing.suppliers.view', 'wms.suppliers.view:all'];
const CSKH: PermissionKey[] = ['cskh.dashboard.view', 'wms.projects.view:all'];
const PUR_DASH: PermissionKey[] = ['purchasing.dashboard.view'];
const STOCKTAKE: PermissionKey[] = ['wms.stocktakes.view:all'];
const CANDIDATES: PermissionKey[] = ['hrm.candidates.view:all'];

export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { match: p => p === '/' },

  { match: p => p === '/dashboard' || p === '/warehouse/dashboard' || p === '/operations' || p === '/operations/dashboard', permissions: WMS_PROJECTS },
  { match: p => p === '/profile', permissions: ['core.profile.view'] },

  { match: p => p === '/warehouse/dashboard-warehouse', permissions: ['wms.dashboard.view'] },
  { match: p => p === '/warehouse/stock', permissions: ['wms.stock.view:all'] },
  { match: p => p === '/warehouse/arrival-plans', permissions: ['purchasing.arrival_plans.view'] },
  { match: p => p === '/warehouse/projects' || p === '/warehouse/list' || p === '/warehouse/locations' || p.startsWith('/warehouse/projects/'), permissions: WMS_PROJECTS },
  { match: p => p === '/warehouse/materials' || p === '/operations/materials', permissions: WMS_MATERIALS },
  { match: p => p === '/operations/projects' || p === '/operations/project-list' || p === '/operations/executive-360', permissions: WMS_PROJECTS },
  {
    match: p =>
      p === '/operations/settings'
      || p === '/operations/settings/material-categories'
      || p === '/warehouse/settings'
      || p === '/warehouse/settings/material-categories',
    permissions: WMS_CATEGORIES,
  },
  {
    match: p => p === '/operations/settings/material-units' || p === '/warehouse/settings/material-units',
    permissions: WMS_UNITS,
  },
  {
    match: p => p === '/operations/settings/material-origins' || p === '/warehouse/settings/material-origins',
    permissions: WMS_ORIGINS,
  },
  { match: p => p === '/warehouse/import', permissions: ['wms.imports.view:all'] },
  { match: p => p === '/warehouse/export', permissions: ['wms.exports.view:all'] },
  { match: p => p === '/warehouse/transfer', permissions: ['wms.transfers.view:all'] },
  { match: p => p === '/warehouse/material-return', permissions: ['wms.export_returns.view:all'] },
  { match: p => p === '/warehouse/defects', permissions: ['wms.defects.view:all'] },
  { match: p => p === '/warehouse/reports', permissions: ['wms.reports.view:all'] },

  { match: p => p === '/stocktake/list' || p === '/stocktake/settings', permissions: STOCKTAKE },

  { match: p => p === '/members/list', permissions: ['hrm.employees.view:all'] },
  { match: p => p === '/members/new', permissions: ['hrm.employees.create'] },
  { match: p => p === '/members/settings', permissions: ['hrm.members.settings.view', 'hrm.recruitment.positions.view'] },
  { match: p => p === '/members/settings/departments', permissions: ['hrm.members.settings.view'] },
  { match: p => p === '/members/settings/branches', permissions: ['hrm.members.settings.view'] },
  { match: p => p === '/members/settings/recruitment', permissions: ['hrm.recruitment.positions.view'] },
  {
    match: p => /^\/members\/[^/]+$/.test(p) && p !== '/members/new' && p !== '/members/settings' && p !== '/members/list' && p !== '/members/recruits',
    permissions: ['hrm.employees.view:all', 'hrm.employees.view:own'],
  },
  { match: p => p === '/members/recruits', permissions: CANDIDATES },
  { match: p => p === '/recruitment/dashboard', permissions: CANDIDATES },
  { match: p => p === '/recruitment/plans', permissions: ['hrm.recruitment.plans.view'] },
  { match: p => p === '/recruitment/costs', permissions: ['hrm.recruitment.costs.view'] },
  { match: p => p === '/recruitment/candidates' || p.startsWith('/recruitment/candidates/'), permissions: CANDIDATES },
  { match: p => p === '/recruitment/calendar', permissions: CANDIDATES },
  { match: p => p === '/recruitment/reports', permissions: ['hrm.recruitment.reports.view'] },
  { match: p => p === '/recruitment/hr-stats', permissions: ['hrm.candidates.view:all', 'hrm.employees.view:all'] },
  { match: p => p === '/recruitment/settings', permissions: ['hrm.recruitment.positions.view'] },

  { match: p => p === '/admin/users' || p.startsWith('/admin/users/'), permissions: ['admin.users.view:all'] },
  { match: p => p === '/admin/settings', permissions: ['admin.roles.view:all'] },
  {
    match: p => /^\/admin\/settings\/roles\/[^/]+\/permissions$/.test(p),
    permissions: ['admin.roles.view:all'],
  },

  {
    match: p =>
      p.startsWith('/suppliers')
      || p.startsWith('/purchasing/suppliers')
      || p === '/warehouse/suppliers'
      || p === '/warehouse/settings/suppliers',
    permissions: SUPPLIERS,
  },
  ...(CSKH_MODULE_ENABLED
    ? (CSKH_MODULE_LOCKED
        ? [{ match: (p: string) => p === '/cskh' || p.startsWith('/cskh/') }]
        : [{ match: (p: string) => p === '/cskh' || p.startsWith('/cskh/'), permissions: CSKH }])
    : [{ match: (p: string) => p === '/cskh' || p.startsWith('/cskh/') }]),
  { match: p => p === '/technical' || p.startsWith('/technical/') },

  { match: p => p === '/purchasing' || p === '/purchasing/dashboard' || p === '/purchasing/settings', permissions: PUR_DASH },
  { match: p => p === '/purchasing/plans' || p.startsWith('/purchasing/plans/'), permissions: ['purchasing.plans.view'] },
  { match: p => p === '/purchasing/adhoc' || p.startsWith('/purchasing/adhoc/'), permissions: ['purchasing.plans.view'] },
  { match: p => p === '/purchasing/orders', permissions: ['purchasing.orders.view'] },
  { match: p => p === '/purchasing/orders/new', permissions: ['purchasing.orders.create', 'purchasing.orders.view'] },
  {
    match: p => p.startsWith('/purchasing/orders/'),
    permissions: ['purchasing.orders.view'],
  },
  {
    match: p => p === '/purchasing/estimate-procurement',
    permissions: ['purchasing.estimates.view', 'purchasing.rfq.view'],
  },
  {
    match: p => p.startsWith('/purchasing/estimate-procurement/'),
    permissions: ['purchasing.estimates.view'],
  },
  { match: p => p === '/purchasing/price-book', permissions: ['purchasing.pricebook.view'] },
  { match: p => p === '/purchasing/contracts', permissions: ['purchasing.contracts.view'] },
  { match: p => p === '/purchasing/documents', permissions: ['purchasing.documents.view'] },
  { match: p => p === '/purchasing/warranties', permissions: ['purchasing.warranties.view'] },
  { match: p => p === '/purchasing/payment-plans', permissions: ['purchasing.payments.view'] },
  { match: p => p === '/purchasing/payments', permissions: ['purchasing.payments.view'] },
  { match: p => p === '/purchasing/payments/new', permissions: ['purchasing.payments.create', 'purchasing.payments.view'] },
  {
    match: p => p.startsWith('/purchasing/payments/'),
    permissions: ['purchasing.payments.view'],
  },
];

export function getRouteAccess(pathname: string): RouteAccess {
  const rule = ROUTE_PERMISSION_RULES.find(r => r.match(pathname));
  if (!rule) return { kind: 'unknown' };
  if (!rule.permissions?.length) return { kind: 'authenticated' };
  return { kind: 'permissions', permissions: rule.permissions };
}

/** `null` = unmatched (deny unknown). `[]` = any authenticated user. */
export function getRequiredPermissionsForPath(pathname: string): PermissionKey[] | null {
  const access = getRouteAccess(pathname);
  if (access.kind === 'unknown') return null;
  if (access.kind === 'authenticated') return [];
  return access.permissions;
}

export function getFallbackRoute(permissions: readonly PermissionKey[]): string {
  if (permissions.includes('wms.projects.view:all')) return '/operations/dashboard';
  if (CSKH_MODULE_ENABLED && !CSKH_MODULE_LOCKED && permissions.includes('cskh.dashboard.view')) return '/cskh';
  if (permissions.includes('wms.dashboard.view')) return '/warehouse/dashboard-warehouse';
  if (permissions.includes('purchasing.dashboard.view')) return '/purchasing/dashboard';
  if (permissions.includes('core.profile.view')) return '/profile';
  return '/login';
}
