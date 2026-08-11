import { useEffect, useMemo, useState } from 'react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import HrmSelect from '../../components/hr/HrmSelect';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import CurrencyInput from '../../components/ui/CurrencyInput';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import { showToast } from '../../components/ui/Toast';
import {
  usePriceBookCategories,
  usePriceBookItem,
  usePriceBookItems,
  usePriceBookMargins,
  usePriceBookMatrix,
  useUpsertSellPrice,
} from '../../hooks/usePurchasePriceBook';
import { useCategoryTree } from '../../hooks/useCategories';
import { useMaterials } from '../../hooks/useMaterials';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import {
  buildPriceHistoryChart,
  isPurchaseKind,
  type PriceHistoryPoint,
} from '../../lib/purchasePriceHistoryChart';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { PriceBookItemApiDto } from '../../types/api/purchasingApi';
import RfqQuotesPanel from './RfqQuotesPanel';

const CHART_COLORS = [
  'var(--md-secondary)',
  'var(--md-tertiary)',
  'var(--md-success)',
  'var(--md-error)',
  'var(--md-info)',
  'var(--md-primary)',
];

type Tab = 'items' | 'matrix' | 'rfq' | 'groups' | 'margins';

const TABS: { id: Tab; label: string }[] = [
  { id: 'items', label: 'Sổ giá theo mặt hàng' },
  { id: 'matrix', label: 'So sánh giá NCC' },
  { id: 'rfq', label: 'Giá chào thầu (RFQ)' },
  { id: 'groups', label: 'Phân tích theo nhóm hàng' },
  { id: 'margins', label: 'Phân tích Mua vào - Bán ra' },
];

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
    ['Mã hàng', 'Tên hàng', 'Giá mới nhất', 'NCC gần nhất', 'Giá min', 'Giá max', 'Số NCC', 'Xu hướng %'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.latestPrice != null ? String(r.latestPrice) : '',
      r.latestSupplierName ?? '',
      r.minPrice != null ? String(r.minPrice) : '',
      r.maxPrice != null ? String(r.maxPrice) : '',
      String(r.supplierCount),
      r.trendPct != null ? String(r.trendPct) : '',
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

  const items = usePriceBookItems(
    search.trim() || undefined,
    categoryId === '' ? undefined : categoryId,
    tab === 'items',
  );
  const allItems = usePriceBookItems(undefined, undefined, tab === 'matrix' || tab === 'margins');
  const matrix = usePriceBookMatrix(matrixCategoryId === '' ? undefined : matrixCategoryId);
  const groups = usePriceBookCategories(tab === 'groups');
  const margins = usePriceBookMargins(tab === 'margins');
  const detail = usePriceBookItem(detailCode ?? undefined);
  const upsertSell = useUpsertSellPrice();
  const { data: categories = [] } = useCategoryTree();
  const { data: materialsPage } = useMaterials({ page: 1, pageSize: 200 });
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

  return (
    <PurchasingListLayout
      title="Sổ giá & Phân tích"
      subtitle="Sổ giá theo mặt hàng · Giá chào thầu (RFQ) · Phân tích Mua vào - Bán ra"
      hideSearch={tab !== 'items'}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Tìm theo mã/tên hàng…"
      filters={tab === 'items' ? (
        <HrmSelect
          aria-label="Nhóm hàng"
          placeholder="-- Tất cả nhóm hàng --"
          value={itemsCategoryValue ? categoryOption(itemsCategoryValue) : ''}
          options={categoryLabels}
          onChange={label => {
            const found = rootCategories.find(c => categoryOption(c) === label);
            setCategoryId(found?.id ?? '');
          }}
        />
      ) : null}
      hasFilters={tab === 'items' && Boolean(categoryId)}
      onResetFilters={() => {
        setCategoryId('');
        setSearch('');
      }}
    >
      <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)] mb-3">
        {tab === 'items'
          ? 'Sổ giá tổng hợp lịch sử mua thực tế (từ PO đã duyệt) theo mặt hàng: biến động giá, số NCC, xu hướng so với lần mua trước và cảnh báo khi vượt giá trần tham chiếu.'
          : tab === 'matrix'
            ? 'Bảng so sánh giá gần nhất của các NCC cho từng mặt hàng trong cùng nhóm hàng. Ô có dấu ★ là giá thấp nhất giữa các NCC đã từng báo / bán mặt hàng đó.'
            : tab === 'rfq'
              ? 'Ghi lại tất cả báo giá nhận được cho một mặt hàng, kể cả báo giá không được chọn, để có nền tảng thương lượng cho các lần mua sau.'
              : tab === 'groups'
                ? 'Tổng hợp chi tiêu và biến động giá theo từng nhóm hàng, giúp nhìn nhóm nào chiếm tỷ trọng lớn để ưu tiên đàm phán.'
                : 'So sánh giá bán / giá chào cho dự án với giá mua thực tế để nhìn margin theo từng mặt hàng.'}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rfq' ? (
        <RfqQuotesPanel canWrite={canWriteRfq} canUpdate={canUpdateRfq} presetMaterialCode={rfqPresetCode} />
      ) : null}

      {tab === 'items' ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => exportItemsCsv(items.data ?? [])}>
              Xuất CSV
            </button>
          </div>
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
                  <input
                    className="form-input"
                    type="date"
                    value={sellForm.effectiveDate}
                    onChange={e => setSellForm(f => ({ ...f, effectiveDate: e.target.value }))}
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
        size="lg"
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
            <p className="text-[length:var(--fs-sm)]">
              Giá trần: {detail.data.item.ceilingPrice != null ? formatCurrencyFull(detail.data.item.ceilingPrice) : 'Chưa khai báo'}
              {detail.data.item.abcClass ? ` · ABC ${detail.data.item.abcClass}` : ''}
            </p>
            <PriceHistoryChart points={detail.data.history} />
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
                      <td className="table-cell"><span className={`badge ${historyKindBadge(h.kind, h.status)}`}>{historyKindLabel(h.kind, h.status)}</span></td>
                      <td className="table-cell">{h.supplierName || '—'}</td>
                      <td className="table-cell text-right tabular-nums">{formatCurrencyFull(h.unitPrice)}</td>
                      <td className="table-cell font-mono">{h.poRef || '—'}</td>
                      <td className="table-cell">{h.projectCode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canWriteRfq ? (
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
            ) : null}
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
            <th className="table-header-cell">Giá mới nhất</th>
            <th className="table-header-cell">NCC gần nhất</th>
            <th className="table-header-cell">Khoảng giá</th>
            <th className="table-header-cell">Số NCC</th>
            <th className="table-header-cell text-center">Xu hướng</th>
            <th className="table-header-cell"> </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows colSpan={7} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="table-cell"><EmptyState message="Chưa có mặt hàng phù hợp." /></td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.materialCode} className="table-row">
              <td className="table-cell">
                <div><span className="mat-code-cell__badge">{row.materialCode}</span></div>
                <div>{row.materialName}</div>
                <div className="text-[var(--md-on-surface-variant)]">
                  Giá trần: {row.ceilingPrice != null ? formatCurrencyFull(row.ceilingPrice) : '—'}
                  {row.overCeiling ? (
                    <span className="ml-2 text-[var(--md-error)]">Vượt trần</span>
                  ) : null}
                </div>
              </td>
              <td className="table-cell text-right tabular-nums">
                {row.latestPrice != null ? formatCurrencyFull(row.latestPrice) : 'Chưa có lịch sử giá'}
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
              <th className="table-header-cell">Giá mua TB</th>
              <th className="table-header-cell">Giá mua mới nhất</th>
              <th className="table-header-cell">Margin</th>
              <th className="table-header-cell">Margin %</th>
              <th className="table-header-cell"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows colSpan={8} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell"><EmptyState message="Chưa có giá bán để đối chiếu." /></td>
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
                <td className="table-cell text-right tabular-nums">{row.purchaseAvg != null ? formatCurrencyFull(row.purchaseAvg) : 'Chưa có'}</td>
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
                  {row.sellHistoryCount > 1 ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onHistory(row.materialCode)}>
                      Lịch sử ({row.sellHistoryCount})
                    </button>
                  ) : null}
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

