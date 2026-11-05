import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Award, History, Search } from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers';
import { queryKeys } from '../../services/queryKeys';
import type { SupplierApiDto } from '../../services/suppliersService';
import SupplierTierEvaluationModal from './SupplierTierEvaluationModal';
import SupplierGradeHistoryModal from './SupplierGradeHistoryModal';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

function TierBadge({ rating }: { rating?: string | null }) {
  const r = (rating || 'D').toUpperCase();
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  if (r === 'A') {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
  } else if (r === 'B') {
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700';
  } else if (r === 'C') {
    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700';
  } else if (r === 'D') {
    badgeColor = 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
      Hạng {r}
    </span>
  );
}

export default function SupplierTierGradingPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<SupplierApiDto | null>(null);
  const [historySupplier, setHistorySupplier] = useState<SupplierApiDto | null>(null);

  const { data, isLoading, isError } = useSuppliers({
    page,
    pageSize,
    search: search || undefined,
    rating: ratingFilter || undefined,
    isBlacklisted: false,
  });

  const suppliers = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleEvaluationSuccess = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo mã, tên nhà cung cấp..."
              className="form-input pl-9 text-xs w-full"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
            className="form-select text-xs"
          >
            <option value="">Tất cả phân hạng (A/B/C/D)</option>
            <option value="A">Hạng A — Đối tác chiến lược (Chiết khấu sâu, ưu tiên cao nhất)</option>
            <option value="B">Hạng B — Nhà cung cấp thân thiết (Cạnh tranh, uy tín)</option>
            <option value="C">Hạng C — Nhà cung cấp tiêu chuẩn</option>
            <option value="D">Hạng D — Nhà cung cấp mới / Đang thử thách</option>
          </select>
        </div>

        <div className="text-xs text-[var(--md-on-surface-variant)] self-end sm:self-center">
          Tổng số: <strong className="text-[var(--md-on-surface)]">{totalCount}</strong> NCC
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-variant05)] text-[var(--md-on-surface-variant)] uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-3">Mã NCC</th>
              <th className="py-3 px-3">Tên Nhà Cung Cấp</th>
              <th className="py-3 px-3">Loại hình & Phạm vi</th>
              <th className="py-3 px-3 text-center">Hạng hiện tại</th>
              <th className="py-3 px-3 text-right">Doanh số đã mua</th>
              <th className="py-3 px-3">Đánh giá gần nhất</th>
              <th className="py-3 px-3 text-center">Thao tác thăng hạng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--md-outline-variant)]">
            {isLoading ? (
              <TableSkeletonRows colSpan={7} />
            ) : isError ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-rose-500">
                  Lỗi tải danh sách nhà cung cấp. Vui lòng thử lại.
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="Không tìm thấy nhà cung cấp nào phù hợp bộ lọc." />
                </td>
              </tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} className="hover:bg-[var(--md-surface-variant05)] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[var(--md-primary)]">
                    {s.supplierCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{s.supplierName}</div>
                    {s.taxCode && (
                      <div className="text-[11px] text-slate-500 font-mono">MST: {s.taxCode}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    <div>{s.supplierType || 'Nhà phân phối'}</div>
                    <div className="text-[11px] text-slate-400">{s.scope || 'Trong nước'}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <TierBadge rating={s.rating} />
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {formatCurrencyFull(s.purchasedRevenue)}
                  </td>
                  <td className="py-3 px-3">
                    {s.latestEvaluation ? (
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {s.latestEvaluation.score}đ
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">({s.latestEvaluation.evaluatedAt})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa đánh giá</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEvaluatingSupplier(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--md-primary)] text-white hover:opacity-90 transition-all shadow-sm"
                        title="Chấm điểm thăng hạng 50-20-20-10"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Đánh giá thăng hạng
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistorySupplier(s)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-variant05)] transition-all"
                        title="Xem lịch sử chuyển hạng"
                      >
                        <History className="w-3.5 h-3.5" />
                        Lịch sử
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          totalItems={totalCount}
        />
      )}

      {evaluatingSupplier && (
        <SupplierTierEvaluationModal
          supplier={evaluatingSupplier}
          isOpen={Boolean(evaluatingSupplier)}
          onClose={() => setEvaluatingSupplier(null)}
          onSuccess={handleEvaluationSuccess}
        />
      )}

      {historySupplier && (
        <SupplierGradeHistoryModal
          supplier={historySupplier}
          isOpen={Boolean(historySupplier)}
          onClose={() => setHistorySupplier(null)}
        />
      )}
    </div>
  );
}
