/** Tone tokens for purchasing/supplier status chips (UI-only, not API wire). */
export type PurchasingTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const TONE_CLASS: Record<PurchasingTone, string> = {
  success: 'hrm-badge hrm-badge--success',
  warning: 'hrm-badge hrm-badge--warning',
  danger: 'hrm-badge hrm-badge--danger',
  neutral: 'hrm-badge hrm-badge--neutral',
  primary: 'hrm-badge hrm-badge--primary',
};

interface PurchasingStatusBadgeProps {
  label: string;
  tone: PurchasingTone;
}

export default function PurchasingStatusBadge({ label, tone }: PurchasingStatusBadgeProps) {
  return <span className={TONE_CLASS[tone]}>{label}</span>;
}
