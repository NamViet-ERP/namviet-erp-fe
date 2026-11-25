import { useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import PermissionGate from '../../../components/auth/PermissionGate';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE } from '../../../constants/pagination';
import { useUpdateProjectInventoryMinStock } from '../../../hooks/useProjects';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { fmtPlannedStock, fmtStockQtyOrDash } from '../../../lib/wms/stockQtyFormat';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';

const MAX_MIN_STOCK_QTY = 1_000_000_000;
const MIN_STOCK_INVALID_MSG = 'Tồn tối thiểu không hợp lệ';

/** Integer ≥ 0 and ≤ MAX; empty rejected (require explicit 0). */
function parseMinStockQty(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n) || n < 0 || n > MAX_MIN_STOCK_QTY) return null;
  return n;
}

function minStockDisplayValue(qty: number): string {
  return qty > 0 ? String(qty) : '';
}

interface ProjectStockTabProps {
  code: string;
  stockWithQty: WarehouseProjectInventoryApiDto[];
  belowMinRows: WarehouseProjectInventoryApiDto[];
  isLoading: boolean;
}

export default function ProjectStockTab({
  code,
  stockWithQty,
  belowMinRows,
  isLoading,
}: ProjectStockTabProps) {
  const [stockPageRaw, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  /** Per-row draft for Tồn tối thiểu — key = materialCode */
  const [minStockDrafts, setMinStockDrafts] = useState<Record<string, string>>({});
  const [savingMinStockCode, setSavingMinStockCode] = useState<string | null>(null);
  const minStockMutation = useUpdateProjectInventoryMinStock();

  const stockTotalPages = Math.max(1, Math.ceil(stockWithQty.length / stockPageSize));
  const stockPage = Math.min(stockPageRaw, stockTotalPages);
  const paginatedStock = stockWithQty.slice(
    (stockPage - 1) * stockPageSize,
    stockPage * stockPageSize,
  );

  const beginMinStockEdit = (materialCode: string, current: number) => {
    setMinStockDrafts(prev => {
      if (prev[materialCode] !== undefined) return prev;
      return { ...prev, [materialCode]: String(current) };
    });
  };

  const cancelMinStockEdit = (materialCode: string) => {
    setMinStockDrafts(prev => {
      const next = { ...prev };
      delete next[materialCode];
      return next;
    });
  };

  const saveMinStock = async (materialCode: string, current: number) => {
    if (!code) return;
    const raw = minStockDrafts[materialCode];
    if (raw === undefined) return;
    const next = parseMinStockQty(raw);
    if (next === null) {
      showToast('error', MIN_STOCK_INVALID_MSG);
      return;
    }
    if (next === current) {
      cancelMinStockEdit(materialCode);
      return;
    }
    setSavingMinStockCode(materialCode);
    try {
      await minStockMutation.mutateAsync({ projectCode: code, materialCode, minStockQty: next });
      cancelMinStockEdit(materialCode);
      showToast('success', 'Đã cập nhật tồn tối thiểu.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật tồn tối thiểu'));
    } finally {
      setSavingMinStockCode(null);
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
        <table className="wms-inventory-table project-warehouse-table">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                <td colSpan={11}><div className="hrm-table-skeleton" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (stockWithQty.length === 0) {
    return (
      <EmptyState message="Chưa có vật tư tại kho dự án. Tạo phiếu nhập kho để cấp vật tư." icon={Package} />
    );
  }

  return (
    <>
      {belowMinRows.length > 0 && (
        <div className="mx-3 mt-2 mb-0 rounded-lg border border-[var(--md-warning)]/40 bg-[var(--md-warning-container)]/30 px-3 py-2 flex items-start gap-2 text-sm text-[var(--md-on-surface)]">
          <AlertTriangle size={16} className="text-[var(--md-warning)] shrink-0 mt-0.5" aria-hidden />
          <p>
            <strong>{belowMinRows.length}</strong> mặt hàng đang dưới tồn tối thiểu.
            Kiểm tra cột <strong>Tồn tối thiểu</strong> và lập phiếu nhập bổ sung.
          </p>
        </div>
      )}
      <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
        <table className="wms-inventory-table project-warehouse-table project-detail-stock-table">
          <thead>
            <tr>
              <th className="table-header-cell whitespace-nowrap">Mã VT</th>
              <th className="table-header-cell">Tên vật tư</th>
              <th className="table-header-cell text-center">ĐVT</th>
              <th className="table-header-cell text-right">Tồn thực tế</th>
              <th className="table-header-cell text-right" title="Ngưỡng cảnh báo theo dự án">Tồn tối thiểu</th>
              <th className="table-header-cell text-right">Nhập dự kiến</th>
              <th className="table-header-cell text-right">Xuất dự kiến</th>
              <th className="table-header-cell text-right" title="Tồn thực tế + nhập/hoàn trả/chuyển kho dự kiến">Tồn dự kiến</th>
              <th className="table-header-cell text-right" title="Đã cấp công trường qua phiếu gắn PO">Từ PO</th>
              <th className="table-header-cell text-right" title="Đã cấp công trường từ kho trung tâm">Từ kho trung tâm</th>
              <th className="table-header-cell text-right">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStock.map(row => {
              const isBelowMin = row.minStockQty > 0 && row.actualInventoryQty < row.minStockQty;
              const draft = minStockDrafts[row.materialCode];
              const isEditing = draft !== undefined;
              const isSavingRow = savingMinStockCode === row.materialCode;
              return (
                <tr key={row.materialCode} className={`table-row wms-inventory-row--interactive${isBelowMin ? ' bg-[color-mix(in_srgb,var(--md-warning)_8%,transparent)]' : ''}`}>
                  <td className="table-cell whitespace-nowrap">
                    <EntityCodeLink
                      code={row.materialCode}
                      to="/warehouse/materials"
                      state={{ highlightCode: row.materialCode }}
                    />
                  </td>
                  <td className="table-cell max-w-[280px]">
                    <span className="line-clamp-2" title={row.materialName}>{row.materialName}</span>
                  </td>
                  <td className="table-cell text-center">{row.unit}</td>
                  <td className={`table-cell text-right font-semibold tabular-nums${isBelowMin ? ' text-[var(--md-warning)]' : ''}`}>
                    {row.actualInventoryQty}
                  </td>
                  <td className="table-cell text-right align-middle">
                    <PermissionGate permission="wms.projects.update" fallback={
                      <span className="tabular-nums">{row.minStockQty > 0 ? row.minStockQty : '—'}</span>
                    }>
                      <div className="inline-flex items-center justify-end gap-1 min-w-[7.5rem]">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="form-input w-[4.5rem] text-right text-xs tabular-nums py-1 px-1.5"
                          value={isEditing ? draft : minStockDisplayValue(row.minStockQty)}
                          placeholder="0"
                          disabled={isSavingRow}
                          aria-label={`Tồn tối thiểu ${row.materialCode}`}
                          onFocus={() => beginMinStockEdit(row.materialCode, row.minStockQty)}
                          onChange={e => {
                            const next = e.target.value;
                            setMinStockDrafts(prev => ({ ...prev, [row.materialCode]: next }));
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void saveMinStock(row.materialCode, row.minStockQty);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelMinStockEdit(row.materialCode);
                            }
                          }}
                        />
                        {isEditing && (
                          <span className="inline-flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              className="btn btn-text btn-sm px-1 py-0.5 text-[0.6875rem] font-semibold leading-none"
                              disabled={isSavingRow}
                              onClick={() => void saveMinStock(row.materialCode, row.minStockQty)}
                            >
                              {isSavingRow ? '…' : 'Lưu'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-text btn-sm px-1 py-0.5 text-[0.6875rem] leading-none text-[var(--md-on-surface-variant)]"
                              disabled={isSavingRow}
                              onClick={() => cancelMinStockEdit(row.materialCode)}
                            >
                              Hủy
                            </button>
                          </span>
                        )}
                      </div>
                    </PermissionGate>
                  </td>
                  <td className="table-cell text-right tabular-nums stock-qty--pending">
                    {fmtStockQtyOrDash(row.plannedImportQty)}
                  </td>
                  <td className="table-cell text-right tabular-nums stock-qty--reserved">
                    {fmtStockQtyOrDash(row.plannedExportQty)}
                  </td>
                  <td className="table-cell text-right font-semibold tabular-nums">
                    {fmtPlannedStock(row.actualInventoryQty, row.plannedImportQty)}
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {fmtStockQtyOrDash(row.issuedFromPoQty ?? 0)}
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {fmtStockQtyOrDash(row.issuedFromGeneralQty ?? 0)}
                  </td>
                  <td className="table-cell text-right font-semibold tabular-nums">
                    {fmtStockQtyOrDash((row.issuedFromPoQty ?? 0) + (row.issuedFromGeneralQty ?? 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        embedded
        itemLabel="mặt hàng"
        currentPage={stockPage}
        totalPages={stockTotalPages}
        onPageChange={setStockPage}
        pageSize={stockPageSize}
        onPageSizeChange={size => { setStockPageSize(size); setStockPage(1); }}
        totalItems={stockWithQty.length}
      />
    </>
  );
}
