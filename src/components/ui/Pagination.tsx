import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageBtnProps {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function PageBtn({ children, onClick, active, disabled }: PageBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        border: 'none',
        background: active ? 'var(--md-secondary-container)' : 'transparent',
        color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '0.875rem',
        fontWeight: active ? 700 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'background 200ms var(--md-easing), color 200ms var(--md-easing)',
        padding: '0 6px',
      }}
      onMouseEnter={e => {
        if (!disabled && !active) e.currentTarget.style.background = 'var(--tint-primary-hover)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  totalItems: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }: PaginationProps) {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '12px',
      }}
    >
      {/* Left: page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="form-select"
          style={{ width: '72px', height: '36px', fontSize: '0.8125rem' }}
        >
          {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          Hiển thị {Math.min(pageSize, totalItems)} / {totalItems} bản ghi
        </span>
      </div>

      {/* Right: page navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <PageBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          <ChevronLeft size={18} />
        </PageBtn>

        {start > 1 && (
          <>
            <PageBtn onClick={() => onPageChange(1)}>1</PageBtn>
            {start > 2 && (
              <span style={{ padding: '0 4px', color: 'var(--md-on-surface-variant)', fontSize: '0.875rem' }}>···</span>
            )}
          </>
        )}

        {pages.map(page => (
          <PageBtn key={page} onClick={() => onPageChange(page)} active={page === currentPage}>
            {page}
          </PageBtn>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span style={{ padding: '0 4px', color: 'var(--md-on-surface-variant)', fontSize: '0.875rem' }}>···</span>
            )}
            <PageBtn onClick={() => onPageChange(totalPages)}>{totalPages}</PageBtn>
          </>
        )}

        <PageBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          <ChevronRight size={18} />
        </PageBtn>
      </div>
    </div>
  );
}
