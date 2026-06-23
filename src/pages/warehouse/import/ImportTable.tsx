import { Eye, Check, Send } from 'lucide-react';
import type { Import } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../../lib/wms/messages';

interface ImportTableProps {
  rows: Import[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  projectName: (code?: string) => string;
  onOpenDetail: (imp: Import) => void;
  onSubmit: (imp: Import) => void;
  onApprove: (imp: Import) => void;
}

export default function ImportTable({
  rows,
  isLoading,
  isError,
  error,
  projectName,
  onOpenDetail,
  onSubmit,
  onApprove,
}: ImportTableProps) {
  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell">Kho dự án</th>
            <th className="table-header-cell">NCC</th>
            <th className="table-header-cell">Mã tham chiếu</th>
            <th className="table-header-cell text-right">Tổng GT</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-center w-16">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={7} />
          ) : isError ? (
            <tr>
              <td colSpan={7}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadImports)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState message={WMS_EMPTY.noImports} />
              </td>
            </tr>
          ) : (
            rows.map(imp => (
              <tr
                key={imp.id}
                className="table-row wms-inventory-row--interactive"
                onClick={() => onOpenDetail(imp)}
              >
                <td className="table-cell font-mono text-sm font-semibold text-[var(--md-primary)]">
                  {imp.voucherCode}
                </td>
                <td className="table-cell max-w-[200px]">
                  <span className="line-clamp-1" title={projectName(imp.project)}>
                    {imp.project ? projectName(imp.project) : '—'}
                  </span>
                </td>
                <td className="table-cell">{imp.supplier}</td>
                <td className="table-cell">{imp.referenceCode}</td>
                <td className="table-cell text-right tabular-nums">{formatCurrency(imp.totalValue)}</td>
                <td className="table-cell text-center">
                  <VoucherStatusCell
                    status={imp.status}
                    approvedBy={imp.approvedBy}
                    approvedAt={imp.approvedAt}
                  />
                </td>
                <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { label: 'Xem chi tiết', icon: Eye, onClick: () => onOpenDetail(imp) },
                      ...(imp.status === 'draft'
                        ? [{ label: 'Chốt phiếu', icon: Send, onClick: () => onSubmit(imp) }]
                        : []),
                      ...(imp.status === 'draft' || imp.status === 'pending'
                        ? [{ label: 'Thủ kho duyệt', icon: Check, onClick: () => onApprove(imp) }]
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
