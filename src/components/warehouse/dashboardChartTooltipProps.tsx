import { DashboardChartTooltip } from './DashboardChartTooltip';

/** Stable tooltip — follows cursor; does not steal hover from chart marks. */
export const dashboardChartTooltipProps = {
  content: <DashboardChartTooltip />,
  isAnimationActive: false,
  allowEscapeViewBox: { x: true, y: true },
  wrapperStyle: {
    zIndex: 50,
    pointerEvents: 'none',
    outline: 'none',
  },
} as const;
