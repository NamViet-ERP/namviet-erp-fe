import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import HrmSelect from '../../components/hr/HrmSelect';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import CurrencyInput from '../../components/ui/CurrencyInput';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { showToast } from '../../components/ui/Toast';
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
import MaterialByGroupFields, { rootCategoryIdOf } from '../../components/purchasing/MaterialByGroupFields';
import { useCategoryTree } from '../../hooks/useCategories';
import { useMaterials } from '../../hooks/useMaterials';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import {
  buildPriceHistoryPlot,
  priceHistoryKindLabel,
  type PriceHistoryPlotPoint,
  type PriceHistoryPoint,
} from '../../lib/purchasePriceHistoryChart';
import { formatCurrencyFull, formatCurrencyShort } from '../../utils/formatCurrency';
import type { PriceBookItemApiDto } from '../../types/api/purchasingApi';
import RfqQuotesPanel from './RfqQuotesPanel';

type Tab = 'items' | 'matrix' | 'rfq' | 'groups' | 'estimates' | 'margins';
type PeriodType = 'all' | 'month' | 'quarter' | 'year';

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

const TABS: { id: Tab; label: string }[] = [
  { id: 'items', label: 'Sổ giá theo mặt hàng' },
  { id: 'matrix', label: 'So sánh giá NCC' },
  { id: 'rfq', label: 'Giá chào thầu (RFQ)' },
  { id: 'groups', label: 'Phân tích theo nhóm hàng' },
  { id: 'estimates', label: 'Giá dự toán & Chênh lệch' },
  { id: 'margins', label: 'Phân tích Mua vào - Bán ra' },
];

