import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import IOSSwitch from '../../../components/ui/IOSSwitch';
import StatusBadge from '../../../components/ui/StatusBadge';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import type { ServiceExpenseItemApiDto } from '../../../types/api/serviceExpenseItem';
import { formatCurrencyFull } from '../../../utils/formatCurrency';

interface ServicesExpensesTableProps {
  items: ServiceExpenseItemApiDto[];
  isLoading: boolean;
  isError: boolean;
  isToggling: boolean;
  hasActiveFilters: boolean;
  page: number;
  pageSize: ListPageSize;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  onRetry: () => void;
  onOpenCreate: () => void;
  onEdit: (item: ServiceExpenseItemApiDto) => void;
  onDelete: (item: ServiceExpenseItemApiDto) => void;
  onToggle: (item: ServiceExpenseItemApiDto) => void;
}

export default function ServicesExpensesTable({
  items,
  isLoading,
  isError,
  isToggling,
  hasActiveFilters,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onOpenCreate,
  onEdit,
  onDelete,
  onToggle,
}: ServicesExpensesTableProps) {
  const emptyMessage = isError
    ? 'Không thể tải danh mục dịch vụ & chi phí.'
    : hasActiveFilters
      ? 'Không tìm thấy mục phù hợp với bộ lọc hiện tại.'
      : 'Chưa có dịch vụ hoặc chi phí nào trong danh mục.';

  return (
    <TableShell
      tableClassName="wms-inventory-table mat-catalog-table"
      colSpan={9}
      loading={isLoading}
      skeletonRows={8}
      isEmpty={isError || items.length === 0}
      emptyIcon={isError ? AlertTriangle : undefined}
      emptyMessage={emptyMessage}
      emptyAction={
        isError ? (
          <Button type="button" variant="tonal" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        ) : (
          <Button type="button" variant="tonal" size="sm" leftIcon={Plus} onClick={onOpenCreate}>
            Thêm mới ngay
          </Button>
        )
      }
      pagination={
        total > 0 && !isLoading && !isError
          ? {
              embedded: true,
              currentPage: page,
              totalPages,
              pageSize,
              totalItems: total,
              itemLabel: 'mục',
              onPageChange,
              onPageSizeChange,
            }
          : undefined
      }
      header={
        <tr>
          <th className="table-header-cell text-center w-12">#</th>
          <th className="table-header-cell text-left w-36">Mã định danh</th>
          <th className="table-header-cell text-left">Tên dịch vụ / chi phí</th>
          <th className="table-header-cell text-center w-36">Phân loại</th>
          <th className="table-header-cell text-center w-24">ĐVT</th>
          <th className="table-header-cell text-right w-44">Đơn giá tham chiếu</th>
          <th className="table-header-cell text-left">Ghi chú</th>
          <th className="table-header-cell text-center w-28">Trạng thái</th>
          <th className="table-header-cell text-center w-24">Thao tác</th>
        </tr>
      }
    >
      {items.map((item, idx) => {
        const isExpense = item.type === 'expense';
        return (
          <tr
            key={item.id}
            className={`table-row transition-colors hover:bg-[var(--md-surface-variant05)] ${
              !item.isActive ? 'opacity-60 bg-[var(--md-surface-container-low)]' : ''
            }`}
          >
            <td className="table-cell text-center text-xs text-[var(--md-on-surface-variant)] tabular-nums">
              {(page - 1) * pageSize + idx + 1}
            </td>
            <td className="table-cell font-mono font-semibold text-xs">
              <span className="inline-block px-2 py-0.5 rounded bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border border-[var(--md-outline-variant)]">
                {item.code}
              </span>
            </td>
            <td className="table-cell font-medium text-[var(--md-on-surface)]">
              {item.name}
            </td>
            <td className="table-cell text-center">
              <StatusBadge
                tone={isExpense ? 'primary' : 'warning'}
                label={isExpense ? 'Chi phí ngoài' : 'Dịch vụ'}
              />
            </td>
            <td className="table-cell text-center font-medium">
              {item.unit}
            </td>
            <td className="table-cell text-right font-medium tabular-nums">
              {item.referencePrice != null ? (
                <span className="text-[var(--md-on-surface)]">
                  {formatCurrencyFull(item.referencePrice)}
                </span>
              ) : (
                <span className="text-[var(--md-on-surface-variant)] opacity-40">—</span>
              )}
            </td>
            <td
              className="table-cell text-xs text-[var(--md-on-surface-variant)] max-w-xs truncate"
              title={item.description ?? ''}
            >
              {item.description || <span className="opacity-40">—</span>}
            </td>
            <td className="table-cell text-center">
              <div className="flex items-center justify-center">
                <IOSSwitch
                  checked={item.isActive}
                  disabled={isToggling}
                  onChange={() => onToggle(item)}
                  title={item.isActive ? 'Đang kích hoạt — Bấm để tắt' : 'Đã tắt — Bấm để kích hoạt'}
                />
              </div>
            </td>
            <td className="table-cell text-center">
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  className="btn-icon text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] hover:bg-[var(--tint-primary-soft)]"
                  title="Sửa thông tin"
                  aria-label={`Sửa ${item.code}`}
                  onClick={() => onEdit(item)}
                >
                  <Pencil size={15} aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  className="btn-icon text-[var(--md-error)] hover:bg-[var(--md-error-container)] hover:text-[var(--md-on-error-container)]"
                  title="Xóa mục này"
                  aria-label={`Xóa ${item.code}`}
                  onClick={() => onDelete(item)}
                >
                  <Trash2 size={15} aria-hidden />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}
