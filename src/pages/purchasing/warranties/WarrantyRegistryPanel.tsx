import { Plus } from 'lucide-react';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import Button from '../../../components/ui/Button';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
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
  const errorMessage = isError ? getApiErrorMessage(error, 'Không tải được danh sách BH.') : null;
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
            <SelectField
              value={status}
              onChange={onStatusChange}
              options={WARRANTY_STATUS_OPTIONS}
              aria-label="Lọc trạng thái"
              selectClassName="form-input"
            />
          </div>
        </div>
      </div>

      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={COL_COUNT}
        loading={isLoading}
        error={errorMessage}
        isEmpty={pageRows.length === 0}
        emptyMessage="Chưa có lô hàng có bảo hành. Set tháng BH trên dòng PO rồi nhập kho / Đồng bộ."
        pagination={pagination}
        header={(
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
        )}
      >
        {pageRows.map(row => (
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
            <td className="table-cell warranty-col-project">
              {row.projectCode ? (
                <EntityCodeLink
                  code={row.projectCode}
                  to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                />
              ) : '-'}
            </td>
            <td className="table-cell warranty-col-po">
              {row.poCode ? (
                <EntityCodeLink
                  code={row.poCode}
                  to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                />
              ) : '-'}
            </td>
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
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => onCreateComplaint(row)}
                >
                  Tạo khiếu nại
                </Button>
              ) : null}
            </td>
          </tr>
        ))}
      </TableShell>
    </>
  );
}
