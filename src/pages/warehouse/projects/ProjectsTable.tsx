import type { ComponentProps, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Trash2, Warehouse } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { isSystemRoleAccount } from '../../../lib/projectPersonnel';
import { WMS_ERROR } from '../../../lib/wms/messages';
import { projectStatusBadge } from '../../../lib/wms/projectStatusBadge';
import type { WarehouseProjectApiDto } from '../../../types/wms';

interface ProjectsTableProps {
  items: WarehouseProjectApiDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  emptyMessage: string;
  isAdmin: boolean;
  onRowClick: (projectCode: string) => void;
  onDeleteClick: (e: MouseEvent, project: WarehouseProjectApiDto) => void;
  pagination?: ComponentProps<typeof Pagination>;
}

export default function ProjectsTable({
  items,
  isLoading,
  isError,
  error,
  emptyMessage,
  isAdmin,
  onRowClick,
  onDeleteClick,
  pagination,
}: ProjectsTableProps) {
  return (
    <TableShell
      flushTop
      tableClassName="wms-inventory-table project-warehouse-table"
      colSpan={7}
      loading={isLoading}
      isEmpty={isError || items.length === 0}
      emptyMessage={isError ? getApiErrorMessage(error, WMS_ERROR.loadProjects) : emptyMessage}
      emptyIcon={isError ? Warehouse : FolderKanban}
      pagination={pagination}
      header={
        <tr>
          <th className="table-header-cell whitespace-nowrap project-col-code">Mã kho</th>
          <th className="table-header-cell project-col-name">Tên công trình</th>
          <th className="table-header-cell project-col-pm">Thủ kho phụ trách</th>
          <th className="table-header-cell text-right project-col-count">Mặt hàng</th>
          <th className="table-header-cell project-col-date whitespace-nowrap">Ngày bắt đầu</th>
          <th className="table-header-cell text-center project-col-status">Trạng thái</th>
          <th className="table-header-cell text-center whitespace-nowrap project-col-actions">Thao tác</th>
        </tr>
      }
    >
      {items.map(p => {
        const keepers = p.warehouseKeepers ?? [];
        const keeperNode = keepers.length > 0 ? (
          <span title={keepers.map(k => k.displayName).join(', ')}>
            {keepers.map(k => k.displayName).join(', ')}
          </span>
        ) : !isSystemRoleAccount(p.pmName) ? (
          p.pmName
        ) : (
          <span className="hrm-empty-cell">—</span>
        );

        return (
          <tr
            key={p.projectCode}
            className="table-row wms-inventory-row--interactive"
            onClick={() => onRowClick(p.projectCode)}
          >
            <td className="table-cell whitespace-nowrap project-col-code">
              <EntityCodeLink
                code={p.projectCode}
                to={`/warehouse/projects/${encodeURIComponent(p.projectCode)}`}
              />
            </td>
            <td className="table-cell font-semibold project-col-name">
              <span title={p.projectName}>{p.projectName}</span>
            </td>
            <td className="table-cell project-col-pm">{keeperNode}</td>
            <td className="table-cell text-right tabular-nums project-col-count">
              {p.stockMaterialCount ?? 0}
            </td>
            <td className="table-cell project-col-date whitespace-nowrap tabular-nums">
              {formatDateCell(p.startDate)}
            </td>
            <td className="table-cell text-center project-col-status">
              <Badge status={projectStatusBadge(p.status)} />
            </td>
            <td className="table-cell text-center project-col-actions" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Link
                  to={`/warehouse/import?projectCode=${encodeURIComponent(p.projectCode)}`}
                  className="btn btn-outlined btn-sm px-2.5 py-1 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  Nhập thực tế
                </Link>
                <Link
                  to={`/warehouse/export?projectCode=${encodeURIComponent(p.projectCode)}`}
                  className="btn btn-outlined btn-sm px-2.5 py-1 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  Xuất thực tế
                </Link>
                <Link
                  to={`/warehouse/projects/${encodeURIComponent(p.projectCode)}`}
                  className="btn btn-outlined btn-sm px-2.5 py-1 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  Thẻ kho
                </Link>
                {isAdmin && (
                  (p.stockMaterialCount ?? 0) === 0 ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm w-8 h-8 p-0 inline-flex items-center justify-center text-[var(--md-error)] hover:bg-[color-mix(in_srgb,var(--md-error)_12%,transparent)]"
                      title={`Xóa kho dự án ${p.projectCode}`}
                      aria-label={`Xóa kho dự án ${p.projectCode}`}
                      onClick={e => onDeleteClick(e, p)}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <span
                      className="w-8 h-8 p-0 inline-flex items-center justify-center text-[var(--md-outline)] opacity-30 cursor-not-allowed"
                      title="Kho đã có mặt hàng, không thể xóa"
                      aria-hidden="true"
                    >
                      <Trash2 size={15} />
                    </span>
                  )
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}
