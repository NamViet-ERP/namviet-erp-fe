import type { PermissionCatalogEntryApiDto } from '../../services/rolePermissionsService';

export interface PermissionResourceGroup {
  resource: string;
  resourceLabel: string;
  entries: PermissionCatalogEntryApiDto[];
}

export interface PermissionModuleGroup {
  module: string;
  moduleLabel: string;
  resources: PermissionResourceGroup[];
}

export type ActionType =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'price'
  | 'lock'
  | 'other';

export interface ActionBadgeInfo {
  type: ActionType;
  label: string;
  tooltip: string;
  badgeClass: string;
  isSensitive: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  Core: 'Hệ thống',
  Admin: 'Quản trị',
  HRM: 'Nhân sự',
  WMS: 'Kho',
  Purchasing: 'Mua hàng',
};

const RESOURCE_LABELS: Record<string, string> = {
  // Common & Admin
  Dashboard: 'Tổng quan',
  Profile: 'Hồ sơ',
  Users: 'Người dùng',
  Roles: 'Vai trò',
  Settings: 'Thiết lập',

  // HRM
  Employees: 'Nhân viên',
  Attendance: 'Chấm công',
  Leaves: 'Nghỉ phép',
  Kpi: 'KPI',
  Candidates: 'Ứng viên',
  Recruitment: 'Tuyển dụng',
  Insurance: 'Bảo hiểm',
  Birthdays: 'Sinh nhật',

  // WMS
  Projects: 'Dự án & công trình',
  Stock: 'Tồn kho',
  Imports: 'Phiếu nhập',
  Exports: 'Phiếu xuất',
  Transfers: 'Chuyển kho',
  ExportReturns: 'Hoàn trả',
  Defects: 'Hàng lỗi',
  Conversions: 'Chuyển đổi',
  LendingLogs: 'Mượn kho trung tâm',
  Loans: 'Mượn kho dự án',
  Stocktakes: 'Kiểm kê',
  Transactions: 'Giao dịch',
  Materials: 'Vật tư',
  Categories: 'Nhóm vật tư',
  MaterialUnits: 'Đơn vị tính',
  MaterialOrigins: 'Xuất xứ',
  Suppliers: 'Nhà cung cấp',
  Warehouses: 'Danh sách kho',
  Prices: 'Đơn giá & giá trị tồn',
  Reports: 'Báo cáo',

  // Purchasing
  Plans: 'Kế hoạch mua',
  ArrivalPlans: 'Hàng về',
  Requests: 'Yêu cầu mua',
  Orders: 'Đơn mua hàng (PO)',
  Deliveries: 'Giao hàng',
  Estimates: 'Dự toán mua',
  Rfq: 'Chào thầu',
  PriceBook: 'Sổ giá & phân tích',
  Payments: 'Thanh toán',
  Contracts: 'Hợp đồng',
  Warranties: 'Bảo hành',
  Documents: 'Chứng từ',
};

export const RESOURCE_ORDER_MAP: Record<string, string[]> = {
  WMS: [
    'Projects',
    'Stock',
    'Imports',
    'Exports',
    'Transfers',
    'ExportReturns',
    'Defects',
    'Conversions',
    'LendingLogs',
    'Loans',
    'Stocktakes',
    'Transactions',
    'Materials',
    'Categories',
    'MaterialUnits',
    'MaterialOrigins',
    'Suppliers',
    'Warehouses',
    'Prices',
    'Reports',
    'Settings',
    'Dashboard',
  ],
  Purchasing: [
    'Plans',
    'ArrivalPlans',
    'Requests',
    'Orders',
    'Deliveries',
    'Estimates',
    'Rfq',
    'PriceBook',
    'Payments',
    'Contracts',
    'Warranties',
    'Documents',
    'Suppliers',
    'Settings',
    'Dashboard',
  ],
  HRM: [
    'Employees',
    'Attendance',
    'Leaves',
    'Kpi',
    'Candidates',
    'Recruitment',
    'Insurance',
    'Birthdays',
    'Settings',
  ],
  Admin: ['Users', 'Roles', 'Dashboard', 'Profile', 'Settings'],
  Core: ['Dashboard', 'Profile', 'Settings'],
};

const MODULE_ORDER = ['Core', 'Admin', 'HRM', 'WMS', 'Purchasing'];

const ACTION_ORDER: Record<ActionType, number> = {
  view: 1,
  create: 2,
  update: 3,
  approve: 4,
  export: 5,
  price: 6,
  lock: 7,
  delete: 8,
  other: 9,
};

