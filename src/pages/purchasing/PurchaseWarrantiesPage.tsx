import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import TabFilter from '../../components/ui/TabFilter';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  usePurchaseWarranties,
  usePurchaseWarrantyClaims,
  useSyncPurchaseWarranties,
} from '../../hooks/usePurchaseWarranties';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { TabItem } from '../../types';
import type { PurchaseWarrantyApiDto } from '../../services/purchaseWarrantiesService';
import CreateComplaintTicketPanel from './warranties/CreateComplaintTicketPanel';
import WarrantyComplaintsPanel from './warranties/WarrantyComplaintsPanel';
import WarrantyDetailModal from './warranties/WarrantyDetailModal';
import WarrantyRegistryPanel from './warranties/WarrantyRegistryPanel';
import {
  WARRANTY_PAGE_TABS,
  type WarrantyPageTab,
} from './warranties/warrantyLabels';

function tabFromParam(value: string | null): WarrantyPageTab {
  if (value === 'complaints' || value === 'create-complaint') return 'complaints';
  return 'registry';
}

function shouldOpenCreate(value: string | null): boolean {
  return value === 'create-complaint' || value === 'create-warranty';
}

export default function PurchaseWarrantiesPage() {
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

  const { data = [], isLoading, isError, error } = usePurchaseWarranties(listParams);
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
    // Deep-link URL (?tab=create / create-complaint) opens create modal once
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link opens create modal once
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

  const goCreateComplaint = (row: PurchaseWarrantyApiDto) => openCreate(row.id);

  return (
    <div className="page-shell space-y-4 pur-warranty-page">
      <PageHeader
        eyebrow="Mua hàng"
        title="Quản lý bảo hành"
        subtitle="Danh mục lô hàng còn/hết hạn BH và khiếu nại bảo hành / chất lượng với NCC."
        actions={
          canUpdate ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={syncMutation.isPending}
              onClick={() => {
                void onSync();
              }}
            >
              <RefreshCw size={14} aria-hidden />
              {syncMutation.isPending ? 'Đang đồng bộ…' : 'Đồng bộ từ PO đã nhận'}
            </button>
          ) : null
        }
      />

      <div className="tab-filter-row">
        <TabFilter tabs={tabs} activeTab={tab} onChange={id => setTab(id as WarrantyPageTab)} />
      </div>

      {tab === 'registry' ? (
        <div className="hrm-stat-grid">
          <HrmStatCard label="Tổng số lô hàng có bảo hành" value={totalLots} icon={Package} tone="primary" />
          <HrmStatCard label="Còn bảo hành" value={activeLots} icon={ShieldCheck} tone="success" />
          <HrmStatCard label="Đã hết bảo hành" value={expiredLots} icon={TriangleAlert} tone="warning" />
        </div>
      ) : null}
      {tab === 'complaints' ? (
        <div className="hrm-stat-grid">
          <HrmStatCard label="Khiếu nại đang xử lý" value={openComplaints} icon={TriangleAlert} tone="warning" />
          <HrmStatCard label="Tổng số khiếu nại" value={claimsQuery.data?.length ?? 0} icon={Package} tone="primary" />
          <HrmStatCard label="Mức nghiêm trọng chưa đóng" value={highOpen} icon={TriangleAlert} tone="warning" />
        </div>
      ) : null}

      {tab === 'registry' ? (
        <HrmPanel noPadding>
          <WarrantyRegistryPanel
            rows={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            search={search}
            onSearchChange={v => { setSearch(v); setPage(1); }}
            projectCode={projectCode}
            onProjectCodeChange={v => { setProjectCode(v); setPage(1); }}
            materialCode={materialCode}
            onMaterialCodeChange={v => { setMaterialCode(v); setPage(1); }}
            status={status}
            onStatusChange={v => { setStatus(v); setPage(1); }}
            projects={projects}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            canCreate={canCreate}
            onOpenDetail={row => setSelectedId(row.id)}
            onCreateComplaint={goCreateComplaint}
          />
        </HrmPanel>
      ) : null}

      {tab === 'complaints' ? (
        <HrmPanel noPadding>
          <WarrantyComplaintsPanel
            rows={claims}
            isLoading={claimsQuery.isLoading}
            isError={claimsQuery.isError}
            error={claimsQuery.error}
            search={claimSearch}
            onSearchChange={v => { setClaimSearch(v); setClaimPage(1); }}
            status={claimStatus}
            onStatusChange={v => { setClaimStatus(v); setClaimPage(1); }}
            page={claimPage}
            pageSize={claimPageSize}
            onPageChange={setClaimPage}
            onPageSizeChange={setClaimPageSize}
            onOpenWarranty={id => setSelectedId(id)}
            canCreate={canCreate}
            onCreate={() => openCreate()}
          />
        </HrmPanel>
      ) : null}

      <CreateComplaintTicketPanel
        key={createOpen ? `open-${preselectedLotId || 'new'}` : 'closed'}
        isOpen={createOpen}
        onClose={closeCreate}
        lots={lots}
        preselectedId={preselectedLotId}
        canCreate={canCreate}
        onCreated={() => {
          closeCreate();
          setTab('complaints');
        }}
      />

      <WarrantyDetailModal
        key={selectedId ?? 'closed'}
        selectedId={selectedId}
        canUpdate={canUpdate}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
