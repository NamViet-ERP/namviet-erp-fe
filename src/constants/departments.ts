import type { LucideIcon } from 'lucide-react';
import {
  Megaphone, HeartHandshake, ShoppingCart, CreditCard, FolderKanban,
  FileSignature, Wrench, Factory, Users, Calendar, TrendingUp,
  UserCheck, Package, PackagePlus, PackageMinus,
  Activity, Warehouse, DollarSign, ShieldCheck, UserCog, LayoutDashboard,
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
      { label: 'Dashboard', icon: LayoutDashboard, path: '/warehouse/dashboard-warehouse' },
      { label: 'Kho hàng', icon: Warehouse, path: '/warehouse/list' },
      { label: 'Vật tư', icon: Package, path: '/warehouse/stock' },
      { label: 'Nhập kho', icon: PackagePlus, path: '/warehouse/import' },
      { label: 'Xuất kho', icon: PackageMinus, path: '/warehouse/export' },
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
    title: 'Admin',
    icon: ShieldCheck,
    items: [
      { label: 'Quản lý người dùng', icon: UserCog, path: '/admin/users' },
    ],
  },
];
