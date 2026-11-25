import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { useSession } from '../../auth/AuthProvider';
import HrmSelect from '../../components/hr/HrmSelect';
import AdminMarkupSettingModal from '../../components/purchasing/AdminMarkupSettingModal';
import { rootCategoryIdOf } from '../../components/purchasing/MaterialByGroupFields';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import TabFilter from '../../components/ui/TabFilter';
import { showToast } from '../../components/ui/Toast';
import { isSessionAdmin } from '../../constants/systemUsers';
import { useCategoryTree } from '../../hooks/useCategories';
import { useMarkupSettings } from '../../hooks/useMarkupSettings';
import { useMaterials } from '../../hooks/useMaterials';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import {
  usePriceBookCategories,
  usePriceBookEstimates,
  usePriceBookItem,
  usePriceBookItems,
  usePriceBookMargins,
  usePriceBookMatrix,
  useUpsertEstimatePrice,
  useUpsertSellPrice,
} from '../../hooks/usePurchasePriceBook';
import { getApiErrorMessage } from '../../lib/apiClient';
import RfqQuotesPanel from './RfqQuotesPanel';
import { EstimateKpis, EstimatesTable, MarginKpis, MarginsTable } from './priceBook/PriceBookEstimatesAndMarginsPanels';
import PriceBookHistoryModal from './priceBook/PriceBookHistoryModal';
import { GroupsTable, ItemsTable, MatrixTable } from './priceBook/PriceBookTables';
import {
  EstimatePriceModal,
  SellPriceModal,
  type EstimateFormState,
  type SellFormState,
} from './priceBook/PriceBookUpsertModals';
import {
  PRICE_BOOK_TAB_INTRO,
  PRICE_BOOK_TABS,
  PRICE_BOOK_THIS_YEAR,
  PRICE_BOOK_YEARS,
  categoryOption,
  exportEstimatesCsv,
  exportItemsCsv,
  exportMarginsCsv,
  periodRange,
  type PriceBookPeriodType,
  type PriceBookTab,
} from './priceBook/priceBookHelpers';

