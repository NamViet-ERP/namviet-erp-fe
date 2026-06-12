import type { LucideIcon } from 'lucide-react';
import {
  Megaphone, HeartHandshake, ShoppingCart, CreditCard, FolderKanban,
  FileSignature, Wrench, Factory, Users, Calendar, TrendingUp,
  ClipboardCheck, UserCheck, ArrowLeftRight, Barcode, PackagePlus,
  Truck, Activity, Warehouse, DollarSign,
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
    title: 'KHO HÀNG',
    icon: Warehouse,
    items: [
      { label: 'Kho Hàng', icon: Warehouse, path: '/warehouse/dashboard-warehouse' },
      { label: 'Kiểm Kê', icon: ClipboardCheck, path: '/stocktake/list' },
      { label: 'Thành Phẩm, Phụ Tùng, NVL', icon: Barcode, path: '/warehouse/stock' },
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
];
