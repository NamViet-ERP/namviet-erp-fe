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
  Headphones,
} from 'lucide-react';
import { CSKH_MODULE_ENABLED } from './cskh';

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
 * Portal + Header mega-menu.
 * Thứ tự: (CSKH khi bật) → SLC → Nhà cung cấp → Mua hàng → Kho → HRM → Admin
 */
export const departments: Department[] = [
  ...(CSKH_MODULE_ENABLED
    ? [{
        title: 'CSKH',
        icon: Headphones,
        tone: 'operations' as const,
        items: [
          {
            label: 'CSKH',
            icon: Headphones,
            path: '/cskh',
            permission: ['cskh.dashboard.view', 'wms.projects.view:all'],
          },
        ],
      }]
    : []),
  {
    title: 'SLC',
    icon: Activity,
    tone: 'operations',
    items: [
      {
        label: 'SLC',
        icon: Activity,
        path: '/operations/dashboard',
        permission: 'wms.projects.view:all',
      },
    ],
  },
  {
    title: 'NHÀ CUNG CẤP',
    icon: Building2,
    tone: 'purchasing',
    items: [
      {
        label: 'Nhà cung cấp',
        icon: Building2,
        path: '/suppliers/dashboard',
        permission: ['purchasing.suppliers.view', 'wms.suppliers.view:all'],
      },
    ],
  },
  {
    title: 'MUA HÀNG',
    icon: ShoppingCart,
    tone: 'purchasing',
    items: [
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
