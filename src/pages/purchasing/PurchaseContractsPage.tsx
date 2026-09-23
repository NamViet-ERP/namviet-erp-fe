import { useMemo, useRef, useState } from 'react';
import { Download, FileText, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CurrencyInput from '../../components/ui/CurrencyInput';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import SupplierAutocomplete from '../../components/ui/SupplierAutocomplete';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useCreatePurchaseContract,
  useDeletePurchaseContract,
  useImportPurchaseContractsFromPo,
  usePurchaseContract,
  usePurchaseContracts,
  useUpdatePurchaseContract,
  useUploadPurchaseContractFile,
} from '../../hooks/usePurchaseContracts';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { useSuppliers } from '../../hooks/useSuppliers';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import PoAutocomplete from '../../components/purchasing/PoAutocomplete';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { findSupplierByName } from '../../services/suppliersService';
import { purchaseContractsService } from '../../services/purchaseContractsService';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PurchaseContractApiDto } from '../../types/api/purchasingApi';

const COL_COUNT = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Hiệu lực' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function statusTone(status: string): 'ok' | 'warn' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'active':
      return 'ok';
    case 'draft':
      return 'warn';
    case 'expired':
    case 'void':
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'active':
      return 'Hiệu lực';
    case 'expired':
      return 'Hết hạn';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

type ContractFormState = {
  contractNo: string;
  title: string;
  poCode: string;
  projectCode: string;
  supplierName: string;
  status: string;
  signedDate: string;
  effectiveFrom: string;
  effectiveTo: string;
  amount: string;
  note: string;
};

function emptyForm(): ContractFormState {
  return {
    contractNo: '',
    title: '',
    poCode: '',
    projectCode: '',
    supplierName: '',
    status: 'draft',
    signedDate: '',
    effectiveFrom: '',
    effectiveTo: '',
    amount: '',
    note: '',
  };
}

function fromRow(row: PurchaseContractApiDto): ContractFormState {
  return {
    contractNo: row.contractNo ?? '',
    title: row.title ?? '',
    poCode: row.poCode ?? '',
    projectCode: row.projectCode ?? '',
    supplierName: row.supplierName ?? '',
    status: row.status || 'draft',
    signedDate: row.signedDate ? String(row.signedDate).slice(0, 10) : '',
    effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : '',
    effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : '',
    amount: row.amount != null && row.amount > 0 ? String(row.amount) : '',
    note: row.note ?? '',
  };
}

