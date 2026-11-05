import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  Globe,
  RotateCcw,
  Save,
  Search,
  X,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import { HrmBackButton } from '../../components/hr/HrmPageChrome';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import PermissionGate from '../../components/auth/PermissionGate';
import { usePermission } from '../../hooks/usePermission';
import { useRoles } from '../../hooks/useRoles';
import {
  usePermissionCatalog,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../../hooks/useRolePermissions';
import {
  filterPermissionGroups,
  getActionBadgeInfo,
  groupPermissionCatalog,
  type PermissionModuleGroup,
} from '../../lib/permissions/groupPermissionCatalog';
import { getApiErrorMessage } from '../../lib/apiClient';

type StatusFilter = 'all' | 'granted' | 'ungranted';
type ActionFilter = 'all' | 'view' | 'create_update' | 'approve' | 'price_report';

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function keysOfGroup(group: PermissionModuleGroup): string[] {
  return group.resources.flatMap(r => r.entries.map(e => e.key));
}

function countSelected(keys: string[], selected: Set<string>): number {
  return keys.filter(k => selected.has(k)).length;
}

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return text;
  const index = text.toLowerCase().indexOf(trimmed);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-amber-200 text-slate-950 rounded px-0.5 dark:bg-amber-400/30 dark:text-amber-200">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

export default function AdminRolePermissionsPage() {
  const navigate = useNavigate();
  const { code = '' } = useParams<{ code: string }>();
  const { has: hasPermission } = usePermission();
  const canEdit = hasPermission('admin.roles.permissions.update');

  const { data: roles = [] } = useRoles();
  const roleLabel = roles.find(r => r.code === code)?.label ?? code;

  const { data: catalog = [], isLoading: catalogLoading } = usePermissionCatalog();
  const {
    data: rolePermissions,
    isLoading: permissionsLoading,
    isError,
    error,
  } = useRolePermissions(code);
  const updateMutation = useUpdateRolePermissions(code);

  const [search, setSearch] = useState('');
  const [searchCrossModules, setSearchCrossModules] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [baseline, setBaseline] = useState<Set<string>>(new Set());
  const [syncedPermissions, setSyncedPermissions] = useState(rolePermissions);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [syncedCode, setSyncedCode] = useState(code);

  if (code !== syncedCode) {
    setSyncedCode(code);
    setSearch('');
    setStatusFilter('all');
    setActionFilter('all');
    setSearchCrossModules(false);
  }

  if (rolePermissions !== syncedPermissions) {
    setSyncedPermissions(rolePermissions);
    if (rolePermissions?.permissions) {
      const next = new Set(rolePermissions.permissions);
      setSelected(next);
      setBaseline(next);
    }
  }

  const groups = useMemo(() => groupPermissionCatalog(catalog), [catalog]);

  const visibleGroups = useMemo(() => {
    return filterPermissionGroups(groups, {
      search,
      status: statusFilter,
      selectedKeys: selected,
      actionFilter,
    });
  }, [groups, search, statusFilter, selected, actionFilter]);

  const activeGroup =
    visibleGroups.find(g => g.module === activeModule) ??
    visibleGroups[0] ??
    null;

  const isDirty = !setsEqual(selected, baseline);
  const grantedCount = selected.size;
  const totalCount = catalog.length;
  const loading = catalogLoading || permissionsLoading;

  const displayGroups = useMemo(() => {
    if (searchCrossModules) return visibleGroups;
    return activeGroup ? [activeGroup] : [];
  }, [searchCrossModules, visibleGroups, activeGroup]);

  const inViewKeys = useMemo(() => {
    return displayGroups.flatMap(g => keysOfGroup(g));
  }, [displayGroups]);

  const inViewCheckedCount = countSelected(inViewKeys, selected);
  const allInViewChecked =
    inViewKeys.length > 0 && inViewCheckedCount === inViewKeys.length;
  const someInViewChecked =
    inViewCheckedCount > 0 && !allInViewChecked;

  const matchingPermissionsCount = useMemo(() => {
    return visibleGroups.reduce(
      (sum, g) => sum + g.resources.reduce((rSum, r) => rSum + r.entries.length, 0),
      0,
    );
  }, [visibleGroups]);

  const isFiltered =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    actionFilter !== 'all' ||
    searchCrossModules;

  const togglePermission = (key: string, checked: boolean) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleKeys = (keys: string[], checked: boolean) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  };

  const handleReset = () => setSelected(new Set(baseline));

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setActionFilter('all');
    setSearchCrossModules(false);
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    try {
      await updateMutation.mutateAsync({ permissions: [...selected].sort() });
      const saved = new Set(selected);
      setBaseline(saved);
      showToast('success', `Đã lưu quyền cho vai trò "${roleLabel}"`);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu ma trận quyền'));
    }
  };

  if (!code) {
    return (
      <div className="hrm-page">
        <EmptyState message="Không tìm thấy mã vai trò." />
      </div>
    );
  }

  const subtitle = isDirty
    ? `${grantedCount}/${totalCount} quyền đang bật · Chưa lưu`
    : `${grantedCount}/${totalCount} quyền đang bật`;

  const showSplit = !loading && !isError && groups.length > 0;

  return (
    <div className="hrm-page admin-role-permissions-page">
      <div className="admin-role-permissions-chrome">
        <HrmBackButton onBack={() => navigate('/admin/settings')} />
        <PageHeader
          title={roleLabel}
          subtitle={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-outline flex items-center gap-2"
                disabled={!isDirty || updateMutation.isPending}
                onClick={handleReset}
              >
                <RotateCcw size={16} aria-hidden />
                Hoàn tác
              </button>
              <PermissionGate permission="admin.roles.permissions.update">
                <button
                  type="button"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={!isDirty || updateMutation.isPending}
                  onClick={() => void handleSave()}
                >
                  <Save size={16} aria-hidden />
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </PermissionGate>
            </div>
          }
        />
      </div>

      {!canEdit && (
        <p className="admin-role-permissions-page__readonly-note">
          Bạn chỉ có quyền xem ma trận quyền. Liên hệ quản trị viên để chỉnh sửa.
        </p>
      )}

      <HrmPanel noPadding className="admin-role-permissions-board">
        {/* Toolbar: Search & Filters */}
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
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm nhanh theo tên quyền, mã quyền (vd: view, kho, dự án, đơn giá)..."
                className="admin-role-permissions-search-input"
                aria-label="Tìm kiếm quyền"
              />
              {search && (
                <button
                  type="button"
                  className="admin-role-permissions-search-clear"
                  onClick={() => setSearch('')}
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
                onChange={e => setSearchCrossModules(e.target.checked)}
                className="admin-role-permissions-table__checkbox"
              />
              <Globe size={14} className="text-[var(--md-primary)]" aria-hidden />
              <span>Tìm trên tất cả phân hệ</span>
            </label>
          </div>

          <div className="admin-role-permissions-filter-row">
            {/* 3-step Status Filter */}
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
                onClick={() => setStatusFilter('all')}
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
                onClick={() => setStatusFilter('granted')}
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
                onClick={() => setStatusFilter('ungranted')}
              >
                Chưa bật ({totalCount - grantedCount})
              </button>
            </div>

            {/* Action Type Filter Chips */}
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
                onClick={() => setActionFilter('all')}
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
                onClick={() => setActionFilter('view')}
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
                onClick={() => setActionFilter('create_update')}
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
                onClick={() => setActionFilter('approve')}
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
                onClick={() => setActionFilter('price_report')}
              >
                Quyền Giá & Báo cáo
              </button>

              {isFiltered && (
                <button
                  type="button"
                  className="admin-role-permissions-reset-filter"
                  onClick={handleResetFilters}
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary Bar */}
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
                onClick={handleResetFilters}
              >
                Xóa bộ lọc để xem lại toàn bộ
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div
            className="admin-role-permissions-split"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="admin-role-permissions-rail" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="hrm-table-skeleton admin-role-permissions-rail__skel"
                />
              ))}
            </div>
            <div className="admin-role-permissions-pane">
              <div className="admin-role-permissions-pane__body table-scroll">
                <table className="w-full border-collapse hrm-table">
                  <tbody>
                    <TableSkeletonRows colSpan={3} rows={8} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={getApiErrorMessage(
                error,
                'Không tải được quyền của vai trò.',
              )}
            />
          </div>
        ) : displayGroups.length === 0 ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={
                isFiltered
                  ? 'Không tìm thấy quyền nào phù hợp bộ lọc hiện tại.'
                  : 'Catalog quyền trống.'
              }
            />
          </div>
        ) : showSplit ? (
          <div className="admin-role-permissions-split">
            {/* Left Rail: Module Tabs */}
            <nav className="admin-role-permissions-rail" aria-label="Phân hệ">
              {groups.map(fullGroup => {
                const fullKeys = keysOfGroup(fullGroup);
                const fullChecked = countSelected(fullKeys, selected);
                const isSelectedModule =
                  !searchCrossModules &&
                  (fullGroup.module === (activeGroup?.module ?? visibleGroups[0]?.module));

                // Find matches in filtered set
                const matchingGroup = visibleGroups.find(
                  g => g.module === fullGroup.module,
                );
                const matchingCount = matchingGroup
                  ? matchingGroup.resources.reduce(
                      (sum, r) => sum + r.entries.length,
                      0,
                    )
                  : 0;

                return (
                  <button
                    key={fullGroup.module}
                    type="button"
                    className={`admin-role-permissions-rail__item${
                      isSelectedModule
                        ? ' admin-role-permissions-rail__item--active'
                        : ''
                    }`}
                    aria-current={isSelectedModule ? 'true' : undefined}
                    onClick={() => {
                      setSearchCrossModules(false);
                      setActiveModule(fullGroup.module);
                    }}
                  >
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="admin-role-permissions-rail__label">
                        {fullGroup.moduleLabel}
                      </span>
                      {isFiltered && (
                        <span className="text-[11px] opacity-75">
                          {matchingCount > 0 ? `${matchingCount} kết quả` : '0 kết quả'}
                        </span>
                      )}
                    </div>
                    <span className="admin-role-permissions-rail__count tabular-nums">
                      {fullChecked}/{fullKeys.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Right Pane: Permissions Table */}
            <section
              className="admin-role-permissions-pane"
              aria-labelledby="admin-role-permissions-pane-title"
            >
              <header className="admin-role-permissions-pane__head">
                <div className="admin-role-permissions-pane__heading">
                  <h2
                    id="admin-role-permissions-pane-title"
                    className="admin-role-permissions-pane__title"
                  >
                    {searchCrossModules
                      ? 'Tất cả phân hệ'
                      : activeGroup?.moduleLabel ?? 'Danh mục quyền'}
                  </h2>
                  <span className="admin-role-permissions-pane__meta tabular-nums">
                    {inViewCheckedCount}/{inViewKeys.length} quyền đang bật trong danh sách này
                  </span>
                </div>
                <PermissionGate permission="admin.roles.permissions.update">
                  <label className="admin-role-permissions-pane__select-all">
                    <input
                      type="checkbox"
                      checked={allInViewChecked}
                      ref={el => {
                        if (el) el.indeterminate = someInViewChecked;
                      }}
                      disabled={!canEdit || inViewKeys.length === 0}
                      onChange={e => toggleKeys(inViewKeys, e.target.checked)}
                    />
                    <span>Chọn tất cả ({inViewKeys.length})</span>
                  </label>
                </PermissionGate>
              </header>

              <div className="admin-role-permissions-pane__body table-scroll">
                <table className="w-full border-collapse hrm-table admin-role-permissions-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell admin-role-permissions-col-on text-center w-14">
                        Bật
                      </th>
                      <th className="table-header-cell w-20 text-center">
                        Loại
                      </th>
                      <th className="table-header-cell">
                        Tên quyền & Mô tả kỹ thuật
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayGroups.flatMap(group => {
                      const showModuleBanner =
                        searchCrossModules && displayGroups.length > 1;

                      const resourceRows = group.resources.flatMap(resource => {
                        const resourceKeys = resource.entries.map(e => e.key);
                        const resourceCheckedCount = countSelected(
                          resourceKeys,
                          selected,
                        );
                        const resourceAllChecked =
                          resourceKeys.length > 0 &&
                          resourceCheckedCount === resourceKeys.length;
                        const resourceSomeChecked =
                          resourceCheckedCount > 0 && !resourceAllChecked;

                        const rows = resource.entries.map(entry => {
                          const checked = selected.has(entry.key);
                          const badge = getActionBadgeInfo(
                            entry.key,
                            entry.label,
                          );

                          return (
                            <tr
                              key={entry.key}
                              className={`table-row${
                                canEdit ? ' hrm-table-row--interactive' : ''
                              }${
                                checked
                                  ? ' admin-role-permissions-table__row--on'
                                  : ''
                              }`}
                              title={entry.key}
                              onClick={() =>
                                canEdit &&
                                togglePermission(entry.key, !checked)
                              }
                            >
                              <td className="table-cell text-center admin-role-permissions-col-on">
                                <input
                                  type="checkbox"
                                  className="admin-role-permissions-table__checkbox"
                                  checked={checked}
                                  disabled={!canEdit}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e =>
                                    togglePermission(
                                      entry.key,
                                      e.target.checked,
                                    )
                                  }
                                  aria-label={`Bật quyền ${entry.label}`}
                                />
                              </td>
                              <td className="table-cell text-center whitespace-nowrap">
                                <span
                                  className={badge.badgeClass}
                                  title={badge.tooltip}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td className="table-cell">
                                <div className="flex flex-col gap-0.5 py-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm text-[var(--md-on-surface)]">
                                      {highlightMatch(entry.label, search)}
                                    </span>
                                    {badge.isSensitive && (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                                        <AlertTriangle size={11} aria-hidden />
                                        Quyền nhạy cảm (Đơn giá & Giá trị tồn)
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-[var(--md-on-surface-variant)] font-mono opacity-80">
                                    {highlightMatch(entry.key, search)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        });

                        return [
                          <tr
                            key={`group-${group.module}-${resource.resource}`}
                            className="admin-role-permissions-group-row"
                          >
                            <td
                              className="admin-role-permissions-group"
                              colSpan={3}
                            >
                              <div className="admin-role-permissions-group__content">
                                <div className="flex items-center gap-2.5">
                                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      className="admin-role-permissions-table__checkbox"
                                      checked={resourceAllChecked}
                                      ref={el => {
                                        if (el)
                                          el.indeterminate =
                                            resourceSomeChecked;
                                      }}
                                      disabled={!canEdit}
                                      onChange={e =>
                                        toggleKeys(
                                          resourceKeys,
                                          e.target.checked,
                                        )
                                      }
                                      aria-label={`Chọn toàn bộ nhóm ${resource.resourceLabel}`}
                                    />
                                    <span className="admin-role-permissions-group__title">
                                      {resource.resourceLabel}
                                    </span>
                                  </label>
                                  <span className="admin-role-permissions-group__count tabular-nums">
                                    {resourceCheckedCount}/{resourceKeys.length}{' '}
                                    quyền
                                  </span>
                                </div>

                                {canEdit && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <button
                                      type="button"
                                      className="text-[var(--md-primary)] hover:underline font-medium px-2 py-0.5 rounded hover:bg-[var(--tint-primary-hover)] transition-colors"
                                      onClick={() =>
                                        toggleKeys(resourceKeys, true)
                                      }
                                      title={`Bật tất cả quyền trong nhóm ${resource.resourceLabel}`}
                                    >
                                      Bật hết
                                    </button>
                                    <span className="text-[var(--md-outline-variant02)]">
                                      |
                                    </span>
                                    <button
                                      type="button"
                                      className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:underline font-medium px-2 py-0.5 rounded hover:bg-[var(--tint-primary-hover)] transition-colors"
                                      onClick={() =>
                                        toggleKeys(resourceKeys, false)
                                      }
                                      title={`Tắt tất cả quyền trong nhóm ${resource.resourceLabel}`}
                                    >
                                      Tắt hết
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>,
                          ...rows,
                        ];
                      });

                      if (!showModuleBanner) return resourceRows;

                      return [
                        <tr
                          key={`module-banner-${group.module}`}
                          className="admin-role-permissions-group-row"
                        >
                          <td
                            colSpan={3}
                            className="bg-[var(--md-surface-container-high)] px-3 py-2 border-y border-[var(--md-outline-variant02)]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-[var(--md-primary)] flex items-center gap-1.5">
                                <Globe size={14} aria-hidden />
                                Phân hệ: {group.moduleLabel}
                              </span>
                              <span className="text-xs text-[var(--md-on-surface-variant)] font-medium tabular-nums">
                                {countSelected(keysOfGroup(group), selected)}/
                                {keysOfGroup(group).length} quyền đang bật
                              </span>
                            </div>
                          </td>
                        </tr>,
                        ...resourceRows,
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </HrmPanel>

      <p className="admin-role-permissions-page__footer-note text-xs text-[var(--md-on-surface-variant)]">
        Quyền được gán theo vai trò - người dùng kế thừa từ role đã chọn khi cấp tài khoản.{' '}
        <Link to="/admin/users" className="hrm-settings-link inline-flex">
          Quản lý người dùng
        </Link>
      </p>
    </div>
  );
}
