import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
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
  groupPermissionCatalog,
  type PermissionModuleGroup,
} from '../../lib/permissions/groupPermissionCatalog';
import { getApiErrorMessage } from '../../lib/apiClient';

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

export default function AdminRolePermissionsPage() {
  const navigate = useNavigate();
  const { code = '' } = useParams<{ code: string }>();
  const { has: hasPermission } = usePermission();
  const canEdit = hasPermission('admin.roles.permissions.update');

  const { data: roles = [] } = useRoles();
  const roleLabel = roles.find(r => r.code === code)?.label ?? code;

  const { data: catalog = [], isLoading: catalogLoading } = usePermissionCatalog();
  const { data: rolePermissions, isLoading: permissionsLoading, isError, error } = useRolePermissions(code);
  const updateMutation = useUpdateRolePermissions(code);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [baseline, setBaseline] = useState<Set<string>>(new Set());
  const [syncedPermissions, setSyncedPermissions] = useState(rolePermissions);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [syncedCode, setSyncedCode] = useState(code);

  if (code !== syncedCode) {
    setSyncedCode(code);
    setSearch('');
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
  const visibleGroups = useMemo(() => filterPermissionGroups(groups, search), [groups, search]);
  const activeGroup =
    visibleGroups.find(g => g.module === activeModule)
    ?? visibleGroups[0]
    ?? null;
  const isDirty = !setsEqual(selected, baseline);
  const grantedCount = selected.size;
  const totalCount = catalog.length;
  const loading = catalogLoading || permissionsLoading;
  const activeKeys = activeGroup ? keysOfGroup(activeGroup) : [];
  const activeCheckedCount = countSelected(activeKeys, selected);
  const activeAllChecked = activeKeys.length > 0 && activeCheckedCount === activeKeys.length;
  const activeSomeChecked = activeCheckedCount > 0 && !activeAllChecked;

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

  const showSplit = !loading && !isError && visibleGroups.length > 0 && activeGroup;

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
        <div className="admin-role-permissions-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên quyền hoặc nhóm..."
          />
        </div>

        {loading ? (
          <div className="admin-role-permissions-split" aria-busy="true" aria-live="polite">
            <div className="admin-role-permissions-rail" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="hrm-table-skeleton admin-role-permissions-rail__skel" />
              ))}
            </div>
            <div className="admin-role-permissions-pane">
              <div className="admin-role-permissions-pane__body table-scroll">
                <table className="w-full border-collapse hrm-table">
                  <tbody>
                    <TableSkeletonRows colSpan={2} rows={8} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="admin-role-permissions-empty">
            <EmptyState message={getApiErrorMessage(error, 'Không tải được quyền của vai trò.')} />
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="admin-role-permissions-empty">
            <EmptyState message={search ? 'Không có quyền phù hợp bộ lọc.' : 'Catalog quyền trống.'} />
          </div>
        ) : showSplit && activeGroup ? (
          <div className="admin-role-permissions-split">
            <nav className="admin-role-permissions-rail" aria-label="Phân hệ">
              {visibleGroups.map(group => {
                const keys = keysOfGroup(group);
                const checked = countSelected(keys, selected);
                const isActive = group.module === activeGroup.module;
                return (
                  <button
                    key={group.module}
                    type="button"
                    className={`admin-role-permissions-rail__item${isActive ? ' admin-role-permissions-rail__item--active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setActiveModule(group.module)}
                  >
                    <span className="admin-role-permissions-rail__label">{group.moduleLabel}</span>
                    <span className="admin-role-permissions-rail__count tabular-nums">
                      {checked}/{keys.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            <section
              className="admin-role-permissions-pane"
              aria-labelledby="admin-role-permissions-pane-title"
            >
              <header className="admin-role-permissions-pane__head">
                <div className="admin-role-permissions-pane__heading">
                  <h2 id="admin-role-permissions-pane-title" className="admin-role-permissions-pane__title">
                    {activeGroup.moduleLabel}
                  </h2>
                  <span className="admin-role-permissions-pane__meta tabular-nums">
                    {activeCheckedCount}/{activeKeys.length} quyền
                  </span>
                </div>
                <PermissionGate permission="admin.roles.permissions.update">
                  <label className="admin-role-permissions-pane__select-all">
                    <input
                      type="checkbox"
                      checked={activeAllChecked}
                      ref={el => {
                        if (el) el.indeterminate = activeSomeChecked;
                      }}
                      disabled={!canEdit}
                      onChange={e => toggleKeys(activeKeys, e.target.checked)}
                    />
                    Chọn tất cả
                  </label>
                </PermissionGate>
              </header>

              <div className="admin-role-permissions-pane__body table-scroll">
                <table className="w-full border-collapse hrm-table admin-role-permissions-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell admin-role-permissions-col-on text-center">Bật</th>
                      <th className="table-header-cell">Quyền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.resources.flatMap(resource => {
                      const showGroupRow = activeGroup.resources.length > 1;
                      const rows = resource.entries.map(entry => {
                        const checked = selected.has(entry.key);
                        return (
                          <tr
                            key={entry.key}
                            className={`table-row${canEdit ? ' hrm-table-row--interactive' : ''}${checked ? ' admin-role-permissions-table__row--on' : ''}`}
                            title={entry.key}
                            onClick={() => canEdit && togglePermission(entry.key, !checked)}
                          >
                            <td className="table-cell text-center">
                              <input
                                type="checkbox"
                                className="admin-role-permissions-table__checkbox"
                                checked={checked}
                                disabled={!canEdit}
                                onClick={e => e.stopPropagation()}
                                onChange={e => togglePermission(entry.key, e.target.checked)}
                                aria-label={`Bật quyền ${entry.label}`}
                              />
                            </td>
                            <td className="table-cell">{entry.label}</td>
                          </tr>
                        );
                      });

                      if (!showGroupRow) return rows;

                      return [
                        <tr key={`group-${resource.resource}`} className="admin-role-permissions-group-row">
                          <td className="admin-role-permissions-group" colSpan={2}>
                            {resource.resourceLabel}
                          </td>
                        </tr>,
                        ...rows,
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
        Quyền được gán theo vai trò - người dùng kế thừa từ role đã chọn khi cấp tài khoản.
        {' '}
        <Link to="/admin/users" className="hrm-settings-link inline-flex">
          Quản lý người dùng
        </Link>
      </p>
    </div>
  );
}
