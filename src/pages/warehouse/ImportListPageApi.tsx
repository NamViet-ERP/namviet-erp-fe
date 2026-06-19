import { useState } from 'react';
import { Plus, Eye, Check, Download } from 'lucide-react';
import type { Import } from '../../types';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  useImports,
  useCreateImport,
  useApproveImport,
} from '../../hooks/useImports';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects } from '../../hooks/useProjects';
import type { CreateImportDto } from '../../services/importsService';

interface FormItem {
  materialCode: string;
  qty: string;
  unitPrice: string;
}

const emptyItem: FormItem = { materialCode: '', qty: '', unitPrice: '0' };

export default function ImportListPageApi() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Import | null>(null);
  const [saveAsDraft, setSaveAsDraft] = useState(true);

  const [supplier, setSupplier] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [isDirect, setIsDirect] = useState(false);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);

  const { data: imports = [], isLoading } = useImports();
  const { data: warehouses = [] } = useWarehouses();
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100 });
  const createMutation = useCreateImport();
  const approveMutation = useApproveImport();

  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];

  const tabs = [
    { id: 'all', label: 'Tất cả', count: imports.length },
    { id: 'draft', label: 'Nháp (giữ kho)', count: imports.filter(i => i.status === 'draft').length },
    { id: 'pending', label: 'Chờ duyệt', count: imports.filter(i => i.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: imports.filter(i => i.status === 'approved').length },
  ];

  let filtered = imports;
  if (activeTab !== 'all') filtered = filtered.filter(i => i.status === activeTab);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      i =>
        i.voucherCode.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q) ||
        i.referenceCode.toLowerCase().includes(q),
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setSupplier('');
    setReferenceCode('');
    setWarehouseId(warehouses[0]?.id ?? '');
    setProjectCode('');
    setIsDirect(false);
    setNote('');
    setItems([{ ...emptyItem }]);
    setSaveAsDraft(true);
  };

  const handleCreate = async () => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    if (!supplier.trim() || !referenceCode.trim() || validItems.length === 0) {
      showToast('error', 'Vui lòng điền NCC, mã tham chiếu và ít nhất 1 dòng vật tư.');
      return;
    }
    if (!isDirect && !warehouseId) {
      showToast('error', 'Vui lòng chọn kho nhập.');
      return;
    }
    if (isDirect && !projectCode) {
      showToast('error', 'Vui lòng chọn dự án thụ hưởng.');
      return;
    }

    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: mat?.unit ?? '',
        unitPrice: Number(it.unitPrice) || 0,
      };
    });

    const totalValue = mappedItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const dto: CreateImportDto = {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      supplier: supplier.trim(),
      referenceCode: referenceCode.trim(),
      totalValue,
      status: saveAsDraft ? 'draft' : 'pending',
      warehouseApproval: 'pending',
      approvedBy: '',
      warehouseKeeper: '',
      items: mappedItems,
      createdBy: 'USER',
      note,
      warehouseId: isDirect ? '' : warehouseId,
      isDirectProcurement: isDirect,
      project: isDirect ? projectCode : undefined,
    };

    try {
      const created = await createMutation.mutateAsync(dto);
      showToast(
        'success',
        saveAsDraft
          ? `Phiếu nháp ${created.voucherCode} — đã giữ kho (reservation).`
          : `Phiếu ${created.voucherCode} đã tạo.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập'));
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
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Kho hàng"
        title="Nhập kho"
        actions={
          <>
            <button type="button" className="btn btn-outline text-xs"><Download size={14} /> Xuất Excel</button>
            <button type="button" className="btn btn-filled" onClick={() => { resetForm(); setShowCreate(true); }}>
              <Plus size={16} /> Tạo mới
            </button>
          </>
        }
      />

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)' }}>
        <div className="px-4 pt-4">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="px-4 pb-3 flex items-center justify-between page-filter-bar">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm mã chứng từ, NCC..." />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm">Đang tải...</div>
        ) : paginated.length === 0 ? (
          <EmptyState message="Không tìm thấy phiếu nhập kho nào!" />
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                  <th className="table-header-cell">Mã chứng từ</th>
                  <th className="table-header-cell">NCC</th>
                  <th className="table-header-cell">Mã tham chiếu</th>
                  <th className="table-header-cell text-right">Tổng GT</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(imp => (
                  <tr
                    key={imp.id}
                    className="table-row hover:bg-[var(--tint-primary-weak)] cursor-pointer"
                    onClick={() => { setSelected(imp); setShowDetail(true); }}
                  >
                    <td className="table-cell font-bold text-[var(--md-primary)]">{imp.voucherCode}</td>
                    <td className="table-cell">{imp.supplier}</td>
                    <td className="table-cell">{imp.referenceCode}</td>
                    <td className="table-cell text-right">{formatCurrency(imp.totalValue)}</td>
                    <td className="table-cell"><Badge status={imp.status} /></td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <Dropdown
                        items={[
                          { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelected(imp); setShowDetail(true); } },
                          ...(imp.status === 'draft' || imp.status === 'pending'
                            ? [{ label: 'Duyệt (thủ kho)', icon: Check, onClick: () => handleApprove(imp) }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 pb-4 mt-2 border-t pt-3" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              totalItems={filtered.length}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tạo phiếu nhập kho"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
            <button type="button" className="btn btn-primary" disabled={createMutation.isPending} onClick={handleCreate}>
              {saveAsDraft ? 'Lưu nháp & giữ kho' : 'Tạo phiếu'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={saveAsDraft} onChange={e => setSaveAsDraft(e.target.checked)} />
            Lưu nháp (Draft) — tạo reservation giữ kho tổng
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDirect} onChange={e => setIsDirect(e.target.checked)} />
            Mua trực tiếp cho dự án (Direct Issue)
          </label>
          <FormField label="Nhà cung cấp" required>
            <input className="form-input" value={supplier} onChange={e => setSupplier(e.target.value)} />
          </FormField>
          <FormField label="Mã tham chiếu / PO" required>
            <input className="form-input" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
          </FormField>
          {!isDirect ? (
            <FormField label="Kho nhập" required>
              <select className="form-select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                <option value="">— Chọn kho —</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField label="Dự án thụ hưởng" required>
              <select className="form-select" value={projectCode} onChange={e => setProjectCode(e.target.value)}>
                <option value="">— Chọn dự án —</option>
                {projects.map(p => (
                  <option key={p.projectCode} value={p.projectCode}>{p.projectName}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Ghi chú">
            <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </FormField>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase text-[var(--md-on-surface-variant)]">Chi tiết vật tư</div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <select
                    className="form-select text-xs"
                    value={it.materialCode}
                    onChange={e => {
                      const next = [...items];
                      next[idx] = { ...next[idx], materialCode: e.target.value };
                      setItems(next);
                    }}
                  >
                    <option value="">— Vật tư —</option>
                    {materials.map(m => (
                      <option key={m.materialCode} value={m.materialCode}>
                        {m.materialCode} — {m.materialName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="form-input text-xs"
                    placeholder="SL"
                    value={it.qty}
                    onChange={e => {
                      const next = [...items];
                      next[idx] = { ...next[idx], qty: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="form-input text-xs"
                    placeholder="ĐG"
                    value={it.unitPrice}
                    onChange={e => {
                      const next = [...items];
                      next[idx] = { ...next[idx], unitPrice: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
                <div className="col-span-3">
                  {items.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm text-xs" onClick={() => setItems([...items, { ...emptyItem }])}>
              + Thêm dòng
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected?.voucherCode ?? 'Chi tiết phiếu nhập'}
        size="md"
        footer={<button type="button" className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>}
      >
        {selected && (
          <div className="space-y-3 text-xs">
            <div><strong>NCC:</strong> {selected.supplier}</div>
            <div><strong>Trạng thái:</strong> <Badge status={selected.status} /></div>
            <div><strong>Ghi chú:</strong> {selected.note || '—'}</div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">VT</th>
                  <th className="text-right">SL</th>
                  <th className="text-right">ĐG</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.sku} — {it.name}</td>
                    <td className="text-right">{it.qty}</td>
                    <td className="text-right">{formatCurrency(it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
