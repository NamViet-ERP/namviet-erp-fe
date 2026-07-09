import { Eye, Check, Send, Pencil } from 'lucide-react';
import type { ExportReturn } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';

interface ExportReturnTableProps {
  rows: ExportReturn[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onOpenDetail: (row: ExportReturn) => void;
  onEdit?: (row: ExportReturn) => void;
  onSubmit: (row: ExportReturn) => void;
  onApprove: (row: ExportReturn) => void;
}

export default function ExportReturnTable({
  rows,
  isLoading,
  isError,
  error,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
}: ExportReturnTableProps) {
  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table export-return-list-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã phiếu HT</th>
            <th className="table-header-cell">Phiếu xuất nguồn</th>
            <th className="table-header-cell">Kho dự án</th>
            <th className="table-header-cell">Ngày</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-center w-16">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={6} />
          ) : isError ? (
            <tr>
              <td colSpan={6}>
                <EmptyState message={getApiErrorMessage(error, 'Không tải được phiếu hoàn trả.')} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState message="Chưa có phiếu hoàn trả nào." />
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={row.id}>
                <td className="table-cell">
                  <VoucherCodeCell code={row.voucherCode} voucher={row} showCreator />
                </td>
                <td className="table-cell font-mono text-xs">{row.sourceExportCode}</td>
                <td className="table-cell export-return-project-cell" title={row.projectName || row.project || undefined}>
                  {row.projectName || row.project || '—'}
                </td>
                <td className="table-cell whitespace-nowrap">{row.date}</td>
                <td className="table-cell text-center">
                  <VoucherStatusCell
                    status={row.status}
                    voucherKind="exportReturn"
                    approvedBy={row.approvedBy}
                    approvedAt={row.approvedAt}
                  />
                </td>
                <td className="table-cell text-center">
                  <Dropdown
                    items={[
                      {
                        label: 'Xem chi tiết',
                        icon: Eye,
                        onClick: () => onOpenDetail(row),
                      },
                      ...(row.status === 'draft' || row.status === 'pending'
                        ? [{
                            label: 'Sửa phiếu',
                            icon: Pencil,
                            onClick: () => onEdit?.(row),
                          }]
                        : []),
                      ...(row.status === 'draft'
                        ? [{
                            label: 'Chốt dự kiến',
                            icon: Send,
                            onClick: () => onSubmit(row),
                          }]
                        : []),
                      ...(row.status === 'pending'
                        ? [{
                            label: 'Duyệt kho',
                            icon: Check,
                            onClick: () => onApprove(row),
                          }]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
