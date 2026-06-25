import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipProps } from 'recharts';

import { formatCurrency } from '../../utils/formatCurrency';

type TooltipPayload = NonNullable<TooltipProps<number, string>['payload']>[number];

const PORTAL_TOOLTIP_WIDTH = 240;
const PORTAL_TOOLTIP_GAP = 12;

export function DashboardChartTooltipContent({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const displayLabel =
    payload[0]?.payload?.name != null ? String(payload[0].payload.name) : label;

  return (
    <div className="chart-tooltip" role="tooltip">
      {displayLabel != null && displayLabel !== '' && (
        <p className="chart-tooltip__label">{String(displayLabel)}</p>
      )}
      {payload.map((entry: TooltipPayload, index) => {
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
            <span className="chart-tooltip__name">{name}:</span>
            <span className="chart-tooltip__value">{display}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardChartTooltip(props: TooltipProps<number, string>) {
  return <DashboardChartTooltipContent {...props} />;
}

/** Renders tooltip in document.body so card overflow cannot clip it. */
export function DashboardBarChartPortalTooltip(
  props: TooltipProps<number, string> & { chartRoot: HTMLElement | null },
) {
  const { active, coordinate, chartRoot } = props;
  if (!active || !coordinate || !chartRoot) return null;

  const anchor = chartRoot.querySelector('.recharts-wrapper') ?? chartRoot;
  const rect = anchor.getBoundingClientRect();
  let left = rect.left + coordinate.x;
  const top = rect.top + coordinate.y - PORTAL_TOOLTIP_GAP;

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
