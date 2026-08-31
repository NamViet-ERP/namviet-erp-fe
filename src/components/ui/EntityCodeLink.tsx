import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EntityCodeLinkProps {
  code: string;
  to?: string;
  state?: unknown;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  title?: string;
  children?: ReactNode;
}

/** Mã nghiệp vụ bấm được: một kiểu trên mọi bảng (mono, gạch chân, hover primary). */
export default function EntityCodeLink({
  code,
  to,
  state,
  onClick,
  className,
  title,
  children,
}: EntityCodeLinkProps) {
  const cls = className ? `entity-code-link ${className}` : 'entity-code-link';
  const label = children ?? code;

  if (to) {
    return (
      <Link
        to={to}
        state={state}
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
