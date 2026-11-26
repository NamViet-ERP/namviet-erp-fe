import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { usePermission } from '../../../hooks/usePermission';
import {
  usePermissionCatalog,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../../../hooks/useRolePermissions';
import { useRoles } from '../../../hooks/useRoles';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { filterPermissionGroups, groupPermissionCatalog } from '../../../lib/permissions/groupPermissionCatalog';
import type { RolePermissionsApiDto } from '../../../services/rolePermissionsService';
import {
  countSelected,
  keysOfGroup,
  setsEqual,
  type ActionFilter,
  type StatusFilter,
} from './rolePermissionHelpers';

interface RoleFilterState {
  code: string;
  search: string;
  searchCrossModules: boolean;
  statusFilter: StatusFilter;
  actionFilter: ActionFilter;
  activeModule: string | null;
}

interface ScopedSnapshot<T> {
  code: string;
  serverSnapshot: RolePermissionsApiDto | undefined;
  value: T;
}

const defaultFilters = (code: string): RoleFilterState => ({
  code,
  search: '',
  searchCrossModules: false,
  statusFilter: 'all',
  actionFilter: 'all',
  activeModule: null,
});

export function useRolePermissionsController() {
  const navigate = useNavigate();
  const { code = '' } = useParams<{ code: string }>();
  const { has: hasPermission } = usePermission();
  const canEdit = hasPermission('admin.roles.permissions.update');

  const { data: roles = [] } = useRoles();
  const roleLabel = roles.find(r => r.code === code)?.label ?? code;

  const catalogQuery = usePermissionCatalog();
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const { data: rolePermissions, isLoading: permissionsLoading, isError, error } = useRolePermissions(code);
  const updateMutation = useUpdateRolePermissions(code);

  const [filterState, setFilterState] = useState<RoleFilterState>(() => defaultFilters(code));
  const [draft, setDraft] = useState<ScopedSnapshot<Set<string>> | null>(null);
  const [savedOverride, setSavedOverride] = useState<ScopedSnapshot<Set<string>> | null>(null);

  const filters = filterState.code === code ? filterState : defaultFilters(code);
  const matchesScope = (s: ScopedSnapshot<Set<string>> | null) =>
    Boolean(s && s.code === code && s.serverSnapshot === rolePermissions);

  const serverBaseline = useMemo(
    () => new Set(rolePermissions?.permissions ?? []),
    [rolePermissions],
  );
  const baseline = matchesScope(savedOverride) ? savedOverride!.value : serverBaseline;
  const selected = matchesScope(draft) ? draft!.value : baseline;

  const updateFilters = (patch: Partial<Omit<RoleFilterState, 'code'>>) =>
    setFilterState({ ...filters, ...patch, code });

  const groups = useMemo(() => groupPermissionCatalog(catalog), [catalog]);
  const visibleGroups = useMemo(
    () =>
      filterPermissionGroups(groups, {
        search: filters.search,
        status: filters.statusFilter,
        selectedKeys: selected,
        actionFilter: filters.actionFilter,
      }),
    [groups, filters.search, filters.statusFilter, selected, filters.actionFilter],
  );

  const activeGroup = visibleGroups.find(g => g.module === filters.activeModule) ?? visibleGroups[0] ?? null;
  const isDirty = !setsEqual(selected, baseline);
  const displayGroups = useMemo(
    () => (filters.searchCrossModules ? visibleGroups : activeGroup ? [activeGroup] : []),
    [filters.searchCrossModules, visibleGroups, activeGroup],
  );
  const inViewKeys = useMemo(() => displayGroups.flatMap(g => keysOfGroup(g)), [displayGroups]);
  const inViewCheckedCount = countSelected(inViewKeys, selected);
  const allInViewChecked = inViewKeys.length > 0 && inViewCheckedCount === inViewKeys.length;
  const someInViewChecked = inViewCheckedCount > 0 && !allInViewChecked;

  const matchingPermissionsCount = useMemo(
    () => visibleGroups.reduce((sum, g) => sum + g.resources.reduce((rSum, r) => rSum + r.entries.length, 0), 0),
    [visibleGroups],
  );

  const isFiltered =
    filters.search.trim() !== '' ||
    filters.statusFilter !== 'all' ||
    filters.actionFilter !== 'all' ||
    filters.searchCrossModules;

  const toggleKeys = (keys: string[], checked: boolean) => {
    if (!canEdit) return;
    const next = new Set(selected);
    for (const key of keys) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    setDraft({ code, serverSnapshot: rolePermissions, value: next });
  };

  const togglePermission = (key: string, checked: boolean) => toggleKeys([key], checked);

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    try {
      await updateMutation.mutateAsync({ permissions: [...selected].sort() });
      setSavedOverride({ code, serverSnapshot: rolePermissions, value: new Set(selected) });
      setDraft(null);
      showToast('success', `Đã lưu quyền cho vai trò "${roleLabel}"`);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu ma trận quyền'));
    }
  };

  return {
    code,
    roleLabel,
    canEdit,
    loading: catalogQuery.isLoading || permissionsLoading,
    isError,
    error,
    isSaving: updateMutation.isPending,
    isDirty,
    grantedCount: selected.size,
    totalCount: catalog.length,
    groups,
    visibleGroups,
    activeGroup,
    displayGroups,
    selected,
    inViewKeys,
    inViewCheckedCount,
    allInViewChecked,
    someInViewChecked,
    matchingPermissionsCount,
    isFiltered,
    search: filters.search,
    searchCrossModules: filters.searchCrossModules,
    statusFilter: filters.statusFilter,
    actionFilter: filters.actionFilter,
    setSearch: (search: string) => updateFilters({ search }),
    setSearchCrossModules: (searchCrossModules: boolean) => updateFilters({ searchCrossModules }),
    setStatusFilter: (statusFilter: StatusFilter) => updateFilters({ statusFilter }),
    setActionFilter: (actionFilter: ActionFilter) => updateFilters({ actionFilter }),
    selectModule: (module: string) => updateFilters({ searchCrossModules: false, activeModule: module }),
    togglePermission,
    toggleKeys,
    handleReset: () => setDraft(null),
    handleResetFilters: () => setFilterState(defaultFilters(code)),
    handleSave,
    goBack: () => navigate('/admin/settings'),
  };
}
