import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import SearchBar from '../ui/SearchBar';
import HrmPanel from '../hr/HrmPanel';

interface PurchasingListLayoutProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Hướng dẫn bước — đặt dưới tiêu đề. */
  intro?: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  filters?: ReactNode;
  hasFilters?: boolean;
  onResetFilters?: () => void;
  children: ReactNode;
}

/** Shared list chrome for Mua hàng UI-only pages. */
export default function PurchasingListLayout({
  eyebrow = 'Mua hàng',
  title,
  subtitle,
  actions,
  intro,
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  hideSearch = false,
  filters,
  hasFilters,
  onResetFilters,
  children,
}: PurchasingListLayoutProps) {
  const showToolbar = !hideSearch || Boolean(filters) || Boolean(hasFilters && onResetFilters);
  return (
    <div className="page-shell">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />
      {intro}
      <HrmPanel noPadding>
        {showToolbar ? (
          <div className="hrm-list-toolbar">
            <div className="hrm-list-toolbar__filters">
              {hideSearch ? null : (
                <SearchBar
                  value={search}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                />
              )}
              {filters && (
                <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                  {filters}
                </div>
              )}
              {hasFilters && onResetFilters && (
                <div className="hrm-list-toolbar__filter-row">
                  <button type="button" onClick={onResetFilters} className="hrm-filter-reset">
                    <RotateCcw size={14} aria-hidden />
                    Xóa lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
        {children}
      </HrmPanel>
    </div>
  );
}
