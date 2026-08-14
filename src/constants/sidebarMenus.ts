import type { SidebarChildItem, SidebarMenuItem } from '../types';
import {
  LayoutDashboard, Package,
  PackagePlus, PackageMinus, Settings,
  ClipboardCheck, Users, UserCheck, UserCog,
  Layers, FolderKanban, ArrowLeftRight, Building2, Ruler, BarChart3, RotateCcw, AlertTriangle,
  Target, CalendarDays, DollarSign, ShoppingCart, ShoppingBag, Star, Truck, WalletCards, Ban,
  History, PieChart, Activity, Warehouse, ShieldCheck, FolderOpen, ScrollText,
  Calculator, BookOpen,
} from 'lucide-react';

function toSidebarChildren(items: SidebarMenuItem[]): SidebarChildItem[] {
  return items.map(item => ({
    id: item.id,
    label: item.label,
    path: item.path,
    icon: item.icon,
    permission: item.permission,
  }));
}
/** Thứ tự theo luồng nghiệp vụ: kho dự án → tồn → nhập/xuất/chuyển → danh mục */
export const warehouseMenu: SidebarMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    path: '/warehouse/dashboard-warehouse',
    permission: 'wms.dashboard.view',
  },
  {
    id: 'projects',
    label: 'Kho dự án',
    icon: FolderKanban,
    path: '/warehouse/projects',
    permission: 'wms.projects.view:all',
  },
  {
    id: 'stock',
    label: 'Tồn kho',
    icon: Layers,
    path: '/warehouse/stock',
    permission: 'wms.stock.view:all',
  },
  {
    id: 'arrival-plans',
    label: 'Kế hoạch hàng về',
    icon: Truck,
    path: '/warehouse/arrival-plans',
    permission: 'purchasing.arrival_plans.view',
  },
  {
    id: 'import',
    label: 'Nhập kho',
    icon: PackagePlus,
    path: '/warehouse/import',
    permission: 'wms.imports.view:all',
  },
  {
    id: 'export',
    label: 'Xuất kho',
    icon: PackageMinus,
    path: '/warehouse/export',
    permission: 'wms.exports.view:all',
  },
  {
    id: 'transfer',
    label: 'Chuyển kho',
    icon: ArrowLeftRight,
    path: '/warehouse/transfer',
    permission: 'wms.transfers.view:all',
  },
  {
    id: 'material-return',
    label: 'Hoàn trả vật tư',
    icon: RotateCcw,
    path: '/warehouse/material-return',
    permission: 'wms.export_returns.view:all',
  },
  {
    id: 'defects',
    label: 'Hàng lỗi và Bảo hành',
    icon: AlertTriangle,
    path: '/warehouse/defects',
    permission: 'wms.defects.view:all',
  },
  {
    id: 'reports',
    label: 'Báo cáo kho',
    icon: BarChart3,
    path: '/warehouse/reports',
    permission: 'wms.reports.view:all',
  },
];

/** Sidebar khi đang trong Thiết lập Vận hành (cây VT / ĐVT) */
export const operationsSettingsMenu: SidebarMenuItem[] = [
  {
    id: 'ops-settings-categories',
    label: 'Cây vật tư',
    icon: Package,
    path: '/operations/settings/material-categories',
    permission: 'wms.categories.view:all',
  },
  {
    id: 'ops-settings-units',
    label: 'Đơn vị tính',
    icon: Ruler,
    path: '/operations/settings/material-units',
    permission: 'wms.material_units.view:all',
  },
];

/** @deprecated Alias — dùng operationsSettingsMenu */
export const warehouseSettingsMenu = operationsSettingsMenu;

