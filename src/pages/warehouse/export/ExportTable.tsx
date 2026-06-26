import { Eye, Check, Send, Pencil } from 'lucide-react';
import type { Export } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../../lib/wms/messages';
import { exportProjectLabel } from './exportUtils';

interface ExportTableProps {
  rows: Export[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onOpenDetail: (exp: Export) => void;
  onEdit?: (exp: Export) => void;
  onSubmit: (exp: Export) => void;
  onApprove: (exp: Export) => void;
}

export default function ExportTable({
  rows,
  isLoading,
  isError,
  error,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
}: ExportTableProps) {
  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell">Kho dự án</th>
            <th className="table-header-cell">Mã tham chiếu</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-center w-16">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={5} />
          ) : isError ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadExports)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message={WMS_EMPTY.noExports} />
              </td>
            </tr>
          ) : (
            rows.map(exp => (
              <tr
                key={exp.id}
                className="table-row wms-inventory-row--interactive"
                onClick={() => onOpenDetail(exp)}
              >
                <td className="table-cell">
                  <VoucherCodeCell code={exp.voucherCode} voucher={exp} />
                </td>
                <td className="table-cell max-w-[220px]">
                  <span className="line-clamp-1" title={exportProjectLabel(exp)}>
                    {exportProjectLabel(exp)}
                  </span>
                </td>
                <td className="table-cell">{exp.soCode || '—'}</td>
                <td className="table-cell text-center">
                  <VoucherStatusCell
                    voucherKind="export"
                    status={exp.status}
                    approvedBy={exp.approvedBy}
                    approvedAt={exp.approvedAt}
                  />
                </td>
                <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { label: 'Xem chi tiết', icon: Eye, onClick: () => onOpenDetail(exp) },
                      ...(exp.status === 'draft' || exp.status === 'pending'
                        ? [{ label: 'Sửa phiếu', icon: Pencil, onClick: () => onEdit?.(exp) }]
                        : []),
                      ...(exp.status === 'draft'
                        ? [{ label: 'Chốt dự kiến', icon: Send, onClick: () => onSubmit(exp) }]
                        : []),
                      ...(exp.status === 'pending'
                        ? [{ label: 'Duyệt thực tế', icon: Check, onClick: () => onApprove(exp) }]
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
