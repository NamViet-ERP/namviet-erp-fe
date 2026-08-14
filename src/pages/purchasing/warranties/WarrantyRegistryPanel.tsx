import { Plus } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type { ListPageSize } from '../../../constants/pagination';
import type { PurchaseWarrantyApiDto } from '../../../services/purchaseWarrantiesService';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import {
  WARRANTY_STATUS_OPTIONS,
  anchorLabel,
  statusLabel,
  statusTone,
} from './warrantyLabels';

const COL_COUNT = 10;

interface WarrantyRegistryPanelProps {
  rows: PurchaseWarrantyApiDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  search: string;
  onSearchChange: (value: string) => void;
  projectCode: string;
  onProjectCodeChange: (value: string) => void;
  materialCode: string;
  onMaterialCodeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  projects: WarehouseProjectApiDto[];
  page: number;
  pageSize: ListPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  canCreate: boolean;
  onOpenDetail: (row: PurchaseWarrantyApiDto) => void;
  onCreateComplaint: (row: PurchaseWarrantyApiDto) => void;
}

export default function WarrantyRegistryPanel({
  rows,
  isLoading,
  isError,
  error,
  search,
  onSearchChange,
  projectCode,
  onProjectCodeChange,
  materialCode,
  onMaterialCodeChange,
  status,
  onStatusChange,
  projects,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  canCreate,
  onOpenDetail,
  onCreateComplaint,
}: WarrantyRegistryPanelProps) {
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <>
      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
            <input
              className="form-input"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm mã BH, PO, vật tư, NCC"
              aria-label="Tìm danh mục bảo hành"
            />
            <ProjectAutocomplete
              value={projectCode}
              onChange={onProjectCodeChange}
              projects={projects}
              placeholder="Lọc dự án"
            />
            <input
              className="form-input"
              value={materialCode}
              onChange={e => onMaterialCodeChange(e.target.value)}
              placeholder="Mã vật tư"
              aria-label="Lọc mã vật tư"
            />
            <select
              className="form-input"
              value={status}
              onChange={e => onStatusChange(e.target.value)}
              aria-label="Lọc trạng thái"
            >
              {WARRANTY_STATUS_OPTIONS.map(o => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell warranty-col-project">Dự án</th>
              <th className="table-header-cell warranty-col-po">PO</th>
              <th className="table-header-cell">Ngày nhận</th>
              <th className="table-header-cell text-right">SL</th>
              <th className="table-header-cell">Bảo hành</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell text-center">Số khiếu nại</th>
              <th className="table-header-cell warranty-col-actions" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={COL_COUNT} />
            ) : isError ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState message={getApiErrorMessage(error, 'Không tải được danh sách BH.')} />
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <EmptyState message="Chưa có lô hàng có bảo hành. Set tháng BH trên dòng PO rồi nhập kho / Đồng bộ." />
                </td>
              </tr>
            ) : (
              pageRows.map(row => (
                <tr
                  key={row.id}
                  className="table-row wms-inventory-row--interactive"
                  onClick={() => onOpenDetail(row)}
                >
                  <td className="table-cell">
                    <div className="font-semibold">{row.materialName}</div>
                    <div className="font-mono text-[var(--md-on-surface-variant)]">
                      {row.materialCode || row.code}
                    </div>
                  </td>
                  <td className="table-cell">{row.supplierName || '-'}</td>
                  <td className="table-cell font-mono warranty-col-project">{row.projectCode || '-'}</td>
                  <td className="table-cell font-mono warranty-col-po">{row.poCode}</td>
                  <td className="table-cell tabular-nums">
                    {formatDateCell(row.deliveryDate ?? undefined)}
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {row.quantity} {row.unit}
                  </td>
                  <td className="table-cell tabular-nums">
                    {row.warrantyMonths} tháng · {anchorLabel(row.anchorType)}
                  </td>
                  <td className="table-cell">
                    <span className={`pur-erp__pill pur-erp__pill--${statusTone(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="table-cell text-center tabular-nums">{row.claimCount}</td>
                  <td className="table-cell warranty-col-actions" onClick={e => e.stopPropagation()}>
                    {canCreate && row.status !== 'void' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onCreateComplaint(row)}
                      >
                        <Plus size={14} aria-hidden />
                        Tạo khiếu nại
                      </button>
                    ) : null}
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
