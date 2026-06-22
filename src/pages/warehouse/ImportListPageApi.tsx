import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Eye, Check, Download, Send, Trash2 } from 'lucide-react';
import type { Import } from '../../types';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import QtyStepper from '../../components/ui/QtyStepper';
import SupplierAutocomplete from '../../components/ui/SupplierAutocomplete';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseCurrencyInput } from '../../utils/currencyInput';
import {
  useImports,
  useCreateImport,
  useApproveImport,
  useSubmitImport,
} from '../../hooks/useImports';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects } from '../../hooks/useProjects';
import { useSuppliers } from '../../hooks/useSuppliers';
import { findSupplierByName } from '../../services/suppliersService';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateImportDto } from '../../services/importsService';

interface FormItem {
  materialCode: string;
  qty: string;
  unitPrice: string;
}

const emptyItem: FormItem = {
  materialCode: '',
  qty: '',
  unitPrice: '',
};

function importStatusHint(status: Import['status']) {
  if (status === 'draft') return 'Nháp — ghi dự kiến nhập dự án';
  if (status === 'pending') return 'Chờ thủ kho duyệt';
  if (status === 'approved') return 'Đã cộng tồn thực tế dự án';
  return '';
}

function lineTotal(it: FormItem) {
  const qty = Number(it.qty) || 0;
  const price = parseCurrencyInput(it.unitPrice);
  return qty * price;
}

