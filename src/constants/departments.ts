import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  Users,
  UserCheck,
  Warehouse, ShieldCheck, UserCog, ClipboardCheck,
} from 'lucide-react';

export interface DepartmentSubItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  /** Any one of these permission keys grants access. */
  permission?: string | string[];
}

export interface Department {
  title: string;
  icon: LucideIcon;
  items: DepartmentSubItem[];
}

/**
 * Mega-menu structure shared by the global Header and the Dashboard launcher.
 * Single source of truth — do not duplicate this elsewhere.
 */
export const departments: Department[] = [
  {
    title: 'KHO MAYZER',
    icon: Warehouse,
    items: [
      {
        label: 'Kho hàng',
        icon: Warehouse,
        path: '/warehouse/dashboard-warehouse',
        permission: 'wms.dashboard.view',
      },
      {
        label: 'Kiểm kê',
        icon: ClipboardCheck,
        path: '/stocktake/list',
        permission: 'wms.stocktakes.view:all',
      },
    ],
  },
  {
    title: 'HRM',
    icon: Users,
    items: [
      {
        label: 'Nhân Viên',
        icon: Users,
        path: '/members/list',
        permission: 'hrm.employees.view:all',
      },
      {
        label: 'Tuyển Dụng',
        icon: UserCheck,
        path: '/recruitment/candidates',
        permission: 'hrm.candidates.view:all',
      },
      { label: 'C & B', icon: CreditCard },
    ],
  },
  {
    title: 'ADMIN',
    icon: ShieldCheck,
    items: [
      {
        label: 'Quản lý người dùng',
        icon: UserCog,
        path: '/admin/users',
        permission: 'admin.users.view:all',
      },
    ],
  },
];
