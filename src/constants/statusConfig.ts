import type { StatusKey, StatusConfigItem, AdjustmentType, AdjustmentTypeConfigItem } from '../types';
import { Check, Clock, AlertCircle, Package, X } from 'lucide-react';

// Color comes from the `className` (MD3 badge tokens in index.css), which
// already adapts to dark mode. No hardcoded hex here — single source of truth.
export const statusConfig: Record<StatusKey, StatusConfigItem> = {
  approved:            { label: 'Đã duyệt',       className: 'badge-approved', icon: Check },
  pending:             { label: 'Chờ duyệt',      className: 'badge-pending',  icon: Clock },
  exported:            { label: 'Đã xuất kho',    className: 'badge-exported', icon: Package },
  warehouse_approved:  { label: 'Đã duyệt kho',   className: 'badge-approved', icon: Check },
  warehouse_pending:   { label: 'Chưa duyệt kho', className: 'badge-pending',  icon: Clock },
  draft:               { label: 'Nháp',           className: 'badge-draft',    icon: AlertCircle },
  new:                 { label: 'Mới',            className: 'badge-new',      icon: AlertCircle },
  cancelled:           { label: 'Đã hủy',         className: 'badge-error',    icon: X },
  completed:           { label: 'Hoàn thành',     className: 'badge-approved', icon: Check },
  frozen:              { label: 'Tạm khóa',       className: 'badge-exported', icon: AlertCircle },
  counting:            { label: 'Đang kiểm đếm',  className: 'badge-pending',  icon: Clock },
  rejected:            { label: 'Từ chối',        className: 'badge-error',    icon: X },
  loan_pending:        { label: 'Chờ duyệt PM',   className: 'badge-pending',  icon: Clock },
  borrowing:           { label: 'Đang mượn',      className: 'badge-exported', icon: Clock },
  returned:            { label: 'Đã hoàn trả',    className: 'badge-approved', icon: Check },
  active:              { label: 'Hoạt động',      className: 'badge-approved', icon: Check },
  inactive:            { label: 'Tạm khóa',       className: 'badge-error',    icon: X },
};

export const adjustmentTypeConfig: Record<AdjustmentType, AdjustmentTypeConfigItem> = {
  increase: { label: 'Tăng', className: 'badge-exported' },
  decrease: { label: 'Giảm', className: 'badge-error' },
};
