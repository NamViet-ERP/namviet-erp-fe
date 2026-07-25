import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  Users,
  UserCheck,
  Warehouse,
  ShieldCheck,
  UserCog,
  ClipboardCheck,
  Wrench,
  ShoppingCart,
  Building2,
  Headphones,
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
 * Portal + Header mega-menu — chỉ phân hệ đã có.
 * MUA HÀNG (1 card): 2 mục → vào module/sidebar riêng
 *   - Nhà cung cấp → /suppliers/dashboard (rồi sidebar: Dashboard, Nhóm, NCC, Đánh giá, Thiết lập)
 *   - Mua hàng → /purchasing (KHMH, Đơn hàng)
 * Thứ tự: Mua hàng → Kỹ thuật → Kho → HRM → Admin
 */
export const departments: Department[] = [
  {
    title: 'MUA HÀNG',
    icon: ShoppingCart,
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
        path: '/purchasing/plans',
        permission: 'purchasing.plans.view',
      },
    ],
  },
  {
    title: 'KỸ THUẬT',
    icon: Wrench,
    items: [
      {
        label: 'Chăm sóc khách hàng',
        icon: Headphones,
        path: '/technical/cskh/clients',
        permission: 'tech.cskh.view',
      },
    ],
  },
  {
    title: 'KHO HÀNG',
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
