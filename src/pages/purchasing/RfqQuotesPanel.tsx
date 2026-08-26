import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import CurrencyInput from '../../components/ui/CurrencyInput';
import Dropdown from '../../components/ui/Dropdown';
import HrmSelect from '../../components/hr/HrmSelect';
import SupplierAutocomplete from '../../components/ui/SupplierAutocomplete';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import MaterialByGroupFields, { rootCategoryIdOf } from '../../components/purchasing/MaterialByGroupFields';
import { useCategoryTree } from '../../hooks/useCategories';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useCreatePurchaseRfqQuote,
  usePurchaseRfqAverages,
  usePurchaseRfqQuotes,
  usePurchaseRfqWinRates,
  useUpdatePurchaseRfqQuote,
} from '../../hooks/usePurchaseRfq';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects } from '../../hooks/useProjects';
import { useSuppliers } from '../../hooks/useSuppliers';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DropdownItem } from '../../types';
import type { PurchaseRfqQuoteApiDto, UpsertPurchaseRfqQuoteRequest } from '../../types/api/purchasingApi';

export type RfqQuotesPanelHandle = {
  openCreate: () => void;
  exportCsv: () => void;
};

const COLS = 9;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

const STATUS_LABEL: Record<string, string> = {
  active: 'Còn hiệu lực',
  won: 'Thắng thầu',
  lost: 'Thua thầu',
  expired: 'Hết hạn',
};

function rfqStatusBadge(status: string) {
  if (status === 'won') return 'badge-success';
  if (status === 'active') return 'badge-warning';
  if (status === 'lost' || status === 'expired') return 'badge-error';
  return 'badge-neutral';
}

type RfqForm = {
  materialCode: string;
  supplierName: string;
  projectCode: string;
  quoteDate: string;
  unitPrice: string;
  validUntil: string;
  leadTimeDays: string;
  paymentTerm: string;
  note: string;
};

const emptyForm = (): RfqForm => ({
  materialCode: '',
  supplierName: '',
  projectCode: '',
  quoteDate: new Date().toISOString().slice(0, 10),
  unitPrice: '',
  validUntil: '',
  leadTimeDays: '',
  paymentTerm: '',
  note: '',
});

