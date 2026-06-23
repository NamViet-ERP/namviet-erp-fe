import { Link } from 'react-router-dom';
import { PackagePlus, PackageMinus, ArrowRightLeft } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import Badge from '../ui/Badge';
import { useProjectLedger } from '../../hooks/useProjects';
import { formatCurrency } from '../../utils/formatCurrency';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import type { ProjectLedgerKind } from '../../types/wms';

interface Props {
  projectCode: string;
}

function kindLabel(kind: ProjectLedgerKind) {
  if (kind === 'import') return 'Nhập';
  if (kind === 'export') return 'Xuất';
  return 'Hoàn trả';
}

function summaryLabel(kind: ProjectLedgerKind, itemQty: number, totalValue: number | null) {
  if (kind === 'import' && totalValue != null) return `${formatCurrency(totalValue)} đ`;
  return `${itemQty} VT`;
}

export default function ProjectWarehouseHistoryTab({ projectCode }: Props) {
  const { data: rows = [], isLoading, isError, error } = useProjectLedger(projectCode);

  if (!isLoading && !isError && rows.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <EmptyState message="Chưa có phiếu nhập/xuất/chuyển gắn kho dự án này." />
        <div className="flex justify-center gap-2 flex-wrap">
          <Link
            to="/warehouse/import"
            state={{ projectCode }}
            className="btn btn-outline text-xs"
          >
            <PackagePlus size={14} /> Nhập kho
          </Link>
          <Link
            to="/warehouse/export"
            state={{ projectCode }}
            className="btn btn-outline text-xs"
          >
            <PackageMinus size={14} /> Xuất kho
          </Link>
          <Link
            to="/warehouse/transfer"
            state={{ projectCode }}
            className="btn btn-outline text-xs"
          >
            <ArrowRightLeft size={14} /> Hoàn trả
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto table-scroll">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="table-header-cell text-left">Loại</th>
            <th className="table-header-cell text-left">Mã phiếu</th>
            <th className="table-header-cell text-left">Ngày</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-right">Tóm tắt</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={5} />
          ) : isError ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadHistory)} />
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={`${row.kind}-${row.id}`} className="table-row border-b border-[var(--md-outline-variant)]">
                <td className="table-cell">
                  <span className={`wms-history-kind ${
                    row.kind === 'import'
                      ? 'wms-history-kind--import'
                      : row.kind === 'export'
                        ? 'wms-history-kind--export'
                        : 'wms-history-kind--transfer'
                  }`}>
                    {row.kind === 'import' ? <PackagePlus size={12} /> : row.kind === 'export' ? <PackageMinus size={12} /> : <ArrowRightLeft size={12} />}
                    {kindLabel(row.kind)}
                  </span>
                </td>
                <td className="table-cell font-mono font-bold">{row.voucherCode}</td>
                <td className="table-cell">{row.date}</td>
                <td className="table-cell text-center">
                  <Badge status={row.status} />
                </td>
                <td className="table-cell text-right tabular-nums">
                  {summaryLabel(row.kind, row.itemQty, row.totalValue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
