import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import {
  usePurchaseWarranties,
  usePurchaseWarrantyClaims,
  useSyncPurchaseWarranties,
} from '../../../hooks/usePurchaseWarranties';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { TabItem } from '../../../types';
import { WARRANTY_PAGE_TABS, type WarrantyPageTab } from './warrantyLabels';

function tabFromParam(value: string | null): WarrantyPageTab {
  if (value === 'complaints' || value === 'create-complaint') return 'complaints';
  return 'registry';
}

function shouldOpenCreate(value: string | null): boolean {
  return value === 'create-complaint' || value === 'create-warranty';
}

export function usePurchaseWarrantiesController() {
  const { has } = usePermission();
  const canCreate = has('purchasing.warranties.create');
  const canUpdate = has('purchasing.warranties.update');
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = tabFromParam(tabParam);

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatus, setClaimStatus] = useState('');
  const [claimPage, setClaimPage] = useState(1);
  const [claimPageSize, setClaimPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preselectedLotId, setPreselectedLotId] = useState('');
  const [createOpen, setCreateOpen] = useState(() => shouldOpenCreate(tabParam));

  const listParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      projectCode: projectCode.trim() || undefined,
      materialCode: materialCode.trim() || undefined,
      status: status || undefined,
    }),
    [search, projectCode, materialCode, status],
  );
  const claimParams = useMemo(() => ({ kind: 'complaint' as const }), []);

  const warrantiesQuery = usePurchaseWarranties(listParams);
  const lotsQuery = usePurchaseWarranties({});
  const lots = lotsQuery.data ?? [];
  const claimsQuery = usePurchaseWarrantyClaims(claimParams);
  const claims = useMemo(() => {
    let rows = claimsQuery.data ?? [];
    if (claimStatus) rows = rows.filter(c => c.status === claimStatus);
    const q = claimSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(c =>
        [c.ticketCode, c.reason, c.poCode, c.materialName, c.materialCode ?? '', c.supplierName ?? '', c.projectCode ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    return rows;
  }, [claimsQuery.data, claimSearch, claimStatus]);
  const syncMutation = useSyncPurchaseWarranties();

  const totalLots = lots.length;
  const activeLots = lots.filter(r => r.status === 'active').length;
  const expiredLots = lots.filter(r => r.status === 'expired').length;
  const openComplaints = (claimsQuery.data ?? []).filter(
    c => c.status !== 'closed' && c.status !== 'cancelled',
  ).length;
  const highOpen = (claimsQuery.data ?? []).filter(
    c => c.severity === 'high' && c.status !== 'closed' && c.status !== 'cancelled',
  ).length;

  useEffect(() => {
    if (!shouldOpenCreate(tabParam)) return;
    setCreateOpen(true);
    setSearchParams(tabParam === 'create-complaint' ? { tab: 'complaints' } : {}, { replace: true });
  }, [tabParam, setSearchParams]);

  const setTab = (next: WarrantyPageTab) => {
    setSearchParams(next === 'registry' ? {} : { tab: next }, { replace: true });
  };

  const openCreate = (lotId = '') => {
    setPreselectedLotId(lotId);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setPreselectedLotId('');
  };

  const onSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      showToast('success', `Đã đồng bộ: tạo ${result.created}, cập nhật ${result.updated} hồ sơ BH.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không đồng bộ được bảo hành'));
    }
  };

  const tabs: TabItem[] = WARRANTY_PAGE_TABS.map(t => {
    if (t.id === 'registry') return { ...t, count: totalLots };
    if (t.id === 'complaints') return { ...t, count: claimsQuery.data?.length ?? 0 };
    return t;
  });

  return {
    canCreate,
    canUpdate,
    projects,
    tab,
    setTab,
    tabs,
    search,
    setSearch,
    projectCode,
    setProjectCode,
    materialCode,
    setMaterialCode,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    claimSearch,
    setClaimSearch,
    claimStatus,
    setClaimStatus,
    claimPage,
    setClaimPage,
    claimPageSize,
    setClaimPageSize,
    selectedId,
    setSelectedId,
    preselectedLotId,
    createOpen,
    openCreate,
    closeCreate,
    lots,
    warrantiesData: warrantiesQuery.data ?? [],
    warrantiesLoading: warrantiesQuery.isLoading,
    warrantiesError: warrantiesQuery.isError,
    warrantiesErrorObj: warrantiesQuery.error,
    claims,
    claimsTotalCount: claimsQuery.data?.length ?? 0,
    claimsLoading: claimsQuery.isLoading,
    claimsError: claimsQuery.isError,
    claimsErrorObj: claimsQuery.error,
    totalLots,
    activeLots,
    expiredLots,
    openComplaints,
    highOpen,
    syncPending: syncMutation.isPending,
    onSync,
  };
}