export default forwardRef<RfqQuotesPanelHandle, {
  canWrite: boolean;
  canUpdate?: boolean;
  presetMaterialCode?: string;
  /** Khi true: ẩn nút trên panel (parent đặt trên PageHeader). */
  hideToolbarActions?: boolean;
}>(function RfqQuotesPanel({
  canWrite,
  canUpdate = canWrite,
  presetMaterialCode = '',
  hideToolbarActions = false,
}, ref) {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>(THIS_YEAR);
  const [quarter, setQuarter] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  const [groupBy, setGroupBy] = useState<'quarter' | 'year'>('quarter');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [editing, setEditing] = useState<PurchaseRfqQuoteApiDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<RfqForm>(emptyForm);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [formErrors, setFormErrors] = useState<Partial<Record<'categoryId' | 'materialCode' | 'supplierName' | 'quoteDate' | 'unitPrice' | 'validUntil', string>>>({});

  const params = useMemo(
    () => ({
      page,
      pageSize,
      supplierId: supplierId === '' ? undefined : supplierId,
      year:
        groupBy === 'year'
          ? year === '' ? undefined : year
          : year === '' ? THIS_YEAR : year,
      quarter: groupBy === 'quarter' && quarter !== '' ? quarter : undefined,
      status: status || undefined,
    }),
    [page, pageSize, supplierId, year, quarter, status, groupBy],
  );

  const chipParams = useMemo(
    () => ({
      supplierId: params.supplierId,
      year: params.year,
      quarter: params.quarter,
    }),
    [params.supplierId, params.year, params.quarter],
  );

  const list = usePurchaseRfqQuotes(params);
  const averages = usePurchaseRfqAverages(groupBy, chipParams);
  const winRates = usePurchaseRfqWinRates(chipParams);
  const createMutation = useCreatePurchaseRfqQuote();
  const updateMutation = useUpdatePurchaseRfqQuote();
  const { data: categories = [] } = useCategoryTree();
  const { data: materialsPage } = useMaterials({
    page: 1,
    pageSize: 500,
    categoryId: categoryId === '' ? undefined : categoryId,
  });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const rootCategories = useMemo(
    () => categories.filter(c => c.level === 1 && c.code !== 'UNCATEGORIZED' && c.isActive),
    [categories],
  );

  const items = list.data?.items ?? [];
  const materials = materialsPage?.items ?? [];
  const suppliers = suppliersPage?.items ?? [];
  const projects = projectsPage?.items ?? [];
  const supplierOptions = useMemo(
    () => [...suppliers].sort((a, b) => a.supplierName.localeCompare(b.supplierName, 'vi')),
    [suppliers],
  );
  const winRateChips = useMemo(
    () => (winRates.data ?? []).filter(w => w.won > 0),
    [winRates.data],
  );

  const consumedPreset = useRef('');
  useEffect(() => {
    if (!canWrite || !presetMaterialCode || consumedPreset.current === presetMaterialCode) return;
    consumedPreset.current = presetMaterialCode;
    setCreating(true);
    setEditing(null);
    setForm(f => ({ ...emptyForm(), materialCode: presetMaterialCode, quoteDate: f.quoteDate || emptyForm().quoteDate }));
    setFormErrors({});
  }, [canWrite, presetMaterialCode]);

  useEffect(() => {
    if (!form.materialCode || categoryId !== '') return;
    const mat = materials.find(m => m.materialCode === form.materialCode);
    if (mat) setCategoryId(rootCategoryIdOf(mat.categoryId, categories));
  }, [form.materialCode, categoryId, materials, categories]);
  const busy = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm());
    setCategoryId('');
    setFormErrors({});
  };

  const openEdit = (row: PurchaseRfqQuoteApiDto) => {
    if (row.status === 'won' || row.status === 'lost') {
      showToast('error', 'Báo giá đã kết thúc, không thể sửa.');
      return;
    }
    setCreating(false);
    setEditing(row);
    setForm({
      materialCode: row.materialCode,
      supplierName: row.supplierName,
      projectCode: row.projectCode ?? '',
      quoteDate: row.quoteDate,
      unitPrice: String(row.unitPrice),
      validUntil: row.validUntil ?? '',
      leadTimeDays: row.leadTimeDays != null ? String(row.leadTimeDays) : '',
      paymentTerm: row.paymentTerm ?? '',
      note: row.note ?? '',
    });
    const mat = materials.find(m => m.materialCode === row.materialCode);
    setCategoryId(rootCategoryIdOf(mat?.categoryId, categories));
    setFormErrors({});
  };

  const closeModal = () => {
    if (busy) return;
    setCreating(false);
    setEditing(null);
  };

  const buildBody = (): UpsertPurchaseRfqQuoteRequest => {
    const matched = suppliers.find(s => s.supplierName === form.supplierName);
    return {
      materialCode: form.materialCode,
      supplierId: matched?.id ?? 0,
      projectCode: form.projectCode || null,
      quoteDate: form.quoteDate,
      unitPrice: Number(String(form.unitPrice).replace(/[^\d.-]/g, '')),
      validUntil: form.validUntil,
      leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
      paymentTerm: form.paymentTerm || null,
      status: null,
      note: form.note || null,
    };
  };

  const save = async () => {
    const nextErrors: typeof formErrors = {};
    if (categoryId === '') nextErrors.categoryId = 'Chọn nhóm vật tư.';
    if (!form.materialCode) nextErrors.materialCode = 'Chọn vật tư.';
    if (!form.supplierName) nextErrors.supplierName = 'Chọn nhà cung cấp.';
    if (!form.quoteDate) nextErrors.quoteDate = 'Chọn ngày báo giá.';
    if (!form.validUntil) nextErrors.validUntil = 'Chọn hạn giữ giá.';
    const price = Number(String(form.unitPrice).replace(/[^\d.-]/g, ''));
    if (!(price > 0)) nextErrors.unitPrice = 'Nhập đơn báo giá.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!buildBody().supplierId) {
      setFormErrors({ supplierName: 'Chọn NCC trong danh mục.' });
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: buildBody() });
        showToast('success', 'Đã cập nhật báo giá.');
      } else {
        await createMutation.mutateAsync(buildBody());
        showToast('success', 'Đã ghi nhận báo giá.');
      }
      closeModal();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được báo giá.'));
    }
  };

  const mark = async (row: PurchaseRfqQuoteApiDto, next: 'won' | 'lost') => {
    if (!row.validUntil) {
      showToast('error', 'Báo giá thiếu hạn giữ giá, hãy sửa trước.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: row.id,
        body: {
          materialCode: row.materialCode,
          supplierId: row.supplierId,
          projectCode: row.projectCode,
          quoteDate: row.quoteDate,
          unitPrice: row.unitPrice,
          validUntil: row.validUntil,
          leadTimeDays: row.leadTimeDays,
          paymentTerm: row.paymentTerm,
          status: next,
          note: row.note,
        },
      });
      showToast('success', next === 'won' ? 'Đã đánh dấu thắng thầu.' : 'Đã đánh dấu thua thầu.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được trạng thái.'));
    }
  };

  const rowActions = (row: PurchaseRfqQuoteApiDto): DropdownItem[] => {
    const items: DropdownItem[] = [];
    const closed = row.status === 'won' || row.status === 'lost';
    if (row.status === 'active') {
      items.push(
        { label: 'Thắng thầu', icon: Check, onClick: () => void mark(row, 'won') },
        { label: 'Thua thầu', icon: X, danger: true, onClick: () => void mark(row, 'lost') },
        { divider: true },
      );
    }
    if (!closed) {
      items.push({ label: 'Sửa báo giá', icon: Pencil, onClick: () => openEdit(row) });
    }
    return items;
  };

  const exportCsv = () => {
    const header = ['Ngày báo giá', 'Mã hàng', 'Tên hàng', 'Nhà cung cấp', 'Đơn giá', 'Hạn giữ giá', 'Thời gian giao hàng', 'Điều khoản thanh toán', 'Trạng thái'];
    const lines = items.map(row => [
      row.quoteDate,
      row.materialCode,
      row.materialName,
      row.supplierName,
      String(row.unitPrice),
      row.validUntil ?? '',
      row.leadTimeDays != null ? String(row.leadTimeDays) : '',
      row.paymentTerm ?? '',
      STATUS_LABEL[row.status] ?? row.status,
    ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BaoGia_RFQ.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({ openCreate, exportCsv }), [canWrite, items]);

  return (
    <div className="space-y-3">
      {hideToolbarActions ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4">
          <h2 className="text-[length:var(--fs-lg)] font-semibold m-0">Sổ giá chào thầu (RFQ)</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>Xuất CSV</button>
            {canWrite ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                + Ghi nhận báo giá mới
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects rfq-filter-row">
            <FormField label="Lọc theo NCC">
              <HrmSelect
                aria-label="Lọc theo NCC"
                placeholder="-- Tất cả NCC --"
                value={supplierId === '' ? '' : String(supplierId)}
                options={supplierOptions.map(s => ({ value: String(s.id), label: s.supplierName }))}
                onChange={v => {
                  setSupplierId(v ? Number(v) : '');
                  setPage(1);
                }}
              />
            </FormField>
            <FormField label="Lọc theo trạng thái">
              <HrmSelect
                aria-label="Lọc theo trạng thái"
                placeholder="-- Tất cả trạng thái --"
                value={status}
                className={
                  status === 'won' ? 'rfq-status-select--won'
                    : status === 'lost' ? 'rfq-status-select--lost'
                      : status === 'expired' ? 'rfq-status-select--expired'
                        : status === 'active' ? 'rfq-status-select--active'
                          : ''
                }
                options={[
                  { value: 'active', label: 'Còn hiệu lực' },
                  { value: 'won', label: 'Thắng thầu' },
                  { value: 'lost', label: 'Thua thầu' },
                  { value: 'expired', label: 'Hết hạn' },
                ]}
                onChange={v => {
                  setStatus(v);
                  setPage(1);
                }}
              />
            </FormField>
            <FormField label="Gom giá TB">
              <HrmSelect
                aria-label="Gom giá TB"
                value={groupBy}
                options={[
                  { value: 'quarter', label: 'Theo quý' },
                  { value: 'year', label: 'Theo năm' },
                ]}
                onChange={v => {
                  const next = v as 'quarter' | 'year';
                  setGroupBy(next);
                  if (next === 'year') {
                    setQuarter('');
                    if (year === '') setYear(THIS_YEAR);
                  } else if (year === '') {
                    setYear(THIS_YEAR);
                  }
                  setPage(1);
                }}
              />
            </FormField>
            {groupBy === 'quarter' ? (
              <FormField label="Quý">
                <HrmSelect
                  aria-label="Quý"
                  placeholder="Tất cả quý"
                  value={quarter === '' ? '' : String(quarter)}
                  options={[1, 2, 3, 4].map(q => ({ value: String(q), label: `Quý ${q}` }))}
                  onChange={v => {
                    setQuarter(v ? Number(v) : '');
                    setPage(1);
                  }}
                />
              </FormField>
            ) : (
              <FormField label="Năm">
                <HrmSelect
                  aria-label="Năm"
                  placeholder="Tất cả (5 năm)"
                  value={year === '' ? '' : String(year)}
                  options={YEARS.map(y => ({ value: String(y), label: String(y) }))}
                  onChange={v => {
                    setYear(v ? Number(v) : '');
                    setPage(1);
                  }}
                />
              </FormField>
            )}
          </div>
        </div>
      </div>

      {winRateChips.length > 0 ? (
        <div className="rfq-chip-row">
          {winRateChips.map(w => (
            <span key={w.supplierId} className={`badge ${w.rate >= 50 ? 'badge-success' : 'badge-error'}`}>
              {w.supplierName}: {w.won}/{w.total} ({w.rate}%)
            </span>
          ))}
        </div>
      ) : null}

      {averages.data && averages.data.length > 0 ? (
        <div className="rfq-chip-row">
          {averages.data.map(a => (
            <span key={a.period} className="badge badge-info">
              {a.period}: {formatCurrency(a.averagePrice)} ({a.quoteCount} BG)
            </span>
          ))}
        </div>
      ) : null}

      <div className="wms-inventory-table-wrap">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell">Ngày BG</th>
              <th className="table-header-cell">Hàng hoá</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell">Đơn giá</th>
              <th className="table-header-cell">Hạn giữ giá</th>
              <th className="table-header-cell">TG giao hàng</th>
              <th className="table-header-cell">Điều khoản thanh toán</th>
              <th className="table-header-cell">Trạng thái</th>
              <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {list.isError ? (
              <tr>
                <td colSpan={COLS} className="table-cell">
                  <EmptyState message={getApiErrorMessage(list.error, 'Không tải được báo giá.')} />
                </td>
              </tr>
            ) : list.isLoading ? (
              <TableSkeletonRows colSpan={COLS} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLS} className="table-cell">
                  <EmptyState message="Chưa có báo giá phù hợp bộ lọc." />
                </td>
              </tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell">{formatDateCell(row.quoteDate)}</td>
                  <td className="table-cell">
                    <span className="font-mono">{row.materialCode}</span>
                    {' '}
                    {row.materialName}
                  </td>
                  <td className="table-cell">{row.supplierName}</td>
                  <td className="table-cell text-right tabular-nums">{formatCurrency(row.unitPrice)}</td>
                  <td className="table-cell">{row.validUntil ? formatDateCell(row.validUntil) : '-'}</td>
                  <td className="table-cell">{row.leadTimeDays != null ? `${row.leadTimeDays} ngày` : '-'}</td>
                  <td className="table-cell">{row.paymentTerm || '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${rfqStatusBadge(row.status)}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="table-cell hrm-table-col-actions">
                    {(() => {
                      if (!canUpdate) return null;
                      const actions = rowActions(row);
                      return actions.length > 0 ? <Dropdown trigger="Tác vụ" items={actions} /> : null;
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={page}
        totalPages={Math.max(1, list.data?.totalPages ?? 1)}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        totalItems={list.data?.totalCount ?? 0}
      />

      <Modal
        isOpen={creating || Boolean(editing)}
        onClose={closeModal}
        title={editing ? 'Sửa báo giá' : 'Ghi nhận báo giá mới'}
        size="xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 modal-form-bordered">
          <MaterialByGroupFields
            categoryId={categoryId}
            onCategoryChange={id => {
              setCategoryId(id);
              setForm(f => ({ ...f, materialCode: '' }));
              setFormErrors(prev => ({ ...prev, categoryId: undefined, materialCode: undefined }));
            }}
            materialCode={form.materialCode}
            onMaterialChange={materialCode => {
              setForm(f => ({ ...f, materialCode }));
              setFormErrors(prev => ({ ...prev, materialCode: undefined }));
            }}
            groups={rootCategories}
            materials={materials}
            categoryError={formErrors.categoryId}
            materialError={formErrors.materialCode}
          />
          <FormField label="Nhà cung cấp" required error={formErrors.supplierName}>
            <SupplierAutocomplete
              value={form.supplierName}
              onChange={supplierName => {
                setForm(f => ({ ...f, supplierName }));
                setFormErrors(prev => ({ ...prev, supplierName: undefined }));
              }}
              suppliers={suppliers}
            />
          </FormField>
          <FormField label="Dự án">
            <ProjectAutocomplete
              value={form.projectCode}
              onChange={projectCode => setForm(f => ({ ...f, projectCode }))}
              projects={projects}
            />
          </FormField>
          <FormField label="Ngày báo giá" required error={formErrors.quoteDate}>
            <input className="form-input" type="date" value={form.quoteDate} onChange={e => {
              setForm(f => ({ ...f, quoteDate: e.target.value }));
              setFormErrors(prev => ({ ...prev, quoteDate: undefined }));
            }} />
          </FormField>
          <FormField label="Đơn báo giá" required error={formErrors.unitPrice}>
            <CurrencyInput
              value={form.unitPrice}
              suffix="VND"
              onChange={unitPrice => {
                setForm(f => ({ ...f, unitPrice }));
                setFormErrors(prev => ({ ...prev, unitPrice: undefined }));
              }}
            />
          </FormField>
          <FormField label="Hạn giữ giá" required error={formErrors.validUntil}>
            <input className="form-input" type="date" value={form.validUntil} onChange={e => {
              setForm(f => ({ ...f, validUntil: e.target.value }));
              setFormErrors(prev => ({ ...prev, validUntil: undefined }));
            }} />
          </FormField>
          <FormField label="Thời gian giao hàng (ngày)">
            <input className="form-input" type="number" min={0} value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} />
          </FormField>
          <FormField label="Điều khoản thanh toán">
            <input className="form-input" value={form.paymentTerm} onChange={e => setForm(f => ({ ...f, paymentTerm: e.target.value }))} />
          </FormField>
          <FormField label="Ghi chú" className="sm:col-span-2">
            <textarea className="form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={closeModal}>Hủy</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save()}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </Modal>
    </div>
  );
});
