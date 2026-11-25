import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { showToast } from '../../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { useCategoryTree } from '../../../hooks/useCategories';
import { useMaterials } from '../../../hooks/useMaterials';
import { useProjects } from '../../../hooks/useProjects';
import {
  useCreatePurchaseRfqQuote,
  usePurchaseRfqAverages,
  usePurchaseRfqQuotes,
  usePurchaseRfqWinRates,
  useUpdatePurchaseRfqQuote,
} from '../../../hooks/usePurchaseRfq';
import { useSuppliers } from '../../../hooks/useSuppliers';
import { rootCategoryIdOf } from '../../../components/purchasing/MaterialByGroupFields';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { downloadCsv } from '../../../lib/csvExport';
import type { DropdownItem } from '../../../types';
import type { PurchaseRfqQuoteApiDto, UpsertPurchaseRfqQuoteRequest } from '../../../types/api/purchasingApi';

export const RFQ_THIS_YEAR = new Date().getFullYear();
export const RFQ_YEARS = Array.from({ length: 5 }, (_, i) => RFQ_THIS_YEAR - i);

export const RFQ_STATUS_LABEL: Record<string, string> = {
  active: 'Còn hiệu lực',
  won: 'Thắng thầu',
  lost: 'Thua thầu',
  expired: 'Hết hạn',
};

export function rfqStatusBadge(status: string) {
  if (status === 'won') return 'badge-success';
  if (status === 'active') return 'badge-warning';
  if (status === 'lost' || status === 'expired') return 'badge-error';
  return 'badge-neutral';
}

export type RfqForm = {
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

export type RfqFormErrorField =
  | 'categoryId'
  | 'materialCode'
  | 'supplierName'
  | 'quoteDate'
  | 'unitPrice'
  | 'validUntil';

export type RfqFormErrors = Partial<Record<RfqFormErrorField, string>>;

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

export function useRfqQuotesController({
  canWrite,
  presetMaterialCode = '',
}: {
  canWrite: boolean;
  presetMaterialCode?: string;
}) {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>(RFQ_THIS_YEAR);
  const [quarter, setQuarter] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  const [groupBy, setGroupBy] = useState<'quarter' | 'year'>('quarter');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [editing, setEditing] = useState<PurchaseRfqQuoteApiDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<RfqForm>(emptyForm);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [formErrors, setFormErrors] = useState<RfqFormErrors>({});

  const params = useMemo(
    () => ({
      page,
      pageSize,
      supplierId: supplierId === '' ? undefined : supplierId,
      year:
        groupBy === 'year'
          ? year === '' ? undefined : year
          : year === '' ? RFQ_THIS_YEAR : year,
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
  const items = useMemo(() => list.data?.items ?? [], [list.data?.items]);
  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);
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

  const openCreate = useCallback(() => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm());
    setCategoryId('');
    setFormErrors({});
  }, []);

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
    const nextErrors: RfqFormErrors = {};
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
    const actions: DropdownItem[] = [];
    const closed = row.status === 'won' || row.status === 'lost';
    if (row.status === 'active') {
      actions.push(
        { label: 'Thắng thầu', icon: Check, onClick: () => void mark(row, 'won') },
        { label: 'Thua thầu', icon: X, danger: true, onClick: () => void mark(row, 'lost') },
        { divider: true },
      );
    }
    if (!closed) {
      actions.push({ label: 'Sửa báo giá', icon: Pencil, onClick: () => openEdit(row) });
    }
    return actions;
  };

  const exportCsv = useCallback(() => {
    const header = ['Ngày báo giá', 'Mã hàng', 'Tên hàng', 'Nhà cung cấp', 'Đơn giá', 'Hạn giữ giá', 'Thời gian giao hàng', 'Điều khoản thanh toán', 'Trạng thái'];
    const rows = items.map(row => [
      row.quoteDate,
      row.materialCode,
      row.materialName,
      row.supplierName,
      String(row.unitPrice),
      row.validUntil ?? '',
      row.leadTimeDays != null ? String(row.leadTimeDays) : '',
      row.paymentTerm ?? '',
      RFQ_STATUS_LABEL[row.status] ?? row.status,
    ]);
    void downloadCsv('BaoGia_RFQ.csv', header, rows);
  }, [items]);

  const patchForm = (patch: Partial<RfqForm>) => setForm(f => ({ ...f, ...patch }));
  const clearError = (field: RfqFormErrorField) => setFormErrors(prev => ({ ...prev, [field]: undefined }));

  return {
    supplierId,
    setSupplierId,
    year,
    setYear,
    quarter,
    setQuarter,
    status,
    setStatus,
    groupBy,
    setGroupBy,
    page,
    setPage,
    pageSize,
    setPageSize,
    editing,
    creating,
    form,
    patchForm,
    categoryId,
    setCategoryId,
    formErrors,
    clearError,
    list,
    averages,
    items,
    rootCategories,
    materials,
    suppliers,
    projects,
    supplierOptions,
    winRateChips,
    busy,
    openCreate,
    closeModal,
    save,
    rowActions,
    exportCsv,
  };
}
