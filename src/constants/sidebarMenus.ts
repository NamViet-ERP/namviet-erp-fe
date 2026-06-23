import type { SidebarMenuItem } from '../types';
import {
  LayoutDashboard, Package,
  PackagePlus, PackageMinus, Settings,
  ClipboardCheck, SlidersHorizontal, Users, UserCheck, UserCog,
  Layers, FolderKanban, ArrowLeftRight, Building2,
} from 'lucide-react';

/** Thứ tự theo luồng nghiệp vụ: kho dự án → tồn → nhập/xuất/chuyển → danh mục */
export const warehouseMenu: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, path: '/warehouse/dashboard-warehouse' },
  { id: 'projects', label: 'Kho dự án', icon: FolderKanban, path: '/warehouse/projects' },
  { id: 'stock', label: 'Tồn kho', icon: Layers, path: '/warehouse/stock' },
  { id: 'import', label: 'Nhập kho', icon: PackagePlus, path: '/warehouse/import' },
  { id: 'export', label: 'Xuất kho', icon: PackageMinus, path: '/warehouse/export' },
  { id: 'transfer', label: 'Chuyển kho', icon: ArrowLeftRight, path: '/warehouse/transfer' },
  { id: 'materials', label: 'Danh mục vật tư', icon: Package, path: '/warehouse/materials' },
  { id: 'settings', label: 'Thiết lập', icon: Settings, path: '/warehouse/settings' },
];

/** Sidebar khi đang trong Thiết lập kho hàng */
export const warehouseSettingsMenu: SidebarMenuItem[] = [
  { id: 'wh-settings-categories', label: 'Cây vật tư', icon: Package, path: '/warehouse/settings/material-categories' },
  { id: 'wh-settings-suppliers', label: 'Danh mục NCC', icon: Building2, path: '/warehouse/settings/suppliers' },
];

export const stocktakeMenu: SidebarMenuItem[] = [
  { id: 'stocktake', label: 'Kiểm kê kho', icon: ClipboardCheck, path: '/stocktake/list' },
  { id: 'adjustment', label: 'Điều chỉnh kho', icon: SlidersHorizontal, path: '/stocktake/adjustment' },
  { id: 'st-settings', label: 'Thiết lập', icon: Settings, path: '/stocktake/settings' },
];

export const recruitmentMenu: SidebarMenuItem[] = [
  { id: 'candidates-list', label: 'Danh sách ứng viên', icon: UserCheck, path: '/recruitment/candidates' },
  { id: 'recruitment-settings', label: 'Thiết lập', icon: Settings, path: '/recruitment/settings' },
];

export const membersMenu: SidebarMenuItem[] = [
  { id: 'members-list', label: 'Hồ sơ nhân sự', icon: Users, path: '/members/list' },
  { id: 'members-settings', label: 'Thiết lập', icon: Settings, path: '/members/settings' },
];

export const adminMenu: SidebarMenuItem[] = [
  { id: 'admin-users', label: 'Quản lý người dùng', icon: UserCog, path: '/admin/users' },
  { id: 'admin-settings', label: 'Thiết lập', icon: Settings, path: '/admin/settings' },
];
