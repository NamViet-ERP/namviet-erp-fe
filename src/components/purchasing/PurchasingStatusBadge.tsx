/** Tone tokens for purchasing/supplier status chips (UI-only, not API wire). */
export type PurchasingTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const TONE_CLASS: Record<PurchasingTone, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-error',
  neutral: 'badge badge-neutral',
  primary: 'badge badge-md-primary',
};

interface PurchasingStatusBadgeProps {
  label: string;
  tone: PurchasingTone;
}

export default function PurchasingStatusBadge({ label, tone }: PurchasingStatusBadgeProps) {
  return <span className={TONE_CLASS[tone]}>{label}</span>;
}
