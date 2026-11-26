import { Zap } from 'lucide-react';
import HrmSelect from '../../components/hr/HrmSelect';
import AdminMarkupSettingModal from '../../components/purchasing/AdminMarkupSettingModal';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import FilterToolbar from '../../components/ui/FilterToolbar';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TabFilter from '../../components/ui/TabFilter';
import { getApiErrorMessage } from '../../lib/apiClient';
import RfqQuotesPanel from './RfqQuotesPanel';
import { EstimateKpis, EstimatesTable, MarginKpis, MarginsTable } from './priceBook/PriceBookEstimatesAndMarginsPanels';
import PriceBookHistoryModal from './priceBook/PriceBookHistoryModal';
import { GroupsTable, ItemsTable, MatrixTable } from './priceBook/PriceBookTables';
import { EstimatePriceModal, SellPriceModal } from './priceBook/PriceBookUpsertModals';
import {
  PRICE_BOOK_TABS,
  PRICE_BOOK_TAB_INTRO,
  exportEstimatesCsv,
  exportItemsCsv,
  exportMarginsCsv,
  type PriceBookTab,
} from './priceBook/priceBookHelpers';
import {
  PRICE_BOOK_MONTH_OPTIONS,
  PRICE_BOOK_PERIOD_OPTIONS,
  PRICE_BOOK_QUARTER_OPTIONS,
  PRICE_BOOK_YEAR_OPTIONS,
  usePriceBookController,
} from './priceBook/usePriceBookController';

