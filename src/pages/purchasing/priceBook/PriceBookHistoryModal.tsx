import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatDateCell } from '../../../lib/hrm/formatters';
import {
  buildPriceHistoryPlot,
  priceHistoryKindLabel,
  type PriceHistoryPlotPoint,
  type PriceHistoryPoint,
} from '../../../lib/purchasePriceHistoryChart';
import type { usePriceBookItem } from '../../../hooks/usePurchasePriceBook';
import { formatCurrencyFull, formatCurrencyShort } from '../../../utils/formatCurrency';
import { historyKindBadge } from './priceBookHelpers';

const CHART_TICK = {
  fill: 'var(--md-on-surface-variant)',
  fontSize: 11,
  fontFamily: 'var(--font-sans)',
} as const;

function PriceHistoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as PriceHistoryPlotPoint | undefined;
  if (!point) return null;
  return (
    <div className="chart-tooltip" role="tooltip">
      <p className="chart-tooltip__label">{point.kindLabel}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__name">Ngày:</span>
        <span className="chart-tooltip__value">{formatDateCell(point.date)}</span>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__name">Đơn giá:</span>
        <span className="chart-tooltip__value">{formatCurrencyFull(point.unitPrice)}</span>
      </div>
      {point.supplierName ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">NCC:</span>
          <span className="chart-tooltip__value">{point.supplierName}</span>
        </div>
      ) : null}
      {point.poRef ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">Tham chiếu:</span>
          <span className="chart-tooltip__value">{point.poRef}</span>
        </div>
      ) : null}
      {point.projectCode ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">Dự án:</span>
          <span className="chart-tooltip__value">{point.projectCode}</span>
        </div>
      ) : null}
    </div>
  );
}

function PriceHistoryDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: PriceHistoryPlotPoint;
}) {
  if (cx == null || cy == null || !payload) return null;
  return (
    <g>
      <text
        x={cx}
        y={cy - 22}
        textAnchor="middle"
        fill="var(--md-on-surface)"
        style={{ fontSize: 'var(--fs-micro)', fontFamily: 'var(--font-sans)' }}
      >
        {formatCurrencyFull(payload.unitPrice)}
      </text>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="var(--md-on-surface-variant)"
        style={{ fontSize: 'var(--fs-micro)', fontFamily: 'var(--font-sans)' }}
      >
        {payload.kindLabel}
      </text>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.purchased ? payload.color : 'var(--md-surface-container-high)'}
        stroke={payload.color}
        strokeWidth={2}
      />
    </g>
  );
}

function PriceHistoryChart({
  points,
  ceilingPrice,
}: {
  points: PriceHistoryPoint[];
  ceilingPrice?: number | null;
}) {
  const plot = buildPriceHistoryPlot(points);
  if (!plot) {
    return <EmptyState message="Chưa có dữ liệu giá để vẽ biểu đồ." />;
  }

  const { rows, legend, xDomain, yDomain, xTicks } = plot;
  const hasPurchaseLine = rows.filter(r => r.purchased).length >= 2;

  return (
    <div className="space-y-2">
      <div className="text-[length:var(--fs-sm)] font-medium">Diễn biến đơn giá theo thời gian</div>
      <div className="pur-pricebook-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 36, right: 28, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--md-outline-variant)" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={ts => {
                const row = rows.find(r => r.ts === ts);
                return formatDateCell(row?.date);
              }}
              tick={CHART_TICK}
              axisLine={{ stroke: 'var(--md-outline-variant)' }}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={value => formatCurrencyShort(Number(value))}
              tick={CHART_TICK}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={PriceHistoryTooltip} />
            {ceilingPrice != null ? (
              <ReferenceLine
                y={ceilingPrice}
                stroke="var(--md-error)"
                strokeDasharray="4 4"
                label={{
                  value: `Giá trần ${formatCurrencyFull(ceilingPrice)}`,
                  fill: 'var(--md-error)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  position: 'insideTopRight',
                }}
              />
            ) : null}
            {hasPurchaseLine ? (
              <Line
                type="linear"
                dataKey="purchasePrice"
                name="Giá đã mua"
                stroke="var(--md-tertiary)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
                legendType="none"
                isAnimationActive={false}
              />
            ) : null}
            <Scatter
              dataKey="unitPrice"
              name="Mốc giá"
              shape={PriceHistoryDot}
              isAnimationActive={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
        {legend.map(item => (
          <span key={item.kindLabel} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{
                background: item.purchased ? item.color : 'transparent',
                boxShadow: `inset 0 0 0 2px ${item.color}`,
              }}
            />
            {item.kindLabel}
          </span>
        ))}
      </div>
      <p className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] m-0">
        Trục ngang là ngày ghi giá. Mỗi chấm là một dòng trong bảng bên dưới.
        Chấm đặc = đã mua (PO, KHMH, nhập kho). Chấm rỗng = giá tham khảo (báo giá, giá bán, dự toán).
      </p>
    </div>
  );
}

