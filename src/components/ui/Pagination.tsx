import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageBtnProps {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

function PageBtn({ children, onClick, active, disabled, ariaLabel }: PageBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`pagination-bar__btn${active ? ' pagination-bar__btn--active' : ''}`}
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
  /** Nhãn đếm bản ghi, mặc định "bản ghi" */
  itemLabel?: string;
  /** Gắn trong panel bảng — không margin ngoài */
  embedded?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  itemLabel = 'bản ghi',
  embedded = false,
}: PaginationProps) {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`pagination-bar${embedded ? ' pagination-bar--embedded' : ''}`}>
      <div className="pagination-bar__meta">
        <label className="pagination-bar__size-label" htmlFor="pagination-page-size">
          Hiển thị
        </label>
        <select
          id="pagination-page-size"
          value={pageSize}
          onChange={e => onPageSizeChange?.(Number(e.target.value))}
          className="pagination-bar__size-select"
        >
          {[10, 15, 25, 50].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="pagination-bar__count tabular-nums">
          {rangeStart}–{rangeEnd} / {totalItems} {itemLabel}
        </span>
      </div>

      <nav className="pagination-bar__nav" aria-label="Phân trang">
        <PageBtn
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          ariaLabel="Trang trước"
        >
          <ChevronLeft size={18} />
        </PageBtn>

        {start > 1 && (
          <>
            <PageBtn onClick={() => onPageChange(1)}>1</PageBtn>
            {start > 2 && <span className="pagination-bar__ellipsis">···</span>}
          </>
        )}

        {pages.map(page => (
          <PageBtn
            key={page}
            onClick={() => onPageChange(page)}
            active={page === currentPage}
            ariaLabel={`Trang ${page}`}
          >
            {page}
          </PageBtn>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="pagination-bar__ellipsis">···</span>}
            <PageBtn onClick={() => onPageChange(totalPages)} ariaLabel={`Trang ${totalPages}`}>
              {totalPages}
            </PageBtn>
          </>
        )}

        <PageBtn
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          ariaLabel="Trang sau"
        >
          <ChevronRight size={18} />
        </PageBtn>
      </nav>
    </div>
  );
}
