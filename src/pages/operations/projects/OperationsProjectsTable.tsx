import { Link } from 'react-router-dom';
import { Activity, ArrowRight, FolderKanban, Pencil } from 'lucide-react';
import PermissionGate from '../../../components/auth/PermissionGate';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatPmDisplayName } from '../../../lib/projectPersonnel';
import { projectStatusBadge } from '../../../lib/wms/projectStatusBadge';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { projectStatusLabel } from './useOperationsProjectListController';

interface OperationsProjectsTableProps {
  items: WarehouseProjectApiDto[];
  isLoading: boolean;
  hasFilters: boolean;
  page: number;
  pageSize: ListPageSize;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  onEdit: (row: WarehouseProjectApiDto) => void;
}

export default function OperationsProjectsTable({
  items,
  isLoading,
  hasFilters,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
}: OperationsProjectsTableProps) {
  return (
    <TableShell
      tableClassName="wms-inventory-table project-warehouse-table project-warehouse-table--wide"
      colSpan={9}
      loading={isLoading}
      skeletonRows={5}
      isEmpty={items.length === 0}
      emptyMessage={
        hasFilters
          ? 'Không tìm thấy dự án phù hợp bộ lọc.'
          : 'Chưa có dự án nào. Bấm "Thêm dự án" để bắt đầu.'
      }
      emptyIcon={FolderKanban}
      pagination={
        totalCount > 0 && !isLoading
          ? {
              embedded: true,
              itemLabel: 'dự án',
              currentPage: page,
              totalPages,
              onPageChange,
              pageSize,
              onPageSizeChange,
              totalItems: totalCount,
            }
          : undefined
      }
      header={(
        <tr>
          <th className="table-header-cell whitespace-nowrap project-col-code">Mã DA</th>
          <th className="table-header-cell project-col-name">Tên dự án</th>
          <th className="table-header-cell project-col-client">Khách hàng</th>
          <th className="table-header-cell project-col-pm">PIC / Quản lý</th>
          <th className="table-header-cell project-col-sc">Thành viên SC</th>
          <th className="table-header-cell project-col-date whitespace-nowrap">Ngày bắt đầu</th>
          <th className="table-header-cell project-col-date whitespace-nowrap">Ngày kết thúc</th>
          <th className="table-header-cell text-center project-col-status">Trạng thái</th>
          <th className="table-header-cell text-center whitespace-nowrap project-col-actions">Tác vụ</th>
        </tr>
      )}
    >
      {items.map(row => (
        <tr key={row.projectCode} className="table-row">
          <td className="table-cell whitespace-nowrap project-col-code">
            <EntityCodeLink
              code={row.projectCode}
              to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
            />
          </td>
          <td className="table-cell font-semibold project-col-name">
            <span title={row.projectName}>{row.projectName}</span>
          </td>
          <td className="table-cell project-col-client">
            {row.clientName?.trim() || <span className="hrm-empty-cell">-</span>}
          </td>
          <td className="table-cell project-col-pm">
            {formatPmDisplayName(row.pmName)}
          </td>
          <td className="table-cell project-col-sc">
            <span title={row.scMembers ?? undefined}>
              {row.scMembers?.trim() || <span className="hrm-empty-cell">-</span>}
            </span>
          </td>
          <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
            {formatDateCell(row.startDate)}
          </td>
          <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
            {formatDateCell(row.endDate ?? undefined)}
          </td>
          <td className="table-cell text-center project-col-status">
            <Badge status={projectStatusBadge(row.status)} label={projectStatusLabel(row.status)} />
          </td>
          <td className="table-cell text-center project-col-actions">
            <div className="flex items-center justify-center gap-1.5">
              <Link
                className="btn btn-tonal btn-sm flex items-center gap-1"
                to={`/operations/executive-360?project=${encodeURIComponent(row.projectCode)}`}
                title="Xem Bảng điều hành 360°"
              >
                <Activity size={14} aria-hidden />
                <span>360°</span>
              </Link>
              <PermissionGate permission="wms.projects.update">
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  leftIcon={Pencil}
                  onClick={() => onEdit(row)}
                  title="Sửa thông tin dự án"
                >
                  Sửa
                </Button>
              </PermissionGate>
              <Link
                to={`/operations/projects?project=${encodeURIComponent(row.projectCode)}`}
                className="btn btn-text btn-sm flex items-center gap-1"
                title="Xem tiến độ cung ứng"
              >
                <span>Tiến độ cung ứng</span>
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
