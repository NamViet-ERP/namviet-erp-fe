import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, RefreshCw, type LucideIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';

export function PillarLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-4 text-center text-[var(--md-error)]">
      <AlertTriangle size={24} className="mx-auto text-[var(--md-error)] mb-1" aria-hidden />
      <p className="m-0 font-medium">{message}</p>
      <Button
        type="button"
        variant="tonal"
        size="sm"
        leftIcon={RefreshCw}
        className="mt-2"
        onClick={onRetry}
      >
        Thử lại
      </Button>
    </div>
  );
}

interface Executive360PillarCardProps {
  icon: LucideIcon;
  iconToneClass: string;
  title: string;
  headerRight: ReactNode;
  footerLeft: ReactNode;
  footerLinkTo?: string;
  footerLinkLabel?: string;
  className?: string;
  children: ReactNode;
}

export default function Executive360PillarCard({
  icon: Icon,
  iconToneClass,
  title,
  headerRight,
  footerLeft,
  footerLinkTo,
  footerLinkLabel,
  className = '',
  children,
}: Executive360PillarCardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-lowest)] p-4 sm:p-5 flex flex-col justify-between shadow-sm ${className}`.trim()}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--md-outline-variant02)]">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-[var(--md-surface-container-high)] ${iconToneClass}`}>
              <Icon size={18} aria-hidden />
            </div>
            <h3 className="font-semibold text-sm text-[var(--md-on-surface)] m-0">{title}</h3>
          </div>
          {headerRight}
        </div>

        <div className="space-y-2 text-xs">{children}</div>
      </div>

      <div className="pt-3 mt-3 border-t border-[var(--md-outline-variant02)] flex items-center justify-between">
        <span className="text-xs text-[var(--md-on-surface-variant)]">{footerLeft}</span>
        {footerLinkTo && footerLinkLabel ? (
          <Link
            to={footerLinkTo}
            className="text-xs text-[var(--md-primary)] font-semibold flex items-center gap-1 hover:underline"
          >
            <span>{footerLinkLabel}</span>
            <ArrowRight size={13} aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
