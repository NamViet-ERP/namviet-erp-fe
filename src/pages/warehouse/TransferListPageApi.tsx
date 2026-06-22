import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Eye, Check, Download, Send, Trash2 } from 'lucide-react';
import type { Transfer } from '../../types';
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
  useTransfers,
  useCreateTransfer,
  useApproveTransfer,
  useSubmitTransfer,
} from '../../hooks/useTransfers';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateTransferDto } from '../../services/transfersService';

type TransferMode = 'return' | 'cross-project';

interface FormItem {
  materialCode: string;
  qty: string;
  constructionPhase: string;
}

const emptyItem: FormItem = { materialCode: '', qty: '', constructionPhase: '' };

function transferStatusHint(status: Transfer['status'], isCrossProject: boolean) {
  if (status === 'draft') return 'Nháp — giữ tồn khả dụng dự án';
  if (status === 'pending') return 'Chờ thủ kho duyệt';
  if (status === 'approved') return isCrossProject ? 'Đã chuyển sang kho dự án đích' : 'Đã hoàn về kho tổng';
  return '';
}

function destinationLabel(tf: Transfer) {
  if (tf.toProjectName) return tf.toProjectName;
  if (tf.toProject) return tf.toProject;
  return tf.toWarehouseName || 'Kho tổng';
}

function isCrossProjectTransfer(tf: Transfer) {
  return Boolean(tf.toProject);
}

function inventoryRow(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
) {
  return inventory.find(r => r.materialCode === materialCode);
}

