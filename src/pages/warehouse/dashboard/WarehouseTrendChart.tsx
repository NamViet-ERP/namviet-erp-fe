import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import EmptyState from '../../../components/ui/EmptyState';
import { dashboardChartTooltipProps } from '../../../components/warehouse/dashboardChartTooltipProps';
import { formatCurrencyShort } from '../../../utils/formatCurrency';
import type { TrendDataPoint } from '../../../lib/wms/warehouseDashboardData';
import { CHART_AXIS_TICK, CHART_EXPORT, CHART_IMPORT } from './chartConstants';

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center flex-1 min-h-[180px]">
      <EmptyState message={message} />
    </div>
  );
}

export function ChartLegendInline({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="chart-legend-inline" aria-hidden>
      {items.map(item => (
        <span key={item.label} className="chart-legend-inline__item">
          <span className="chart-legend-inline__dot" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const hasData = data.some(point => point.imports > 0 || point.exports > 0);
  if (!hasData) {
    return <ChartEmpty message="Chưa có giá trị nhập/xuất trong 6 tháng gần đây." />;
  }

  const totalImports = data.reduce((sum, point) => sum + point.imports, 0);
  const totalExports = data.reduce((sum, point) => sum + point.exports, 0);
  const peak = Math.max(...data.flatMap(point => [point.imports, point.exports]), 1);
  const yMax = Math.ceil(peak * 1.15);

  return (
    <div className="chart-panel">
      <div className="trend-summary">
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: CHART_IMPORT }} />
          Nhập: <strong>{formatCurrencyShort(totalImports)}</strong>
        </span>
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: CHART_EXPORT }} />
          Xuất: <strong>{formatCurrencyShort(totalExports)}</strong>
        </span>
      </div>
      <div className="chart-panel__body">
        <div className="chart-surface">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -4, bottom: 4 }}>
              <defs>
                <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_IMPORT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_IMPORT} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_EXPORT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_EXPORT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--md-outline-variant)"
                vertical={false}
                opacity={0.25}
              />
              <XAxis
                dataKey="month"
                stroke="transparent"
                tick={CHART_AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ ...CHART_AXIS_TICK, fontSize: 10 }}
                tickFormatter={v => formatCurrencyShort(Number(v))}
                width={48}
                domain={[0, yMax]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...dashboardChartTooltipProps}
                shared
                cursor={{ stroke: 'var(--md-outline-variant)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="imports"
                name="Nhập kho"
                stroke={CHART_IMPORT}
                strokeWidth={2}
                fill="url(#gradImport)"
                dot={{ r: 3, strokeWidth: 0, fill: CHART_IMPORT }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: CHART_IMPORT }}
              />
              <Area
                type="monotone"
                dataKey="exports"
                name="Xuất kho"
                stroke={CHART_EXPORT}
                strokeWidth={2}
                fill="url(#gradExport)"
                dot={{ r: 3, strokeWidth: 0, fill: CHART_EXPORT }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: CHART_EXPORT }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartLegendInline
        items={[
          { color: CHART_IMPORT, label: 'Nhập kho' },
          { color: CHART_EXPORT, label: 'Xuất kho' },
        ]}
      />
    </div>
  );
}