export default function PurchasePriceBookPage() {
  const { has } = usePermission();
  const { user, permissions } = useSession();
  const isAdmin = isSessionAdmin(user);
  const roleLower = (user?.role ?? '').toLowerCase();
  const isBoss = isAdmin ||
    roleLower.includes('director') ||
    roleLower.includes('manager') ||
    roleLower.includes('giam_doc') ||
    roleLower.includes('truong_phong') ||
    roleLower.includes('bld') ||
    permissions.includes('admin.users.view:all') ||
    permissions.includes('purchasing.pricebook.update');

  const { config: markupConfig, isSaving: isSavingMarkup, saveConfig: saveMarkupConfig, getMarkupPercent, saveItemMarkup } = useMarkupSettings();
  const [markupModalOpen, setMarkupModalOpen] = useState(false);

  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');
  const canUpdateBook = has('purchasing.pricebook.update');

  const [tab, setTab] = useState<PriceBookTab>('items');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [periodType, setPeriodType] = useState<PriceBookPeriodType>('all');
  const [periodYear, setPeriodYear] = useState(PRICE_BOOK_THIS_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [matrixCategoryId, setMatrixCategoryId] = useState<number | ''>('');
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [rfqPresetCode, setRfqPresetCode] = useState('');
  const [sellOpen, setSellOpen] = useState(false);
  const [sellForm, setSellForm] = useState<SellFormState>({
    materialCode: '',
    projectCode: '',
    sellPrice: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateCategoryId, setEstimateCategoryId] = useState<number | ''>('');
  const [estimateForm, setEstimateForm] = useState<EstimateFormState>({
    materialCode: '',
    projectCode: '',
    estimatePrice: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const range = periodRange(periodType, periodYear, periodQuarter, periodMonth);
  const items = usePriceBookItems(
    search.trim() || undefined,
    categoryId === '' ? undefined : categoryId,
    tab === 'items',
    range.from,
    range.to,
  );
  const allItems = usePriceBookItems(undefined, undefined, tab === 'matrix' || tab === 'margins' || tab === 'estimates');
  const matrix = usePriceBookMatrix(matrixCategoryId === '' ? undefined : matrixCategoryId);
  const groups = usePriceBookCategories(tab === 'groups' || tab === 'matrix');
  const margins = usePriceBookMargins(tab === 'margins');
  const estimates = usePriceBookEstimates(tab === 'estimates');
  const detail = usePriceBookItem(detailCode ?? undefined);
  const upsertSell = useUpsertSellPrice();
  const upsertEstimate = useUpsertEstimatePrice();
  const { data: categories = [] } = useCategoryTree();
  const { data: materialsPage } = useMaterials({
    page: 1,
    pageSize: 500,
    categoryId: estimateCategoryId === '' ? undefined : estimateCategoryId,
  });
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];

  const rootCategories = useMemo(
    () => categories.filter(c => c.level === 1 && c.code !== 'UNCATEGORIZED' && c.isActive),
    [categories],
  );

  const matrixCategories = useMemo(() => {
    const fromGroups = (groups.data ?? []).map(row => ({
      id: row.categoryId,
      code: row.categoryCode,
      name: row.categoryName,
    }));
    return fromGroups.length > 0 ? fromGroups : rootCategories;
  }, [groups.data, rootCategories]);
  const categoryLabels = useMemo(() => rootCategories.map(categoryOption), [rootCategories]);
  const matrixCategoryLabels = useMemo(() => matrixCategories.map(categoryOption), [matrixCategories]);
  const itemsCategoryValue = rootCategories.find(c => c.id === categoryId);
  const matrixCategoryValue = matrixCategories.find(c => c.id === matrixCategoryId);

  if (tab === 'matrix' && matrixCategories.length > 0) {
    const valid =
      matrixCategoryId !== '' && matrixCategories.some(c => c.id === matrixCategoryId);
    if (!valid) {
      setMatrixCategoryId(matrixCategories[0]!.id);
    }
  }

  const saveSell = async () => {
    const price = Number(String(sellForm.sellPrice).replace(/[^\d.-]/g, ''));
    if (!sellForm.materialCode || !sellForm.effectiveDate || !(price > 0)) {
      showToast('error', 'Nhập vật tư, ngày hiệu lực và giá bán.');
      return;
    }
    try {
      await upsertSell.mutateAsync({
        materialCode: sellForm.materialCode,
        projectCode: sellForm.projectCode || null,
        sellPrice: price,
        effectiveDate: sellForm.effectiveDate,
        note: sellForm.note || null,
      });
      showToast('success', 'Đã ghi giá bán.');
      setSellForm(f => ({ ...f, sellPrice: '', note: '' }));
      setSellOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không ghi được giá bán.'));
    }
  };

  const saveEstimate = async () => {
    const price = Number(String(estimateForm.estimatePrice).replace(/[^\d.-]/g, ''));
    if (estimateCategoryId === '' || !estimateForm.materialCode || !estimateForm.effectiveDate || !(price > 0)) {
      showToast('error', 'Chọn nhóm vật tư, vật tư, ngày hiệu lực và giá dự toán.');
      return;
    }
    try {
      await upsertEstimate.mutateAsync({
        materialCode: estimateForm.materialCode,
        projectCode: estimateForm.projectCode || null,
        estimatePrice: price,
        effectiveDate: estimateForm.effectiveDate,
        note: estimateForm.note || null,
      });
      showToast('success', 'Đã ghi giá dự toán.');
      setEstimateForm(f => ({ ...f, estimatePrice: '', note: '' }));
      setEstimateOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không ghi được giá dự toán.'));
    }
  };

  return (
    <PurchasingListLayout
      eyebrow="Dự án EPC / Chào thầu"
      title="Sổ giá chào thầu & Phân tích"
      subtitle="Sổ giá chào thầu theo mặt hàng · Giá chào thầu (RFQ) · Phân tích Mua vào - Bán ra"
      actions={
        isBoss ? (
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs py-1.5 px-3"
            onClick={() => setMarkupModalOpen(true)}
            title="Cài đặt hệ số đắp giá / chào thầu theo từng nhóm hàng (Dành riêng cho BLĐ & Admin)"
          >
            <Zap size={14} className="text-yellow-300 fill-yellow-300 animate-pulse" />
            <span>⚡ Cài Đặt Markup Quản Trị</span>
          </button>
        ) : null
      }
      hideSearch={tab !== 'items'}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm theo mã/tên hàng…"
      hasFilters={tab === 'items' && Boolean(search.trim() || categoryId || periodType !== 'all')}
      filters={tab === 'items' ? (
        <>
          <HrmSelect
            aria-label="Nhóm hàng"
            placeholder="Tất cả nhóm hàng"
            value={itemsCategoryValue ? categoryOption(itemsCategoryValue) : ''}
            options={categoryLabels}
            onChange={label => {
              const found = rootCategories.find(c => categoryOption(c) === label);
              setCategoryId(found?.id ?? '');
            }}
          />
          <HrmSelect
            aria-label="Kỳ"
            value={periodType === 'all' ? 'Tất cả (toàn bộ lịch sử)' : periodType === 'month' ? 'Theo tháng' : periodType === 'quarter' ? 'Theo quý' : 'Theo năm'}
            options={['Tất cả (toàn bộ lịch sử)', 'Theo tháng', 'Theo quý', 'Theo năm']}
            onChange={label => {
              if (label.startsWith('Tất cả')) setPeriodType('all');
              else if (label === 'Theo tháng') setPeriodType('month');
              else if (label === 'Theo quý') setPeriodType('quarter');
              else setPeriodType('year');
            }}
          />
          {periodType !== 'all' ? (
            <HrmSelect
              aria-label="Năm"
              value={String(periodYear)}
              options={PRICE_BOOK_YEARS.map(String)}
              onChange={v => setPeriodYear(Number(v))}
            />
          ) : null}
          {periodType === 'quarter' ? (
            <HrmSelect
              aria-label="Quý"
              value={`Quý ${periodQuarter}`}
              options={['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4']}
              onChange={v => setPeriodQuarter(Number(v.replace('Quý ', '')))}
            />
          ) : null}
          {periodType === 'month' ? (
            <HrmSelect
              aria-label="Tháng"
              value={`Tháng ${periodMonth}`}
              options={Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)}
              onChange={v => setPeriodMonth(Number(v.replace('Tháng ', '')))}
            />
          ) : null}
        </>
      ) : null}
      onResetFilters={() => {
        setCategoryId('');
        setSearch('');
        setPeriodType('all');
      }}
    >
      <div className="pur-pricebook-chrome">
        <p className="pur-pricebook-intro text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
          {PRICE_BOOK_TAB_INTRO[tab]}
        </p>

        <div className="tab-filter-row">
          <TabFilter
            tabs={PRICE_BOOK_TABS.map(t => ({ id: t.id, label: t.label }))}
            activeTab={tab}
            onChange={id => setTab(id as PriceBookTab)}
          />
          {tab === 'items' ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => exportItemsCsv(items.data ?? [])}>
              Xuất CSV
            </button>
          ) : null}
        </div>
      </div>

      {tab === 'rfq' ? (
        <RfqQuotesPanel canWrite={canWriteRfq} canUpdate={canUpdateRfq} presetMaterialCode={rfqPresetCode} />
      ) : null}

      {tab === 'items' ? (
        <div className="space-y-3">
          {items.isError ? (
            <EmptyState message={getApiErrorMessage(items.error, 'Không tải được sổ giá.')} />
          ) : (
            <ItemsTable
              loading={items.isLoading}
              rows={items.data ?? []}
              onOpen={setDetailCode}
              isBoss={isBoss}
              getMarkupPercent={getMarkupPercent}
              onSaveItemMarkup={saveItemMarkup}
            />
          )}
        </div>
      ) : null}

      {tab === 'matrix' ? (
        <div className="space-y-3">
          <div className="pur-pricebook-section flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">So sánh giá theo nhà cung cấp</h2>
            <FormField label="Nhóm hàng">
              <HrmSelect
                aria-label="Nhóm hàng"
                placeholder="Chọn nhóm hàng"
                value={matrixCategoryValue ? categoryOption(matrixCategoryValue) : ''}
                options={matrixCategoryLabels}
                onChange={label => {
                  const found = matrixCategories.find(c => categoryOption(c) === label);
                  setMatrixCategoryId(found?.id ?? '');
                }}
              />
            </FormField>
          </div>
          <MatrixTable loading={matrix.isLoading} data={matrix.data} hasCategory={matrixCategoryId !== ''} />
        </div>
      ) : null}

      {tab === 'groups' ? (
        groups.isError ? (
          <EmptyState message={getApiErrorMessage(groups.error, 'Không tải được phân tích nhóm hàng.')} />
        ) : (
          <GroupsTable
            loading={groups.isLoading}
            rows={groups.data ?? []}
            onCompare={id => {
              setMatrixCategoryId(id);
              setTab('matrix');
            }}
          />
        )
      ) : null}

      {tab === 'estimates' ? (
        <div className="space-y-3">
          <EstimateKpis rows={estimates.data ?? []} />
          <div className="pur-pricebook-section flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">Giá dự toán & Chênh lệch so với giá mua thực tế</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => exportEstimatesCsv(estimates.data ?? [])}
              >
                Xuất CSV
              </button>
              {canUpdateBook ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEstimateCategoryId('');
                    setEstimateForm({
                      materialCode: '',
                      projectCode: '',
                      estimatePrice: '',
                      effectiveDate: new Date().toISOString().slice(0, 10),
                      note: '',
                    });
                    setEstimateOpen(true);
                  }}
                >
                  + Thiết lập giá dự toán
                </button>
              ) : null}
            </div>
          </div>
          <EstimatesTable
            loading={estimates.isLoading}
            rows={estimates.data ?? []}
            missingEstimate={allItems.data?.filter(i => i.latestPrice != null && !(estimates.data ?? []).some(m => m.materialCode === i.materialCode)) ?? []}
            canUpdate={canUpdateBook}
            onEdit={row => {
              const mat = materials.find(m => m.materialCode === row.materialCode);
              setEstimateCategoryId(rootCategoryIdOf(mat?.categoryId, categories));
              setEstimateForm({
                materialCode: row.materialCode,
                projectCode: row.projectCode ?? '',
                estimatePrice: String(row.estimatePrice),
                effectiveDate: row.effectiveDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                note: '',
              });
              setEstimateOpen(true);
            }}
            onAdd={code => {
              const mat = materials.find(m => m.materialCode === code);
              setEstimateCategoryId(rootCategoryIdOf(mat?.categoryId, categories));
              setEstimateForm(f => ({ ...f, materialCode: code, projectCode: '', estimatePrice: '' }));
              setEstimateOpen(true);
            }}
            onHistory={setDetailCode}
          />
          {canUpdateBook ? (
            <EstimatePriceModal
              isOpen={estimateOpen}
              onClose={() => setEstimateOpen(false)}
              categoryId={estimateCategoryId}
              onCategoryChange={setEstimateCategoryId}
              form={estimateForm}
              setForm={setEstimateForm}
              rootCategories={rootCategories}
              materials={materials}
              projects={projects}
              isPending={upsertEstimate.isPending}
              onSave={saveEstimate}
            />
          ) : null}
        </div>
      ) : null}

      {tab === 'margins' ? (
        <div className="space-y-3">
          <MarginKpis rows={margins.data ?? []} />
          <div className="pur-pricebook-section flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">Phân tích Mua vào - Bán ra</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => exportMarginsCsv(margins.data ?? [])}>
                Xuất CSV
              </button>
              {canUpdateBook ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setSellOpen(true)}>
                  + Thêm giá bán/giá chào
                </button>
              ) : null}
            </div>
          </div>
          <MarginsTable
            loading={margins.isLoading}
            rows={margins.data ?? []}
            missingSell={allItems.data?.filter(i => i.latestPrice != null && !(margins.data ?? []).some(m => m.materialCode === i.materialCode)) ?? []}
            canUpdate={canUpdateBook}
            onEdit={row => {
              setSellForm(f => ({
                ...f,
                materialCode: row.materialCode,
                projectCode: row.projectCode ?? '',
                sellPrice: String(row.sellPrice),
                effectiveDate: row.effectiveDate?.slice(0, 10) || f.effectiveDate,
              }));
              setSellOpen(true);
            }}
            onAddSell={code => {
              setSellForm(f => ({ ...f, materialCode: code, projectCode: '', sellPrice: '' }));
              setSellOpen(true);
            }}
            onHistory={setDetailCode}
          />
          {canUpdateBook ? (
            <SellPriceModal
              isOpen={sellOpen}
              onClose={() => setSellOpen(false)}
              form={sellForm}
              setForm={setSellForm}
              materials={materials}
              projects={projects}
              isPending={upsertSell.isPending}
              onSave={saveSell}
            />
          ) : null}
        </div>
      ) : null}

      <PriceBookHistoryModal
        detailCode={detailCode}
        detail={detail}
        canWriteRfq={canWriteRfq}
        onClose={() => setDetailCode(null)}
        onAddRfq={code => {
          setRfqPresetCode(code);
          setDetailCode(null);
          setTab('rfq');
        }}
      />

      {isBoss && (
        <AdminMarkupSettingModal
          isOpen={markupModalOpen}
          onClose={() => setMarkupModalOpen(false)}
          config={markupConfig}
          onSave={saveMarkupConfig}
          isSaving={isSavingMarkup}
        />
      )}
    </PurchasingListLayout>
  );
}
