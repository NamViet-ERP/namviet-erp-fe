import { useEffect, useMemo, useRef, useState } from 'react';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import CurrencyInput from '../../components/ui/CurrencyInput';
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
import type { PurchaseRfqQuoteApiDto, UpsertPurchaseRfqQuoteRequest } from '../../types/api/purchasingApi';

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
  status: string;
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
  status: 'active',
  note: '',
});

export default function RfqQuotesPanel({
  canWrite,
  canUpdate = canWrite,
  presetMaterialCode = '',
}: {
  canWrite: boolean;
  canUpdate?: boolean;
  presetMaterialCode?: string;
}) {
  const [search, setSearch] = useState('');
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
  const [formErrors, setFormErrors] = useState<Partial<Record<'categoryId' | 'materialCode' | 'supplierName' | 'quoteDate' | 'unitPrice', string>>>({});

  const params = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      year:
        groupBy === 'year'
          ? year === '' ? undefined : year
          : year === '' ? THIS_YEAR : year,
      quarter: groupBy === 'quarter' && quarter !== '' ? quarter : undefined,
      status: status || undefined,
    }),
    [page, pageSize, search, year, quarter, status, groupBy],
  );

  const list = usePurchaseRfqQuotes(params);
  const averagesYear = groupBy === 'year' ? (year === '' ? undefined : year) : (year === '' ? THIS_YEAR : year);
  const averages = usePurchaseRfqAverages(groupBy, averagesYear);
  const winRates = usePurchaseRfqWinRates();
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
      status: row.status === 'expired' ? 'active' : row.status,
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
    validUntil: form.validUntil || null,
    leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
    paymentTerm: form.paymentTerm || null,
    status: form.status,
    note: form.note || null,
  };
  };

  const save = async () => {
    const nextErrors: typeof formErrors = {};
    if (categoryId === '') nextErrors.categoryId = 'Chọn nhóm vật tư.';
    if (!form.materialCode) nextErrors.materialCode = 'Chọn vật tư.';
    if (!form.supplierName) nextErrors.supplierName = 'Chọn nhà cung cấp.';
    if (!form.quoteDate) nextErrors.quoteDate = 'Chọn ngày báo giá.';
    const price = Number(String(form.unitPrice).replace(/[^\d.-]/g, ''));
    if (!(price > 0)) nextErrors.unitPrice = 'Nhập đơn giá chào.';
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

  const exportCsv = () => {
    const header = ['Ngày báo giá', 'Mã hàng', 'Tên hàng', 'Nhà cung cấp', 'Đơn giá', 'Hạn giữ giá', 'Lead-time', 'Điều khoản TT', 'Trạng thái'];
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

  return (
    <div className="space-y-3">
      {winRates.data && winRates.data.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {winRates.data.map(w => (
            <span key={w.supplierId} className={`badge ${w.rate >= 50 ? 'badge-success' : 'badge-warning'}`}>
              {w.supplierName}: {w.won}/{w.total} ({w.rate}%)
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
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

      <div className="flex flex-wrap gap-2 items-end">
        <FormField label="Lọc theo NCC">
          <input
            className="form-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Mã / tên VT / NCC"
          />
        </FormField>
        <FormField label="Lọc theo trạng thái">
          <select className="form-input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">-- Tất cả trạng thái --</option>
            <option value="active">Còn hiệu lực</option>
            <option value="won">Thắng thầu</option>
            <option value="lost">Thua thầu</option>
          </select>
        </FormField>
        <FormField label="Gom giá TB">
          <select
            className="form-input"
            value={groupBy}
            onChange={e => {
              const next = e.target.value as 'quarter' | 'year';
              setGroupBy(next);
              if (next === 'year') {
                setQuarter('');
                if (year === '') setYear(THIS_YEAR);
              } else if (year === '') {
                setYear(THIS_YEAR);
              }
              setPage(1);
            }}
          >
            <option value="quarter">Theo quý</option>
            <option value="year">Theo năm</option>
          </select>
        </FormField>
        {groupBy === 'quarter' ? (
          <FormField label="Quý">
            <select
              className="form-input"
              value={quarter}
              onChange={e => {
                setQuarter(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
            >
              <option value="">Tất cả quý</option>
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Quý {q}</option>
              ))}
            </select>
          </FormField>
        ) : (
          <FormField label="Năm">
            <select
              className="form-input"
              value={year}
              onChange={e => {
                setYear(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
            >
              <option value="">Tất cả (5 năm)</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      {averages.data && averages.data.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {averages.data.map(a => (
            <span key={a.period} className="badge">
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
              <th className="table-header-cell">Lead-time</th>
              <th className="table-header-cell">Điều khoản TT</th>
              <th className="table-header-cell">Trạng thái</th>
              <th className="table-header-cell"> </th>
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
                  <td className="table-cell">{row.validUntil ? formatDateCell(row.validUntil) : '—'}</td>
                  <td className="table-cell">{row.leadTimeDays != null ? `${row.leadTimeDays} ngày` : '—'}</td>
                  <td className="table-cell">{row.paymentTerm || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${rfqStatusBadge(row.status)}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {canUpdate && row.status === 'active' ? (
                      <>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void mark(row, 'won')}>Thắng</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void mark(row, 'lost')}>Thua</button>
                      </>
                    ) : null}
                    {canUpdate ? (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>Sửa</button>
                    ) : null}
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
        size="md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <FormField label="Đơn giá chào" required error={formErrors.unitPrice}>
            <CurrencyInput value={form.unitPrice} onChange={unitPrice => {
              setForm(f => ({ ...f, unitPrice }));
              setFormErrors(prev => ({ ...prev, unitPrice: undefined }));
            }} />
          </FormField>
          <FormField label="Hạn giữ giá">
            <input className="form-input" type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
          </FormField>
          <FormField label="Lead-time (ngày)">
            <input className="form-input" type="number" min={0} value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} />
          </FormField>
          <FormField label="Điều khoản TT">
            <input className="form-input" value={form.paymentTerm} onChange={e => setForm(f => ({ ...f, paymentTerm: e.target.value }))} />
          </FormField>
          <FormField label="Trạng thái">
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Còn hiệu lực</option>
              <option value="won">Thắng thầu</option>
              <option value="lost">Thua thầu</option>
            </select>
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
}
