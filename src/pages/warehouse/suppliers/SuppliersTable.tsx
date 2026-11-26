import { Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
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
      <SelectField
        variant="hrm"
        className="hrm-filter-select-wrap"
        selectClassName="hrm-filter-select"
        aria-label="Hạng"
        value={ratingFilter}
        placeholder="Tất cả hạng"
        options={RATING_OPTIONS.map(r => ({ value: r, label: `Hạng ${r}` }))}
        onChange={onRatingFilterChange}
      />
      <SelectField
        variant="hrm"
        className="hrm-filter-select-wrap"
        selectClassName="hrm-filter-select"
        aria-label="Trạng thái"
        value={statusFilter}
        placeholder="Tất cả trạng thái"
        options={[
          { value: SUPPLIER_APPROVAL.New, label: 'Mới - chờ duyệt' },
          { value: SUPPLIER_APPROVAL.Approved, label: 'Đã duyệt' },
          { value: SUPPLIER_APPROVAL.Rejected, label: 'Từ chối' },
        ]}
        onChange={onStatusFilterChange}
      />
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
    <TableShell
      tableClassName="w-full border-collapse hrm-table ncc-master-table"
      colSpan={COL_COUNT}
      loading={isLoading}
      error={isError ? WMS_ERROR.loadSuppliers : null}
      isEmpty={items.length === 0}
      emptyMessage={hasActiveFilters ? 'Không tìm thấy NCC phù hợp.' : 'Chưa có nhà cung cấp nào.'}
      emptyAction={
        hasActiveFilters ? null : (
          <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={onOpenCreate}>
            Thêm NCC đầu tiên
          </Button>
        )
      }
      pagination={
        totalCount > 0 && !isLoading
          ? {
              embedded: true,
              itemLabel: 'NCC',
              currentPage: page,
              totalPages,
              onPageChange,
              pageSize,
              onPageSizeChange,
              totalItems: totalCount,
            }
          : undefined
      }
      header={
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
      }
    >
      {items.map(s => (
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
              <div className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] font-mono">
                MST: {s.taxCode}
              </div>
            )}
          </td>
          <td className="table-cell ncc-master-col-phone">
            {s.primaryContact ? (
              <div className="flex flex-col text-[length:var(--fs-xs)]">
                <span className="font-semibold text-[var(--md-on-surface)] flex items-center gap-1">
                  <span className="truncate max-w-[140px]" title={s.primaryContact.fullName}>
                    {s.primaryContact.fullName}
                  </span>
                  {s.contactCount && s.contactCount > 1 ? (
                    <span
                      className="inline-flex items-center text-[length:var(--fs-micro)] font-normal text-[var(--md-on-primary-container)] bg-[var(--md-primary-container)] px-1 py-0.5 rounded-[var(--radius-xs)]"
                      title={`${s.contactCount} liên hệ`}
                    >
                      +{s.contactCount - 1}
                    </span>
                  ) : null}
                </span>
                <span className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] tabular-nums">
                  {s.primaryContact.phone || s.contactPhone || '—'}
                </span>
                {s.primaryContact.position && (
                  <span
                    className="text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)] opacity-75 truncate max-w-[140px]"
                    title={s.primaryContact.position}
                  >
                    {s.primaryContact.position}
                  </span>
                )}
              </div>
            ) : s.contactPhone ? (
              <span className="tabular-nums text-[length:var(--fs-xs)]">{s.contactPhone}</span>
            ) : (
              <span className="text-[var(--md-on-surface-variant)] italic text-[length:var(--fs-xs)]">
                Chưa có liên hệ
              </span>
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
      ))}
    </TableShell>
  );
}
