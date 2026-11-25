import StatusBadge, { type StatusTone } from '../ui/StatusBadge';

/** Tone tokens for purchasing/supplier status chips (UI-only, not API wire). */
export type PurchasingTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const TONE_MAP: Record<PurchasingTone, StatusTone> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  neutral: 'neutral',
  primary: 'primary',
};

interface PurchasingStatusBadgeProps {
  label: string;
  tone: PurchasingTone;
}

export default function PurchasingStatusBadge({ label, tone }: PurchasingStatusBadgeProps) {
  return <StatusBadge tone={TONE_MAP[tone]} label={label} />;
}
