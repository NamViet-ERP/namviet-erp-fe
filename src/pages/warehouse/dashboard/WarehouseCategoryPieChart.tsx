import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { dashboardChartTooltipProps } from '../../../components/warehouse/dashboardChartTooltipProps';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import type { CategoryDataPoint } from '../../../lib/wms/warehouseDashboardData';
import { ChartEmpty } from './WarehouseTrendChart';

const RADIAN = Math.PI / 180;

interface PieSliceLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderPiePercentLabel(props: PieSliceLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--md-inverse-on-surface)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fontFamily="var(--font-sans)"
      pointerEvents="none"
      style={{ pointerEvents: 'none' }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export function CategoryBreakdownList({ data }: { data: CategoryDataPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;

  return (
    <div className="chart-breakdown__list" aria-label="Chi tiết cơ cấu tồn kho">
      {data.map((item, index) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div key={`${item.name}-${index}`} className="chart-breakdown__row">
            <div className="chart-breakdown__row-top">
              <span className="chart-breakdown__dot" style={{ background: item.color }} />
              <span className="chart-breakdown__name" title={item.name}>{item.name}</span>
              <span className="chart-breakdown__pct">
                {pct}% · {fmtStockQty(item.value)}
              </span>
            </div>
            <div className="chart-breakdown__track">
              <div
                className="chart-breakdown__fill"
                style={{ width: `${pct}%`, background: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryPieChart({ data }: { data: CategoryDataPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (data.length === 0 || total <= 0) {
    return <ChartEmpty message="Chưa có số lượng tồn kho." />;
  }

  return (
    <div className="chart-breakdown">
      <div className="chart-breakdown__donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={props => renderPiePercentLabel(props as PieSliceLabelProps)}
              outerRadius="86%"
              innerRadius="54%"
              paddingAngle={2}
              dataKey="value"
              animationDuration={500}
              strokeWidth={2}
              stroke="var(--md-surface-container)"
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...dashboardChartTooltipProps} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-breakdown__center" aria-hidden>
          <span className="chart-breakdown__center-value">{fmtStockQty(total)}</span>
          <span className="chart-breakdown__center-label">Tồn</span>
        </div>
      </div>
      <CategoryBreakdownList data={data} />
    </div>
  );
}
