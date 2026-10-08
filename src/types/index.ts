/**
 * @file src/types/index.ts
 * Central type definitions for the Warehouse Management application.
 * All shared interfaces and union types are defined here.
 */

import type { LucideIcon } from 'lucide-react';
export type { MaterialApiDto as Material } from './wms';

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

/** Card accent color options */
export type CardAccent =
  | 'amber'
  | 'blue'
  | 'teal'
  | 'purple'
  | 'warning'
  | 'danger'
  | 'success'
  | 'info'
  | 'primary'
  | 'neutral'
  | 'stone';

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Modal size options */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'wide';

/** Visual variant — `branded` gives the navy document header. */
export type ModalVariant = 'plain' | 'branded';

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
  /** Ghi chú dòng — giữ khi sửa (vd. poItem:{id} từ PO) */
  notes?: string | null;
  /** Id dòng warehouse_transaction_items — dùng khi kiểm nhận duyệt */
  lineId?: number;
  /** SL dự kiến (trước duyệt). Sau duyệt qty = đạt. */
  plannedQty?: number;
  acceptedQty?: number | null;
  defectQty?: number | null;
  shortageQty?: number | null;
  defectLineReason?: string | null;
  shortageLineReason?: string | null;
  [key: string]: unknown;
}

export interface ImportAttachment {
  id: string;
  kind: 'document' | 'photo' | 'defect_photo' | string;
  fileName: string;
  storageKey: string;
  uploadedAt: string;
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
  /** Xuất thẳng lấy hàng từ kho trung tâm - không quyết toán Đã nhận PO. */
  issueFromGeneralWarehouse?: boolean;
  /** Dự án thụ hưởng khi isDirectProcurement = true */
  project?: string;
  planCode?: string | null;
  receiptEvaluation?: string | null;
  attachments?: ImportAttachment[];
  /** Báo cáo thiếu hàng khi duyệt có ShortageQty */
  shortageReport?: string | null;
  /** HL tạo từ kiểm nhận */
  linkedDefectTicketCode?: string | null;
  /** Mã phiếu XK liên kết khi xuất thẳng công trường. */
  linkedTicketCode?: string | null;
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
  /** Xuất thẳng công trường (cung ứng lập từ PO), không trừ tồn kho. */
  isDirectProcurement?: boolean;
  /** Mã phiếu nhận hàng liên kết (NK) khi xuất thẳng. */
  linkedTicketCode?: string | null;
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
// Export return (Hoàn trả vật tư theo phiếu xuất)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportReturnItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  [key: string]: unknown;
}

export interface ExportReturn {
  id: string;
  voucherCode: string;
  date: string;
  createdAt?: string;
  sourceExportId: string;
  sourceExportCode: string;
  project?: string;
  projectName?: string;
  items: ExportReturnItem[];
  status: StatusKey;
  createdBy: string;
  note: string;
  approvedBy?: string;
  approvedAt?: string;
  attachments?: ImportAttachment[];
}

export interface ExportReturnableExport {
  id: string;
  voucherCode: string;
  date: string;
  soCode?: string;
  customer?: string;
  status: StatusKey;
  approvedAt?: string;
  returnableLineCount: number;
  totalRemainingQty: number;
}

export interface ExportReturnableLine {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  exportedQty: number;
  returnedQty: number;
  remainingQty: number;
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
  reason?: string;
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
  icon?: LucideIcon;
  /** Any one of these permission keys grants access. */
  permission?: string | string[];
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: SidebarChildItem[];
  badge?: string;
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