export const stocktakeMenu: SidebarMenuItem[] = [
  {
    id: 'stocktake',
    label: 'Kiểm kê kho',
    icon: ClipboardCheck,
    path: '/stocktake/list',
    permission: 'wms.stocktakes.view:all',
  },
];
export const recruitmentMenu: SidebarMenuItem[] = [
  {
    id: 'recruitment-dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    path: '/recruitment/dashboard',
    permission: 'hrm.candidates.view:all',
  },
  {
    id: 'recruitment-plans',
    label: 'Kế hoạch & Tiến độ',
    icon: Target,
    path: '/recruitment/plans',
    permission: 'hrm.recruitment.plans.view',
  },
  {
    id: 'recruitment-costs',
    label: 'Chi phí',
    icon: DollarSign,
    path: '/recruitment/costs',
    permission: 'hrm.recruitment.costs.view',
  },
  {
    id: 'candidates-list',
    label: 'Quản lý ứng viên',
    icon: UserCheck,
    path: '/recruitment/candidates',
    permission: 'hrm.candidates.view:all',
  },
  {
    id: 'recruitment-calendar',
    label: 'Lịch PV',
    icon: CalendarDays,
    path: '/recruitment/calendar',
    permission: 'hrm.candidates.view:all',
  },
  {
    id: 'recruitment-reports',
    label: 'Báo cáo',
    icon: BarChart3,
    path: '/recruitment/reports',
    permission: 'hrm.recruitment.reports.view',
  },
  {
    id: 'recruitment-hr-stats',
    label: 'Thống kê nhân sự',
    icon: UserCog,
    path: '/recruitment/hr-stats',
    permission: 'hrm.candidates.view:all',
  },
  {
    id: 'recruitment-settings',
    label: 'Thiết lập tuyển dụng',
    icon: Settings,
    path: '/recruitment/settings',
    permission: 'hrm.recruitment.positions.view',
  },
];
export const membersMenu: SidebarMenuItem[] = [
  {
    id: 'members-list',
    label: 'Hồ sơ nhân sự',
    icon: Users,
    path: '/members/list',
    permission: 'hrm.employees.view:all',
  },
  {
    id: 'members-settings',
    label: 'Thiết lập nhân sự',
    icon: Settings,
    path: '/members/settings',
    permission: 'hrm.members.settings.view',
  },
];
export const adminMenu: SidebarMenuItem[] = [
  {
    id: 'admin-users',
    label: 'Quản lý người dùng',
    icon: UserCog,
    path: '/admin/users',
    permission: 'admin.users.view:all',
  },
  {
    id: 'admin-settings',
    label: 'Thiết lập',
    icon: Settings,
    path: '/admin/settings',
    permission: 'admin.roles.view:all',
  },
];
/** Kỹ thuật / CSKH — chưa ship API; giữ export rỗng để AppLayout không gãy. */
export const technicalMenu: SidebarMenuItem[] = [];
/** Mua hàng — Dashboard + KHMH + Đơn hàng (NCC nằm module Nhà cung cấp). */
export const purchasingMenu: SidebarMenuItem[] = [
  {
    id: 'pur-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/purchasing/dashboard',
    permission: 'purchasing.dashboard.view',
  },
  {
    id: 'pur-plan',
    label: 'Kế hoạch mua hàng',
    icon: Target,
    path: '/purchasing/plans',
    permission: 'purchasing.plans.view',
  },
  {
    id: 'pur-adhoc',
    label: 'Mua hàng phát sinh',
    icon: ShoppingBag,
    path: '/purchasing/adhoc',
    permission: 'purchasing.plans.view',
  },
  {
    id: 'pur-orders',
    label: 'Đơn hàng',
    icon: ShoppingCart,
    path: '/purchasing/orders',
    permission: 'purchasing.orders.view',
  },
  {
    id: 'pur-estimate-procurement',
    label: 'Mua hàng dự toán',
    icon: Calculator,
    path: '/purchasing/estimate-procurement',
    permission: ['purchasing.estimates.view', 'purchasing.rfq.view'],
  },
  {
    id: 'pur-price-book',
    label: 'Sổ giá',
    icon: BookOpen,
    path: '/purchasing/price-book',
    permission: 'purchasing.pricebook.view',
  },
  {
    id: 'pur-contracts',
    label: 'Hợp đồng',
    icon: ScrollText,
    path: '/purchasing/contracts',
    permission: 'purchasing.contracts.view',
  },
  {
    id: 'pur-documents',
    label: 'Hồ sơ mua hàng',
    icon: FolderOpen,
    path: '/purchasing/documents',
    permission: 'purchasing.documents.view',
  },
  {
    id: 'pur-warranties',
    label: 'Bảo hành / Khiếu nại',
    icon: ShieldCheck,
    path: '/purchasing/warranties',
    permission: 'purchasing.warranties.view',
  },
  {
    id: 'pur-payment-plans',
    label: 'Kế hoạch thanh toán',
    icon: WalletCards,
    path: '/purchasing/payment-plans',
    permission: 'purchasing.payments.view',
  },
  {
    id: 'pur-payments',
    label: 'Đề nghị thanh toán',
    icon: DollarSign,
    path: '/purchasing/payments',
    permission: 'purchasing.payments.view',
  },
];
/** Nhà cung cấp — menu giống ERP /admin/suppliers. */
export const suppliersMenu: SidebarMenuItem[] = [
  {
    id: 'sup-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/suppliers/dashboard',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-groups',
    label: 'Nhóm nhà cung cấp',
    icon: Layers,
    path: '/suppliers/groups',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-directory',
    label: 'Nhà cung cấp',
    icon: Building2,
    path: '/suppliers/list',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-contacts',
    label: 'Liên hệ NCC',
    icon: Users,
    path: '/suppliers/contacts',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-spend',
    label: 'Chi tiêu theo NCC',
    icon: PieChart,
    path: '/suppliers/spend',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-debt',
    label: 'Công nợ NCC',
    icon: WalletCards,
    path: '/suppliers/debt',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-price-history',
    label: 'Lịch sử giá',
    icon: History,
    path: '/suppliers/price-history',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-evaluate',
    label: 'Đánh giá NCC',
    icon: Star,
    path: '/suppliers/evaluations',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-blacklist',
    label: 'Danh sách blacklist',
    icon: Ban,
    path: '/suppliers/blacklist',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
];
/** Vận hành — Tổng quan, Dự án EPC, Danh mục vật tư, Thiết lập cây VT. */
export const operationsMenu: SidebarMenuItem[] = [
  {
    id: 'ops-dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    path: '/operations/dashboard',
    permission: 'wms.projects.view:all',
  },
  {
    id: 'ops-projects',
    label: 'Dự án',
    icon: FolderKanban,
    path: '/operations/projects',
    permission: 'wms.projects.view:all',
  },
  {
    id: 'ops-materials',
    label: 'Danh mục vật tư',
    icon: Package,
    path: '/operations/materials',
    permission: 'wms.materials.view:all',
  },
  {
    id: 'ops-settings',
    label: 'Thiết lập',
    icon: Settings,
    path: '/operations/settings',
    permission: [
      'wms.categories.view:all',
      'wms.material_units.view:all',
    ],
  },
];

/**
 * Sidebar thống nhất — mọi phân hệ dạng accordion (mục lớn → mục nhỏ).
 * Portal card `/dashboard` đã tắt; điều hướng chỉ qua menu này.
 */
export const unifiedSidebarMenu: SidebarMenuItem[] = [
  {
    id: 'mod-operations',
    label: 'Vận hành',
    icon: Activity,
    path: '/operations/dashboard',
    children: toSidebarChildren(operationsMenu),
  },
  {
    id: 'mod-purchasing',
    label: 'Mua hàng',
    icon: ShoppingCart,
    path: '/purchasing/dashboard',
    children: toSidebarChildren(purchasingMenu),
  },
  {
    id: 'mod-suppliers',
    label: 'Nhà cung cấp',
    icon: Building2,
    path: '/suppliers/dashboard',
    children: toSidebarChildren(suppliersMenu),
  },
  {
    id: 'mod-warehouse',
    label: 'Kho hàng',
    icon: Warehouse,
    path: '/warehouse/dashboard-warehouse',
    children: toSidebarChildren([...warehouseMenu, ...stocktakeMenu]),
  },
  {
    id: 'mod-hrm',
    label: 'HRM',
    icon: Users,
    path: '/members/list',
    children: toSidebarChildren([...membersMenu, ...recruitmentMenu]),
  },
  {
    id: 'mod-admin',
    label: 'Admin',
    icon: ShieldCheck,
    path: '/admin/users',
    children: toSidebarChildren(adminMenu),
  },
];
