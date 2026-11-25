import { Plus } from 'lucide-react';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import type { ListPageSize } from '../../../constants/pagination';
import { SUPPLIER_APPROVAL } from '../../../lib/suppliers/supplierStatus';
import { WMS_ERROR } from '../../../lib/wms/messages';
import type { DropdownItem } from '../../../types';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import {
  ApprovalStatusBadge,
  COL_COUNT,
  IndustryGroupsCell,
  RATING_OPTIONS,
  RatingBadge,
  type SupplierRow,
} from './SupplierShared';

interface SuppliersFilterBarProps {
  ratingFilter: string;
  onRatingFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  groupIdFromUrl?: number;
  filteredGroupName?: string;
  onClearGroupFilter: () => void;
}

export function SuppliersFilterBar({
  ratingFilter,
  onRatingFilterChange,
  statusFilter,
  onStatusFilterChange,
  groupIdFromUrl,
  filteredGroupName,
  onClearGroupFilter,
}: SuppliersFilterBarProps) {
  return (
    <div className="ncc-master-filters">
      <div className="hrm-filter-select-wrap">
        <select
          className="hrm-filter-select"
          value={ratingFilter}
          aria-label="Hạng"
          onChange={e => onRatingFilterChange(e.target.value)}
        >
          <option value="">Tất cả hạng</option>
          {RATING_OPTIONS.map(r => (
            <option key={r} value={r}>Hạng {r}</option>
          ))}
        </select>
      </div>
      <div className="hrm-filter-select-wrap">
        <select
          className="hrm-filter-select"
          value={statusFilter}
          aria-label="Trạng thái"
          onChange={e => onStatusFilterChange(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value={SUPPLIER_APPROVAL.New}>Mới - chờ duyệt</option>
          <option value={SUPPLIER_APPROVAL.Approved}>Đã duyệt</option>
          <option value={SUPPLIER_APPROVAL.Rejected}>Từ chối</option>
        </select>
      </div>
      {groupIdFromUrl ? (
        <button
          type="button"
          className="hrm-filter-reset"
          onClick={onClearGroupFilter}
        >
          Nhóm: {filteredGroupName ?? `#${groupIdFromUrl}`}
        </button>
      ) : null}
    </div>
  );
}

interface SuppliersTableProps {
  items: SupplierRow[];
  isLoading: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: ListPageSize) => void;
  onOpenCreate: () => void;
  onViewSupplier: (supplier: SupplierRow) => void;
  rowActions: (supplier: SupplierRow) => DropdownItem[];
}

export default function SuppliersTable({
  items,
  isLoading,
  isError,
  hasActiveFilters,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onOpenCreate,
  onViewSupplier,
  rowActions,
}: SuppliersTableProps) {
  return (
    <>
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table ncc-master-table">
          <thead>
            <tr>
              <th className="table-header-cell ncc-master-col-code">Mã NCC</th>
              <th className="table-header-cell ncc-master-col-name">Tên nhà cung cấp</th>
              <th className="table-header-cell ncc-master-col-phone">Người liên hệ</th>
              <th className="table-header-cell text-right ncc-master-col-debt">Hạn công nợ</th>
              <th className="table-header-cell text-right ncc-master-col-limit">Hạn mức</th>
              <th className="table-header-cell ncc-master-col-terms">Điều khoản thanh toán</th>
              <th className="table-header-cell ncc-master-col-groups">Nhóm ngành hàng</th>
              <th className="table-header-cell text-center ncc-master-col-grade">Hạng</th>
              <th className="table-header-cell text-center ncc-master-col-status">Trạng thái</th>
              <th className="table-header-cell text-right ncc-master-col-revenue">Doanh số đã mua</th>
              <th className="table-header-cell ncc-master-col-eval">Đánh giá gần nhất</th>
              <th className="table-header-cell text-right ncc-master-col-kpi">Điểm KPI</th>
              <th className="table-header-cell text-center hrm-table-col-actions">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={COL_COUNT} />
            ) : isError ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState message={WMS_ERROR.loadSuppliers} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState
                    message={hasActiveFilters ? 'Không tìm thấy NCC phù hợp.' : 'Chưa có nhà cung cấp nào.'}
                    action={
                      hasActiveFilters ? null : (
                        <button type="button" className="btn btn-primary" onClick={onOpenCreate}>
                          <Plus size={16} aria-hidden />
                          Thêm NCC đầu tiên
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell font-mono whitespace-nowrap ncc-master-col-code">
                    {s.supplierCode}
                  </td>
                  <td className="table-cell ncc-master-col-name">
                    <button
                      type="button"
                      className="ncc-master-name"
                      onClick={() => onViewSupplier(s)}
                    >
                      {s.supplierName}
                    </button>
                    {s.taxCode && (
                      <div className="text-[11px] text-[var(--md-on-surface-variant)] font-mono">
                        MST: {s.taxCode}
                      </div>
                    )}
                  </td>
                  <td className="table-cell ncc-master-col-phone">
                    {s.primaryContact ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-[var(--md-on-surface)] flex items-center gap-1">
                          <span className="truncate max-w-[140px]" title={s.primaryContact.fullName}>
                            {s.primaryContact.fullName}
                          </span>
                          {s.contactCount && s.contactCount > 1 ? (
                            <span
                              className="inline-flex items-center text-[10px] font-normal text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-1 py-0.2 rounded"
                              title={`${s.contactCount} liên hệ`}
                            >
                              +{s.contactCount - 1}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-[var(--md-on-surface-variant)] tabular-nums">
                          {s.primaryContact.phone || s.contactPhone || '—'}
                        </span>
                        {s.primaryContact.position && (
                          <span
                            className="text-[10px] text-[var(--md-on-surface-variant)]/70 truncate max-w-[140px]"
                            title={s.primaryContact.position}
                          >
                            {s.primaryContact.position}
                          </span>
                        )}
                      </div>
                    ) : s.contactPhone ? (
                      <span className="tabular-nums text-xs">{s.contactPhone}</span>
                    ) : (
                      <span className="text-zinc-400 italic text-xs">Chưa có liên hệ</span>
                    )}
                  </td>
                  <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-debt">
                    {s.maxDebtDays} ngày
                  </td>
                  <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-limit">
                    {s.creditLimit ? formatCurrencyFull(s.creditLimit) : 'Không giới hạn'}
                  </td>
                  <td className="table-cell ncc-master-col-terms">
                    <span className="line-clamp-2" title={s.paymentTerms || undefined}>
                      {s.paymentTerms || '—'}
                    </span>
                  </td>
                  <td className="table-cell ncc-master-col-groups">
                    <IndustryGroupsCell groups={s.industryGroups ?? []} />
                  </td>
                  <td className="table-cell text-center ncc-master-col-grade">
                    <RatingBadge rating={s.rating} />
                  </td>
                  <td className="table-cell text-center ncc-master-col-status">
                    <ApprovalStatusBadge status={s.approvalStatus} />
                  </td>
                  <td className="table-cell text-right tabular-nums whitespace-nowrap ncc-master-col-revenue">
                    {formatCurrencyFull(s.purchasedRevenue)}
                  </td>
                  <td className="table-cell ncc-master-col-eval">
                    {s.latestEvaluation ? (
                      <span
                        className="line-clamp-2"
                        title={`${s.latestEvaluation.period} - ${s.latestEvaluation.gradeLabel || s.latestEvaluation.grade} - ${s.latestEvaluation.evaluatedAt}`}
                      >
                        {s.latestEvaluation.period} - {s.latestEvaluation.gradeLabel || s.latestEvaluation.grade}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="table-cell text-right tabular-nums ncc-master-col-kpi">
                    {s.latestEvaluation ? s.latestEvaluation.score : '—'}
                  </td>
                  <td className="table-cell text-center hrm-table-col-actions">
                    <Dropdown trigger="Tác vụ" items={rowActions(s)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && !isLoading && (
        <Pagination
          embedded
          itemLabel="NCC"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalItems={totalCount}
        />
      )}
    </>
  );
}
