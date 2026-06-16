import type { SidebarMenuItem } from '../types';
import {
  LayoutDashboard, Warehouse, Package,
  PackagePlus, PackageMinus, Settings,
  ClipboardCheck, SlidersHorizontal, Users, UserCheck, UserCog
} from 'lucide-react';

export const warehouseMenu: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/warehouse/dashboard-warehouse' },
  { id: 'warehouse', label: 'Kho hàng', icon: Warehouse, path: '/warehouse/list' },
  { id: 'materials', label: 'Vật tư', icon: Package, path: '/warehouse/stock' },
  { id: 'import', label: 'Nhập kho', icon: PackagePlus, path: '/warehouse/import' },
  { id: 'export', label: 'Xuất kho', icon: PackageMinus, path: '/warehouse/export' },
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
