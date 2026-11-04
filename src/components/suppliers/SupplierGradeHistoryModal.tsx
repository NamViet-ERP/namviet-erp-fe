import { History, User, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
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
    >
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Đang tải lịch sử...</div>
        ) : errorMessage ? (
          <div className="py-8 text-center text-xs text-red-500">{errorMessage}</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Chưa có lịch sử chuyển hạng
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nhà cung cấp này chưa thực hiện đánh giá thăng hạng nào qua quy chuẩn 50-20-20-10.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-3 font-semibold">Thời gian</th>
                  <th className="py-3 px-3 font-semibold">Chuyển hạng</th>
                  <th className="py-3 px-3 font-semibold">Tổng điểm</th>
                  <th className="py-3 px-3 font-semibold">Chi tiết (50-20-20-10)</th>
                  <th className="py-3 px-3 font-semibold">Người đánh giá</th>
                  <th className="py-3 px-3 font-semibold">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => {
                  const isPromoted = item.oldGrade !== item.newGrade;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Hạng {item.oldGrade || 'D'}
                          </span>
                          <span className="text-slate-400">➔</span>
                          <span className={`px-2 py-0.5 rounded ${isPromoted ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300' : 'bg-slate-100 text-slate-600'}`}>
                            Hạng {item.newGrade}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-black text-sm ${item.totalScore >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                          {item.totalScore}
                        </span>
                        <span className="text-slate-400 font-medium text-[11px]">/100</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold" title="Đơn giá (max 50)">
                            G: {item.priceScore}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold" title="Hồ sơ CO/CQ (max 20)">
                            HS: {item.profileScore}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold" title="Vận chuyển/Công nợ (max 20)">
                            VC: {item.paymentScore}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold" title="Dịch vụ/Bảo hành (max 10)">
                            DV: {item.serviceScore}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.evaluatedByName || 'Hệ thống'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={item.reason || ''}>
                        {item.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-[var(--md-outline-variant)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