export default function PurchasePriceBookPage() {
  const vm = usePriceBookController();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Dự án EPC / Chào thầu"
        title="Sổ giá chào thầu & Phân tích"
        subtitle="Sổ giá chào thầu theo mặt hàng · Giá chào thầu (RFQ) · Phân tích Mua vào - Bán ra"
        actions={vm.isBoss ? (
          <Button
            type="button"
            variant="tonal"
            size="sm"
            leftIcon={Zap}
            onClick={() => vm.setMarkupModalOpen(true)}
            title="Cài đặt hệ số đắp giá / chào thầu theo từng nhóm hàng (Dành riêng cho BLĐ & Admin)"
          >
            Cài Đặt Markup Quản Trị
          </Button>
        ) : null}
      />

      <SectionCard noPadding>
        {vm.tab === 'items' ? (
          <FilterToolbar
            search={vm.search}
            onSearchChange={vm.setSearch}
            searchPlaceholder="Tìm theo mã/tên hàng…"
            hasActiveFilters={vm.hasActiveItemsFilter}
            onReset={vm.resetItemsFilter}
            filters={(
              <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
                <HrmSelect
                  aria-label="Nhóm hàng"
                  placeholder="Tất cả nhóm hàng"
                  value={vm.itemsCategoryLabel}
                  options={vm.categoryLabels}
                  onChange={vm.selectItemsCategoryLabel}
                />
                <HrmSelect
                  aria-label="Kỳ"
                  value={vm.periodLabel}
                  options={PRICE_BOOK_PERIOD_OPTIONS}
                  onChange={vm.selectPeriodLabel}
                />
                {vm.periodType !== 'all' ? (
                  <HrmSelect
                    aria-label="Năm"
                    value={String(vm.periodYear)}
                    options={PRICE_BOOK_YEAR_OPTIONS}
                    onChange={v => vm.setPeriodYear(Number(v))}
                  />
                ) : null}
                {vm.periodType === 'quarter' ? (
                  <HrmSelect
                    aria-label="Quý"
                    value={`Quý ${vm.periodQuarter}`}
                    options={PRICE_BOOK_QUARTER_OPTIONS}
                    onChange={v => vm.setPeriodQuarter(Number(v.replace('Quý ', '')))}
                  />
                ) : null}
                {vm.periodType === 'month' ? (
                  <HrmSelect
                    aria-label="Tháng"
                    value={`Tháng ${vm.periodMonth}`}
                    options={PRICE_BOOK_MONTH_OPTIONS}
                    onChange={v => vm.setPeriodMonth(Number(v.replace('Tháng ', '')))}
                  />
                ) : null}
              </div>
            )}
          />
        ) : null}

        <div className="pur-pricebook-chrome">
          <p className="pur-pricebook-intro text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            {PRICE_BOOK_TAB_INTRO[vm.tab]}
          </p>
          <div className="tab-filter-row">
            <TabFilter
              tabs={PRICE_BOOK_TABS.map(t => ({ id: t.id, label: t.label }))}
              activeTab={vm.tab}
              onChange={id => vm.setTab(id as PriceBookTab)}
            />
            {vm.tab === 'items' ? (
              <Button type="button" variant="outlined" size="sm" onClick={() => exportItemsCsv(vm.items.data ?? [])}>
                Xuất CSV
              </Button>
            ) : null}
          </div>
        </div>

        {vm.tab === 'rfq' ? (
          <RfqQuotesPanel canWrite={vm.canWriteRfq} canUpdate={vm.canUpdateRfq} presetMaterialCode={vm.rfqPresetCode} />
        ) : null}

        {vm.tab === 'items' ? (
          vm.items.isError ? (
            <EmptyState message={getApiErrorMessage(vm.items.error, 'Không tải được sổ giá.')} />
          ) : (
            <ItemsTable {...vm.itemsTableProps} />
          )
        ) : null}

        {vm.tab === 'matrix' ? (
          <div className="space-y-3">
            <div className="pur-pricebook-section flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">So sánh giá theo nhà cung cấp</h2>
              <FormField label="Nhóm hàng">
                <HrmSelect
                  aria-label="Nhóm hàng"
                  placeholder="Chọn nhóm hàng"
                  value={vm.matrixCategoryLabel}
                  options={vm.matrixCategoryLabels}
                  onChange={vm.selectMatrixCategoryLabel}
                />
              </FormField>
            </div>
            <MatrixTable loading={vm.matrix.isLoading} data={vm.matrix.data} hasCategory={vm.matrixCategoryId !== ''} />
          </div>
        ) : null}

        {vm.tab === 'groups' ? (
          vm.groups.isError ? (
            <EmptyState message={getApiErrorMessage(vm.groups.error, 'Không tải được phân tích nhóm hàng.')} />
          ) : (
            <GroupsTable
              loading={vm.groups.isLoading}
              rows={vm.groups.data ?? []}
              onCompare={id => { vm.setMatrixCategoryId(id); vm.setTab('matrix'); }}
            />
          )
        ) : null}

        {vm.tab === 'estimates' ? (
          <div className="space-y-3">
            <EstimateKpis rows={vm.estimates.data ?? []} />
            <div className="pur-pricebook-section flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">Giá dự toán & Chênh lệch so với giá mua thực tế</h2>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outlined" size="sm" onClick={() => exportEstimatesCsv(vm.estimates.data ?? [])}>
                  Xuất CSV
                </Button>
                {vm.canUpdateBook ? (
                  <Button type="button" variant="filled" size="sm" onClick={vm.openCreateEstimateModal}>
                    + Thiết lập giá dự toán
                  </Button>
                ) : null}
              </div>
            </div>
            <EstimatesTable {...vm.estimatesTableProps} />
            {vm.canUpdateBook ? <EstimatePriceModal {...vm.estimateModalProps} /> : null}
          </div>
        ) : null}

        {vm.tab === 'margins' ? (
          <div className="space-y-3">
            <MarginKpis rows={vm.margins.data ?? []} />
            <div className="pur-pricebook-section flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">Phân tích Mua vào - Bán ra</h2>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outlined" size="sm" onClick={() => exportMarginsCsv(vm.margins.data ?? [])}>
                  Xuất CSV
                </Button>
                {vm.canUpdateBook ? (
                  <Button type="button" variant="filled" size="sm" onClick={() => vm.setSellOpen(true)}>
                    + Thêm giá bán/giá chào
                  </Button>
                ) : null}
              </div>
            </div>
            <MarginsTable {...vm.marginsTableProps} />
            {vm.canUpdateBook ? <SellPriceModal {...vm.sellModalProps} /> : null}
          </div>
        ) : null}

        <PriceBookHistoryModal {...vm.historyModalProps} />

        {vm.isBoss ? <AdminMarkupSettingModal {...vm.adminMarkupModalProps} /> : null}
      </SectionCard>
    </PageShell>
  );
}