export default function ImportListPageApi() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Import | null>(null);

  const [defaultSupplier, setDefaultSupplier] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);

  const { data: imports = [], isLoading, isError, error } = useImports();
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const createMutation = useCreateImport();
  const approveMutation = useApproveImport();
  const submitMutation = useSubmitImport();

  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];
  const suppliers = suppliersPage?.items ?? [];

  useEffect(() => {
    const fromState = (location.state as { projectCode?: string } | null)?.projectCode;
    if (fromState) {
      setProjectCode(fromState);
      setShowCreate(true);
    }
  }, [location.state]);

  const tabs = [
    { id: 'all', label: 'Tất cả', count: imports.length },
    { id: 'draft', label: 'Nháp', count: imports.filter(i => i.status === 'draft').length },
    { id: 'pending', label: 'Chờ duyệt', count: imports.filter(i => i.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: imports.filter(i => i.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = imports;
    if (activeTab !== 'all') list = list.filter(i => i.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        i =>
          i.voucherCode.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q) ||
          i.referenceCode.toLowerCase().includes(q) ||
          (i.project ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [imports, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formGrandTotal = useMemo(
    () => items.reduce((sum, it) => sum + lineTotal(it), 0),
    [items],
  );

  const projectName = (code?: string) =>
    projects.find(p => p.projectCode === code)?.projectName ?? code ?? '—';

  const materialUnit = (code: string) =>
    materials.find(m => m.materialCode === code)?.unit ?? '—';

  const resetForm = () => {
    setDefaultSupplier('');
    setReferenceCode('');
    setProjectCode('');
    setNote('');
    setItems([{ ...emptyItem }]);
  };

  const addMaterialLine = () => {
    setItems(prev => [...prev, { ...emptyItem, qty: '1' }]);
  };

  const buildDto = (status: 'draft' | 'pending'): CreateImportDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    if (!projectCode.trim()) {
      showToast('error', 'Vui lòng chọn kho dự án nhận vật tư.');
      return null;
    }
    if (!referenceCode.trim() || validItems.length === 0) {
      showToast('error', 'Vui lòng điền mã tham chiếu / PO và ít nhất 1 dòng vật tư.');
      return null;
    }
    if (!findSupplierByName(suppliers, defaultSupplier)) {
      showToast('error', 'Vui lòng chọn NCC từ danh mục (Thiết lập → Danh mục NCC).');
      return null;
    }

    const supplierMatch = findSupplierByName(suppliers, defaultSupplier.trim());
    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: mat?.unit ?? '',
        unitPrice: parseCurrencyInput(it.unitPrice),
        supplier: defaultSupplier.trim(),
        supplierId: supplierMatch?.id,
      };
    });

    const totalValue = mappedItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      supplier: defaultSupplier.trim(),
      referenceCode: referenceCode.trim(),
      totalValue,
      status,
      warehouseApproval: 'pending',
      approvedBy: '',
      warehouseKeeper: '',
      items: mappedItems,
      createdBy: 'USER',
      note,
      warehouseId: '',
      isDirectProcurement: false,
      project: projectCode.trim(),
    };
  };

  const handleCreate = async (status: 'draft' | 'pending') => {
    const dto = buildDto(status);
    if (!dto) return;
    try {
      const created = await createMutation.mutateAsync(dto);
      showToast(
        'success',
        status === 'draft'
          ? `Phiếu nháp ${created.voucherCode} — đã ghi dự kiến nhập dự án.`
          : `Phiếu ${created.voucherCode} đã chốt, chờ thủ kho duyệt.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập'));
    }
  };

  const handleSubmit = async (imp: Import) => {
    try {
      await submitMutation.mutateAsync(imp.id);
      showToast('success', `Đã chốt phiếu ${imp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (imp: Import) => {
    try {
      await approveMutation.mutateAsync(imp.id);
      showToast('success', `Thủ kho đã duyệt phiếu ${imp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Nhập kho"
        subtitle="Nhập vật tư từ NCC vào kho dự án — chọn NCC, thêm vật tư và đơn giá."
        actions={
          <>
            <button type="button" className="hrm-header-btn"><Download size={14} /> Xuất Excel</button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => { resetForm(); setShowCreate(true); }}
            >
              <Plus size={16} /> Tạo phiếu nhập
            </button>
          </>
        }
      />

      <HrmPanel noPadding>
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, NCC, kho dự án..." />
          </div>
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
                <th className="table-header-cell">Kho dự án</th>
                <th className="table-header-cell">NCC</th>
                <th className="table-header-cell">Mã tham chiếu</th>
                <th className="table-header-cell text-right">Tổng GT</th>
                <th className="table-header-cell text-center">Trạng thái</th>
                <th className="table-header-cell text-center w-16">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={7} />
              ) : isError ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadImports)} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message={WMS_EMPTY.noImports} />
                  </td>
                </tr>
              ) : (
                paginated.map(imp => (
                  <tr
                    key={imp.id}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => { setSelected(imp); setShowDetail(true); }}
                  >
                    <td className="table-cell font-mono text-sm font-semibold text-[var(--md-primary)]">
                      {imp.voucherCode}
                    </td>
                    <td className="table-cell max-w-[200px]">
                      <span className="line-clamp-1" title={projectName(imp.project)}>
                        {imp.project ? projectName(imp.project) : '—'}
                      </span>
                    </td>
                    <td className="table-cell">{imp.supplier}</td>
                    <td className="table-cell">{imp.referenceCode}</td>
                    <td className="table-cell text-right tabular-nums">{formatCurrency(imp.totalValue)}</td>
                    <td className="table-cell text-center">
                      <Badge status={imp.status} />
                    </td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <Dropdown
                        items={[
                          { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelected(imp); setShowDetail(true); } },
                          ...(imp.status === 'draft'
                            ? [{ label: 'Chốt phiếu', icon: Send, onClick: () => handleSubmit(imp) }]
                            : []),
                          ...(imp.status === 'draft' || imp.status === 'pending'
                            ? [{ label: 'Thủ kho duyệt', icon: Check, onClick: () => handleApprove(imp) }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="phiếu nhập"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={filtered.length}
          />
        )}
      </HrmPanel>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo phiếu nhập kho dự án"
        size="full"
        footer={
          <div className="flex w-full items-center justify-between gap-4 flex-wrap">
            <div className="text-sm">
              <span className="text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
              <span className="font-bold text-[var(--md-primary)] tabular-nums">{formatCurrency(formGrandTotal)} đ</span>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
              <button type="button" className="btn btn-outline" disabled={createMutation.isPending} onClick={() => handleCreate('draft')}>
                Lưu nháp
              </button>
              <button type="button" className="btn btn-filled" disabled={createMutation.isPending} onClick={() => handleCreate('pending')}>
                Chốt phiếu
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          <FormField label="Kho dự án nhận vật tư" required>
            <select className="form-select" value={projectCode} onChange={e => setProjectCode(e.target.value)}>
              <option value="">— Chọn kho dự án —</option>
              {projects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nhà cung cấp (NCC)" required>
              <SupplierAutocomplete
                value={defaultSupplier}
                onChange={setDefaultSupplier}
                suppliers={suppliers}
                placeholder="Chọn NCC từ danh mục…"
              />
              <p className="mt-1 text-[11px] text-[var(--md-on-surface-variant)] text-pretty">
                Bắt buộc chọn từ danh mục. Áp dụng cho toàn bộ phiếu nhập.
              </p>
            </FormField>
            <FormField label="Mã tham chiếu / PO" required>
              <input className="form-input" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Ghi chú">
            <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
              <button type="button" className="btn btn-outline btn-sm text-xs" onClick={addMaterialLine}>
                <Plus size={12} /> Thêm vật tư
              </button>
            </div>
            <div className="overflow-x-auto table-scroll">
              <table className="form-table import-items-table import-items-table--import text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                    <th className="table-header-cell text-right">Đơn giá</th>
                    <th className="table-header-cell text-right">Thành tiền</th>
                    <th className="table-header-cell text-center" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const total = lineTotal(it);
                    return (
                      <tr key={idx} className="table-row">
                        <td className="table-cell">
                          <MaterialAutocomplete
                            compact
                            value={it.materialCode}
                            onChange={code => {
                              const next = [...items];
                              next[idx] = { ...next[idx], materialCode: code };
                              setItems(next);
                            }}
                            materials={materials}
                            placeholder="— Vật tư —"
                          />
                        </td>
                        <td className="table-cell text-right">
                          <QtyStepper
                            value={it.qty}
                            onChange={qtyVal => {
                              const next = [...items];
                              next[idx] = { ...next[idx], qty: qtyVal };
                              setItems(next);
                            }}
                          />
                        </td>
                        <td className="table-cell text-center text-[var(--md-on-surface-variant)]">
                          {it.materialCode ? materialUnit(it.materialCode) : '—'}
                        </td>
                        <td className="table-cell text-right">
                          <CurrencyInput
                            value={it.unitPrice}
                            onChange={(_raw, numeric) => {
                              const next = [...items];
                              next[idx] = { ...next[idx], unitPrice: numeric > 0 ? String(numeric) : '' };
                              setItems(next);
                            }}
                          />
                        </td>
                        <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-on-surface)]">
                          {total > 0 ? formatCurrency(total) : '—'}
                        </td>
                        <td className="table-cell text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100"
                              aria-label="Xóa dòng"
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--md-outline-variant)]">
                    <td colSpan={4} className="table-cell text-right font-bold text-[var(--md-on-surface-variant)] py-2">
                      Tổng cộng
                    </td>
                    <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)] py-2">
                      {formatCurrency(formGrandTotal)} đ
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected?.voucherCode ?? 'Chi tiết phiếu nhập'}
        size="md"
        footer={
          <div className="flex flex-wrap gap-2 justify-end w-full">
            {selected?.status === 'draft' && (
              <button type="button" className="btn btn-outline" disabled={submitMutation.isPending} onClick={() => selected && handleSubmit(selected)}>
                Chốt phiếu
              </button>
            )}
            {(selected?.status === 'draft' || selected?.status === 'pending') && (
              <button type="button" className="btn btn-filled" disabled={approveMutation.isPending} onClick={() => selected && handleApprove(selected)}>
                Thủ kho duyệt
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-3 text-xs">
            <div><strong>Kho dự án:</strong> {selected.project ? projectName(selected.project) : '—'}</div>
            <div><strong>NCC:</strong> {selected.supplier}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong>Trạng thái:</strong> <Badge status={selected.status} />
              <span className="text-[var(--md-on-surface-variant)]">{importStatusHint(selected.status)}</span>
            </div>
            <div><strong>Ghi chú:</strong> {selected.note || '—'}</div>
            <div className="overflow-x-auto wms-inventory-table-wrap">
              <table className="wms-inventory-table text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell text-left">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                    <th className="table-header-cell text-right">Đơn giá</th>
                    <th className="table-header-cell text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.sku || it.productId} — {it.name}</td>
                      <td className="table-cell text-right tabular-nums">{it.qty}</td>
                      <td className="table-cell text-center">{it.unit || '—'}</td>
                      <td className="table-cell text-right tabular-nums">{formatCurrency(it.unitPrice)}</td>
                      <td className="table-cell text-right tabular-nums font-semibold">{formatCurrency(it.qty * it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--md-outline-variant)]">
                    <td colSpan={4} className="table-cell text-right font-bold py-2">Tổng cộng</td>
                    <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)] py-2">
                      {formatCurrency(selected.totalValue)} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