function availableReturnQty(
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

export default function TransferListPageApi() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const [projectCode, setProjectCode] = useState('');
  const [toProjectCode, setToProjectCode] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('return');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);

  const { data: transfers = [], isLoading, isError, error } = useTransfers();
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateTransfer();
  const approveMutation = useApproveTransfer();
  const submitMutation = useSubmitTransfer();

  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];

  const targetProjects = useMemo(
    () => projects.filter(p => p.projectCode !== projectCode),
    [projects, projectCode],
  );

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
    { id: 'all', label: 'Tất cả', count: transfers.length },
    { id: 'draft', label: 'Nháp', count: transfers.filter(t => t.status === 'draft').length },
    { id: 'pending', label: 'Chờ duyệt', count: transfers.filter(t => t.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: transfers.filter(t => t.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = transfers;
    if (activeTab !== 'all') list = list.filter(t => t.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.voucherCode.toLowerCase().includes(q) ||
          (t.projectName ?? t.fromWarehouseName).toLowerCase().includes(q) ||
          (t.project ?? '').toLowerCase().includes(q) ||
          (t.toProjectName ?? t.toProject ?? '').toLowerCase().includes(q) ||
          t.toWarehouseName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transfers, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const projectLabel = (tf: Transfer) =>
    tf.projectName || tf.fromWarehouseName || tf.project || '—';

  const materialUnit = (code: string) => {
    const inv = inventoryRow(projectInventory, code);
    if (inv?.unit) return inv.unit;
    return materials.find(m => m.materialCode === code)?.unit ?? '—';
  };

  const resetForm = () => {
    setProjectCode('');
    setToProjectCode('');
    setTransferMode('return');
    setNote('');
    setItems([{ ...emptyItem }]);
  };

  const addMaterialLine = () => {
    setItems(prev => [...prev, { ...emptyItem, qty: '1' }]);
  };

  const buildDto = (status: 'draft' | 'pending'): CreateTransferDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    if (!projectCode.trim()) {
      showToast('error', 'Vui lòng chọn kho dự án nguồn.');
      return null;
    }
    if (transferMode === 'cross-project' && !toProjectCode.trim()) {
      showToast('error', 'Vui lòng chọn kho dự án đích.');
      return null;
    }
    if (validItems.length === 0) {
      showToast('error', 'Vui lòng thêm ít nhất 1 dòng vật tư.');
      return null;
    }

    const overflow = validItems.some((it, idx) => {
      const max = availableReturnQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    if (overflow) {
      showToast('error', 'Số lượng chuyển vượt tồn khả dụng tại kho dự án nguồn.');
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
        constructionPhase: it.constructionPhase.trim() || undefined,
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      fromWarehouseId: '',
      toWarehouseId: '',
      items: mappedItems,
      status,
      createdBy: 'USER',
      note,
      project: projectCode.trim(),
      toProject: transferMode === 'cross-project' ? toProjectCode.trim() : undefined,
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
          ? `Phiếu nháp ${created.voucherCode} — đã giữ tồn khả dụng.`
          : `Phiếu ${created.voucherCode} đã chốt, chờ thủ kho duyệt.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu chuyển kho'));
    }
  };

  const handleSubmit = async (tf: Transfer) => {
    try {
      await submitMutation.mutateAsync(tf.id);
      showToast('success', `Đã chốt phiếu ${tf.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (tf: Transfer) => {
    try {
      await approveMutation.mutateAsync(tf.id);
      showToast('success', `Thủ kho đã duyệt phiếu ${tf.voucherCode}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Chuyển kho"
        subtitle="Hoàn trả về kho tổng hoặc chuyển vật tư giữa các kho dự án — sau khi thủ kho duyệt."
        actions={
          <>
            <button type="button" className="hrm-header-btn"><Download size={14} /> Xuất Excel</button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => { resetForm(); setShowCreate(true); }}
            >
              <Plus size={16} /> Tạo phiếu chuyển
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
                <th className="table-header-cell">Từ kho dự án</th>
                <th className="table-header-cell">Đích</th>
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
                    <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadTransfers)} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={WMS_EMPTY.noTransfers} />
                  </td>
                </tr>
              ) : (
                paginated.map(tf => (
                  <tr
                    key={tf.id}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => { setSelected(tf); setShowDetail(true); }}
                  >
                    <td className="table-cell font-mono text-sm font-semibold text-[var(--md-primary)]">
                      {tf.voucherCode}
                    </td>
                    <td className="table-cell max-w-[220px]">
                      <span className="line-clamp-1" title={projectLabel(tf)}>
                        {projectLabel(tf)}
                      </span>
                    </td>
                    <td className="table-cell">{destinationLabel(tf)}</td>
                    <td className="table-cell text-center">
                      <Badge status={tf.status} />
                    </td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <Dropdown
                        items={[
                          { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelected(tf); setShowDetail(true); } },
                          ...(tf.status === 'draft'
                            ? [{ label: 'Chốt phiếu', icon: Send, onClick: () => handleSubmit(tf) }]
                            : []),
                          ...(tf.status === 'draft' || tf.status === 'pending'
                            ? [{ label: 'Thủ kho duyệt', icon: Check, onClick: () => handleApprove(tf) }]
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
            itemLabel="phiếu chuyển"
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
        title="Tạo phiếu chuyển kho dự án"
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${transferMode === 'return' ? 'btn-filled' : 'btn-outline'}`}
              onClick={() => { setTransferMode('return'); setToProjectCode(''); }}
            >
              Hoàn trả kho tổng
            </button>
            <button
              type="button"
              className={`btn btn-sm ${transferMode === 'cross-project' ? 'btn-filled' : 'btn-outline'}`}
              onClick={() => setTransferMode('cross-project')}
            >
              Chuyển sang kho dự án khác
            </button>
          </div>
          <FormField label="Kho dự án nguồn" required>
            <select
              className="form-select"
              value={projectCode}
              onChange={e => {
                setProjectCode(e.target.value);
                if (e.target.value === toProjectCode) setToProjectCode('');
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
          {transferMode === 'return' ? (
            <FormField label="Đích">
              <input className="form-input bg-[var(--md-surface-variant)]" value="Kho tổng" readOnly disabled />
            </FormField>
          ) : (
            <FormField label="Kho dự án đích" required>
              <select
                className="form-select"
                value={toProjectCode}
                onChange={e => setToProjectCode(e.target.value)}
                disabled={!projectCode}
              >
                <option value="">— Chọn kho dự án đích —</option>
                {targetProjects.map(p => (
                  <option key={p.projectCode} value={p.projectCode}>
                    {p.projectCode} — {p.projectName}
                  </option>
                ))}
              </select>
            </FormField>
          )}
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
                <table className="form-table import-items-table import-items-table--transfer text-xs">
                  <thead>
                    <tr>
                      <th className="table-header-cell">Vật tư</th>
                      <th className="table-header-cell text-right">SL</th>
                      <th className="table-header-cell text-center">ĐVT</th>
                      <th className="table-header-cell text-right" title="Tồn thực tế − dự kiến xuất/chuyển">Tồn TT</th>
                      <th className="table-header-cell">Công đoạn (tùy chọn)</th>
                      <th className="table-header-cell text-center" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const maxQty = it.materialCode
                        ? availableReturnQty(projectInventory, it.materialCode, items, idx)
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
                          <td className="table-cell">
                            <input
                              className="form-input text-xs"
                              placeholder="VD: Móng, Thân..."
                              value={it.constructionPhase}
                              onChange={e => {
                                const next = [...items];
                                next[idx] = { ...next[idx], constructionPhase: e.target.value };
                                setItems(next);
                              }}
                            />
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
        title={selected?.voucherCode ?? 'Chi tiết phiếu chuyển'}
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
            <div><strong>Từ kho dự án:</strong> {projectLabel(selected)}</div>
            <div><strong>Đích:</strong> {destinationLabel(selected)}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong>Trạng thái:</strong> <Badge status={selected.status} />
              <span className="text-[var(--md-on-surface-variant)]">
                {transferStatusHint(selected.status, isCrossProjectTransfer(selected))}
              </span>
            </div>
            <div><strong>Ghi chú:</strong> {selected.note || '—'}</div>
            <div className="overflow-x-auto wms-inventory-table-wrap">
              <table className="wms-inventory-table text-xs">
                <thead>
                  <tr>
                    <th className="table-header-cell text-left">Vật tư</th>
                    <th className="table-header-cell text-right">SL</th>
                    <th className="table-header-cell text-center">ĐVT</th>
                    <th className="table-header-cell text-left">Công đoạn</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.sku || it.productId} — {it.name}</td>
                      <td className="table-cell text-right tabular-nums">{it.qty}</td>
                      <td className="table-cell text-center">{it.unit || '—'}</td>
                      <td className="table-cell">{String(it.constructionPhase ?? '—')}</td>
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
