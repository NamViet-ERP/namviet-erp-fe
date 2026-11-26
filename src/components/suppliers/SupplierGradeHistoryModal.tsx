import { History, User, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TableShell from '../ui/TableShell';
import { suppliersService, type SupplierApiDto, type SupplierTierEvaluationDto } from '../../services/suppliersService';
import { getApiErrorMessage } from '../../lib/apiClient';

interface SupplierGradeHistoryModalProps {
  supplier: SupplierApiDto;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplierGradeHistoryModal({
  supplier,
  isOpen,
  onClose,
}: SupplierGradeHistoryModalProps) {
  const {
    data: history = [],
    isLoading: loading,
    error,
  } = useQuery<SupplierTierEvaluationDto[]>({
    queryKey: ['supplierGradeHistory', supplier.id],
    queryFn: () => suppliersService.getGradeHistory(supplier.id),
    enabled: isOpen && Boolean(supplier.id),
  });

  if (!isOpen) return null;

  const errorMessage = error ? getApiErrorMessage(error, 'Lỗi tải lịch sử chuyển hạng.') : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Lịch Sử Đánh Giá & Chuyển Hạng NCC"
      subtitle={`${supplier.supplierCode} — ${supplier.supplierName} (Hiện tại: Hạng ${supplier.rating || 'D'})`}
      footer={(
        <Button type="button" variant="outlined" size="sm" onClick={onClose}>
          Đóng
        </Button>
      )}
    >
      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={6}
        loading={loading}
        error={errorMessage}
        isEmpty={history.length === 0}
        emptyIcon={History}
        emptyMessage="Chưa có lịch sử chuyển hạng"
        emptyAction={(
          <p className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
            Nhà cung cấp này chưa thực hiện đánh giá thăng hạng nào qua quy chuẩn 50-20-20-10.
          </p>
        )}
        header={(
          <tr>
            <th className="table-header-cell">Thời gian</th>
            <th className="table-header-cell">Chuyển hạng</th>
            <th className="table-header-cell">Tổng điểm</th>
            <th className="table-header-cell">Chi tiết (50-20-20-10)</th>
            <th className="table-header-cell">Người đánh giá</th>
            <th className="table-header-cell">Lý do</th>
          </tr>
        )}
      >
        {history.map(item => {
          const isPromoted = item.oldGrade !== item.newGrade;
          return (
            <tr key={item.id} className="table-row">
              <td className="table-cell whitespace-nowrap text-[var(--md-on-surface-variant)]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]" aria-hidden />
                  <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </td>
              <td className="table-cell whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)]">
                    Hạng {item.oldGrade || 'D'}
                  </span>
                  <span className="text-[var(--md-on-surface-variant)]" aria-hidden>➔</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      isPromoted
                        ? 'bg-[var(--md-success-container)] text-[var(--md-on-success-container)]'
                        : 'bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)]'
                    }`}
                  >
                    Hạng {item.newGrade}
                  </span>
                </div>
              </td>
              <td className="table-cell whitespace-nowrap tabular-nums">
                <span
                  className={`font-bold text-[length:var(--fs-sm)] ${
                    item.totalScore >= 80 ? 'text-[var(--md-success)]' : 'text-[var(--md-warning)]'
                  }`}
                >
                  {item.totalScore}
                </span>
                <span className="text-[var(--md-on-surface-variant)] font-medium text-[length:var(--fs-xs)]">
                  /100
                </span>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1.5 text-[length:var(--fs-xs)] tabular-nums">
                  <span
                    className="px-1.5 py-0.5 rounded bg-[var(--md-info-container)] text-[var(--md-on-info-container)] font-semibold"
                    title="Đơn giá (max 50)"
                  >
                    G: {item.priceScore}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-semibold"
                    title="Hồ sơ CO/CQ (max 20)"
                  >
                    HS: {item.profileScore}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] font-semibold"
                    title="Vận chuyển/Công nợ (max 20)"
                  >
                    VC: {item.paymentScore}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded bg-[var(--md-success-container)] text-[var(--md-on-success-container)] font-semibold"
                    title="Dịch vụ/Bảo hành (max 10)"
                  >
                    DV: {item.serviceScore}
                  </span>
                </div>
              </td>
              <td className="table-cell whitespace-nowrap text-[var(--md-on-surface-variant)]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]" aria-hidden />
                  <span>{item.evaluatedByName || 'Hệ thống'}</span>
                </div>
              </td>
              <td className="table-cell text-[var(--md-on-surface)] max-w-xs truncate" title={item.reason || ''}>
                {item.reason || '—'}
              </td>
            </tr>
          );
        })}
      </TableShell>
    </Modal>
  );
}
