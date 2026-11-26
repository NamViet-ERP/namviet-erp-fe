import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, X } from 'lucide-react';
import PurchasingStatusBadge from '../purchasing/PurchasingStatusBadge';
import CompleteDeliveryEvaluationModal from './CompleteDeliveryEvaluationModal';
import Button from '../ui/Button';
import EntityCodeLink from '../ui/EntityCodeLink';
import FilterToolbar from '../ui/FilterToolbar';
import SelectField from '../ui/SelectField';
import TableShell from '../ui/TableShell';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { orderGradeLabel } from '../../lib/suppliers/orderEvalScoring';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCompleteSupplierDeliveryEvaluation,
  useSupplierDeliveryEvaluations,
  useSupplierModuleSettings,
} from '../../hooks/useSupplierDirectory';
import type {
  CompleteSupplierDeliveryEvaluationRequest,
  SupplierDeliveryEvaluationApiDto,
} from '../../types/api/supplierDirectoryApi';

function gradeTone(grade: string | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'warning';
  if (grade === 'C' || grade === 'D') return 'danger';
  return 'neutral';
}

function criteriaCell(value: number | null | undefined) {
  return value == null ? '—' : value;
}

export default function SupplierOrderEvaluationsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSupplierId = searchParams.get('supplierId') || '';
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(urlSupplierId);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [completing, setCompleting] = useState<SupplierDeliveryEvaluationApiDto | null>(null);
  const prevUrlSupplierIdRef = useRef(urlSupplierId);

  useEffect(() => {
    if (urlSupplierId !== prevUrlSupplierIdRef.current) {
      prevUrlSupplierIdRef.current = urlSupplierId;
      setSupplierFilter(urlSupplierId);
      setPage(1);
    }
  }, [urlSupplierId]);

  const { data: suppliers } = useSuppliers({ all: true });
  const { data: settings } = useSupplierModuleSettings();
  const supplierId = supplierFilter ? Number(supplierFilter) : undefined;
  const activeSupplier = (suppliers?.items ?? []).find(s => String(s.id) === supplierFilter);

  const handleSupplierFilterChange = (val: string) => {
    setSupplierFilter(val);
    setPage(1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val) next.set('supplierId', val);
      else next.delete('supplierId');
      return next;
    }, { replace: true });
  };

  const pendingQuery = useSupplierDeliveryEvaluations({
    status: 'pending',
    supplierId,
    search,
    page: 1,
    pageSize: 50,
  });
  const historyQuery = useSupplierDeliveryEvaluations({
    status: 'completed',
    supplierId,
    search,
    page,
    pageSize,
  });
  const completeMutation = useCompleteSupplierDeliveryEvaluation();

  const pendingItems = pendingQuery.data?.items ?? [];
  const historyItems = historyQuery.data?.items ?? [];
  const hasFilters = Boolean(search || supplierFilter);

  const handleComplete = async (body: CompleteSupplierDeliveryEvaluationRequest) => {
    if (!completing) return;
    try {
      await completeMutation.mutateAsync({ id: completing.id, body });
      showToast('success', 'Đã hoàn thành đánh giá nhận hàng');
      setCompleting(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu đánh giá nhận hàng'));
    }
  };

  return (
    <div className="space-y-5 p-4">
      <FilterToolbar
        search={search}
        onSearchChange={value => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm PO, phiếu NK, NCC…"
        filters={(
          <SelectField
            variant="hrm"
            className="hrm-filter-select-wrap"
            selectClassName="hrm-filter-select"
            aria-label="Lọc theo nhà cung cấp"
            value={supplierFilter}
            placeholder="Tất cả nhà cung cấp"
            options={(suppliers?.items ?? []).map(s => ({
              value: String(s.id),
              label: s.supplierName,
            }))}
            onChange={handleSupplierFilterChange}
          />
        )}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setSearch('');
          handleSupplierFilterChange('');
        }}
      />

      {supplierFilter ? (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-[var(--md-primary-container)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[var(--md-on-surface-variant)]">Đang lọc theo NCC:</span>
            <span className="font-semibold text-[var(--md-primary)]">
              {activeSupplier ? `${activeSupplier.supplierCode} - ${activeSupplier.supplierName}` : `NCC #${supplierFilter}`}
            </span>
          </div>
          <Button
            type="button"
            variant="text"
            size="sm"
            leftIcon={X}
            onClick={() => handleSupplierFilterChange('')}
          >
            Bỏ lọc NCC
          </Button>
        </div>
      ) : null}

      <section aria-label="Đánh giá đang chờ xử lý">
        <h2 className="purchasing-section-title mb-1 text-base">
          Đánh giá đang chờ xử lý
          <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
            ({pendingQuery.data?.totalCount ?? pendingItems.length})
          </span>
        </h2>
        <p className="mb-2 text-xs text-pretty text-[var(--md-on-surface-variant)]">
          Mỗi khi nhận hàng theo PO, có 0–30 ngày để hoàn thành đánh giá NCC cho đợt giao đó.
        </p>
        <TableShell
          tableClassName="w-full border-collapse hrm-table table-min-w--750"
          colSpan={6}
          loading={pendingQuery.isLoading}
          isEmpty={pendingItems.length === 0}
          emptyMessage="Không có đánh giá nhận hàng đang chờ."
          header={(
            <tr>
              <th className="table-header-cell">Mã PO</th>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Ngày nhận hàng</th>
              <th className="table-header-cell">Hạn đánh giá</th>
              <th className="table-header-cell">Trạng thái</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          )}
        >
          {pendingItems.map(row => (
            <tr key={row.id} className="table-row">
              <td className="table-cell whitespace-nowrap">
                <EntityCodeLink
                  code={row.poCode}
                  to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                />
              </td>
              <td className="table-cell font-semibold">{row.supplierName}</td>
              <td className="table-cell whitespace-nowrap tabular-nums">
                {formatDateTimeVi(row.receivedAt) ?? formatDateCell(row.receivedAt)}
              </td>
              <td className="table-cell whitespace-nowrap tabular-nums">
                {formatDateCell(row.dueAt)}
              </td>
              <td className="table-cell">
                <PurchasingStatusBadge
                  label={row.isOverdue ? 'Quá hạn' : 'Chờ đánh giá'}
                  tone={row.isOverdue ? 'danger' : 'warning'}
                />
              </td>
              <td className="table-cell text-center">
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  leftIcon={ClipboardCheck}
                  onClick={() => setCompleting(row)}
                >
                  Đánh giá ngay
                </Button>
              </td>
            </tr>
          ))}
        </TableShell>
      </section>

      <section aria-label="Lịch sử đánh giá theo đơn hàng">
        <h2 className="purchasing-section-title mb-1 text-base">Lịch sử đánh giá nhà cung cấp</h2>
        <p className="mb-2 text-xs text-pretty text-[var(--md-on-surface-variant)]">
          Thang điểm 1–10 mỗi tiêu chí · Điểm tổng theo trọng số (Chất lượng 30%, Giao hàng 25%, Giá 20%, Dịch vụ 15%, Tuân thủ 10%).
        </p>
        <TableShell
          tableClassName="w-full border-collapse hrm-table table-min-w--950"
          colSpan={11}
          loading={historyQuery.isLoading}
          error={historyQuery.isError ? 'Không tải được lịch sử đánh giá.' : null}
          isEmpty={historyItems.length === 0}
          emptyMessage={hasFilters ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá nào.'}
          pagination={
            (historyQuery.data?.totalCount ?? 0) > 0 && !historyQuery.isLoading
              ? {
                  embedded: true,
                  itemLabel: 'đánh giá',
                  currentPage: page,
                  totalPages: historyQuery.data?.totalPages ?? 1,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: size => {
                    setPageSize(size);
                    setPage(1);
                  },
                  totalItems: historyQuery.data?.totalCount ?? 0,
                }
              : undefined
          }
          header={(
            <tr>
              <th className="table-header-cell">Ngày</th>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Mã PO</th>
              <th className="table-header-cell">Người đánh giá</th>
              <th className="table-header-cell text-center">Chất lượng</th>
              <th className="table-header-cell text-center">Giao hàng</th>
              <th className="table-header-cell text-center">Giá</th>
              <th className="table-header-cell text-center">Dịch vụ</th>
              <th className="table-header-cell text-center">Tuân thủ</th>
              <th className="table-header-cell text-right">Điểm tổng</th>
              <th className="table-header-cell">Xếp hạng</th>
            </tr>
          )}
        >
          {historyItems.map(row => (
            <tr key={row.id} className="table-row">
              <td className="table-cell whitespace-nowrap tabular-nums">
                {row.evaluatedAt ? formatDateCell(row.evaluatedAt) : '—'}
              </td>
              <td className="table-cell font-semibold">{row.supplierName}</td>
              <td className="table-cell whitespace-nowrap">
                <EntityCodeLink
                  code={row.poCode}
                  to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                />
              </td>
              <td className="table-cell">{row.evaluatedByName || '—'}</td>
              <td className="table-cell text-center tabular-nums">{criteriaCell(row.quality)}</td>
              <td className="table-cell text-center tabular-nums">{criteriaCell(row.delivery)}</td>
              <td className="table-cell text-center tabular-nums">{criteriaCell(row.price)}</td>
              <td className="table-cell text-center tabular-nums">{criteriaCell(row.service)}</td>
              <td className="table-cell text-center tabular-nums">{criteriaCell(row.compliance)}</td>
              <td className="table-cell text-right tabular-nums font-semibold">
                {row.score == null ? '—' : row.score}
              </td>
              <td className="table-cell">
                <PurchasingStatusBadge
                  label={row.gradeLabel || orderGradeLabel(row.grade)}
                  tone={gradeTone(row.grade)}
                />
              </td>
            </tr>
          ))}
        </TableShell>
      </section>

      <CompleteDeliveryEvaluationModal
        isOpen={Boolean(completing)}
        evaluation={completing}
        settings={settings}
        isSaving={completeMutation.isPending}
        onClose={() => setCompleting(null)}
        onSubmit={body => { void handleComplete(body); }}
      />
    </div>
  );
}
