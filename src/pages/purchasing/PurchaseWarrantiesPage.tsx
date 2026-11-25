import { Package, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import KpiCard from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TabFilter from '../../components/ui/TabFilter';
import CreateComplaintTicketPanel from './warranties/CreateComplaintTicketPanel';
import { usePurchaseWarrantiesController } from './warranties/usePurchaseWarrantiesController';
import WarrantyComplaintsPanel from './warranties/WarrantyComplaintsPanel';
import WarrantyDetailModal from './warranties/WarrantyDetailModal';
import WarrantyRegistryPanel from './warranties/WarrantyRegistryPanel';
import type { WarrantyPageTab } from './warranties/warrantyLabels';

export default function PurchaseWarrantiesPage() {
  const vm = usePurchaseWarrantiesController();

  return (
    <PageShell className="pur-warranty-page">
      <PageHeader
        eyebrow="Mua hàng"
        title="Quản lý bảo hành"
        subtitle="Danh mục lô hàng còn/hết hạn BH và khiếu nại bảo hành / chất lượng với NCC."
        actions={
          vm.canUpdate ? (
            <Button
              type="button"
              variant="outlined"
              size="sm"
              leftIcon={RefreshCw}
              disabled={vm.syncPending}
              onClick={() => {
                void vm.onSync();
              }}
            >
              {vm.syncPending ? 'Đang đồng bộ…' : 'Đồng bộ từ PO đã nhận'}
            </Button>
          ) : null
        }
      />

      <div className="erp-filter-toolbar__tabs">
        <TabFilter tabs={vm.tabs} activeTab={vm.tab} onChange={id => vm.setTab(id as WarrantyPageTab)} />
      </div>

      {vm.tab === 'registry' ? (
        <MetricsStrip columns={3}>
          <KpiCard label="Tổng số lô hàng có bảo hành" value={vm.totalLots} icon={Package} tone="primary" />
          <KpiCard label="Còn bảo hành" value={vm.activeLots} icon={ShieldCheck} tone="success" />
          <KpiCard label="Đã hết bảo hành" value={vm.expiredLots} icon={TriangleAlert} tone="warning" />
        </MetricsStrip>
      ) : null}
      {vm.tab === 'complaints' ? (
        <MetricsStrip columns={3}>
          <KpiCard label="Khiếu nại đang xử lý" value={vm.openComplaints} icon={TriangleAlert} tone="warning" />
          <KpiCard label="Tổng số khiếu nại" value={vm.claimsTotalCount} icon={Package} tone="primary" />
          <KpiCard label="Mức nghiêm trọng chưa đóng" value={vm.highOpen} icon={TriangleAlert} tone="warning" />
        </MetricsStrip>
      ) : null}

      {vm.tab === 'registry' ? (
        <SectionCard noPadding>
          <WarrantyRegistryPanel
            rows={vm.warrantiesData}
            isLoading={vm.warrantiesLoading}
            isError={vm.warrantiesError}
            error={vm.warrantiesErrorObj}
            search={vm.search}
            onSearchChange={v => { vm.setSearch(v); vm.setPage(1); }}
            projectCode={vm.projectCode}
            onProjectCodeChange={v => { vm.setProjectCode(v); vm.setPage(1); }}
            materialCode={vm.materialCode}
            onMaterialCodeChange={v => { vm.setMaterialCode(v); vm.setPage(1); }}
            status={vm.status}
            onStatusChange={v => { vm.setStatus(v); vm.setPage(1); }}
            projects={vm.projects}
            page={vm.page}
            pageSize={vm.pageSize}
            onPageChange={vm.setPage}
            onPageSizeChange={vm.setPageSize}
            canCreate={vm.canCreate}
            onOpenDetail={row => vm.setSelectedId(row.id)}
            onCreateComplaint={row => vm.openCreate(row.id)}
          />
        </SectionCard>
      ) : null}

      {vm.tab === 'complaints' ? (
        <SectionCard noPadding>
          <WarrantyComplaintsPanel
            rows={vm.claims}
            isLoading={vm.claimsLoading}
            isError={vm.claimsError}
            error={vm.claimsErrorObj}
            search={vm.claimSearch}
            onSearchChange={v => { vm.setClaimSearch(v); vm.setClaimPage(1); }}
            status={vm.claimStatus}
            onStatusChange={v => { vm.setClaimStatus(v); vm.setClaimPage(1); }}
            page={vm.claimPage}
            pageSize={vm.claimPageSize}
            onPageChange={vm.setClaimPage}
            onPageSizeChange={vm.setClaimPageSize}
            onOpenWarranty={id => vm.setSelectedId(id)}
            canCreate={vm.canCreate}
            onCreate={() => vm.openCreate()}
          />
        </SectionCard>
      ) : null}

      <CreateComplaintTicketPanel
        key={vm.createOpen ? `create-open-${vm.preselectedLotId || 'new'}` : 'create-closed'}
        isOpen={vm.createOpen}
        onClose={vm.closeCreate}
        lots={vm.lots}
        preselectedId={vm.preselectedLotId}
        canCreate={vm.canCreate}
        onCreated={() => {
          vm.closeCreate();
          vm.setTab('complaints');
        }}
      />

      <WarrantyDetailModal
        key={vm.selectedId ? `detail-${vm.selectedId}` : 'detail-closed'}
        selectedId={vm.selectedId}
        canUpdate={vm.canUpdate}
        onClose={() => vm.setSelectedId(null)}
      />
    </PageShell>
  );
}
