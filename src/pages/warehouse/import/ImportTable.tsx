import { Eye, Check, Send, Pencil } from 'lucide-react';
import type { Import } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
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
  onEdit?: (imp: Import) => void;
  onSubmit: (imp: Import) => void;
  onApprove: (imp: Import) => void;
  canEdit?: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
}

export default function ImportTable({
  rows,
  isLoading,
  isError,
  error,
  projectName,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
  canEdit = false,
  canSubmit = false,
  canApprove = false,
}: ImportTableProps) {
  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell text-center whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell text-center">Kho dự án</th>
            <th className="table-header-cell text-center">Nhà cung cấp</th>
            <th className="table-header-cell text-center">Mã đơn hàng</th>
            <th className="table-header-cell text-center">Mã KHMH</th>
            <th className="table-header-cell text-center">Tổng giá trị</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-center w-16">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={8} />
          ) : isError ? (
            <tr>
              <td colSpan={8}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadImports)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8}>
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
                <td className="table-cell text-center">
                  <VoucherCodeCell code={imp.voucherCode} voucher={imp} />
                </td>
                <td className="table-cell text-center max-w-[200px]">
                  <span className="line-clamp-1" title={projectName(imp.project)}>
                    {imp.project ? projectName(imp.project) : '—'}
                  </span>
                </td>
                <td className="table-cell text-center">{imp.supplier || '—'}</td>
                <td className="table-cell text-center">{imp.referenceCode || '—'}</td>
                <td className="table-cell text-center">{imp.planCode?.trim() || '—'}</td>
                <td className="table-cell text-center tabular-nums">{formatCurrency(imp.totalValue)}</td>
                <td className="table-cell text-center">
                  <VoucherStatusCell
                    voucherKind="import"
                    status={imp.status}
                    approvedBy={imp.approvedBy}
                    approvedAt={imp.approvedAt}
                  />
                </td>
                <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { label: 'Xem chi tiết', icon: Eye, onClick: () => onOpenDetail(imp) },
                      ...(canEdit && (imp.status === 'draft' || imp.status === 'pending')
                        ? [{ label: 'Sửa phiếu', icon: Pencil, onClick: () => onEdit?.(imp) }]
                        : []),
                      ...(canSubmit && imp.status === 'draft'
                        ? [{ label: 'Chốt dự kiến', icon: Send, onClick: () => onSubmit(imp) }]
                        : []),
                      ...(canApprove && imp.status === 'pending'
                        ? [{ label: 'Duyệt thực tế', icon: Check, onClick: () => onApprove(imp) }]
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