interface PriceBookHistoryModalProps {
  detailCode: string | null;
  detail: ReturnType<typeof usePriceBookItem>;
  canWriteRfq: boolean;
  onClose: () => void;
  onAddRfq: (materialCode: string) => void;
}

export default function PriceBookHistoryModal({
  detailCode,
  detail,
  canWriteRfq,
  onClose,
  onAddRfq,
}: PriceBookHistoryModalProps) {
  return (
    <Modal
      isOpen={Boolean(detailCode)}
      onClose={onClose}
      title={detail.data ? `${detail.data.item.materialCode} · ${detail.data.item.materialName}` : 'Chi tiết sổ giá'}
      size="full"
      subtitle={
        detail.data ? (
          <p className="m-0 text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Giá trần: {detail.data.item.ceilingPrice != null ? formatCurrencyFull(detail.data.item.ceilingPrice) : 'Chưa khai báo'}
          </p>
        ) : undefined
      }
      footer={
        canWriteRfq && detail.data ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAddRfq(detail.data.item.materialCode)}
            >
              + Ghi nhận báo giá mới
            </button>
          </div>
        ) : undefined
      }
    >
      {detail.isError ? (
        <EmptyState message={getApiErrorMessage(detail.error, 'Không tải được chi tiết sổ giá.')} />
      ) : detail.isLoading || !detail.data ? (
        <div className="wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <tbody><TableSkeletonRows colSpan={5} /></tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          <PriceHistoryChart
            points={detail.data.history}
            ceilingPrice={detail.data.item.ceilingPrice}
          />
          <div className="text-[length:var(--fs-sm)] font-medium">Toàn bộ lịch sử giá và báo giá</div>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table wms-voucher-detail-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Ngày</th>
                  <th className="table-header-cell">Loại</th>
                  <th className="table-header-cell">NCC</th>
                  <th className="table-header-cell">Đơn giá</th>
                  <th className="table-header-cell">Tham chiếu</th>
                  <th className="table-header-cell">Dự án</th>
                </tr>
              </thead>
              <tbody>
                {detail.data.history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell"><EmptyState message="Chưa có lịch sử giá." /></td>
                  </tr>
                ) : detail.data.history.map((h, i) => (
                  <tr key={`${h.date}-${h.kind}-${i}`} className="table-row">
                    <td className="table-cell">{formatDateCell(h.date)}</td>
                    <td className="table-cell"><span className={`badge ${historyKindBadge(h.kind, h.status)}`}>{priceHistoryKindLabel(h.kind, h.status)}</span></td>
                    <td className="table-cell">{h.supplierName || '—'}</td>
                    <td className="table-cell text-right tabular-nums">{formatCurrencyFull(h.unitPrice)}</td>
                    <td className="table-cell font-mono">{h.poRef || '—'}</td>
                    <td className="table-cell">{h.projectCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
