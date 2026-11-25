import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import type { usePriceBookEstimates, usePriceBookMargins } from '../../../hooks/usePurchasePriceBook';
import type { PriceBookItemApiDto } from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import { estimateMarginBadge, marginPctBadge } from './priceBookHelpers';

export function EstimateKpis({
  rows,
}: {
  rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>;
}) {
  const withEst = new Set(rows.map(r => r.materialCode)).size;
  const valid = rows.filter(r => r.marginPct != null);
  const avg = valid.length === 0 ? null : valid.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / valid.length;
  const over = rows.filter(r => r.marginPct != null && r.marginPct < 0).length;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Số mặt hàng đã có giá dự toán
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{withEst}</div>
      </div>
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Biên lợi nhuận TB so với dự toán
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">
          {avg == null ? '—' : `${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`}
        </div>
      </div>
      <div className={`border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 ${over > 0 ? 'border-l-[var(--md-error)]' : 'border-l-[var(--md-secondary)]'}`}>
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Mặt hàng đang mua vượt giá dự toán
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{over}</div>
      </div>
    </div>
  );
}

export function EstimatesTable({
  loading,
  rows,
  missingEstimate,
  canUpdate,
  onEdit,
  onAdd,
  onHistory,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>;
  missingEstimate: PriceBookItemApiDto[];
  canUpdate: boolean;
  onEdit: (row: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>[number]) => void;
  onAdd: (materialCode: string) => void;
  onHistory: (materialCode: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">Giá dự toán</th>
              <th className="table-header-cell">Giá mua mới nhất</th>
              <th className="table-header-cell">Chênh lệch (Mua - Dự toán)</th>
              <th className="table-header-cell">Biên lợi nhuận</th>
              <th className="table-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell"><EmptyState message="Chưa có giá dự toán nào được thiết lập." /></td>
              </tr>
            ) : rows.map(row => (
              <tr key={`${row.materialCode}-${row.projectCode ?? ''}-${row.effectiveDate}`} className="table-row">
                <td className="table-cell">
                  <span className="mat-code-cell__badge">{row.materialCode}</span>
                  {' '}
                  {row.materialName}
                </td>
                <td className="table-cell">{row.projectCode || 'Chung'}</td>
                <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.estimatePrice)}</td>
                <td className="table-cell text-right tabular-nums">{row.purchaseLatest != null ? formatCurrencyFull(row.purchaseLatest) : '—'}</td>
                <td className={`table-cell text-right tabular-nums font-semibold ${row.diff != null && row.diff > 0 ? 'text-[var(--md-error)]' : ''}`}>
                  {row.diff != null ? `${row.diff > 0 ? '+' : ''}${formatCurrencyFull(row.diff)}` : '—'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${estimateMarginBadge(row.marginPct)}`}>
                    {row.marginPct != null ? `${row.marginPct > 0 ? '+' : ''}${row.marginPct}%` : '—'}
                  </span>
                </td>
                <td className="table-cell whitespace-nowrap">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHistory(row.materialCode)}>
                    Lịch sử ({row.estimateHistoryCount})
                  </button>
                  {canUpdate ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(row)}>Sửa</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingEstimate.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[length:var(--fs-lg)] font-semibold m-0">Mặt hàng đã có giá mua nhưng chưa thiết lập giá dự toán</h3>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Hàng hoá</th>
                  <th className="table-header-cell">Giá mua mới nhất</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {missingEstimate.map(row => (
                  <tr key={row.materialCode} className="table-row">
                    <td className="table-cell">
                      <span className="mat-code-cell__badge">{row.materialCode}</span>
                      {' '}
                      {row.materialName}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : '—'}
                    </td>
                    <td className="table-cell">
                      {canUpdate ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(row.materialCode)}>
                          + Thiết lập giá dự toán
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MarginKpis({
  rows,
}: {
  rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>;
}) {
  const withSell = new Set(rows.map(r => r.materialCode)).size;
  const avg = rows.length === 0
    ? null
    : rows.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / rows.length;
  const low = rows.filter(r => r.marginPct != null && r.marginPct < 10).length;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Số mặt hàng đã có giá bán
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{withSell}</div>
      </div>
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Margin trung bình
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{avg == null ? '—' : `${avg.toFixed(1)}%`}</div>
      </div>
      <div className={`border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 ${low > 0 ? 'border-l-[var(--md-error)]' : 'border-l-[var(--md-secondary)]'}`}>
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">
          Mặt hàng margin dưới 10%
        </div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{low}</div>
      </div>
    </div>
  );
}

export function MarginsTable({
  loading,
  rows,
  missingSell,
  canUpdate,
  onEdit,
  onAddSell,
  onHistory,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>;
  missingSell: PriceBookItemApiDto[];
  canUpdate: boolean;
  onEdit: (row: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>[number]) => void;
  onAddSell: (materialCode: string) => void;
  onHistory: (materialCode: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">Giá bán/chào</th>
              <th className="table-header-cell">Giá mua mới nhất</th>
              <th className="table-header-cell">Margin</th>
              <th className="table-header-cell">Margin %</th>
              <th className="table-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell"><EmptyState message="Chưa có giá bán để đối chiếu." /></td>
              </tr>
            ) : rows.map(row => (
              <tr key={`${row.materialCode}-${row.projectCode ?? ''}-${row.effectiveDate}`} className="table-row">
                <td className="table-cell">
                  <span className="mat-code-cell__badge">{row.materialCode}</span>
                  {' '}
                  {row.materialName}
                </td>
                <td className="table-cell">{row.projectCode || 'Chung'}</td>
                <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.sellPrice)}</td>
                <td className="table-cell text-right tabular-nums">{row.purchaseLatest != null ? formatCurrencyFull(row.purchaseLatest) : '—'}</td>
                <td className={`table-cell text-right tabular-nums font-semibold ${row.margin != null && row.margin < 0 ? 'text-[var(--md-error)]' : ''}`}>
                  {row.margin != null ? formatCurrencyFull(row.margin) : '—'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${marginPctBadge(row.marginPct)}`}>
                    {row.marginPct != null ? `${row.marginPct}%` : '—'}
                  </span>
                </td>
                <td className="table-cell whitespace-nowrap">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHistory(row.materialCode)}>
                    Lịch sử ({row.sellHistoryCount})
                  </button>
                  {canUpdate ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(row)}>Sửa</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingSell.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[length:var(--fs-lg)] font-semibold m-0">Mặt hàng đã có giá mua nhưng chưa thiết lập giá bán</h3>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Hàng hoá</th>
                  <th className="table-header-cell">Giá mua mới nhất</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {missingSell.map(row => (
                  <tr key={row.materialCode} className="table-row">
                    <td className="table-cell">
                      <span className="mat-code-cell__badge">{row.materialCode}</span>
                      {' '}
                      {row.materialName}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : '—'}
                    </td>
                    <td className="table-cell">
                      {canUpdate ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddSell(row.materialCode)}>
                          + Thêm giá bán
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
