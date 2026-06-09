import type { StatusKey, StatusConfigItem, AdjustmentType, AdjustmentTypeConfigItem } from '../types';
import { Check, Clock, AlertCircle, Package, X } from 'lucide-react';

export const statusConfig: Record<StatusKey, StatusConfigItem> = {
  approved: {
    label: 'Đã duyệt',
    className: 'badge-approved',
    icon: Check,
    color: '#22C55E',
  },
  pending: {
    label: 'Chờ duyệt',
    className: 'badge-pending',
    icon: Clock,
    color: '#F59E0B',
  },
  exported: {
    label: 'Đã xuất kho',
    className: 'badge-exported',
    icon: Package,
    color: '#06B6D4',
  },
  warehouse_approved: {
    label: 'Đã duyệt kho',
    className: 'badge-approved',
    icon: Check,
    color: '#22C55E',
  },
  warehouse_pending: {
    label: 'Chưa duyệt kho',
    className: 'badge-pending',
    icon: Clock,
    color: '#F59E0B',
  },
  draft: {
    label: 'Nháp',
    className: 'badge-draft',
    icon: AlertCircle,
    color: '#6B7280',
  },
  new: {
    label: 'Mới',
    className: 'badge-new',
    icon: AlertCircle,
    color: '#EF4444',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'badge-error',
    icon: X,
    color: '#EF4444',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'badge-approved',
    icon: Check,
    color: '#22C55E',
  },
  frozen: {
    label: 'Tạm khóa',
    className: 'badge-exported',
    icon: AlertCircle,
    color: '#06B6D4',
  },
  counting: {
    label: 'Đang kiểm đếm',
    className: 'badge-pending',
    icon: Clock,
    color: '#F59E0B',
  },
  rejected: {
    label: 'Từ chối',
    className: 'badge-error',
    icon: X,
    color: '#EF4444',
  },
  loan_pending: {
    label: 'Chờ duyệt PM',
    className: 'badge-pending',
    icon: Clock,
    color: '#F59E0B',
  },
  borrowing: {
    label: 'Đang mượn',
    className: 'badge-exported',
    icon: Clock,
    color: '#06B6D4',
  },
  returned: {
    label: 'Đã hoàn trả',
    className: 'badge-approved',
    icon: Check,
    color: '#22C55E',
  },
  active: {
    label: 'Hoạt động',
    className: 'badge-approved',
    icon: Check,
    color: '#22C55E',
  },
  inactive: {
    label: 'Tạm khóa',
    className: 'badge-error',
    icon: X,
    color: '#EF4444',
  },
};

export const adjustmentTypeConfig: Record<AdjustmentType, AdjustmentTypeConfigItem> = {
  increase: {
    label: 'Tăng',
    className: 'badge-exported',
    color: '#06B6D4',
  },
  decrease: {
    label: 'Giảm',
    className: 'badge-error',
    color: '#EF4444',
  },
};
