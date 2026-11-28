import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { buildSupplierGroupTree } from '../../../lib/suppliers/supplierGroupTree';
import { SUPPLIER_APPROVAL } from '../../../lib/suppliers/supplierStatus';
import { WMS_ERROR } from '../../../lib/wms/messages';
import type { DropdownItem } from '../../../types';
import type { SupplierGroupApiDto } from '../../../types/api/supplierDirectoryApi';
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
  groupOptions: SupplierGroupApiDto[];
  onGroupFilterChange: (groupId?: number) => void;
}

export function SuppliersFilterBar({
  ratingFilter,
  onRatingFilterChange,
  statusFilter,
  onStatusFilterChange,
  groupIdFromUrl,
  groupOptions,
  onGroupFilterChange,
}: SuppliersFilterBarProps) {
  const groupSelectOptions = useMemo(() => {
    const tree = buildSupplierGroupTree(groupOptions);
    const opts: { value: string; label: string }[] = [];
    for (const node of tree) {
      opts.push({ value: String(node.group.id), label: node.group.name });
      for (const child of node.children) {
        opts.push({ value: String(child.id), label: `↳ ${child.name}` });
      }
    }
    return opts;
  }, [groupOptions]);

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
      <SelectField
        variant="hrm"
        className="hrm-filter-select-wrap"
        selectClassName="hrm-filter-select"
        aria-label="Nhóm ngành hàng"
        placeholder="Tất cả nhóm ngành hàng"
        value={groupIdFromUrl ? String(groupIdFromUrl) : ''}
        options={groupSelectOptions}
        onChange={val => onGroupFilterChange(val ? Number(val) : undefined)}
      />
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
      stickyPageHeader
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
          <th className="table-header-cell ncc-master-col-contact">Người liên hệ</th>
          <th className="table-header-cell ncc-master-col-groups">Nhóm ngành hàng</th>
          <th className="table-header-cell ncc-master-col-terms">Công nợ &amp; Điều khoản</th>
          <th className="table-header-cell text-center ncc-master-col-grade">Hạng</th>
          <th className="table-header-cell text-center ncc-master-col-status">Trạng thái</th>
          <th className="table-header-cell text-right ncc-master-col-finance">Doanh số &amp; Đánh giá</th>
          <th className="table-header-cell text-center hrm-table-col-actions ncc-master-col-actions">Tác vụ</th>
        </tr>
      }
    >
      {items.map(s => {
        const nameMeta = [s.taxCode ? `MST: ${s.taxCode}` : null, s.supplierType]
          .filter(Boolean)
          .join(' · ');

        return (
          <tr key={s.id} className="table-row">
            <td className="table-cell whitespace-nowrap ncc-master-col-code">
              <span className="ncc-master-code">{s.supplierCode}</span>
            </td>
            <td className="table-cell ncc-master-col-name">
              <button
                type="button"
                className="ncc-master-name"
                onClick={() => onViewSupplier(s)}
              >
                {s.supplierName}
              </button>
              {nameMeta ? (
                <div className="ncc-master-subline">{nameMeta}</div>
              ) : null}
            </td>
            <td className="table-cell ncc-master-col-contact">
              {s.primaryContact ? (
                <div className="ncc-master-contact">
                  <div className="ncc-master-contact__header">
                    <span className="ncc-master-contact__name" title={s.primaryContact.fullName}>
                      {s.primaryContact.fullName}
                    </span>
                    {(s.contactCount ?? 0) > 1 ? (
                      <span
                        className="ncc-master-contact__more"
                        title={`${s.contactCount} liên hệ`}
                      >
                        +{(s.contactCount ?? 0) - 1}
                      </span>
                    ) : null}
                  </div>
                  <span className="ncc-master-contact__phone">
                    {s.primaryContact.phone || s.contactPhone || '—'}
                  </span>
                  {s.primaryContact.position ? (
                    <span
                      className="ncc-master-contact__role"
                      title={s.primaryContact.position}
                    >
                      {s.primaryContact.position}
                    </span>
                  ) : null}
                </div>
              ) : s.contactPhone ? (
                <span className="ncc-master-contact__phone">{s.contactPhone}</span>
              ) : (
                <span className="ncc-master-muted ncc-master-nowrap">Chưa có liên hệ</span>
              )}
            </td>
            <td className="table-cell ncc-master-col-groups">
              <IndustryGroupsCell groups={s.industryGroups ?? []} />
            </td>
            <td className="table-cell ncc-master-col-terms">
              <div className="ncc-master-debt-primary tabular-nums">
                {s.maxDebtDays} ngày · {s.creditLimit ? formatCurrencyFull(s.creditLimit) : 'Không giới hạn'}
              </div>
              {s.paymentTerms ? (
                <div className="ncc-master-subline line-clamp-1" title={s.paymentTerms}>
                  {s.paymentTerms}
                </div>
              ) : null}
            </td>
            <td className="table-cell text-center ncc-master-col-grade">
              <RatingBadge rating={s.rating} />
            </td>
            <td className="table-cell text-center ncc-master-col-status">
              <ApprovalStatusBadge status={s.approvalStatus} />
            </td>
            <td className="table-cell text-right ncc-master-col-finance">
              <div className="ncc-master-revenue tabular-nums">
                {formatCurrencyFull(s.purchasedRevenue)}
              </div>
              {s.latestEvaluation ? (
                <div
                  className="ncc-master-subline"
                  title={`${s.latestEvaluation.period} · ${s.latestEvaluation.gradeLabel || s.latestEvaluation.grade} (${s.latestEvaluation.score}đ) · ${s.latestEvaluation.evaluatedAt}`}
                >
                  {s.latestEvaluation.period} · {s.latestEvaluation.gradeLabel || s.latestEvaluation.grade} ({s.latestEvaluation.score}đ)
                </div>
              ) : (
                <div className="ncc-master-subline">Chưa đánh giá</div>
              )}
            </td>
            <td className="table-cell text-center hrm-table-col-actions ncc-master-col-actions">
              <Dropdown trigger="Tác vụ" items={rowActions(s)} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}
