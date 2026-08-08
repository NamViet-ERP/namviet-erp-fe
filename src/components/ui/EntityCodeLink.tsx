import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

const CODE_LINK_CLASS =
  'appearance-none border-0 bg-transparent p-0 font-mono text-sm font-bold underline underline-offset-2 text-[var(--md-on-surface)] hover:text-[var(--md-primary)] cursor-pointer text-left';

interface EntityCodeLinkProps {
  code: string;
  to?: string;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  title?: string;
  children?: ReactNode;
}

/** Mã nghiệp vụ: đậm + gạch chân, click mở chi tiết. */
export default function EntityCodeLink({
  code,
  to,
  onClick,
  className,
  title,
  children,
}: EntityCodeLinkProps) {
  const cls = className ? `${CODE_LINK_CLASS} ${className}` : CODE_LINK_CLASS;
  const label = children ?? code;

  if (to) {
    return (
      <Link
        to={to}
        className={cls}
        title={title ?? code}
        onClick={e => {
          e.stopPropagation();
          onClick?.(e);
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      title={title ?? code}
      onClick={e => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {label}
    </button>
  );
}
