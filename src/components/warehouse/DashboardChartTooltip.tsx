import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipContentProps, TooltipPayloadEntry } from 'recharts';

import { formatCurrency } from '../../utils/formatCurrency';

type ChartTooltipProps = TooltipContentProps;

const PORTAL_TOOLTIP_WIDTH = 240;
const PORTAL_TOOLTIP_GAP = 12;

export function DashboardChartTooltipContent({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel =
    payload[0]?.payload?.name != null ? String(payload[0].payload.name) : label;

  return (
    <div className="chart-tooltip" role="tooltip">
      {displayLabel != null && displayLabel !== '' && (
        <p className="chart-tooltip__label">{String(displayLabel)}</p>
      )}
      {payload.map((entry: TooltipPayloadEntry, index: number) => {
        const color = entry.color ?? entry.fill ?? 'var(--md-primary)';
        const name = entry.name ?? entry.dataKey ?? '';
        const raw = entry.value;
        const display =
          typeof raw === 'number'
            ? formatCurrency(raw)
            : raw != null
              ? String(raw)
              : '—';

        return (
          <div key={`${name}-${index}`} className="chart-tooltip__row">
            <span
              className="chart-tooltip__dot"
              style={{ '--chart-dot-color': color } as CSSProperties}
            />
            <span className="chart-tooltip__name">{String(name)}:</span>
            <span className="chart-tooltip__value">{display}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardChartTooltip(props: ChartTooltipProps) {
  return <DashboardChartTooltipContent {...props} />;
}

/** Renders tooltip in document.body so card overflow cannot clip it. */
export function DashboardBarChartPortalTooltip(
  props: ChartTooltipProps & { chartRoot: HTMLElement | null },
) {
  const { active, coordinate, chartRoot } = props;
  if (!active || !coordinate || !chartRoot) return null;

  const anchor = chartRoot.querySelector('.recharts-wrapper') ?? chartRoot;
  const rect = anchor.getBoundingClientRect();
  let left = rect.left + (coordinate.x ?? 0);
  const top = rect.top + (coordinate.y ?? 0) - PORTAL_TOOLTIP_GAP;

  const minLeft = PORTAL_TOOLTIP_GAP;
  const maxLeft = window.innerWidth - PORTAL_TOOLTIP_WIDTH - PORTAL_TOOLTIP_GAP;
  left = Math.min(Math.max(left, minLeft), maxLeft);

  return createPortal(
    <div
      className="chart-tooltip-portal"
      style={{
        position: 'fixed',
        left,
        top,
        transform: 'translate(-50%, -100%)',
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <DashboardChartTooltipContent {...props} />
    </div>,
    document.body,
  );
}
