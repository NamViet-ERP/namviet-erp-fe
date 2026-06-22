import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Eye, Check, Download, Send, Trash2 } from 'lucide-react';
import type { Export } from '../../types';
import type { WarehouseProjectInventoryApiDto } from '../../types/wms';
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
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { fmtStockQty } from '../../lib/wms/stockQtyFormat';
import {
  useExports,
  useCreateExport,
  useApproveExport,
  useSubmitExport,
} from '../../hooks/useExports';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateExportDto } from '../../services/exportsService';

interface FormItem {
  materialCode: string;
  qty: string;
}

const emptyItem: FormItem = { materialCode: '', qty: '' };

function exportStatusHint(status: Export['status']) {
  if (status === 'draft') return 'Nháp — ghi dự kiến xuất dự án';
  if (status === 'pending') return 'Chờ thủ kho duyệt';
  if (status === 'approved') return 'Đã trừ tồn thực tế dự án';
  return '';
}

function inventoryRow(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
) {
  return inventory.find(r => r.materialCode === materialCode);
}

function availableExportQty(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
  items: FormItem[],
  lineIdx: number,
) {
  const row = inventoryRow(inventory, materialCode);
  if (!row) return 0;
  const base = row.actualInventoryQty - row.plannedExportQty;
  const usedInForm = items.reduce((sum, it, i) => {
    if (i === lineIdx || it.materialCode !== materialCode) return sum;
    return sum + (Number(it.qty) || 0);
  }, 0);
  return Math.max(0, base - usedInForm);
}

