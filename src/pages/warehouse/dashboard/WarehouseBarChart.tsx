import { useState } from 'react';
import type { XAxisTickContentProps } from 'recharts';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from 'recharts';
import { DashboardBarChartPortalTooltip } from '../../../components/warehouse/DashboardChartTooltip';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { CategoryDataPoint } from '../../../lib/wms/warehouseDashboardData';
import { CHART_AXIS_STROKE, CHART_AXIS_TICK } from './chartConstants';
import { ChartEmpty } from './WarehouseTrendChart';

const WAREHOUSE_BAR_Y_AXIS = {
  title: 'Số lượng tồn',
  unit: 'ĐVT theo từng mã vật tư',
} as const;

const WAREHOUSE_BAR_X_AXIS = {
  title: 'Kho dự án',
  unit: 'Đơn vị: STT (số thứ tự)',
} as const;

/** Round Y-axis to clean steps; always includes 0. */
function buildStockBarYScale(values: number[]): { domainMax: number; ticks: number[] } {
  const dataMax = Math.max(...values, 0);
  if (dataMax === 0) {
    return { domainMax: 4, ticks: [0, 1, 2, 3, 4] };
  }

  const targetTicks = 4;
  const roughStep = (dataMax * 1.06) / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceUnit = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceUnit * magnitude;
  const domainMax = step * targetTicks;
  const ticks = Array.from({ length: targetTicks + 1 }, (_, i) => i * step);

  return { domainMax, ticks };
}

function warehouseBarChartHeight(): number {
  return 180;
}

export function WarehouseBarXTick({ x = 0, y = 0, index = 0 }: XAxisTickContentProps) {
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={14}
      fill={CHART_AXIS_TICK.fill}
      fontSize={CHART_AXIS_TICK.fontSize}
      fontFamily={CHART_AXIS_TICK.fontFamily}
      textAnchor="middle"
      fontWeight={600}
    >
      {index + 1}
    </text>
  );
}

export function WarehouseBarLegend({ data }: { data: CategoryDataPoint[] }) {
  return (
    <div className="warehouse-bar-legend-wrap">
      <p className="warehouse-bar-legend__heading">
        {WAREHOUSE_BAR_X_AXIS.title} - {WAREHOUSE_BAR_X_AXIS.unit}. Tên đầy đủ:
      </p>
      <ul className="warehouse-bar-legend" aria-label="Danh sách kho dự án">
        {data.map((item, index) => (
          <li key={`${item.name}-${index}`} className="warehouse-bar-legend__row">
            <span className="warehouse-bar-legend__index" aria-hidden>{index + 1}</span>
            <span className="warehouse-bar-legend__dot" style={{ background: item.color }} aria-hidden />
            <span className="warehouse-bar-legend__name">{item.name}</span>
            <span className="warehouse-bar-legend__value">{fmtStockQty(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WarehouseBarChart({ data }: { data: CategoryDataPoint[] }) {
  const [chartRoot, setChartRoot] = useState<HTMLDivElement | null>(null);

  if (data.length === 0) {
    return <ChartEmpty message="Chưa có tồn kho theo kho dự án." />;
  }

  const values = data.map(item => item.value);
  const yScale = buildStockBarYScale(values);
  const chartHeight = warehouseBarChartHeight();

  return (
    <div className="chart-panel chart-panel--warehouse-bar">
      <div
        className="chart-panel__body chart-panel__body--compact chart-panel__body--bar"
        style={{ minHeight: chartHeight }}
      >
        <div className="warehouse-bar-chart-frame">
          <div className="chart-axis-y-caption" aria-hidden>
            <span className="chart-axis-y-caption__title">{WAREHOUSE_BAR_Y_AXIS.title}</span>
            <span className="chart-axis-y-caption__unit">{WAREHOUSE_BAR_Y_AXIS.unit}</span>
          </div>
          <div className="warehouse-bar-chart-frame__plot">
            <div ref={setChartRoot} className="chart-surface chart-surface--bar chart-surface--framed">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 16, left: 4, bottom: 8 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={CHART_AXIS_STROKE}
                    vertical={false}
                    opacity={0.45}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={CHART_AXIS_STROKE}
                    tick={WarehouseBarXTick}
                    tickLine={{ stroke: CHART_AXIS_STROKE }}
                    axisLine={{ stroke: CHART_AXIS_STROKE }}
                    height={28}
                    interval={0}
                  />
                  <YAxis
                    stroke={CHART_AXIS_STROKE}
                    tick={CHART_AXIS_TICK}
                    tickLine={{ stroke: CHART_AXIS_STROKE }}
                    axisLine={{ stroke: CHART_AXIS_STROKE }}
                    allowDecimals={false}
                    width={56}
                    domain={[0, yScale.domainMax]}
                    ticks={yScale.ticks}
                    tickFormatter={(v: number) => fmtStockQty(v)}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    cursor={{ fill: 'var(--tint-primary-weak)', opacity: 0.35 }}
                    content={props => (
                      <DashboardBarChartPortalTooltip
                        {...props}
                        chartRoot={chartRoot}
                      />
                    )}
                  />
                  <Bar dataKey="value" name={WAREHOUSE_BAR_Y_AXIS.title} radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {data.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={8}
                      formatter={value => fmtStockQty(Number(value ?? 0))}
                      className="chart-bar-label"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-axis-x-caption">
              <span className="chart-axis-x-caption__title">{WAREHOUSE_BAR_X_AXIS.title}</span>
              <span className="chart-axis-x-caption__unit">{WAREHOUSE_BAR_X_AXIS.unit}</span>
            </p>
          </div>
        </div>
      </div>
      <WarehouseBarLegend data={data} />
    </div>
  );
}