export default function PurchaseContractsPage() {
  const { has } = usePermission();
  const canCreate = has('purchasing.contracts.create');
  const canUpdate = has('purchasing.contracts.update');
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const { data: ordersPage } = usePurchaseOrders({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];
  const suppliers = suppliersPage?.items ?? [];
  const orders = ordersPage?.items ?? [];

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContractFormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectableOrders = useMemo(() => {
    const hasSup = Boolean(form.supplierName?.trim());
    const hasProj = Boolean(form.projectCode?.trim());
    if (!hasSup && !hasProj) return orders;

    const sup = form.supplierName.trim().toLowerCase();
    const proj = form.projectCode.trim().toLowerCase();

    return [...orders].sort((a, b) => {
      const matchA_both = hasSup && hasProj && a.supplierName?.trim().toLowerCase() === sup && a.projectCode?.trim().toLowerCase() === proj;
      const matchB_both = hasSup && hasProj && b.supplierName?.trim().toLowerCase() === sup && b.projectCode?.trim().toLowerCase() === proj;
      if (matchA_both && !matchB_both) return -1;
      if (!matchA_both && matchB_both) return 1;

      const matchA_sup = hasSup && a.supplierName?.trim().toLowerCase() === sup;
      const matchB_sup = hasSup && b.supplierName?.trim().toLowerCase() === sup;
      if (matchA_sup && !matchB_sup) return -1;
      if (!matchA_sup && matchB_sup) return 1;

      const matchA_proj = hasProj && a.projectCode?.trim().toLowerCase() === proj;
      const matchB_proj = hasProj && b.projectCode?.trim().toLowerCase() === proj;
      if (matchA_proj && !matchB_proj) return -1;
      if (!matchA_proj && matchB_proj) return 1;

      return 0;
    });
  }, [orders, form.supplierName, form.projectCode]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode.trim() || undefined,
      status: status || undefined,
    }),
    [page, pageSize, search, projectCode, status],
  );

  const { data, isLoading, isError, error } = usePurchaseContracts(listParams);
  const detailQuery = usePurchaseContract(selectedId ?? undefined);
  const createMutation = useCreatePurchaseContract();
  const updateMutation = useUpdatePurchaseContract();
  const uploadMutation = useUploadPurchaseContractFile();
  const deleteMutation = useDeletePurchaseContract();
  const importMutation = useImportPurchaseContractsFromPo();

  const items = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const busy =
    createMutation.isPending
    || updateMutation.isPending
    || uploadMutation.isPending
    || deleteMutation.isPending
    || importMutation.isPending;

  const openCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setForm(emptyForm());
  };

  const openEdit = (row: PurchaseContractApiDto) => {
    setCreating(false);
    setSelectedId(row.id);
    setForm(fromRow(row));
  };

  const closeModal = () => {
    if (busy) return;
    setCreating(false);
    setSelectedId(null);
    setForm(emptyForm());
  };

  const buildBody = () => {
    const matched = findSupplierByName(suppliers, form.supplierName);
    const amountNum = Number(String(form.amount).replace(/[^\d.-]/g, ''));
    return {
      contractNo: form.contractNo.trim(),
      title: form.title.trim(),
      poCode: form.poCode.trim() || null,
      projectCode: form.projectCode.trim() || null,
      supplierId: matched?.id ?? null,
      status: form.status || 'draft',
      signedDate: form.signedDate || null,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
      amount: Number.isFinite(amountNum) && amountNum > 0 ? amountNum : null,
      note: form.note.trim() || null,
    };
  };

  const onSave = async () => {
    if (!form.contractNo.trim() || !form.title.trim()) {
      showToast('warning', 'Nhập số hợp đồng và tiêu đề.');
      return;
    }
    try {
      if (creating) {
        const created = await createMutation.mutateAsync(buildBody());
        showToast('success', `Đã tạo ${created.code}.`);
        setCreating(false);
        setSelectedId(created.id);
        setForm(fromRow(created));
      } else if (selectedId) {
        const updated = await updateMutation.mutateAsync({ id: selectedId, body: buildBody() });
        showToast('success', `Đã cập nhật ${updated.code}.`);
        setForm(fromRow(updated));
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được hợp đồng.'));
    }
  };

  const onUpload = async (file: File) => {
    if (!selectedId) return;
    try {
      const updated = await uploadMutation.mutateAsync({ id: selectedId, file });
      showToast('success', 'Đã tải file hợp đồng.');
      setForm(fromRow(updated));
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    }
  };

  const onDownload = async (row: PurchaseContractApiDto) => {
    if (!row.hasFile || !row.fileName) return;
    try {
      await purchaseContractsService.download(row.id, row.fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được tệp.'));
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast('success', 'Đã xóa hợp đồng.');
      if (selectedId === deleteId) closeModal();
      setDeleteId(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được hợp đồng.'));
    }
  };

  const modalOpen = creating || Boolean(selectedId);
  const modalTitle = creating
    ? 'Tạo hợp đồng'
    : detailQuery.data
      ? `Hợp đồng ${detailQuery.data.code}`
      : 'Chi tiết hợp đồng';

  return (
    <>
      <PurchasingListLayout
        title="Hợp đồng"
        subtitle="Quản lý hợp đồng mua hàng độc lập - gắn PO / NCC / dự án"
        search={search}
        onSearchChange={value => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Tìm số HĐ, tiêu đề, PO, NCC…"
        actions={(
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={busy}
                onClick={() => {
                  void importMutation
                    .mutateAsync()
                    .then(r => {
                      showToast(
                        'success',
                        `Đã nhập ${r.imported} HĐ từ PO (bỏ qua ${r.skipped} đã có).`,
                      );
                    })
                    .catch(err => {
                      showToast('error', getApiErrorMessage(err, 'Không nhập được từ PO.'));
                    });
                }}
              >
                <RefreshCw size={14} aria-hidden />
                {importMutation.isPending ? 'Đang nhập…' : 'Nhập từ đính kèm PO'}
              </button>
            ) : null}
            {canCreate ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} aria-hidden />
                Tạo hợp đồng
              </button>
            ) : null}
          </div>
        )}
        filters={(
          <>
            <ProjectAutocomplete
              value={projectCode}
              onChange={code => {
                setProjectCode(code);
                setPage(1);
              }}
              projects={projects}
              placeholder="Lọc dự án"
              compact
            />
            <select
              className="form-input"
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc trạng thái"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        )}
      >
        {isError ? (
          <EmptyState message={getApiErrorMessage(error, 'Không tải được danh sách hợp đồng.')} />
        ) : (
          <>
            <div className="overflow-x-auto table-scroll wms-inventory-table-wrap pur-contracts-table">
              <table className="wms-inventory-table">
                <thead>
                  <tr>
                    <th className="table-header-cell pur-contracts-col-code">Mã</th>
                    <th className="table-header-cell pur-contracts-col-no">Số HĐ</th>
                    <th className="table-header-cell">Tiêu đề</th>
                    <th className="table-header-cell">NCC</th>
                    <th className="table-header-cell pur-contracts-col-po">PO / Dự án</th>
                    <th className="table-header-cell pur-contracts-col-date">Hiệu lực từ</th>
                    <th className="table-header-cell pur-contracts-col-date">Hiệu lực đến</th>
                    <th className="table-header-cell text-right">Giá trị</th>
                    <th className="table-header-cell">Trạng thái</th>
                    <th className="table-header-cell text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeletonRows rows={8} colSpan={COL_COUNT} />
                  ) : items.length === 0 ? (
                    <tr className="table-row">
                      <td className="table-cell" colSpan={COL_COUNT}>
                        <EmptyState icon={FileText} message="Chưa có hợp đồng." />
                      </td>
                    </tr>
                  ) : (
                    items.map(row => (
                      <tr
                        key={row.id}
                        className="table-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openEdit(row)}
                      >
                        <td className="table-cell pur-contracts-col-code">
                          <EntityCodeLink code={row.code} onClick={() => openEdit(row)} />
                        </td>
                        <td className="table-cell font-semibold pur-contracts-col-no">{row.contractNo}</td>
                        <td className="table-cell">{row.title}</td>
                        <td className="table-cell">{row.supplierName || '—'}</td>
                        <td className="table-cell pur-contracts-col-po">
                          {row.poCode ? (
                            <EntityCodeLink
                              code={row.poCode}
                              to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                            />
                          ) : (
                            <span className="entity-code">—</span>
                          )}
                          <div className="text-xs text-[var(--md-on-surface-variant)] font-mono">
                            {row.projectCode || '—'}
                          </div>
                        </td>
                        <td className="table-cell tabular-nums pur-contracts-col-date">
                          {formatDateCell(row.effectiveFrom ?? undefined)}
                        </td>
                        <td className="table-cell tabular-nums pur-contracts-col-date">
                          {formatDateCell(row.effectiveTo ?? undefined)}
                        </td>
                        <td className="table-cell text-right tabular-nums">
                          {row.amount != null ? formatCurrency(row.amount) : '—'}
                        </td>
                        <td className="table-cell">
                          <div className="pur-contract-status">
                            <span className={`pur-erp__pill pur-erp__pill--${statusTone(row.status)}`}>
                              {statusLabel(row.status)}
                            </span>
                            {row.hasFile ? (
                              <span className="pur-erp__pill pur-erp__pill--info">
                                Có file
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                          {row.hasFile ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title={`Tải ${row.fileName || 'file đính kèm'}`}
                              aria-label={`Tải ${row.fileName || 'file đính kèm'}`}
                              onClick={() => {
                                void onDownload(row);
                              }}
                            >
                              <Download size={14} aria-hidden />
                            </button>
                          ) : (
                            <span className="text-[var(--md-on-surface-variant)] text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalItems > 0 && !isLoading ? (
              <Pagination
                embedded
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={size => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            ) : null}
          </>
        )}
      </PurchasingListLayout>

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle} size="lg">
        {!creating && detailQuery.isLoading ? (
          <EmptyState message="Đang tải…" />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Số hợp đồng *">
                <input
                  className="form-input"
                  value={form.contractNo}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={e => setForm(prev => ({ ...prev, contractNo: e.target.value }))}
                />
              </FormField>
              <FormField label="Trạng thái">
                <select
                  className="form-input"
                  value={form.status}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.filter(o => o.value).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tiêu đề *" className="md:col-span-2">
                <input
                  className="form-input"
                  value={form.title}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </FormField>
              <FormField label="NCC">
                <SupplierAutocomplete
                  value={form.supplierName}
                  suppliers={suppliers}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={v => setForm(prev => ({ ...prev, supplierName: v }))}
                />
              </FormField>
              <FormField label="Dự án">
                <ProjectAutocomplete
                  value={form.projectCode}
                  projects={projects}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={code => setForm(prev => ({ ...prev, projectCode: code }))}
                />
              </FormField>
              <FormField label="Mã PO">
                <PoAutocomplete
                  value={form.poCode}
                  orders={selectableOrders}
                  disabled={busy || (!canCreate && !canUpdate)}
                  placeholder="Chọn đơn hàng PO (tùy chọn)…"
                  allowClear
                  onChange={code => {
                    if (!code) {
                      setForm(prev => ({
                        ...prev,
                        poCode: '',
                      }));
                      return;
                    }
                    const selectedPo = orders.find(o => o.code === code);
                    if (selectedPo) {
                      setForm(prev => ({
                        ...prev,
                        poCode: code,
                        supplierName: selectedPo.supplierName || prev.supplierName,
                        projectCode: selectedPo.projectCode || prev.projectCode,
                        amount: selectedPo.totalAmount ? String(selectedPo.totalAmount) : prev.amount,
                      }));
                    }
                  }}
                />
              </FormField>
              <FormField label="Giá trị">
                <CurrencyInput
                  suffix="VNĐ"
                  disabled={busy || (!canCreate && !canUpdate)}
                  value={form.amount}
                  onChange={(_raw, numeric) =>
                    setForm(prev => ({ ...prev, amount: numeric > 0 ? String(numeric) : '' }))
                  }
                />
              </FormField>
              <FormField label="Ngày ký">
                <HrmDatePicker
                  value={form.signedDate}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={signedDate => setForm(prev => ({ ...prev, signedDate }))}
                />
              </FormField>
              <FormField label="Hiệu lực từ">
                <HrmDatePicker
                  value={form.effectiveFrom}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={effectiveFrom => setForm(prev => ({ ...prev, effectiveFrom }))}
                />
              </FormField>
              <FormField label="Hiệu lực đến">
                <HrmDatePicker
                  value={form.effectiveTo}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={effectiveTo => setForm(prev => ({ ...prev, effectiveTo }))}
                />
              </FormField>
              <FormField label="Ghi chú" className="md:col-span-2">
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.note}
                  disabled={busy || (!canCreate && !canUpdate)}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </FormField>
            </div>

            {!creating && selectedId ? (
              <div className="border-t border-[var(--md-outline-variant)] pt-3 space-y-2">
                <div className="text-sm text-[var(--md-on-surface-variant)]">
                  File:{' '}
                  <strong>
                    {detailQuery.data?.fileName
                      || (form && detailQuery.data?.hasFile ? 'Đã có file' : 'Chưa có')}
                  </strong>
                  {detailQuery.data?.uploadedAt
                    ? ` · ${formatDateTimeVi(detailQuery.data.uploadedAt) ?? ''}`
                    : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canUpdate ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busy}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={14} aria-hidden />
                        Tải file lên
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.rtf,.xls,.xlsx,.xlsm,.xlsb,.csv,.ppt,.pptx,.txt"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) void onUpload(file);
                        }}
                      />
                    </>
                  ) : null}
                  {detailQuery.data?.hasFile && detailQuery.data.fileName ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => {
                        void onDownload(detailQuery.data!);
                      }}
                    >
                      <Download size={14} aria-hidden />
                      Tải xuống
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {(canCreate || canUpdate) ? (
              <div className="flex items-center justify-between gap-2 border-t border-[var(--md-outline-variant)] pt-3">
                <div>
                  {!creating && selectedId && canUpdate ? (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={busy}
                      onClick={() => setDeleteId(selectedId)}
                    >
                      <Trash2 size={14} aria-hidden />
                      Xóa hợp đồng
                    </button>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={closeModal}>
                    Đóng
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => { void onSave(); }}>
                    {busy ? 'Đang lưu…' : creating ? 'Tạo' : 'Lưu'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { void onConfirmDelete(); }}
        title="Xóa hợp đồng"
        message={
          <span>
            Bạn có chắc chắn muốn xóa hợp đồng{' '}
            <strong>
              {detailQuery.data?.contractNo
                ? `${detailQuery.data.contractNo} (${detailQuery.data.code})`
                : form.contractNo
                  ? `${form.contractNo}`
                  : detailQuery.data?.code || 'này'}
            </strong>
            ? Thao tác này không thể hoàn tác.
          </span>
        }
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
