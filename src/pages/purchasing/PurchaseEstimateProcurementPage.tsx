import { useRef } from 'react';
import { Plus } from 'lucide-react';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Button from '../../components/ui/Button';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import EstimateCreateModal from './estimates/EstimateCreateModal';
import EstimatesListTable from './estimates/EstimatesListTable';
import { useEstimateProcurementController } from './estimates/useEstimateProcurementController';
import RfqQuotesPanel, { type RfqQuotesPanelHandle } from './RfqQuotesPanel';

export default function PurchaseEstimateProcurementPage() {
  const vm = useEstimateProcurementController();
  const rfqPanelRef = useRef<RfqQuotesPanelHandle>(null);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Mua hàng"
        title="Mua hàng dự toán"
        subtitle="Dự toán vật tư theo dự án và giá chào thầu"
        actions={
          vm.tab === 'estimates' && vm.canWriteEstimate ? (
            <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={() => vm.setCreating(true)}>
              Tạo dự toán
            </Button>
          ) : vm.tab === 'rfq' ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outlined" size="sm" onClick={() => rfqPanelRef.current?.exportCsv()}>
                Xuất CSV
              </Button>
              {vm.canWriteRfq ? (
                <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={() => rfqPanelRef.current?.openCreate()}>
                  Ghi nhận báo giá mới
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      <SectionCard noPadding>
        <FilterToolbar
          tabs={vm.tabs}
          activeTab={vm.tab}
          onTabChange={id => vm.setTab(id as 'rfq' | 'estimates')}
          search={vm.tab === 'estimates' ? vm.search : undefined}
          onSearchChange={vm.tab === 'estimates' ? v => { vm.setSearch(v); vm.setPage(1); } : undefined}
          searchPlaceholder="Tìm mã DT / tiêu đề…"
          hasActiveFilters={vm.tab === 'estimates' && Boolean(vm.projectCode || vm.search.trim())}
          onReset={vm.tab === 'estimates' ? () => { vm.setProjectCode(''); vm.setSearch(''); vm.setPage(1); } : undefined}
          filters={vm.tab === 'estimates' ? (
            <>
              <div className="min-w-[14rem] max-w-[20rem]">
                <ProjectAutocomplete
                  value={vm.projectCode}
                  onChange={v => { vm.setProjectCode(v); vm.setPage(1); }}
                  projects={vm.projects}
                  placeholder="Lọc dự án"
                  compact
                />
              </div>
              {vm.toolbarProject ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-low)] px-2.5 py-1.5 rounded-md border border-[var(--md-outline-variant02)]">
                  <span className="font-semibold text-[var(--md-primary)]">Ngân sách VT:</span>
                  <span className="font-mono tabular-nums">{formatCurrencyFull(vm.toolbarProject.materialBudget)}</span>
                  <span>· Còn lại:</span>
                  <span className={`font-mono tabular-nums font-semibold ${vm.toolbarRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}>
                    {formatCurrencyFull(vm.toolbarRemaining)}
                  </span>
                </div>
              ) : null}
            </>
          ) : undefined}
        />

        {vm.tab === 'rfq' ? (
          <RfqQuotesPanel
            ref={rfqPanelRef}
            canWrite={vm.canWriteRfq}
            canUpdate={vm.canUpdateRfq}
            hideToolbarActions
          />
        ) : (
          <>
            <p className="px-4 py-2.5 text-sm text-[var(--md-on-surface-variant)] m-0">
              Chọn dự án → thêm vật tư, số lượng, giá dự toán → Gửi duyệt → Trưởng dự án duyệt → tạo Kế hoạch mua hàng.
            </p>
            <EstimatesListTable
              items={vm.list.data?.items ?? []}
              isLoading={vm.list.isLoading}
              errorMessage={vm.list.isError ? getApiErrorMessage(vm.list.error, 'Không tải được danh sách dự toán.') : null}
              page={vm.page}
              totalPages={Math.max(1, vm.list.data?.totalPages ?? 1)}
              pageSize={vm.pageSize}
              totalItems={vm.list.data?.totalCount ?? 0}
              onPageChange={vm.setPage}
              onPageSizeChange={vm.setPageSize}
              getRowActions={vm.rowActions}
            />
          </>
        )}

        <EstimateCreateModal
          key={vm.creating ? `create-${vm.projectCode || 'all'}` : 'create-closed'}
          isOpen={vm.creating}
          initialProjectCode={vm.projectCode}
          projects={vm.projects}
          materials={vm.materials}
          isPending={vm.createPending}
          onClose={() => vm.setCreating(false)}
          onSubmit={vm.handleCreateSubmit}
        />
      </SectionCard>
    </PageShell>
  );
}