function periodRange(type: PeriodType, year: number, quarter: number, month: number) {
  if (type === 'all') return { from: undefined as string | undefined, to: undefined as string | undefined };
  if (type === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (type === 'quarter') {
    const start = (quarter - 1) * 3 + 1;
    const endMonth = start + 2;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      from: `${year}-${String(start).padStart(2, '0')}-01`,
      to: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, '0')}-01`,
    to: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function categoryOption(c: { code: string; name: string }) {
  return `${c.code} - ${c.name}`;
}

function trendClass(pct: number | null | undefined) {
  if (pct == null || pct === 0) return 'text-[var(--md-on-surface-variant)]';
  return pct > 0 ? 'text-[var(--md-success)]' : 'text-[var(--md-error)]';
}

function trendLabel(pct: number | null | undefined) {
  if (pct == null) return '—';
  if (pct === 0) return '0%';
  return `${pct > 0 ? '▲' : '▼'} ${pct > 0 ? '+' : ''}${pct}%`;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const lines = rows.map(cols => cols.map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
  const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportItemsCsv(rows: PriceBookItemApiDto[]) {
  downloadCsv('SoGia_MatHang.csv',
    ['Mã hàng', 'Tên hàng', 'Quy cách', 'Thông số kỹ thuật chung', 'Giá mua mới nhất', 'Giá dự toán', 'Chênh lệch', 'Chênh lệch %', 'NCC gần nhất', 'Giá min', 'Giá max', 'Số NCC', 'Xu hướng %', 'Giá trần'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.technicalSpec ?? '',
      r.generalTechnicalSpec ?? '',
      r.latestPrice != null ? String(r.latestPrice) : '',
      r.estimatePrice != null ? String(r.estimatePrice) : '',
      r.estimateDiff != null ? String(r.estimateDiff) : '',
      r.estimateDiffPct != null ? String(r.estimateDiffPct) : '',
      r.latestSupplierName ?? '',
      r.minPrice != null ? String(r.minPrice) : '',
      r.maxPrice != null ? String(r.maxPrice) : '',
      String(r.supplierCount),
      r.trendPct != null ? String(r.trendPct) : '',
      r.ceilingPrice != null ? String(r.ceilingPrice) : '',
    ]));
}

function exportEstimatesCsv(rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>) {
  downloadCsv('GiaDuToan_ChenhLech.csv',
    ['Mã hàng', 'Tên hàng', 'Dự án', 'Giá dự toán', 'Giá mua mới nhất', 'Chênh lệch', 'Biên lợi nhuận %'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.projectCode ?? '',
      String(r.estimatePrice),
      r.purchaseLatest != null ? String(r.purchaseLatest) : '',
      r.diff != null ? String(r.diff) : '',
      r.marginPct != null ? String(r.marginPct) : '',
    ]));
}

function exportMarginsCsv(rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>) {
  downloadCsv('PhanTich_MuaVaoBanRa.csv',
    ['Mã hàng', 'Tên hàng', 'Dự án', 'Giá bán', 'Giá mua TB', 'Giá mua mới', 'Biên', 'Biên %'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.projectCode ?? '',
      String(r.sellPrice),
      r.purchaseAvg != null ? String(r.purchaseAvg) : '',
      r.purchaseLatest != null ? String(r.purchaseLatest) : '',
      r.margin != null ? String(r.margin) : '',
      r.marginPct != null ? String(r.marginPct) : '',
    ]));
}

export default function PurchasePriceBookPage() {
  const { has } = usePermission();
  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');
  const canUpdateBook = has('purchasing.pricebook.update');

  const [tab, setTab] = useState<Tab>('items');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [periodType, setPeriodType] = useState<PeriodType>('all');
  const [periodYear, setPeriodYear] = useState(THIS_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [matrixCategoryId, setMatrixCategoryId] = useState<number | ''>('');
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [rfqPresetCode, setRfqPresetCode] = useState('');
  const [sellOpen, setSellOpen] = useState(false);
  const [sellForm, setSellForm] = useState({
    materialCode: '',
    projectCode: '',
    sellPrice: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateCategoryId, setEstimateCategoryId] = useState<number | ''>('');
  const [estimateForm, setEstimateForm] = useState({
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
  const groups = usePriceBookCategories(tab === 'groups');
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

  const pricedCategoryIds = useMemo(() => {
    const byId = new Map(categories.map(c => [c.id, c]));
    const roots = new Set<number>();
    for (const row of allItems.data ?? []) {
      if (row.latestPrice == null || row.categoryId == null) continue;
      let cur = byId.get(row.categoryId);
      while (cur?.parentId) {
        const parent = byId.get(cur.parentId);
        if (!parent) break;
        cur = parent;
      }
      if (cur) roots.add(cur.id);
    }
    return roots;
  }, [allItems.data, categories]);
  const matrixCategories = useMemo(() => {
    const priced = rootCategories.filter(c => pricedCategoryIds.has(c.id));
    return priced.length > 0 ? priced : rootCategories;
  }, [rootCategories, pricedCategoryIds]);
  const categoryLabels = useMemo(() => rootCategories.map(categoryOption), [rootCategories]);
  const matrixCategoryLabels = useMemo(() => matrixCategories.map(categoryOption), [matrixCategories]);
  const itemsCategoryValue = rootCategories.find(c => c.id === categoryId);
  const matrixCategoryValue = matrixCategories.find(c => c.id === matrixCategoryId);

  useEffect(() => {
    if (tab !== 'matrix' || matrixCategories.length === 0) return;
    if (matrixCategoryId !== '' && matrixCategories.some(c => c.id === matrixCategoryId)) return;
    setMatrixCategoryId(matrixCategories[0]!.id);
  }, [tab, matrixCategoryId, matrixCategories]);

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
      title="Sổ giá & Phân tích"
      subtitle="Sổ giá theo mặt hàng · Giá chào thầu (RFQ) · Phân tích Mua vào - Bán ra"
      hideSearch={tab !== 'items'}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm theo mã/tên hàng…"
      hasFilters={tab === 'items' && Boolean(categoryId || periodType !== 'all')}
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
              options={YEARS.map(String)}
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
      <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)] mb-3">
        {tab === 'items'
          ? 'Sổ giá tổng hợp lịch sử mua thực tế từ PO đã chốt theo mặt hàng: giá mới nhất, giá dự toán (từ tab Giá dự toán & Chênh lệch), số NCC, xu hướng và cảnh báo khi vượt giá trần.'
          : tab === 'matrix'
            ? 'Bảng so sánh giá gần nhất của các NCC cho từng mặt hàng trong cùng nhóm hàng. Ô có dấu ★ là giá thấp nhất giữa các NCC đã từng báo / bán mặt hàng đó.'
            : tab === 'rfq'
              ? 'Ghi lại tất cả báo giá nhận được cho một mặt hàng, kể cả báo giá không được chọn, để có nền tảng thương lượng cho các lần mua sau.'
              : tab === 'groups'
                ? 'Tổng hợp chi tiêu và biến động giá theo từng nhóm hàng, giúp nhìn nhóm nào chiếm tỷ trọng lớn để ưu tiên đàm phán.'
                : tab === 'estimates'
                  ? 'So sánh giá dự toán (giá công ty) với giá mua thực tế trên PO đã chốt để biết đang mua rẻ hơn hay đắt hơn dự toán.'
                : 'So sánh giá bán / giá chào cho dự án với giá mua thực tế để nhìn margin theo từng mặt hàng.'}
      </p>

      <div className="tab-filter-row">
        <TabFilter
          tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
          activeTab={tab}
          onChange={id => setTab(id as Tab)}
        />
        {tab === 'items' ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => exportItemsCsv(items.data ?? [])}>
            Xuất CSV
          </button>
        ) : null}
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
            />
          )}
        </div>
      ) : null}

      {tab === 'matrix' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <Modal isOpen={estimateOpen} onClose={() => setEstimateOpen(false)} title="Thiết lập giá dự toán" size="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MaterialByGroupFields
                  categoryId={estimateCategoryId}
                  onCategoryChange={id => {
                    setEstimateCategoryId(id);
                    setEstimateForm(f => ({ ...f, materialCode: '' }));
                  }}
                  materialCode={estimateForm.materialCode}
                  onMaterialChange={materialCode => setEstimateForm(f => ({ ...f, materialCode }))}
                  groups={rootCategories}
                  materials={materials}
                />
                <FormField label="Dự án">
                  <ProjectAutocomplete
                    value={estimateForm.projectCode}
                    onChange={projectCode => setEstimateForm(f => ({ ...f, projectCode }))}
                    projects={projects}
                  />
                </FormField>
                <FormField label="Giá dự toán" required>
                  <CurrencyInput
                    value={estimateForm.estimatePrice}
                    onChange={estimatePrice => setEstimateForm(f => ({ ...f, estimatePrice }))}
                  />
                </FormField>
                <FormField label="Ngày hiệu lực" required>
                  <HrmDatePicker
                    value={estimateForm.effectiveDate}
                    onChange={effectiveDate => setEstimateForm(f => ({ ...f, effectiveDate }))}
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEstimateOpen(false)}>Hủy</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={upsertEstimate.isPending} onClick={() => void saveEstimate()}>
                  {upsertEstimate.isPending ? 'Đang lưu…' : 'Lưu'}
                </button>
              </div>
            </Modal>
          ) : null}
        </div>
      ) : null}

      {tab === 'margins' ? (
        <div className="space-y-3">
          <MarginKpis rows={margins.data ?? []} />
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <Modal isOpen={sellOpen} onClose={() => setSellOpen(false)} title="Thêm giá bán / giá chào" size="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Vật tư" required>
                  <MaterialAutocomplete
                    value={sellForm.materialCode}
                    onChange={materialCode => setSellForm(f => ({ ...f, materialCode }))}
                    materials={materials}
                  />
                </FormField>
                <FormField label="Dự án">
                  <ProjectAutocomplete
                    value={sellForm.projectCode}
                    onChange={projectCode => setSellForm(f => ({ ...f, projectCode }))}
                    projects={projects}
                  />
                </FormField>
                <FormField label="Giá bán" required>
                  <CurrencyInput value={sellForm.sellPrice} onChange={sellPrice => setSellForm(f => ({ ...f, sellPrice }))} />
                </FormField>
                <FormField label="Ngày hiệu lực" required>
                  <HrmDatePicker
                    value={sellForm.effectiveDate}
                    onChange={effectiveDate => setSellForm(f => ({ ...f, effectiveDate }))}
                  />
                </FormField>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSellOpen(false)}>Hủy</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={upsertSell.isPending} onClick={() => void saveSell()}>
                  {upsertSell.isPending ? 'Đang lưu…' : 'Lưu'}
                </button>
              </div>
            </Modal>
          ) : null}
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(detailCode)}
        onClose={() => setDetailCode(null)}
        title={detail.data ? `${detail.data.item.materialCode} · ${detail.data.item.materialName}` : 'Chi tiết sổ giá'}
        size="full"
        subtitle={
          detail.data ? (
            <p className="m-0 text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
              Giá trần: {detail.data.item.ceilingPrice != null ? formatCurrencyFull(detail.data.item.ceilingPrice) : 'Chưa khai báo'}
            </p>
          ) : undefined
        }
        footer={
          canWriteRfq && detail.data ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setRfqPresetCode(detail.data.item.materialCode);
                  setDetailCode(null);
                  setTab('rfq');
                }}
              >
                + Ghi nhận báo giá mới
              </button>
            </div>
          ) : undefined
        }
      >
        {detail.isError ? (
          <EmptyState message={getApiErrorMessage(detail.error, 'Không tải được chi tiết sổ giá.')} />
        ) : detail.isLoading || !detail.data ? (
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <tbody><TableSkeletonRows colSpan={5} /></tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <PriceHistoryChart
              points={detail.data.history}
              ceilingPrice={detail.data.item.ceilingPrice}
            />
            <div className="text-[length:var(--fs-sm)] font-medium">Toàn bộ lịch sử giá và báo giá</div>
            <div className="wms-inventory-table-wrap">
              <table className="wms-inventory-table wms-voucher-detail-table">
                <thead>
                  <tr>
                    <th className="table-header-cell">Ngày</th>
                    <th className="table-header-cell">Loại</th>
                    <th className="table-header-cell">NCC</th>
                    <th className="table-header-cell">Đơn giá</th>
                    <th className="table-header-cell">Tham chiếu</th>
                    <th className="table-header-cell">Dự án</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.data.history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-cell"><EmptyState message="Chưa có lịch sử giá." /></td>
                    </tr>
                  ) : detail.data.history.map((h, i) => (
                    <tr key={`${h.date}-${h.kind}-${i}`} className="table-row">
                      <td className="table-cell">{formatDateCell(h.date)}</td>
                      <td className="table-cell"><span className={`badge ${historyKindBadge(h.kind, h.status)}`}>{priceHistoryKindLabel(h.kind, h.status)}</span></td>
                      <td className="table-cell">{h.supplierName || '—'}</td>
                      <td className="table-cell text-right tabular-nums">{formatCurrencyFull(h.unitPrice)}</td>
                      <td className="table-cell font-mono">{h.poRef || '—'}</td>
                      <td className="table-cell">{h.projectCode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </PurchasingListLayout>
  );
}

function ItemsTable({
  loading,
  rows,
  onOpen,
}: {
  loading: boolean;
  rows: PriceBookItemApiDto[];
  onOpen: (code: string) => void;
}) {
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Hàng hoá</th>
            <th className="table-header-cell">Giá mua mới nhất</th>
            <th className="table-header-cell">Giá dự toán</th>
            <th className="table-header-cell">Chênh lệch (Mua - Dự toán)</th>
            <th className="table-header-cell">NCC gần nhất</th>
            <th className="table-header-cell">Khoảng giá</th>
            <th className="table-header-cell">Số NCC</th>
            <th className="table-header-cell text-center">Xu hướng</th>
            <th className="table-header-cell"> </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={9} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="table-cell"><EmptyState message="Chưa có mặt hàng phù hợp." /></td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.materialCode} className="table-row">
              <td className="table-cell">
                <div><span className="mat-code-cell__badge">{row.materialCode}</span></div>
                <div>{row.materialName}</div>
                {row.technicalSpec?.trim() ? (
                  <div className="text-[var(--md-on-surface-variant)]">Quy cách: {row.technicalSpec.trim()}</div>
                ) : null}
                {row.generalTechnicalSpec?.trim() ? (
                  <div
                    className="pur-pricebook-goods__spec text-[var(--md-on-surface-variant)]"
                    title={row.generalTechnicalSpec}
                  >
                    Thông số kỹ thuật: {row.generalTechnicalSpec.trim()}
                  </div>
                ) : null}
                <div className="text-[var(--md-on-surface-variant)]">
                  Giá trần: {row.ceilingPrice != null ? formatCurrencyFull(row.ceilingPrice) : '—'}
                  {row.estimatePrice != null ? ` · Giá dự toán: ${formatCurrencyFull(row.estimatePrice)}` : ''}
                  {row.overCeiling ? (
                    <span className="ml-2 text-[var(--md-error)]">Vượt trần</span>
                  ) : null}
                </div>
              </td>
              <td className={`table-cell text-right tabular-nums ${row.overCeiling ? 'text-[var(--md-error)]' : ''}`}>
                {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : 'Chưa có lịch sử giá mua trong kỳ đã chọn'}
              </td>
              <td className="table-cell text-right tabular-nums">
                {row.estimatePrice != null ? formatCurrencyFull(row.estimatePrice) : '—'}
              </td>
              <td className={`table-cell text-right tabular-nums ${row.estimateDiff != null && row.estimateDiff > 0 ? 'text-[var(--md-error)]' : row.estimateDiff != null ? 'text-[var(--md-success)]' : ''}`}>
                {row.estimateDiff != null
                  ? `${row.estimateDiff > 0 ? '+' : ''}${formatCurrencyFull(row.estimateDiff)}${row.estimateDiffPct != null ? ` (${row.estimateDiffPct > 0 ? '+' : ''}${row.estimateDiffPct}%)` : ''}`
                  : 'Chưa có dự toán'}
              </td>
              <td className="table-cell">{row.latestSupplierName || '—'}</td>
              <td className="table-cell text-right tabular-nums">
                {row.minPrice != null && row.maxPrice != null
                  ? `${formatCurrencyFull(row.minPrice)} - ${formatCurrencyFull(row.maxPrice)}`
                  : '—'}
              </td>
              <td className="table-cell text-right tabular-nums">{row.supplierCount}</td>
              <td className={`table-cell text-center tabular-nums ${trendClass(row.trendPct)}`}>
                {trendLabel(row.trendPct)}
              </td>
              <td className="table-cell">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(row.materialCode)}>
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatrixTable({
  loading,
  data,
  hasCategory,
}: {
  loading: boolean;
  data: ReturnType<typeof usePriceBookMatrix>['data'];
  hasCategory: boolean;
}) {
  if (!hasCategory) {
    return <EmptyState message="Chọn nhóm hàng để so sánh giá NCC." />;
  }
  const suppliers = data?.rows[0]?.cells ?? [];
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Hàng hoá</th>
            {suppliers.map(s => (
              <th key={s.supplierId} className="table-header-cell">{s.supplierName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={Math.max(1, suppliers.length + 1)} />
          ) : !data || data.rows.length === 0 || suppliers.length === 0 ? (
            <tr>
              <td colSpan={Math.max(1, suppliers.length + 1)} className="table-cell">
                <EmptyState message="Nhóm này chưa có giá từ PO, KHMH, RFQ hoặc phiếu nhập kho." />
              </td>
            </tr>
          ) : data.rows.map(row => (
            <tr key={row.materialCode} className="table-row">
              <td className="table-cell">
                <span className="font-mono">{row.materialCode}</span>
                {' '}
                {row.materialName}
              </td>
              {row.cells.map(cell => (
                <td
                  key={cell.supplierId}
                  className={`table-cell text-right tabular-nums ${cell.isMin && cell.unitPrice != null ? 'text-[var(--md-success)] font-semibold' : ''}`}
                >
                  {cell.unitPrice != null
                    ? `${formatCurrencyFull(cell.unitPrice)}${cell.isMin ? ' ★' : ''}`
                    : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupsTable({
  loading,
  rows,
  onCompare,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookCategories>['data']>;
  onCompare: (categoryId: number) => void;
}) {
  const total = rows.reduce((sum, r) => sum + (r.totalSpend ?? 0), 0);
  return (
    <div className="wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell">Nhóm hàng</th>
            <th className="table-header-cell">Số mã hàng</th>
            <th className="table-header-cell">Số NCC đã mua</th>
            <th className="table-header-cell">Số lượt PO</th>
            <th className="table-header-cell">Tổng giá trị đã mua</th>
            <th className="table-header-cell">Tỷ trọng</th>
            <th className="table-header-cell"> </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={7} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="table-cell"><EmptyState message="Chưa có dữ liệu nhóm hàng." /></td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.categoryId} className="table-row">
              <td className="table-cell">
                <span className="font-mono">{row.categoryCode}</span>
                {' '}
                {row.categoryName}
              </td>
              <td className="table-cell text-right tabular-nums">{row.itemCount}</td>
              <td className="table-cell text-right tabular-nums">{row.supplierCount}</td>
              <td className="table-cell text-right tabular-nums">{row.poCount}</td>
              <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.totalSpend)}</td>
              <td className="table-cell">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="flex-1 h-2 rounded-full bg-[var(--md-secondary-container)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--md-secondary)]"
                      style={{ width: `${Math.max(0, Math.min(100, row.sharePct))}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[length:var(--fs-xs)]">{row.sharePct}%</span>
                </div>
              </td>
              <td className="table-cell">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCompare(row.categoryId)}>
                  Xem so sánh NCC
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {!loading && rows.length > 0 ? (
          <tfoot>
            <tr className="table-row">
              <td className="table-cell" colSpan={4}>Tổng cộng</td>
              <td className="table-cell text-right tabular-nums font-semibold">{formatCurrencyFull(total)}</td>
              <td className="table-cell" colSpan={2} />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

function EstimateKpis({ rows }: { rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']> }) {
  const withEst = new Set(rows.map(r => r.materialCode)).size;
  const valid = rows.filter(r => r.marginPct != null);
  const avg = valid.length === 0 ? null : valid.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / valid.length;
  const over = rows.filter(r => r.marginPct != null && r.marginPct < 0).length;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Số mặt hàng đã có giá dự toán</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{withEst}</div>
      </div>
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Biên lợi nhuận TB so với dự toán</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{avg == null ? '—' : `${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`}</div>
      </div>
      <div className={`border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 ${over > 0 ? 'border-l-[var(--md-error)]' : 'border-l-[var(--md-secondary)]'}`}>
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Mặt hàng đang mua vượt giá dự toán</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{over}</div>
      </div>
    </div>
  );
}

function estimateMarginBadge(pct: number | null | undefined) {
  if (pct == null) return 'badge-neutral';
  if (pct >= 10) return 'badge-success';
  if (pct >= 0) return 'badge-warning';
  return 'badge-error';
}

function EstimatesTable({
  loading,
  rows,
  missingEstimate,
  canUpdate,
  onEdit,
  onAdd,
  onHistory,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>;
  missingEstimate: PriceBookItemApiDto[];
  canUpdate: boolean;
  onEdit: (row: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>[number]) => void;
  onAdd: (materialCode: string) => void;
  onHistory: (materialCode: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">Giá dự toán</th>
              <th className="table-header-cell">Giá mua mới nhất</th>
              <th className="table-header-cell">Chênh lệch (Mua - Dự toán)</th>
              <th className="table-header-cell">Biên lợi nhuận</th>
              <th className="table-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell"><EmptyState message="Chưa có giá dự toán nào được thiết lập." /></td>
              </tr>
            ) : rows.map(row => (
              <tr key={`${row.materialCode}-${row.projectCode ?? ''}-${row.effectiveDate}`} className="table-row">
                <td className="table-cell">
                  <span className="mat-code-cell__badge">{row.materialCode}</span>
                  {' '}
                  {row.materialName}
                </td>
                <td className="table-cell">{row.projectCode || 'Chung'}</td>
                <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.estimatePrice)}</td>
                <td className="table-cell text-right tabular-nums">{row.purchaseLatest != null ? formatCurrencyFull(row.purchaseLatest) : '—'}</td>
                <td className={`table-cell text-right tabular-nums font-semibold ${row.diff != null && row.diff > 0 ? 'text-[var(--md-error)]' : ''}`}>
                  {row.diff != null ? `${row.diff > 0 ? '+' : ''}${formatCurrencyFull(row.diff)}` : '—'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${estimateMarginBadge(row.marginPct)}`}>
                    {row.marginPct != null ? `${row.marginPct > 0 ? '+' : ''}${row.marginPct}%` : '—'}
                  </span>
                </td>
                <td className="table-cell whitespace-nowrap">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHistory(row.materialCode)}>
                    Lịch sử ({row.estimateHistoryCount})
                  </button>
                  {canUpdate ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(row)}>Sửa</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingEstimate.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[length:var(--fs-lg)] font-semibold m-0">Mặt hàng đã có giá mua nhưng chưa thiết lập giá dự toán</h3>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Hàng hoá</th>
                  <th className="table-header-cell">Giá mua mới nhất</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {missingEstimate.map(row => (
                  <tr key={row.materialCode} className="table-row">
                    <td className="table-cell">
                      <span className="mat-code-cell__badge">{row.materialCode}</span>
                      {' '}
                      {row.materialName}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : '—'}
                    </td>
                    <td className="table-cell">
                      {canUpdate ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(row.materialCode)}>
                          + Thiết lập giá dự toán
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MarginKpis({ rows }: { rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']> }) {
  const withSell = new Set(rows.map(r => r.materialCode)).size;
  const avg = rows.length === 0
    ? null
    : rows.reduce((sum, r) => sum + (r.marginPct ?? 0), 0) / rows.length;
  const low = rows.filter(r => r.marginPct != null && r.marginPct < 10).length;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Số mặt hàng đã có giá bán</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{withSell}</div>
      </div>
      <div className="border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 border-l-[var(--md-secondary)]">
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Margin trung bình</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{avg == null ? '—' : `${avg.toFixed(1)}%`}</div>
      </div>
      <div className={`border border-[var(--md-outline-variant)] rounded-[var(--radius-md)] px-3 py-2 border-l-4 ${low > 0 ? 'border-l-[var(--md-error)]' : 'border-l-[var(--md-secondary)]'}`}>
        <div className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--md-on-surface-variant)]">Mặt hàng margin dưới 10%</div>
        <div className="text-[length:var(--fs-2xl)] font-semibold tabular-nums">{low}</div>
      </div>
    </div>
  );
}

function marginPctBadge(pct: number | null | undefined) {
  if (pct == null) return 'badge-neutral';
  if (pct >= 20) return 'badge-success';
  if (pct >= 10) return 'badge-warning';
  return 'badge-error';
}

function MarginsTable({
  loading,
  rows,
  missingSell,
  canUpdate,
  onEdit,
  onAddSell,
  onHistory,
}: {
  loading: boolean;
  rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>;
  missingSell: PriceBookItemApiDto[];
  canUpdate: boolean;
  onEdit: (row: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>[number]) => void;
  onAddSell: (materialCode: string) => void;
  onHistory: (materialCode: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">Giá bán/chào</th>
              <th className="table-header-cell">Giá mua mới nhất</th>
              <th className="table-header-cell">Margin</th>
              <th className="table-header-cell">Margin %</th>
              <th className="table-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell"><EmptyState message="Chưa có giá bán để đối chiếu." /></td>
              </tr>
            ) : rows.map(row => (
              <tr key={`${row.materialCode}-${row.projectCode ?? ''}-${row.effectiveDate}`} className="table-row">
                <td className="table-cell">
                  <span className="mat-code-cell__badge">{row.materialCode}</span>
                  {' '}
                  {row.materialName}
                </td>
                <td className="table-cell">{row.projectCode || 'Chung'}</td>
                <td className="table-cell text-right tabular-nums">{formatCurrencyFull(row.sellPrice)}</td>
                <td className="table-cell text-right tabular-nums">{row.purchaseLatest != null ? formatCurrencyFull(row.purchaseLatest) : '—'}</td>
                <td className={`table-cell text-right tabular-nums font-semibold ${row.margin != null && row.margin < 0 ? 'text-[var(--md-error)]' : ''}`}>
                  {row.margin != null ? formatCurrencyFull(row.margin) : '—'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${marginPctBadge(row.marginPct)}`}>
                    {row.marginPct != null ? `${row.marginPct}%` : '—'}
                  </span>
                </td>
                <td className="table-cell whitespace-nowrap">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHistory(row.materialCode)}>
                    Lịch sử ({row.sellHistoryCount})
                  </button>
                  {canUpdate ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(row)}>Sửa</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingSell.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[length:var(--fs-lg)] font-semibold m-0">Mặt hàng đã có giá mua nhưng chưa thiết lập giá bán</h3>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Hàng hoá</th>
                  <th className="table-header-cell">Giá mua mới nhất</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {missingSell.map(row => (
                  <tr key={row.materialCode} className="table-row">
                    <td className="table-cell">
                      <span className="mat-code-cell__badge">{row.materialCode}</span>
                      {' '}
                      {row.materialName}
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : '—'}
                    </td>
                    <td className="table-cell">
                      {canUpdate ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddSell(row.materialCode)}>
                          + Thêm giá bán
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function historyKindBadge(kind: string, status?: string | null) {
  if (kind === 'po' || kind === 'plan' || kind === 'import') return 'badge-success';
  if (kind === 'sell' || kind === 'estimate') return 'badge-info';
  if (status === 'won') return 'badge-success';
  if (status === 'active') return 'badge-warning';
  if (status === 'lost' || status === 'expired') return 'badge-error';
  return 'badge-neutral';
}

const CHART_TICK = {
  fill: 'var(--md-on-surface-variant)',
  fontSize: 11,
  fontFamily: 'var(--font-sans)',
} as const;

function PriceHistoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as PriceHistoryPlotPoint | undefined;
  if (!point) return null;
  return (
    <div className="chart-tooltip" role="tooltip">
      <p className="chart-tooltip__label">{point.kindLabel}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__name">Ngày:</span>
        <span className="chart-tooltip__value">{formatDateCell(point.date)}</span>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__name">Đơn giá:</span>
        <span className="chart-tooltip__value">{formatCurrencyFull(point.unitPrice)}</span>
      </div>
      {point.supplierName ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">NCC:</span>
          <span className="chart-tooltip__value">{point.supplierName}</span>
        </div>
      ) : null}
      {point.poRef ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">Tham chiếu:</span>
          <span className="chart-tooltip__value">{point.poRef}</span>
        </div>
      ) : null}
      {point.projectCode ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__name">Dự án:</span>
          <span className="chart-tooltip__value">{point.projectCode}</span>
        </div>
      ) : null}
    </div>
  );
}

function PriceHistoryDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: PriceHistoryPlotPoint;
}) {
  if (cx == null || cy == null || !payload) return null;
  return (
    <g>
      <text
        x={cx}
        y={cy - 22}
        textAnchor="middle"
        fill="var(--md-on-surface)"
        style={{ fontSize: 'var(--fs-micro)', fontFamily: 'var(--font-sans)' }}
      >
        {formatCurrencyFull(payload.unitPrice)}
      </text>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="var(--md-on-surface-variant)"
        style={{ fontSize: 'var(--fs-micro)', fontFamily: 'var(--font-sans)' }}
      >
        {payload.kindLabel}
      </text>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.purchased ? payload.color : 'var(--md-surface-container-high)'}
        stroke={payload.color}
        strokeWidth={2}
      />
    </g>
  );
}

