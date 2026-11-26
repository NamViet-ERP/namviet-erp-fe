import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Award, History } from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers';
import { queryKeys } from '../../services/queryKeys';
import type { SupplierApiDto } from '../../services/suppliersService';
import SupplierTierEvaluationModal from './SupplierTierEvaluationModal';
import SupplierGradeHistoryModal from './SupplierGradeHistoryModal';
import Button from '../ui/Button';
import FilterToolbar from '../ui/FilterToolbar';
import SelectField from '../ui/SelectField';
import TableShell from '../ui/TableShell';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

const TIER_BADGE_TONE: Record<string, string> = {
  A: 'bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)] border-[var(--tint-warning-border)]',
  B: 'bg-[var(--md-info-container)] text-[var(--md-on-info-container)] border-[var(--md-outline-variant)]',
  C: 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border-[var(--md-outline-variant)]',
  D: 'bg-[var(--md-error-container)] text-[var(--md-on-error-container)] border-[var(--md-outline-variant)]',
};
const DEFAULT_TIER_TONE =
  'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)]';

const RATING_FILTER_OPTIONS = [
  { value: 'A', label: 'Hạng A — Đối tác chiến lược (Chiết khấu sâu, ưu tiên cao nhất)' },
  { value: 'B', label: 'Hạng B — Nhà cung cấp thân thiết (Cạnh tranh, uy tín)' },
  { value: 'C', label: 'Hạng C — Nhà cung cấp tiêu chuẩn' },
  { value: 'D', label: 'Hạng D — Nhà cung cấp mới / Đang thử thách' },
];

function TierBadge({ rating }: { rating?: string | null }) {
  const r = (rating || 'D').toUpperCase();
  const badgeColor = TIER_BADGE_TONE[r] ?? DEFAULT_TIER_TONE;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[length:var(--fs-xs)] font-bold border ${badgeColor}`}>
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
  const hasActiveFilters = Boolean(search || ratingFilter);

  const handleEvaluationSuccess = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
  };

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={value => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo mã, tên nhà cung cấp..."
        filters={(
          <SelectField
            aria-label="Lọc phân hạng"
            selectClassName="form-select text-xs"
            value={ratingFilter}
            placeholder="Tất cả phân hạng (A/B/C/D)"
            options={RATING_FILTER_OPTIONS}
            onChange={value => {
              setRatingFilter(value);
              setPage(1);
            }}
          />
        )}
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setSearch('');
          setRatingFilter('');
          setPage(1);
        }}
        actions={(
          <div className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
            Tổng số: <strong className="text-[var(--md-on-surface)]">{totalCount}</strong> NCC
          </div>
        )}
      />

      <TableShell
        tableClassName="wms-inventory-table"
        colSpan={7}
        loading={isLoading}
        error={isError ? 'Lỗi tải danh sách nhà cung cấp. Vui lòng thử lại.' : null}
        isEmpty={suppliers.length === 0}
        emptyMessage="Không tìm thấy nhà cung cấp nào phù hợp bộ lọc."
        pagination={
          totalCount > 0 && !isLoading
            ? {
                embedded: true,
                itemLabel: 'NCC',
                currentPage: page,
                totalPages,
                onPageChange: setPage,
                pageSize,
                onPageSizeChange: s => {
                  setPageSize(s);
                  setPage(1);
                },
                totalItems: totalCount,
              }
            : undefined
        }
        header={(
          <tr>
            <th className="table-header-cell">Mã NCC</th>
            <th className="table-header-cell">Tên Nhà Cung Cấp</th>
            <th className="table-header-cell">Loại hình &amp; Phạm vi</th>
            <th className="table-header-cell text-center">Hạng hiện tại</th>
            <th className="table-header-cell text-right">Doanh số đã mua</th>
            <th className="table-header-cell">Đánh giá gần nhất</th>
            <th className="table-header-cell text-center">Thao tác thăng hạng</th>
          </tr>
        )}
      >
        {suppliers.map(s => (
          <tr key={s.id} className="table-row">
            <td className="table-cell font-mono font-bold text-[var(--md-primary)] whitespace-nowrap">
              {s.supplierCode}
            </td>
            <td className="table-cell">
              <div className="font-semibold text-[var(--md-on-surface)]">{s.supplierName}</div>
              {s.taxCode ? (
                <div className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] font-mono">
                  MST: {s.taxCode}
                </div>
              ) : null}
            </td>
            <td className="table-cell text-[var(--md-on-surface)]">
              <div>{s.supplierType || 'Nhà phân phối'}</div>
              <div className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
                {s.scope || 'Trong nước'}
              </div>
            </td>
            <td className="table-cell text-center">
              <TierBadge rating={s.rating} />
            </td>
            <td className="table-cell text-right font-mono font-semibold tabular-nums whitespace-nowrap">
              {formatCurrencyFull(s.purchasedRevenue)}
            </td>
            <td className="table-cell">
              {s.latestEvaluation ? (
                <div>
                  <span className="font-semibold text-[var(--md-on-surface)]">
                    {s.latestEvaluation.score}đ
                  </span>{' '}
                  <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
                    ({s.latestEvaluation.evaluatedAt})
                  </span>
                </div>
              ) : (
                <span className="text-[var(--md-on-surface-variant)] italic">Chưa đánh giá</span>
              )}
            </td>
            <td className="table-cell text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={Award}
                  onClick={() => setEvaluatingSupplier(s)}
                  title="Chấm điểm thăng hạng 50-20-20-10"
                >
                  Đánh giá thăng hạng
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  leftIcon={History}
                  onClick={() => setHistorySupplier(s)}
                  title="Xem lịch sử chuyển hạng"
                >
                  Lịch sử
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {evaluatingSupplier ? (
        <SupplierTierEvaluationModal
          supplier={evaluatingSupplier}
          isOpen={Boolean(evaluatingSupplier)}
          onClose={() => setEvaluatingSupplier(null)}
          onSuccess={handleEvaluationSuccess}
        />
      ) : null}

      {historySupplier ? (
        <SupplierGradeHistoryModal
          supplier={historySupplier}
          isOpen={Boolean(historySupplier)}
          onClose={() => setHistorySupplier(null)}
        />
      ) : null}
    </>
  );
}
