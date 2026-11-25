import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import type { TabItem } from '../../types';
import SearchBar from './SearchBar';
import TabFilter from './TabFilter';

export interface FilterToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  hasActiveFilters?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

/** Unified list/dashboard toolbar composing TabFilter, SearchBar, filters, reset, and actions. */
export default function FilterToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder,
  onRefresh,
  tabs,
  activeTab,
  onTabChange,
  filters,
  actions,
  hasActiveFilters = false,
  onReset,
  resetLabel = 'Xóa lọc',
  className = '',
}: FilterToolbarProps) {
  const showTabs = Boolean(tabs && tabs.length > 0 && onTabChange);
  const showReset = Boolean(hasActiveFilters && onReset);
  const showBar = Boolean(onSearchChange || filters || actions || showReset);

  return (
    <div className={['erp-filter-toolbar', className].filter(Boolean).join(' ')}>
      {showTabs && tabs && onTabChange ? (
        <div className="erp-filter-toolbar__tabs">
          <TabFilter tabs={tabs} activeTab={activeTab ?? tabs[0].id} onChange={onTabChange} />
        </div>
      ) : null}

      {showBar ? (
        <div className="erp-filter-toolbar__bar">
          <div className="erp-filter-toolbar__controls">
            {onSearchChange ? (
              <SearchBar
                value={search}
                onChange={onSearchChange}
                onRefresh={onRefresh}
                placeholder={searchPlaceholder}
              />
            ) : null}
            {filters}
            {showReset && onReset ? (
              <button type="button" onClick={onReset} className="hrm-filter-reset">
                <RotateCcw size={14} aria-hidden />
                <span>{resetLabel}</span>
              </button>
            ) : null}
          </div>
          {actions ? <div className="erp-filter-toolbar__actions">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
