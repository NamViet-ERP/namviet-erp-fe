import type { SidebarMenuItem } from '../types';
import {
  LayoutDashboard, Warehouse, ArrowLeftRight, RefreshCw,
  PackagePlus, PackageMinus, Settings,
  ClipboardCheck, SlidersHorizontal, CalendarRange, Scale, Truck, Barcode
} from 'lucide-react';

export const warehouseMenu: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/warehouse/dashboard' },
  {
    id: 'warehouse', label: 'Kho hàng', icon: Warehouse, path: '/warehouse/list',
    children: [
      { id: 'wh-list', label: 'Kho', path: '/warehouse/list' },
      { id: 'wh-location', label: 'Vị trí kho', path: '/warehouse/locations' },
      { id: 'wh-stock', label: 'Tồn kho máy', path: '/warehouse/stock' },
    ]
  },
  { id: 'expected-imports', label: 'Dự kiến & Điều phối', icon: CalendarRange, path: '/warehouse/expected-imports' },
  { id: 'reconciliation', label: 'Đối chiếu PO - GRN', icon: Scale, path: '/warehouse/reconciliation' },
  { id: 'suppliers', label: 'Gợi ý Nhà Cung Cấp', icon: Truck, path: '/warehouse/suppliers' },
  { id: 'barcodes', label: 'Mã SKU & Barcode', icon: Barcode, path: '/warehouse/barcodes' },
  { id: 'transfer', label: 'Chuyển kho', icon: ArrowLeftRight, path: '/warehouse/transfer' },
  { id: 'conversion', label: 'Chuyển đổi kho', icon: RefreshCw, path: '/warehouse/conversion' },
  { id: 'import', label: 'Nhập kho', icon: PackagePlus, path: '/warehouse/import' },
  { id: 'export', label: 'Xuất kho giao hàng', icon: PackageMinus, path: '/warehouse/export' },
  { id: 'settings', label: 'Thiết lập', icon: Settings, path: '/warehouse/settings' },
];

export const stocktakeMenu: SidebarMenuItem[] = [
  { id: 'stocktake', label: 'Kiểm kê kho', icon: ClipboardCheck, path: '/stocktake/list' },
  { id: 'adjustment', label: 'Điều chỉnh kho', icon: SlidersHorizontal, path: '/stocktake/adjustment' },
  { id: 'st-settings', label: 'Thiết lập', icon: Settings, path: '/stocktake/settings' },
];
