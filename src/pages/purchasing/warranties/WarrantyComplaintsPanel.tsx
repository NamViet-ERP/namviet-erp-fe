import { Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type { PurchaseWarrantyClaimListApiDto } from '../../../services/purchaseWarrantiesService';
import {
  CLAIM_STATUS_OPTIONS,
  claimStatusLabel,
  defectTypeLabel,
  severityLabel,
  severityTone,
  statusLabel,
  statusTone,
} from './warrantyLabels';

const COL_COUNT = 9;

interface WarrantyComplaintsPanelProps {
  rows: PurchaseWarrantyClaimListApiDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  page: number;
  pageSize: ListPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  onOpenWarranty: (warrantyId: string) => void;
  onCreate?: () => void;
  canCreate?: boolean;
}

export default function WarrantyComplaintsPanel({
  rows,
  isLoading,
  isError,
  error,
  search,
  onSearchChange,
  status,
  onStatusChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpenWarranty,
  onCreate,
  canCreate,
}: WarrantyComplaintsPanelProps) {
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const errorMessage = isError ? getApiErrorMessage(error, 'Không tải được phiếu khiếu nại.') : null;
  const pagination = rows.length > 0 && !isLoading
    ? {
        embedded: true,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
        pageSize,
        onPageChange,
        onPageSizeChange: (size: ListPageSize) => {
          onPageSizeChange(size);
          onPageChange(1);
        },
        totalItems: rows.length,
      }
    : undefined;

  return (
    <>
      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
            <input
              className="form-input md:col-span-2"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm mã phiếu, vật tư, NCC, PO"
              aria-label="Tìm khiếu nại bảo hành"
            />
            <SelectField
              value={status}
              onChange={onStatusChange}
              options={CLAIM_STATUS_OPTIONS}
              aria-label="Lọc trạng thái khiếu nại"
              selectClassName="form-input"
            />
            {canCreate && onCreate ? (
              <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={onCreate}>
                Tạo khiếu nại mới
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={COL_COUNT}
        loading={isLoading}
        error={errorMessage}
        isEmpty={pageRows.length === 0}
        emptyMessage="Chưa có khiếu nại bảo hành nào."
        pagination={pagination}
        header={(
          <tr>
            <th className="table-header-cell">Mã</th>
            <th className="table-header-cell">Ngày</th>
            <th className="table-header-cell">NCC</th>
            <th className="table-header-cell">Hàng hoá</th>
            <th className="table-header-cell">Loại lỗi</th>
            <th className="table-header-cell">Mức độ</th>
            <th className="table-header-cell">Bảo hành</th>
            <th className="table-header-cell">Trạng thái</th>
            <th className="table-header-cell warranty-col-actions" />
          </tr>
        )}
      >
        {pageRows.map(row => (
          <tr key={row.id} className="table-row">
            <td className="table-cell font-mono">{row.ticketCode}</td>
            <td className="table-cell tabular-nums">
              {formatDateCell(row.createdAt)}
            </td>
            <td className="table-cell">{row.supplierName || '-'}</td>
            <td className="table-cell">
              <div className="font-semibold">{row.materialName}</div>
              <div className="font-mono text-[var(--md-on-surface-variant)]">
                {row.materialCode || row.poCode}
              </div>
            </td>
            <td className="table-cell">{defectTypeLabel(row.defectType)}</td>
            <td className="table-cell">
              <span className={`pur-erp__pill pur-erp__pill--${severityTone(row.severity)}`}>
                {severityLabel(row.severity)}
              </span>
            </td>
            <td className="table-cell">
              <span className={`pur-erp__pill pur-erp__pill--${statusTone(row.warrantyStatus)}`}>
                {statusLabel(row.warrantyStatus)}
              </span>
            </td>
            <td className="table-cell">
              <span className={`pur-erp__pill pur-erp__pill--${statusTone(row.status)}`}>
                {claimStatusLabel(row.status)}
              </span>
            </td>
            <td className="table-cell warranty-col-actions">
              <Button
                type="button"
                variant="filled"
                size="sm"
                onClick={() => onOpenWarranty(row.warrantyId)}
              >
                Xử lý
              </Button>
            </td>
          </tr>
        ))}
      </TableShell>
    </>
  );
}