function PriceHistoryChart({
  points,
  ceilingPrice,
}: {
  points: PriceHistoryPoint[];
  ceilingPrice?: number | null;
}) {
  const plot = buildPriceHistoryPlot(points);
  if (!plot) {
    return <EmptyState message="Chưa có dữ liệu giá để vẽ biểu đồ." />;
  }

  const { rows, legend, xDomain, yDomain, xTicks } = plot;
  const hasPurchaseLine = rows.filter(r => r.purchased).length >= 2;

  return (
    <div className="space-y-2">
      <div className="text-[length:var(--fs-sm)] font-medium">Diễn biến đơn giá theo thời gian</div>
      <div className="pur-pricebook-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 36, right: 28, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--md-outline-variant)" vertical={false} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={xDomain}
              ticks={xTicks}
              tickFormatter={ts => {
                const row = rows.find(r => r.ts === ts);
                return formatDateCell(row?.date);
              }}
              tick={CHART_TICK}
              axisLine={{ stroke: 'var(--md-outline-variant)' }}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={value => formatCurrencyShort(Number(value))}
              tick={CHART_TICK}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={PriceHistoryTooltip} />
            {ceilingPrice != null ? (
              <ReferenceLine
                y={ceilingPrice}
                stroke="var(--md-error)"
                strokeDasharray="4 4"
                label={{
                  value: `Giá trần ${formatCurrencyFull(ceilingPrice)}`,
                  fill: 'var(--md-error)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  position: 'insideTopRight',
                }}
              />
            ) : null}
            {hasPurchaseLine ? (
              <Line
                type="linear"
                dataKey="purchasePrice"
                name="Giá đã mua"
                stroke="var(--md-tertiary)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
                legendType="none"
                isAnimationActive={false}
              />
            ) : null}
            <Scatter
              dataKey="unitPrice"
              name="Mốc giá"
              shape={PriceHistoryDot}
              isAnimationActive={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
        {legend.map(item => (
          <span key={item.kindLabel} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{
                background: item.purchased ? item.color : 'transparent',
                boxShadow: `inset 0 0 0 2px ${item.color}`,
              }}
            />
            {item.kindLabel}
          </span>
        ))}
      </div>
      <p className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] m-0">
        Trục ngang là ngày ghi giá. Mỗi chấm là một dòng trong bảng bên dưới.
        Chấm đặc = đã mua (PO, KHMH, nhập kho). Chấm rỗng = giá tham khảo (báo giá, giá bán, dự toán).
      </p>
    </div>
  );
}
