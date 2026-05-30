import {
  LayoutDashboard, Warehouse, ArrowLeftRight, RefreshCw,
  PackagePlus, PackageMinus, Settings,
  ClipboardCheck, SlidersHorizontal
} from 'lucide-react';

export const warehouseMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/warehouse/dashboard' },
  {
    id: 'warehouse', label: 'Kho hàng', icon: Warehouse, path: '/warehouse/list',
    children: [
      { id: 'wh-list', label: 'Kho', path: '/warehouse/list' },
      { id: 'wh-location', label: 'Vị trí kho', path: '/warehouse/locations' },
      { id: 'wh-stock', label: 'Tồn kho máy', path: '/warehouse/stock' },
    ]
  },
  { id: 'transfer', label: 'Chuyển kho', icon: ArrowLeftRight, path: '/warehouse/transfer' },
  { id: 'conversion', label: 'Chuyển đổi kho', icon: RefreshCw, path: '/warehouse/conversion' },
  { id: 'import', label: 'Nhập kho', icon: PackagePlus, path: '/warehouse/import' },
  { id: 'export', label: 'Xuất kho giao hàng', icon: PackageMinus, path: '/warehouse/export' },
  { id: 'settings', label: 'Thiết lập', icon: Settings, path: '/warehouse/settings' },
];

export const stocktakeMenu = [
  { id: 'stocktake', label: 'Kiểm kê kho', icon: ClipboardCheck, path: '/stocktake/list' },
  { id: 'adjustment', label: 'Điều chỉnh kho', icon: SlidersHorizontal, path: '/stocktake/adjustment' },
  { id: 'st-settings', label: 'Thiết lập', icon: Settings, path: '/stocktake/settings' },
];
