import { Plus } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type { ListPageSize } from '../../../constants/pagination';
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
            <select
              className="form-input"
              value={status}
              onChange={e => onStatusChange(e.target.value)}
              aria-label="Lọc trạng thái khiếu nại"
            >
              {CLAIM_STATUS_OPTIONS.map(o => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
            {canCreate && onCreate ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
                <Plus size={14} aria-hidden />
                Tạo khiếu nại mới
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
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
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={COL_COUNT} />
            ) : isError ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState message={getApiErrorMessage(error, 'Không tải được phiếu khiếu nại.')} />
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState message="Chưa có khiếu nại bảo hành nào." />
                </td>
              </tr>
            ) : (
              pageRows.map(row => (
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
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenWarranty(row.warrantyId)}
                    >
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && !isLoading ? (
        <Pagination
          embedded
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(rows.length / pageSize))}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={size => {
            onPageSizeChange(size);
            onPageChange(1);
          }}
          totalItems={rows.length}
        />
      ) : null}
    </>
  );
}
