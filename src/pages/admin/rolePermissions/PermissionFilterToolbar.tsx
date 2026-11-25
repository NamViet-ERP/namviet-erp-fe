import { Filter, Globe, Search, X } from 'lucide-react';
import type { ActionFilter, StatusFilter } from './rolePermissionHelpers';

interface PermissionFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchCrossModules: boolean;
  onSearchCrossModulesChange: (checked: boolean) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  actionFilter: ActionFilter;
  onActionFilterChange: (action: ActionFilter) => void;
  totalCount: number;
  grantedCount: number;
  isFiltered: boolean;
  matchingPermissionsCount: number;
  onResetFilters: () => void;
}

export default function PermissionFilterToolbar({
  search,
  onSearchChange,
  searchCrossModules,
  onSearchCrossModulesChange,
  statusFilter,
  onStatusFilterChange,
  actionFilter,
  onActionFilterChange,
  totalCount,
  grantedCount,
  isFiltered,
  matchingPermissionsCount,
  onResetFilters,
}: PermissionFilterToolbarProps) {
  return (
    <>
      <div className="admin-role-permissions-toolbar">
        <div className="admin-role-permissions-search-row">
          <div className="admin-role-permissions-search-box">
            <Search
              className="admin-role-permissions-search-icon"
              size={16}
              aria-hidden
            />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm nhanh theo tên quyền, mã quyền (vd: view, kho, dự án, đơn giá)..."
              className="admin-role-permissions-search-input"
              aria-label="Tìm kiếm quyền"
            />
            {search && (
              <button
                type="button"
                className="admin-role-permissions-search-clear"
                onClick={() => onSearchChange('')}
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>

          <label className="admin-role-permissions-search-cross-module">
            <input
              type="checkbox"
              checked={searchCrossModules}
              onChange={e => onSearchCrossModulesChange(e.target.checked)}
              className="admin-role-permissions-table__checkbox"
            />
            <Globe size={14} className="text-[var(--md-primary)]" aria-hidden />
            <span>Tìm trên tất cả phân hệ</span>
          </label>
        </div>

        <div className="admin-role-permissions-filter-row">
          <div
            className="admin-role-permissions-status-tabs"
            role="tablist"
            aria-label="Lọc trạng thái quyền"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              className={`admin-role-permissions-status-tab${
                statusFilter === 'all'
                  ? ' admin-role-permissions-status-tab--active'
                  : ''
              }`}
              onClick={() => onStatusFilterChange('all')}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'granted'}
              className={`admin-role-permissions-status-tab${
                statusFilter === 'granted'
                  ? ' admin-role-permissions-status-tab--active'
                  : ''
              }`}
              onClick={() => onStatusFilterChange('granted')}
            >
              Đang bật ({grantedCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'ungranted'}
              className={`admin-role-permissions-status-tab${
                statusFilter === 'ungranted'
                  ? ' admin-role-permissions-status-tab--active'
                  : ''
              }`}
              onClick={() => onStatusFilterChange('ungranted')}
            >
              Chưa bật ({totalCount - grantedCount})
            </button>
          </div>

          <div className="admin-role-permissions-chips">
            <span className="text-xs text-[var(--md-on-surface-variant)] font-medium mr-1 flex items-center gap-1">
              <Filter size={12} aria-hidden />
              Loại:
            </span>
            <button
              type="button"
              className={`admin-role-permissions-chip${
                actionFilter === 'all'
                  ? ' admin-role-permissions-chip--active'
                  : ''
              }`}
              onClick={() => onActionFilterChange('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`admin-role-permissions-chip${
                actionFilter === 'view'
                  ? ' admin-role-permissions-chip--active'
                  : ''
              }`}
              onClick={() => onActionFilterChange('view')}
            >
              Chỉ quyền Xem
            </button>
            <button
              type="button"
              className={`admin-role-permissions-chip${
                actionFilter === 'create_update'
                  ? ' admin-role-permissions-chip--active'
                  : ''
              }`}
              onClick={() => onActionFilterChange('create_update')}
            >
              Chỉ quyền Tạo & Sửa
            </button>
            <button
              type="button"
              className={`admin-role-permissions-chip${
                actionFilter === 'approve'
                  ? ' admin-role-permissions-chip--active'
                  : ''
              }`}
              onClick={() => onActionFilterChange('approve')}
            >
              Chỉ quyền Duyệt
            </button>
            <button
              type="button"
              className={`admin-role-permissions-chip${
                actionFilter === 'price_report'
                  ? ' admin-role-permissions-chip--active'
                  : ''
              }`}
              onClick={() => onActionFilterChange('price_report')}
            >
              Quyền Giá & Báo cáo
            </button>

            {isFiltered && (
              <button
                type="button"
                className="admin-role-permissions-reset-filter"
                onClick={onResetFilters}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {isFiltered && (
        <div className="px-4 py-2 bg-[var(--md-surface-container-low)] border-b border-[var(--md-outline-variant02)] flex items-center justify-between text-xs text-[var(--md-on-surface-variant)]">
          <span>
            Tìm thấy{' '}
            <strong className="text-[var(--md-on-surface)]">
              {matchingPermissionsCount}
            </strong>{' '}
            quyền phù hợp
            {search && (
              <>
                {' '}
                với từ khóa &ldquo;
                <span className="text-[var(--md-primary)] font-semibold">
                  {search}
                </span>
                &rdquo;
              </>
            )}
            {searchCrossModules && ' (trên tất cả phân hệ)'}
          </span>
          {matchingPermissionsCount === 0 && (
            <button
              type="button"
              className="text-[var(--md-primary)] hover:underline font-medium"
              onClick={onResetFilters}
            >
              Xóa bộ lọc để xem lại toàn bộ
            </button>
          )}
        </div>
      )}
    </>
  );
}
