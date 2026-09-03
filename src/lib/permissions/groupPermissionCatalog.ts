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

const MODULE_LABELS: Record<string, string> = {
  Core: 'Hệ thống',
  Admin: 'Quản trị',
  HRM: 'Nhân sự',
  WMS: 'Kho',
  Purchasing: 'Mua hàng',
};

const RESOURCE_LABELS: Record<string, string> = {
  Dashboard: 'Tổng quan',
  Profile: 'Hồ sơ',
  Users: 'Người dùng',
  Roles: 'Vai trò',
  Employees: 'Nhân viên',
  Settings: 'Thiết lập',
  Candidates: 'Ứng viên',
  Recruitment: 'Tuyển dụng',
  Birthdays: 'Sinh nhật',
  Insurance: 'Bảo hiểm',
  Leaves: 'Nghỉ phép',
  Attendance: 'Chấm công',
  Kpi: 'KPI',
  Stock: 'Tồn kho',
  Projects: 'Dự án',
  Materials: 'Vật tư',
  Imports: 'Phiếu nhập',
  Exports: 'Phiếu xuất',
  Transfers: 'Chuyển kho',
  ExportReturns: 'Hoàn trả',
  Defects: 'Hàng lỗi',
  Stocktakes: 'Kiểm kê',
  Suppliers: 'Nhà cung cấp',
  Categories: 'Nhóm vật tư',
  MaterialUnits: 'Đơn vị tính',
  Reports: 'Báo cáo',
  Transactions: 'Giao dịch',
  Prices: 'Đơn giá',
  Warehouses: 'Danh sách kho',
  Conversions: 'Chuyển đổi',
  LendingLogs: 'Mượn vật tư',
  Loans: 'Mượn vật tư (dự án)',
  Plans: 'Kế hoạch mua',
  ArrivalPlans: 'Hàng về',
  Requests: 'Yêu cầu mua',
  Orders: 'Đơn mua',
  Deliveries: 'Giao hàng',
  Payments: 'Thanh toán',
  Documents: 'Chứng từ',
  Contracts: 'Hợp đồng',
  Warranties: 'Bảo hành',
  Estimates: 'Dự toán',
  Rfq: 'Chào thầu',
  PriceBook: 'Sổ giá',
};

const MODULE_ORDER = ['Core', 'Admin', 'HRM', 'WMS', 'Purchasing'];

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
    .map(([module, resourcesMap]) => ({
      module,
      moduleLabel: getModuleLabel(module),
      resources: [...resourcesMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, entries]) => ({
          resource,
          resourceLabel: getResourceLabel(resource),
          entries: [...entries].sort((a, b) => a.key.localeCompare(b.key)),
        })),
    }));
}

export function filterPermissionGroups(
  groups: PermissionModuleGroup[],
  search: string,
): PermissionModuleGroup[] {
  const term = search.trim().toLowerCase();
  if (!term) return groups;

  return groups
    .map(group => {
      if (
        group.module.toLowerCase().includes(term)
        || group.moduleLabel.toLowerCase().includes(term)
      ) {
        return group;
      }

      return {
        ...group,
        resources: group.resources
          .map(resource => ({
            ...resource,
            entries: resource.entries.filter(entry =>
              entry.key.toLowerCase().includes(term)
              || entry.label.toLowerCase().includes(term)
              || entry.resource.toLowerCase().includes(term)
              || resource.resourceLabel.toLowerCase().includes(term),
            ),
          }))
          .filter(resource => resource.entries.length > 0),
      };
    })
    .filter(group => group.resources.length > 0);
}