export function getModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}

export function getResourceLabel(resource: string): string {
  const trimmed = resource.trim();
  if (!trimmed) return trimmed;
  if (RESOURCE_LABELS[trimmed]) return RESOURCE_LABELS[trimmed];
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed.charAt(0) + trimmed.slice(1).toLowerCase();
  }
  return trimmed;
}

export function getActionType(key: string): ActionType {
  const lower = key.toLowerCase();
  if (lower.includes('.prices.') || lower.includes('.pricebook.')) {
    return 'price';
  }
  if (lower.endsWith('.view') || lower.endsWith('.view:all') || lower.endsWith('.view:own')) {
    return 'view';
  }
  if (lower.endsWith('.create')) {
    return 'create';
  }
  if (lower.endsWith('.update')) {
    return 'update';
  }
  if (lower.endsWith('.delete')) {
    return 'delete';
  }
  if (
    lower.endsWith('.approve') ||
    lower.endsWith('.approve_l1') ||
    lower.endsWith('.approve_l2') ||
    lower.endsWith('.unapprove') ||
    lower.endsWith('.reject') ||
    lower.endsWith('.submit')
  ) {
    return 'approve';
  }
  if (lower.endsWith('.export') || lower.endsWith('.import')) {
    return 'export';
  }
  if (lower.endsWith('.lock')) {
    return 'lock';
  }
  return 'other';
}

export function getActionBadgeInfo(key: string, label?: string): ActionBadgeInfo {
  const type = getActionType(key);
  const isSensitive = key === 'wms.prices.view' || key.includes('.prices.');

  switch (type) {
    case 'price':
      return {
        type,
        label: 'GIÁ',
        tooltip: isSensitive
          ? 'Quyền nhạy cảm: Cho phép xem đơn giá và giá trị tồn'
          : 'Quyền liên quan đến giá & phân tích',
        badgeClass: 'admin-perm-badge admin-perm-badge--price',
        isSensitive,
      };
    case 'view':
      return {
        type,
        label: 'XEM',
        tooltip: 'Quyền xem dữ liệu',
        badgeClass: 'admin-perm-badge admin-perm-badge--view',
        isSensitive: false,
      };
    case 'create':
      return {
        type,
        label: 'TẠO',
        tooltip: 'Quyền tạo mới',
        badgeClass: 'admin-perm-badge admin-perm-badge--create',
        isSensitive: false,
      };
    case 'update':
      return {
        type,
        label: 'SỬA',
        tooltip: 'Quyền chỉnh sửa',
        badgeClass: 'admin-perm-badge admin-perm-badge--update',
        isSensitive: false,
      };
    case 'delete':
      return {
        type,
        label: 'XÓA',
        tooltip: 'Quyền xóa dữ liệu',
        badgeClass: 'admin-perm-badge admin-perm-badge--delete',
        isSensitive: false,
      };
    case 'approve':
      return {
        type,
        label: 'DUYỆT',
        tooltip: 'Quyền phê duyệt / thẩm định',
        badgeClass: 'admin-perm-badge admin-perm-badge--approve',
        isSensitive: false,
      };
    case 'export':
      return {
        type,
        label: key.endsWith('.import') ? 'NHẬP' : 'XUẤT',
        tooltip: key.endsWith('.import') ? 'Quyền nhập file dữ liệu' : 'Quyền xuất file / báo cáo',
        badgeClass: 'admin-perm-badge admin-perm-badge--export',
        isSensitive: false,
      };
    case 'lock':
      return {
        type,
        label: 'KHÓA',
        tooltip: 'Quyền khóa / mở khóa tài khoản',
        badgeClass: 'admin-perm-badge admin-perm-badge--lock',
        isSensitive: false,
      };
    default:
      return {
        type,
        label: 'KHÁC',
        tooltip: label || 'Thao tác khác',
        badgeClass: 'admin-perm-badge admin-perm-badge--other',
        isSensitive: false,
      };
  }
}

export function sortEntriesByAction(
  entries: PermissionCatalogEntryApiDto[],
): PermissionCatalogEntryApiDto[] {
  return [...entries].sort((a, b) => {
    const typeA = getActionType(a.key);
    const typeB = getActionType(b.key);
    const orderA = ACTION_ORDER[typeA] ?? 99;
    const orderB = ACTION_ORDER[typeB] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.key.localeCompare(b.key);
  });
}

