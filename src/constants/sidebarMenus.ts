import type { SidebarMenuItem } from '../types';

import {

  LayoutDashboard, Package,

  PackagePlus, PackageMinus, Settings,

  ClipboardCheck, Users, UserCheck, UserCog,

  Layers, FolderKanban, ArrowLeftRight, Building2, Ruler,

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

    id: 'materials',

    label: 'Danh mục vật tư',

    icon: Package,

    path: '/warehouse/materials',

    permission: 'wms.materials.view:all',

  },

  {

    id: 'settings',

    label: 'Thiết lập',

    icon: Settings,

    path: '/warehouse/settings',

    permission: [

      'wms.categories.view:all',

      'wms.material_units.view:all',

      'wms.suppliers.view:all',

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

  {

    id: 'wh-settings-suppliers',

    label: 'Danh mục NCC',

    icon: Building2,

    path: '/warehouse/settings/suppliers',

    permission: 'wms.suppliers.view:all',

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

    id: 'candidates-list',

    label: 'Danh sách ứng viên',

    icon: UserCheck,

    path: '/recruitment/candidates',

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

