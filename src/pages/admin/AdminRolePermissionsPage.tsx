import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, RotateCcw, Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
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
} from '../../lib/permissions/groupPermissionCatalog';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_LOADING } from '../../lib/uiMessages';

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
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

  const isDirty = !setsEqual(selected, baseline);
  const grantedCount = selected.size;
  const totalCount = catalog.length;
  const loading = catalogLoading || permissionsLoading;

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

  return (
    <div className="hrm-page admin-role-permissions-page">
      <div className="admin-role-permissions-page__toolbar">
        <button
          type="button"
          className="btn btn-outline btn-sm flex items-center gap-2"
          onClick={() => navigate('/admin/settings')}
        >
          <ArrowLeft size={16} />
          Về thiết lập vai trò
        </button>
      </div>

      <PageHeader
        eyebrow="Admin · Quyền hạn"
        title={roleLabel}
        subtitle={`Ma trận quyền theo catalog hệ thống — ${grantedCount}/${totalCount} quyền đang bật.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-outline flex items-center gap-2"
              disabled={!isDirty || updateMutation.isPending}
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Hoàn tác
            </button>
            <PermissionGate permission="admin.roles.permissions.update">
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2"
                disabled={!isDirty || updateMutation.isPending}
                onClick={() => void handleSave()}
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </PermissionGate>
          </div>
        }
      />

      {!canEdit && (
        <p className="admin-role-permissions-page__readonly-note">
          Bạn chỉ có quyền xem ma trận quyền. Liên hệ quản trị viên để chỉnh sửa.
        </p>
      )}

      <HrmPanel className="admin-role-permissions-page__panel">
        <div className="admin-role-permissions-page__filters">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên quyền hoặc mã key..."
          />
          <div className="admin-role-permissions-page__summary">
            <KeyRound size={16} aria-hidden />
            <span>
              <strong>{grantedCount}</strong> / {totalCount} quyền
              {isDirty && <span className="admin-role-permissions-page__dirty"> · Chưa lưu</span>}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="hrm-recruitment-positions-empty">{UI_LOADING.roles}</div>
        ) : isError ? (
          <EmptyState message={getApiErrorMessage(error, 'Không tải được quyền của vai trò.')} />
        ) : visibleGroups.length === 0 ? (
          <EmptyState message={search ? 'Không có quyền phù hợp bộ lọc.' : 'Catalog quyền trống.'} />
        ) : (
          <div className="admin-role-permissions-page__groups">
            {visibleGroups.map(group => {
              const groupKeys = group.resources.flatMap(r => r.entries.map(e => e.key));
              const groupCheckedCount = groupKeys.filter(k => selected.has(k)).length;
              const groupAllChecked = groupKeys.length > 0 && groupCheckedCount === groupKeys.length;
              const groupSomeChecked = groupCheckedCount > 0 && !groupAllChecked;

              return (
                <section key={group.module} className="admin-role-permissions-module">
                  <header className="admin-role-permissions-module__head">
                    <div>
                      <h2 className="admin-role-permissions-module__title">{group.moduleLabel}</h2>
                      <p className="admin-role-permissions-module__meta">
                        {groupCheckedCount}/{groupKeys.length} quyền trong module
                      </p>
                    </div>
                    <PermissionGate permission="admin.roles.permissions.update">
                      <label className="admin-role-permissions-module__select-all">
                        <input
                          type="checkbox"
                          checked={groupAllChecked}
                          ref={el => {
                            if (el) el.indeterminate = groupSomeChecked;
                          }}
                          disabled={!canEdit}
                          onChange={e => toggleKeys(groupKeys, e.target.checked)}
                        />
                        Chọn tất cả
                      </label>
                    </PermissionGate>
                  </header>

                  {group.resources.map(resource => (
                    <div key={`${group.module}-${resource.resource}`} className="admin-role-permissions-resource">
                      <h3 className="admin-role-permissions-resource__title">{resource.resource}</h3>
                      <div className="overflow-x-auto table-scroll">
                        <table className="w-full min-w-max border-collapse hrm-table admin-role-permissions-table">
                          <thead>
                            <tr>
                              <th className="table-header-cell w-12 text-center">Bật</th>
                              <th className="table-header-cell">Quyền</th>
                              <th className="table-header-cell">Mã key</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resource.entries.map(entry => {
                              const checked = selected.has(entry.key);
                              return (
                                <tr key={entry.key} className="table-row">
                                  <td className="table-cell text-center">
                                    <input
                                      type="checkbox"
                                      className="admin-role-permissions-table__checkbox"
                                      checked={checked}
                                      disabled={!canEdit}
                                      onChange={e => togglePermission(entry.key, e.target.checked)}
                                      aria-label={`Bật quyền ${entry.label}`}
                                    />
                                  </td>
                                  <td className="table-cell">
                                    <span className="admin-role-permissions-table__label">{entry.label}</span>
                                  </td>
                                  <td className="table-cell">
                                    <code className="admin-role-permissions-table__key">{entry.key}</code>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </HrmPanel>

      <p className="admin-role-permissions-page__footer-note text-xs text-[var(--md-on-surface-variant)]">
        Quyền được gán theo vai trò — người dùng kế thừa từ role đã chọn khi cấp tài khoản.
        {' '}
        <Link to="/admin/users" className="hrm-settings-link inline-flex">
          Quản lý người dùng
        </Link>
      </p>
    </div>
  );
}