export default function ExportListPageApi() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Export | null>(null);

  const [projectCode, setProjectCode] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);

  const { data: exports = [], isLoading, isError, error } = useExports();
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateExport();
  const approveMutation = useApproveExport();
  const submitMutation = useSubmitExport();

  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const codes = new Set(
      projectInventory
        .filter(r => r.actualInventoryQty - r.plannedExportQty > 0)
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode));
  }, [materials, projectInventory, projectCode]);

  useEffect(() => {
    const fromState = (location.state as { projectCode?: string } | null)?.projectCode;
    if (fromState) {
      setProjectCode(fromState);
      setShowCreate(true);
    }
  }, [location.state]);

  const tabs = [
    { id: 'all', label: 'Tất cả', count: exports.length },
    { id: 'draft', label: 'Nháp', count: exports.filter(e => e.status === 'draft').length },
    { id: 'pending', label: 'Chờ duyệt', count: exports.filter(e => e.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: exports.filter(e => e.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = exports;
    if (activeTab !== 'all') list = list.filter(e => e.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        e =>
          e.voucherCode.toLowerCase().includes(q) ||
          (e.projectName ?? e.warehouseName).toLowerCase().includes(q) ||
          (e.project ?? '').toLowerCase().includes(q) ||
          e.soCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [exports, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const projectLabel = (exp: Export) =>
    exp.projectName || exp.warehouseName || exp.project || '—';

  const materialUnit = (code: string) => {
    const inv = inventoryRow(projectInventory, code);
    if (inv?.unit) return inv.unit;
    return materials.find(m => m.materialCode === code)?.unit ?? '—';
  };

  const resetForm = () => {
    setProjectCode('');
    setReferenceCode('');
    setNote('');
    setItems([{ ...emptyItem }]);
  };

  const addMaterialLine = () => {
    setItems(prev => [...prev, { ...emptyItem, qty: '1' }]);
  };

  const buildDto = (status: 'draft' | 'pending'): CreateExportDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    if (!projectCode.trim()) {
      showToast('error', 'Vui lòng chọn kho dự án xuất vật tư.');
      return null;
    }
    if (validItems.length === 0) {
      showToast('error', 'Vui lòng thêm ít nhất 1 dòng vật tư.');
      return null;
    }

    const overflow = validItems.some((it, idx) => {
      const max = availableExportQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    if (overflow) {
      showToast('error', 'Số lượng xuất vượt tồn khả dụng tại kho dự án.');
      return null;
    }

    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      const inv = inventoryRow(projectInventory, it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? inv?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: inv?.unit ?? mat?.unit ?? '',
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      soCode: referenceCode.trim(),
      customer: '',
      warehouseId: '',
      items: mappedItems,
      status,
      createdBy: 'USER',
      note,
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
          ? `Phiếu nháp ${created.voucherCode} — đã ghi dự kiến xuất.`
          : `Phiếu ${created.voucherCode} đã chốt, chờ thủ kho duyệt.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu xuất'));
    }
  };

  const handleSubmit = async (exp: Export) => {
    try {
      await submitMutation.mutateAsync(exp.id);
      showToast('success', `Đã chốt phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (exp: Export) => {
    try {
      await approveMutation.mutateAsync(exp.id);
      showToast('success', `Thủ kho đã duyệt phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Xuất kho"
        subtitle="Tiêu hao vật tư tại kho dự án — trừ tồn thực tế sau khi thủ kho duyệt."
        actions={
          <>
            <button type="button" className="hrm-header-btn"><Download size={14} /> Xuất Excel</button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => { resetForm(); setShowCreate(true); }}
            >
              <Plus size={16} /> Tạo phiếu xuất
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
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, kho dự án..." />
          </div>
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
                <th className="table-header-cell">Kho dự án</th>
                <th className="table-header-cell">Mã tham chiếu</th>
                <th className="table-header-cell text-center">Trạng thái</th>
                <th className="table-header-cell text-center w-16">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={5} />
              ) : isError ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadExports)} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={WMS_EMPTY.noExports} />
                  </td>
                </tr>
              ) : (
                paginated.map(exp => (
                  <tr
                    key={exp.id}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => { setSelected(exp); setShowDetail(true); }}
                  >
                    <td className="table-cell font-mono text-sm font-semibold text-[var(--md-primary)]">
                      {exp.voucherCode}
                    </td>
                    <td className="table-cell max-w-[220px]">
                      <span className="line-clamp-1" title={projectLabel(exp)}>
                        {projectLabel(exp)}
                      </span>
                    </td>
                    <td className="table-cell">{exp.soCode || '—'}</td>
                    <td className="table-cell text-center">
                      <Badge status={exp.status} />
                    </td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <Dropdown
                        items={[
                          { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelected(exp); setShowDetail(true); } },
                          ...(exp.status === 'draft'
                            ? [{ label: 'Chốt phiếu', icon: Send, onClick: () => handleSubmit(exp) }]
                            : []),
                          ...(exp.status === 'draft' || exp.status === 'pending'
                            ? [{ label: 'Thủ kho duyệt', icon: Check, onClick: () => handleApprove(exp) }]
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
            itemLabel="phiếu xuất"
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
        title="Tạo phiếu xuất kho dự án"
        size="full"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
            <button type="button" className="btn btn-outline" disabled={createMutation.isPending} onClick={() => handleCreate('draft')}>
              Lưu nháp
            </button>
            <button type="button" className="btn btn-filled" disabled={createMutation.isPending} onClick={() => handleCreate('pending')}>
              Chốt phiếu
            </button>
          </>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          <FormField label="Kho dự án xuất vật tư" required>
            <select
              className="form-select"
              value={projectCode}
              onChange={e => {
                setProjectCode(e.target.value);
                setItems([{ ...emptyItem }]);
              }}
            >
              <option value="">— Chọn kho dự án —</option>
              {projects.map(p => (
                <option key={p.projectCode} value={p.projectCode}>
                  {p.projectCode} — {p.projectName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Mã tham chiếu / lý do xuất">
            <input className="form-input" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
          </FormField>
          <FormField label="Ghi chú">
            <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
              <button
                type="button"
                className="btn btn-outline btn-sm text-xs"
                onClick={addMaterialLine}
                disabled={!projectCode}
              >
                <Plus size={12} /> Thêm vật tư
              </button>
            </div>
            {!projectCode ? (
              <p className="text-[11px] text-[var(--md-on-surface-variant)]">Chọn kho dự án trước khi thêm vật tư.</p>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <table className="form-table import-items-table import-items-table--export text-xs">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Vật tư</th>
                      <th className="table-header-cell text-right">SL</th>
                      <th className="table-header-cell text-center">ĐVT</th>
                      <th className="table-header-cell text-right" title="Tồn thực tế − dự kiến xuất">Tồn TT</th>
                      <th className="table-header-cell text-center" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const maxQty = it.materialCode
                        ? availableExportQty(projectInventory, it.materialCode, items, idx)
                        : undefined;
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
                              materials={stockMaterials}
                              placeholder="— Vật tư —"
                            />
                          </td>
                          <td className="table-cell text-right">
                            <QtyStepper
                              value={it.qty}
                              max={maxQty}
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
                          <td className="table-cell text-right tabular-nums font-semibold">
                            {it.materialCode ? fmtStockQty(maxQty ?? 0) : '—'}
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
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected?.voucherCode ?? 'Chi tiết phiếu xuất'}
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
            <div><strong>Kho dự án:</strong> {projectLabel(selected)}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong>Trạng thái:</strong> <Badge status={selected.status} />
              <span className="text-[var(--md-on-surface-variant)]">{exportStatusHint(selected.status)}</span>
            </div>
            <div><strong>Mã tham chiếu:</strong> {selected.soCode || '—'}</div>
            <div><strong>Ghi chú:</strong> {selected.note || '—'}</div>
            <div className="overflow-x-auto wms-inventory-table-wrap">
              <table className="wms-inventory-table text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell text-left">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.sku || it.productId} — {it.name}</td>
                      <td className="table-cell text-right tabular-nums">{it.qty}</td>
                      <td className="table-cell text-center">{it.unit || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
