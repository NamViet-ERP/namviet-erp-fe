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
      { label: 'Kho hàng', icon: Warehouse, path: '/warehouse/dashboard-warehouse' },
      { label: 'Kiểm kê', icon: ClipboardCheck, path: '/stocktake/list' },
    ],
  },
  {
    title: 'HRM',
    icon: Users,
    items: [
      { label: 'Nhân Viên', icon: Users, path: '/members/list' },
      { label: 'Tuyển Dụng', icon: UserCheck, path: '/recruitment/candidates' },
      { label: 'C & B', icon: CreditCard },
    ],
  },
  {
    title: 'ADMIN',
    icon: ShieldCheck,
    items: [
      { label: 'Quản lý người dùng', icon: UserCog, path: '/admin/users' },
    ],
  },
];
