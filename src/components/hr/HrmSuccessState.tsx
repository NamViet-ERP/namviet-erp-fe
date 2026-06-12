import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface HrmSuccessStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  iconSize?: number;
  animated?: boolean;
}

export default function HrmSuccessState({
  title,
  description,
  actionLabel,
  onAction,
  iconSize = 64,
  animated = false,
}: HrmSuccessStateProps) {
  return (
    <div className={`hrm-success-state${animated ? ' animate-scale-in' : ''}`}>
      <div className="hrm-success-state__icon">
        <CheckCircle2 size={iconSize} />
      </div>
      <h3 className="hrm-success-state__title">{title}</h3>
      <p className="hrm-success-state__desc">{description}</p>
      <button type="button" onClick={onAction} className="btn btn-primary rounded-full px-8 font-bold">
        {actionLabel}
      </button>
    </div>
  );
}

export function HrmFormSubmitButton({
  label,
  loadingLabel,
  isLoading,
  disabled,
  icon,
}: {
  label: string;
  loadingLabel: string;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="btn btn-primary w-full h-12 rounded-full font-bold mt-8 flex items-center justify-center gap-2"
    >
      <span>{isLoading ? loadingLabel : label}</span>
      {icon}
    </button>
  );
}
