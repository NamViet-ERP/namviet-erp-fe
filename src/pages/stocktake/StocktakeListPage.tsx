import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Lock, Unlock } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { stocktakes as initialStocktakes } from '../../data/stocktakes';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { generateCode } from '../../utils/generateCode';

import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import type { Stocktake, StocktakeItem, DropdownItem } from '../../types';

/** Shape for each row in the create-form item table */
interface FormItem {
  productId: string;
  systemQty: string;
  actualQty: string;
}

/** Shape of the create-phiếu form */
interface StocktakeForm {
  warehouseId: string;
  note: string;
  items: FormItem[];
}

/** Validation error map */
interface FormErrors {
  warehouseId?: string;
  items?: string;
  [key: string]: string | undefined;
}

const emptyForm: StocktakeForm = {
  warehouseId: '',
  note: '',
  items: [{ productId: '', systemQty: '', actualQty: '' }],
};

export default function StocktakeListPage() {
  const [data, setData] = useState<Stocktake[]>(initialStocktakes);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Stocktake | null>(null);
  const [form, setForm] = useState<StocktakeForm>({ ...emptyForm });
  const [errors, setErrors] = useState<FormErrors>({});

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'approved', label: 'Đã Duyệt', count: data.filter(s => s.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: data.filter(s => s.status === 'pending').length },
  ];

  let filtered = data;
  if (activeTab !== 'all') filtered = filtered.filter(s => s.status === activeTab);
  if (search) filtered = filtered.filter(s =>
    s.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    s.createdBy.toLowerCase().includes(search.toLowerCase()) ||
    s.warehouseName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho kiểm kê';
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 SKU kiểm kê';
    form.items.forEach((it, i) => {
      if (it.productId) {
        if (it.systemQty === '' || Number(it.systemQty) < 0) errs[`sysqty_${i}`] = 'Số tồn hệ thống phải ≥ 0';
        if (it.actualQty === '' || Number(it.actualQty) < 0) errs[`actqty_${i}`] = 'Số đếm thực tế phải ≥ 0';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate()) return;
    const wh = warehouses.find(w => w.id === form.warehouseId);
    const newItem: Stocktake = {
      id: `st-${Date.now()}`, voucherCode: generateCode('KK'),
      date: new Date().toLocaleDateString('vi-VN'),
      createdBy: 'Admin', status: 'pending',
      warehouseId: form.warehouseId, warehouseName: wh?.name?.toUpperCase() || '',
      condition: 'counting', isFrozen: true, note: form.note,
      items: form.items.filter(it => it.productId).map((it): StocktakeItem => {
        const prod = products.find(p => p.id === it.productId);
        const sys = Number(it.systemQty);
        const act = Number(it.actualQty);
        return { productId: it.productId, sku: prod?.sku ?? '', name: prod?.name ?? '', systemQty: sys, actualQty: act, diff: act - sys };
      }),
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu kiểm kê ${newItem.voucherCode} đã được tạo. SKU đã đóng băng!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item: Stocktake): void => {
    setData(data.map(s => s.id === item.id ? { ...s, status: 'approved', condition: 'completed', isFrozen: false } : s));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}. SKU đã mở băng.`);
  };

  const handleToggleFreeze = (item: Stocktake): void => {
    const newFrozen = !item.isFrozen;
    setData(data.map(s => s.id === item.id ? { ...s, isFrozen: newFrozen } : s));
    showToast(newFrozen ? 'warning' : 'success',
      newFrozen ? `SKU phiếu ${item.voucherCode} đã đóng băng. Không thể nhập/xuất.`
        : `SKU phiếu ${item.voucherCode} đã mở băng.`
    );
  };

  const handleCancel = (item: Stocktake): void => {
    if (item.status === 'approved') { showToast('error', 'Không thể hủy phiếu đã duyệt'); return; }
    setData(data.map(s => s.id === item.id ? { ...s, status: 'cancelled', isFrozen: false } : s));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}. SKU đã mở băng.`);
  };

  const addItem = (): void => setForm({ ...form, items: [...form.items, { productId: '', systemQty: '', actualQty: '' }] });
  const removeItem = (i: number): void => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof FormItem, val: string): void => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const getActions = (item: Stocktake): DropdownItem[] => {
    const a: DropdownItem[] = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.status === 'pending') {
      a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
      a.push({ label: item.isFrozen ? 'Mở băng SKU' : 'Đóng băng SKU', icon: item.isFrozen ? Unlock : Lock, onClick: () => handleToggleFreeze(item) });
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="KIỂM KÊ"
        title="KIỂM KÊ KHO"
        actions={<>
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-filled" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </>}
      />

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        </div>

        {paginated.length === 0 ? <EmptyState message="Không tìm thấy phiếu kiểm kê nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header-cell">Ngày chứng từ</th>
                <th className="table-header-cell">Mã chứng từ</th>
                <th className="table-header-cell">Người tạo</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">Kho hàng</th>
                <th className="table-header-cell">Tình trạng</th>
                <th className="table-header-cell">Ghi chú</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr></thead>
              <tbody>
                {paginated.map((st) => (
                  <tr key={st.id} className="table-row">
                    <td className="table-cell">{st.date}</td>
                    <td className="table-cell font-semibold text-[var(--md-primary)] cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(st); setShowDetail(true); }}>{st.voucherCode}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                          <span className="text-[9px] text-white font-bold">{st.createdBy.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        </div>
                        <span>{st.createdBy}</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge status={st.status} /></td>
                    <td className="table-cell font-medium">{st.warehouseName}</td>
                    <td className="table-cell"><Badge status={st.condition} /></td>
                    <td className="table-cell text-[var(--md-on-surface-variant)] max-w-[180px] truncate">{st.note || '—'}</td>
                    <td className="table-cell text-center"><Dropdown items={getActions(st)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} totalItems={filtered.length} />
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU KIỂM KÊ" size="xl"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu kiểm kê</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Kho kiểm kê" required error={errors.warehouseId}>
            <select className={`form-select ${errors.warehouseId ? 'border-[var(--md-error)]' : ''}`}
              value={form.warehouseId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">-- Chọn kho --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú">
            <input className="form-input" value={form.note} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, note: e.target.value })} placeholder="Kiểm kê cuối tháng..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold" style={{ color: 'var(--nv-text-primary)' }}>Danh sách SKU kiểm kê</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)', border: '1px solid var(--md-outline-variant)' }}>
          <p className="text-xs">⚠️ Khi tạo phiếu kiểm kê, các SKU sẽ tự động <b>đóng băng</b>. Không thể nhập/xuất/giữ hàng cho đến khi phiếu được duyệt hoặc mở băng.</p>
        </div>
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}
        <table className="w-full">
          <thead><tr>
            <th className="table-header-cell w-12">STT</th>
            <th className="table-header-cell">Sản phẩm</th>
            <th className="table-header-cell w-28">SL hệ thống</th>
            <th className="table-header-cell w-28">SL thực tế</th>
            <th className="table-header-cell w-24 text-right">Chênh lệch</th>
            <th className="table-header-cell w-12"></th>
          </tr></thead>
          <tbody>
            {form.items.map((it, i) => {
              const diff: number | null = it.productId && it.systemQty !== '' && it.actualQty !== '' ? Number(it.actualQty) - Number(it.systemQty) : null;
              return (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-sm" value={it.productId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`sysqty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.systemQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'systemQty', e.target.value)} placeholder="0" />
                    {errors[`sysqty_${i}`] && <p className="text-[var(--md-error)] text-[10px]">{errors[`sysqty_${i}`]}</p>}
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`actqty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.actualQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, 'actualQty', e.target.value)} placeholder="0" />
                    {errors[`actqty_${i}`] && <p className="text-[var(--md-error)] text-[10px]">{errors[`actqty_${i}`]}</p>}
                  </td>
                  <td className={`table-cell text-right font-bold text-sm ${diff === null ? '' : diff > 0 ? 'text-[var(--md-success)]' : diff < 0 ? 'text-[var(--md-error)]' : 'text-[var(--md-on-surface-variant)]'}`}>
                    {diff === null ? '—' : diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && <button className="p-1 text-[var(--md-error)] hover:opacity-80" onClick={() => removeItem(i)}>✕</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU KIỂM KÊ — ${selectedItem?.voucherCode || ''}`} size="xl"
        footer={<button className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>}
      >
        {selectedItem && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--md-surface-container-low)' }}>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Mã chứng từ</span><p className="font-semibold text-[var(--md-primary)]">{selectedItem.voucherCode}</p></div>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Ngày</span><p className="font-medium text-sm">{selectedItem.date}</p></div>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Kho</span><p className="font-medium text-sm">{selectedItem.warehouseName}</p></div>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Trạng thái</span><div className="mt-0.5"><Badge status={selectedItem.status} /></div></div>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Tình trạng</span><div className="mt-0.5"><Badge status={selectedItem.condition} /></div></div>
              <div><span className="text-xs text-[var(--md-on-surface-variant)]">Đóng băng</span>
                <p className={`text-sm font-medium ${selectedItem.isFrozen ? 'text-[var(--md-error)]' : 'text-[var(--md-success)]'}`}>
                  {selectedItem.isFrozen ? '🔒 Đang đóng băng' : '🔓 Đã mở băng'}
                </p>
              </div>
              {selectedItem.note && <div className="col-span-2"><span className="text-xs text-[var(--md-on-surface-variant)]">Ghi chú</span><p className="text-sm">{selectedItem.note}</p></div>}
            </div>
            {selectedItem.items?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-header-cell">Tên hàng</th>
                  <th className="table-header-cell">SKU</th>
                  <th className="table-header-cell text-right">SL Hệ thống</th>
                  <th className="table-header-cell text-right">SL Thực tế</th>
                  <th className="table-header-cell text-right">Chênh lệch</th>
                </tr></thead>
                <tbody>
                  {selectedItem.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.name}</td>
                      <td className="table-cell">{it.sku}</td>
                      <td className="table-cell text-right">{it.systemQty}</td>
                      <td className="table-cell text-right">{it.actualQty}</td>
                      <td className={`table-cell text-right font-bold ${it.diff > 0 ? 'text-[var(--md-success)]' : it.diff < 0 ? 'text-[var(--md-error)]' : ''}`}>
                        {it.diff > 0 ? `+${it.diff}` : it.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-center text-[var(--md-on-surface-variant)] py-8">Không có mặt hàng nào</p>}
          </>
        )}
      </Modal>
    </div>
  );
}
