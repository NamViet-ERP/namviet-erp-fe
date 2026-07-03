/**
 * @file src/types/index.ts
 * Central type definitions for the Warehouse Management application.
 * All shared interfaces and union types are defined here.
 */

import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Status & Enum Union Types
// ─────────────────────────────────────────────────────────────────────────────

/** All valid status keys used across the application */
export type StatusKey =
  | 'approved'
  | 'pending'
  | 'exported'
  | 'warehouse_approved'
  | 'warehouse_pending'
  | 'draft'
  | 'new'
  | 'cancelled'
  | 'completed'
  | 'frozen'
  | 'counting'
  | 'rejected'
  | 'loan_pending'
  | 'borrowing'
  | 'returned'
  | 'active'
  | 'inactive';

export type VoucherPrefix = 'CK' | 'CDK' | 'NK' | 'XK' | 'KK';

/** Card accent color options */
export type CardAccent = 'amber' | 'blue' | 'teal' | 'purple';

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Modal size options */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusConfigItem {
  label: string;
  className: string;
  icon: LucideIcon;
}

// ─────────────────────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Warehouse
// ─────────────────────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  group: string;
  address: string;
  branch: string;
  manager: string;
  totalStock: number;
  totalValue: number;
  status: 'active' | 'inactive';
}

// ─────────────────────────────────────────────────────────────────────────────
// Import (Nhập kho)
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  /** NCC theo dòng — nếu trống dùng NCC mặc định của phiếu */
  supplier?: string;
  supplierId?: number;
  [key: string]: unknown;
}

export interface Import {
  id: string;
  voucherCode: string;
  date: string;
  /** ISO datetime — thời điểm tạo phiếu */
  createdAt?: string;
  supplier: string;
  referenceCode: string;
  totalValue: number;
  status: StatusKey;
  warehouseApproval: StatusKey;
  approvedBy: string;
  approvedAt?: string;
  warehouseKeeper: string;
  items: ImportItem[];
  createdBy: string;
  note: string;
  warehouseId: string;
  /** Mua phát sinh trực tiếp cho dự án (không qua kho chung) */
  isDirectProcurement?: boolean;
  /** Dự án thụ hưởng khi isDirectProcurement = true */
  project?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export (Xuất kho)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  [key: string]: unknown;
}

export interface Export {
  id: string;
  voucherCode: string;
  date: string;
  /** ISO datetime — thời điểm tạo phiếu */
  createdAt?: string;
  soCode: string;
  customer: string;
  warehouseId: string;
  warehouseName: string;
  items: ExportItem[];
  status: StatusKey;
  createdBy: string;
  note: string;
  approvedBy?: string;
  approvedAt?: string;
  project?: string;
  projectName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transfer (Chuyển kho)
// ─────────────────────────────────────────────────────────────────────────────

export interface TransferItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  [key: string]: unknown;
}

export interface Transfer {
  id: string;
  voucherCode: string;
  date: string;
  /** ISO datetime — thời điểm tạo phiếu */
  createdAt?: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: TransferItem[];
  status: StatusKey;
  createdBy: string;
  note: string;
  approvedBy?: string;
  approvedAt?: string;
  project?: string;
  projectName?: string;
  toProject?: string;
  toProjectName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion (Chuyển đổi kho)
// ─────────────────────────────────────────────────────────────────────────────

export interface ConversionItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  reason: string;
  [key: string]: unknown;
}

export interface Conversion {
  id: string;
  voucherCode: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  fromType: string;
  toWarehouseId: string;
  toWarehouseName: string;
  toType: string;
  items: ConversionItem[];
  status: StatusKey;
  createdBy: string;
  approvedBy?: string;
  note: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stocktake (Kiểm kê)
// ─────────────────────────────────────────────────────────────────────────────

export interface StocktakeItem {
  productId: string;
  sku: string;
  name: string;
  systemQty: number;
  actualQty: number;
  diff: number;
  [key: string]: unknown;
}

export interface Stocktake {
  id: string;
  voucherCode: string;
  date: string;
  createdBy: string;
  status: StatusKey;
  warehouseId: string;
  warehouseName: string;
  condition: StatusKey;
  isFrozen: boolean;
  note: string;
  items: StocktakeItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar / Navigation
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarChildItem {
  id: string;
  label: string;
  path: string;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: SidebarChildItem[];
  /** Any one of these permission keys grants access. */
  permission?: string | string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────────────────────────────────────────

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title: string;
  duration: number;
  /** Bumped to reset auto-dismiss timer without stacking toasts. */
  revision: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Component Prop Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface DropdownItem {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

/** Generic column definition for DetailModal table */
export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  label?: string;
  align?: 'left' | 'right' | 'center';
  render?: (item: T) => React.ReactNode;
}

/** Generic data shape expected by DetailModal */
export interface DetailModalData {
  voucherCode?: string;
  createdBy?: string;
  date?: string;
  warehouseName?: string;
  note?: string;
  items?: Record<string, unknown>[];
  [key: string]: unknown;
}

/** Validation result returned by validator functions */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

/** Stock quantities shape used in validators */
export interface StockQuantities {
  actual: number;
  held: number;
  available: number;
}

export type { ToastType, ModalSize, CardAccent } from './ui';
