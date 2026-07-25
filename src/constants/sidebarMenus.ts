import type { SidebarMenuItem } from '../types';

import {

  LayoutDashboard, Package,

  PackagePlus, PackageMinus, Settings,

  ClipboardCheck, Users, UserCheck, UserCog,

  Layers, FolderKanban, ArrowLeftRight, Building2, Ruler, BarChart3, RotateCcw, AlertTriangle,

  Target, CalendarDays, DollarSign, Headphones, ShoppingCart, ClipboardList, FileText, Cake,
  Star, Truck,

} from 'lucide-react';



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

    label: 'Hàng lỗi',

    icon: AlertTriangle,

    path: '/warehouse/defects',

    permission: 'wms.defects.view:all',

  },

  {

    id: 'materials',

    label: 'Danh mục vật tư',

    icon: Package,

    path: '/warehouse/materials',

    permission: 'wms.materials.view:all',

  },

  {

    id: 'reports',

    label: 'Báo cáo kho',

    icon: BarChart3,

    path: '/warehouse/reports',

    permission: 'wms.reports.view:all',

  },

  {

    id: 'settings',

    label: 'Thiết lập',

    icon: Settings,

    path: '/warehouse/settings',

    permission: [

      'wms.categories.view:all',

      'wms.material_units.view:all',

    ],

  },

];



/** Sidebar khi đang trong Thiết lập kho hàng */

export const warehouseSettingsMenu: SidebarMenuItem[] = [

  {

    id: 'wh-settings-categories',

    label: 'Cây vật tư',

    icon: Package,

    path: '/warehouse/settings/material-categories',

    permission: 'wms.categories.view:all',

  },

  {

    id: 'wh-settings-units',

    label: 'Đơn vị tính',

    icon: Ruler,

    path: '/warehouse/settings/material-units',

    permission: 'wms.material_units.view:all',

  },

];



export const stocktakeMenu: SidebarMenuItem[] = [

  {

    id: 'stocktake',

    label: 'Kiểm kê kho',

    icon: ClipboardCheck,

    path: '/stocktake/list',

    permission: 'wms.stocktakes.view:all',

  },

  {

    id: 'st-settings',

    label: 'Thiết lập',

    icon: Settings,

    path: '/stocktake/settings',

    permission: 'wms.stocktakes.settings.view',

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

    label: 'Thiết lập',

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

    label: 'Thiết lập',

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



/** Kỹ thuật — chỉ CSKH (ERP cũ + yêu cầu sếp). */
export const technicalMenu: SidebarMenuItem[] = [
  {
    id: 'cskh-clients',
    label: 'Khách hàng sau bán',
    icon: Headphones,
    path: '/technical/cskh/clients',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-history',
    label: 'Lịch sử chăm sóc',
    icon: ClipboardList,
    path: '/technical/cskh/history',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-issues',
    label: 'Vấn đề theo dự án',
    icon: FolderKanban,
    path: '/technical/cskh/project-issues',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-cdt',
    label: 'Báo cáo CĐT',
    icon: FileText,
    path: '/technical/cskh/reports-cdt',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-internal',
    label: 'Báo cáo nội bộ',
    icon: BarChart3,
    path: '/technical/cskh/reports-internal',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-birthdays',
    label: 'Sinh nhật hôm nay',
    icon: Cake,
    path: '/technical/cskh/birthdays',
    permission: 'tech.cskh.view',
  },
  {
    id: 'cskh-settings',
    label: 'Thiết lập',
    icon: Settings,
    path: '/technical/cskh/settings',
    permission: 'tech.cskh.view',
  },
];



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
    id: 'pur-orders',
    label: 'Đơn hàng',
    icon: ShoppingCart,
    path: '/purchasing/orders',
    permission: 'purchasing.orders.view',
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
    id: 'sup-evaluate',
    label: 'Đánh giá NCC',
    icon: Star,
    path: '/suppliers/evaluations',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
  {
    id: 'sup-settings',
    label: 'Thiết lập',
    icon: Settings,
    path: '/suppliers/settings',
    permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
  },
];

