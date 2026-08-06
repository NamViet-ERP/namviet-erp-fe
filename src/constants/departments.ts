import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  Users,
  UserCheck,
  Warehouse,
  ShieldCheck,
  UserCog,
  ClipboardCheck,
  ShoppingCart,
  Building2,
  Activity,
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
  /** Color tone for portal / mega-menu cards (SCM-EPC palette). */
  tone: 'operations' | 'purchasing' | 'warehouse' | 'hrm' | 'admin';
  items: DepartmentSubItem[];
}

/**
 * Portal + Header mega-menu — chỉ phân hệ đã ship (có API).
 * Thứ tự: Vận hành → Mua hàng → Kho → HRM → Admin
 */
export const departments: Department[] = [
  {
    title: 'VẬN HÀNH',
    icon: Activity,
    tone: 'operations',
    items: [
      {
        label: 'Vận hành',
        icon: Activity,
        path: '/operations/dashboard',
        permission: 'wms.projects.view:all',
      },
    ],
  },
  {
    title: 'MUA HÀNG',
    icon: ShoppingCart,
    tone: 'purchasing',
    items: [
      {
        label: 'Nhà cung cấp',
        icon: Building2,
        path: '/suppliers/dashboard',
        permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
      },
      {
        label: 'Mua hàng',
        icon: ShoppingCart,
        path: '/purchasing/dashboard',
        permission: 'purchasing.dashboard.view',
      },
    ],
  },
  {
    title: 'KHO HÀNG',
    icon: Warehouse,
    tone: 'warehouse',
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
    tone: 'hrm',
    items: [
      {
        label: 'Nhân viên',
        icon: Users,
        path: '/members/list',
        permission: 'hrm.employees.view:all',
      },
      {
        label: 'Tuyển dụng',
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
    tone: 'admin',
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