export function groupPermissionCatalog(
  catalog: PermissionCatalogEntryApiDto[],
): PermissionModuleGroup[] {
  const byModule = new Map<string, Map<string, PermissionCatalogEntryApiDto[]>>();

  for (const entry of catalog) {
    if (!byModule.has(entry.module)) byModule.set(entry.module, new Map());
    const byResource = byModule.get(entry.module)!;
    if (!byResource.has(entry.resource)) byResource.set(entry.resource, []);
    byResource.get(entry.resource)!.push(entry);
  }

  return [...byModule.entries()]
    .sort(([a], [b]) => {
      const ai = MODULE_ORDER.indexOf(a);
      const bi = MODULE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([module, resourcesMap]) => {
      const resourceOrder = RESOURCE_ORDER_MAP[module];
      return {
        module,
        moduleLabel: getModuleLabel(module),
        resources: [...resourcesMap.entries()]
          .sort(([a], [b]) => {
            if (resourceOrder) {
              const ai = resourceOrder.indexOf(a);
              const bi = resourceOrder.indexOf(b);
              if (ai !== -1 && bi !== -1) return ai - bi;
              if (ai !== -1) return -1;
              if (bi !== -1) return 1;
            }
            return a.localeCompare(b);
          })
          .map(([resource, entries]) => ({
            resource,
            resourceLabel: getResourceLabel(resource),
            entries: sortEntriesByAction(entries),
          })),
      };
    });
}

export interface FilterPermissionOptions {
  search?: string;
  status?: 'all' | 'granted' | 'ungranted';
  selectedKeys?: Set<string>;
  actionFilter?: 'all' | 'view' | 'create_update' | 'approve' | 'price_report';
}

export function filterPermissionGroups(
  groups: PermissionModuleGroup[],
  searchOrOptions: string | FilterPermissionOptions,
): PermissionModuleGroup[] {
  const options: FilterPermissionOptions =
    typeof searchOrOptions === 'string'
      ? { search: searchOrOptions, status: 'all', actionFilter: 'all' }
      : {
          search: searchOrOptions.search ?? '',
          status: searchOrOptions.status ?? 'all',
          selectedKeys: searchOrOptions.selectedKeys,
          actionFilter: searchOrOptions.actionFilter ?? 'all',
        };

  const term = options.search?.trim().toLowerCase() ?? '';
  const status = options.status ?? 'all';
  const selectedKeys = options.selectedKeys;
  const actionFilter = options.actionFilter ?? 'all';

  const hasSearch = term.length > 0;
  const hasStatusFilter = status !== 'all' && selectedKeys !== undefined;
  const hasActionFilter = actionFilter !== 'all';

  if (!hasSearch && !hasStatusFilter && !hasActionFilter) {
    return groups;
  }

  const matchesStatus = (key: string) => {
    if (!hasStatusFilter || !selectedKeys) return true;
    const isGranted = selectedKeys.has(key);
    return status === 'granted' ? isGranted : !isGranted;
  };

  const matchesAction = (key: string, resource: string) => {
    if (!hasActionFilter) return true;
    const type = getActionType(key);
    if (actionFilter === 'view') return type === 'view';
    if (actionFilter === 'create_update') return type === 'create' || type === 'update';
    if (actionFilter === 'approve') return type === 'approve';
    if (actionFilter === 'price_report') {
      return (
        type === 'price' ||
        resource === 'Reports' ||
        resource === 'Prices' ||
        resource === 'PriceBook' ||
        key.includes('.reports.') ||
        key.includes('.prices.') ||
        key.includes('.pricebook.')
      );
    }
    return true;
  };

  const matchesSearch = (entry: PermissionCatalogEntryApiDto, resourceLabel: string) => {
    if (!hasSearch) return true;
    return (
      entry.key.toLowerCase().includes(term) ||
      entry.label.toLowerCase().includes(term) ||
      entry.resource.toLowerCase().includes(term) ||
      resourceLabel.toLowerCase().includes(term)
    );
  };

  return groups
    .map(group => {
      const moduleMatchesSearch =
        hasSearch &&
        (group.module.toLowerCase().includes(term) ||
          group.moduleLabel.toLowerCase().includes(term));

      return {
        ...group,
        resources: group.resources
          .map(resource => ({
            ...resource,
            entries: resource.entries.filter(entry => {
              if (!matchesStatus(entry.key)) return false;
              if (!matchesAction(entry.key, resource.resource)) return false;
              if (moduleMatchesSearch) return true;
              return matchesSearch(entry, resource.resourceLabel);
            }),
          }))
          .filter(resource => resource.entries.length > 0),
      };
    })
    .filter(group => group.resources.length > 0);
}