function historyKindLabel(kind: string, status?: string | null) {
  if (kind === 'po') return 'Đã mua (PO)';
  if (kind === 'plan') return 'KHMH';
  if (kind === 'import') return 'Nhập kho';
  if (kind === 'sell') return 'Giá bán';
  if (status === 'won') return 'Báo giá - Thắng';
  if (status === 'lost') return 'Báo giá - Thua';
  if (status === 'active') return 'Báo giá - Còn hiệu lực';
  if (status === 'expired') return 'Báo giá - Hết hạn';
  return 'Báo giá';
}

function historyKindBadge(kind: string, status?: string | null) {
  if (kind === 'po' || kind === 'plan' || kind === 'import') return 'badge-success';
  if (kind === 'sell') return 'badge-info';
  if (status === 'won') return 'badge-success';
  if (status === 'active') return 'badge-warning';
  if (status === 'lost' || status === 'expired') return 'badge-error';
  return 'badge-neutral';
}

function PriceHistoryChart({ points }: { points: PriceHistoryPoint[] }) {
  const chart = buildPriceHistoryChart(points);
  if (!chart) {
    return <EmptyState message="Chưa có dữ liệu giá để vẽ biểu đồ." />;
  }

  const { layout, axis, supplierKeys, xOf, yOf, minP, midP, maxP } = chart;
  const colorOf = (name: string) => CHART_COLORS[Math.max(0, supplierKeys.indexOf(name)) % CHART_COLORS.length];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Biểu đồ lịch sử giá"
        >
          <line x1={axis.x1} y1={axis.y1} x2={axis.x1} y2={axis.y2} stroke="var(--md-outline-variant)" />
          <line x1={axis.x1} y1={axis.y2} x2={axis.x2} y2={axis.y2} stroke="var(--md-outline-variant)" />
          {[maxP, midP, minP].map(v => (
            <text
              key={v}
              x={4}
              y={yOf(v) + 4}
              fill="var(--md-on-surface-variant)"
              style={{ fontSize: 'var(--fs-micro)' }}
            >
              {formatCurrencyFull(v)}
            </text>
          ))}
          {supplierKeys.map(name => {
            const linePts = points
              .filter(p => (p.supplierName || `#${p.supplierId ?? 0}`) === name && isPurchaseKind(p.kind))
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date));
            if (linePts.length < 2) return null;
            const d = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.date).toFixed(1)} ${yOf(p.unitPrice).toFixed(1)}`).join(' ');
            return <path key={name} d={d} fill="none" stroke={colorOf(name)} strokeWidth="2" opacity="0.75" />;
          })}
          {points.map((p, i) => {
            const key = p.supplierName || `#${p.supplierId ?? 0}`;
            const color = colorOf(key);
            const purchased = isPurchaseKind(p.kind);
            return (
              <circle
                key={`${p.date}-${p.kind}-${i}`}
                cx={xOf(p.date)}
                cy={yOf(p.unitPrice)}
                r={purchased ? 5 : 4}
                fill={purchased ? color : 'var(--md-surface-container)'}
                stroke={p.kind === 'quote' && p.status === 'active' ? 'var(--md-tertiary)' : color}
                strokeWidth={purchased ? 1.5 : 2}
              >
                <title>
                  {`${p.supplierName || 'NCC'}: ${formatCurrencyFull(p.unitPrice)} (${p.date}) - ${historyKindLabel(p.kind, p.status)}`}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)]">
        {supplierKeys.map(name => (
          <span key={name} className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorOf(name) }} />
            {name}
          </span>
        ))}
      </div>
      <p className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] m-0">
        Chấm đặc = đã mua (PO / KHMH / nhập kho). Chấm rỗng = báo giá hoặc giá bán.
      </p>
    </div>
  );
}
