import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Lock, Unlock } from 'lucide-react';
import { stocktakes as initialStocktakes } from '../../data/stocktakes';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { generateCode } from '../../utils/generateCode';
import { validateFreeze } from '../../utils/validators';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';

const emptyForm = { warehouseId: '', note: '', items: [{ productId: '', systemQty: '', actualQty: '' }] };

export default function StocktakeListPage() {
  const [data, setData] = useState(initialStocktakes);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const errs = {};
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

  const handleSubmit = () => {
    if (!validate()) return;
    const wh = warehouses.find(w => w.id === form.warehouseId);
    const newItem = {
      id: `st-${Date.now()}`, voucherCode: generateCode('KK'),
      date: new Date().toLocaleDateString('vi-VN'),
      createdBy: 'Admin', status: 'pending',
      warehouseId: form.warehouseId, warehouseName: wh?.name?.toUpperCase() || '',
      condition: 'counting', isFrozen: true, note: form.note,
      items: form.items.filter(it => it.productId).map(it => {
        const prod = products.find(p => p.id === it.productId);
        const sys = Number(it.systemQty);
        const act = Number(it.actualQty);
        return { productId: it.productId, sku: prod?.sku, name: prod?.name, systemQty: sys, actualQty: act, diff: act - sys };
      }),
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu kiểm kê ${newItem.voucherCode} đã được tạo. SKU đã đóng băng!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item) => {
    setData(data.map(s => s.id === item.id ? { ...s, status: 'approved', condition: 'completed', isFrozen: false } : s));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}. SKU đã mở băng.`);
  };

  const handleToggleFreeze = (item) => {
    const newFrozen = !item.isFrozen;
    setData(data.map(s => s.id === item.id ? { ...s, isFrozen: newFrozen } : s));
    showToast(newFrozen ? 'warning' : 'success',
      newFrozen ? `SKU phiếu ${item.voucherCode} đã đóng băng. Không thể nhập/xuất.`
        : `SKU phiếu ${item.voucherCode} đã mở băng.`
    );
  };

  const handleCancel = (item) => {
    if (item.status === 'approved') { showToast('error', 'Không thể hủy phiếu đã duyệt'); return; }
    setData(data.map(s => s.id === item.id ? { ...s, status: 'cancelled', isFrozen: false } : s));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}. SKU đã mở băng.`);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', systemQty: '', actualQty: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items }); };

  const getActions = (item) => {
    const a = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">KIỂM KÊ KHO</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-20 text-xs py-1.5" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button className="btn btn-outline text-xs py-1.5">XUẤT RA</button>
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
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
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
                    <td className="table-cell text-gray-500 max-w-[180px] truncate">{st.note || '—'}</td>
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
            <select className={`form-select ${errors.warehouseId ? 'border-red-400' : ''}`}
              value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">-- Chọn kho --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.branch})</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Kiểm kê cuối tháng..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-navy-900">Danh sách SKU kiểm kê</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
          <p className="text-xs text-amber-700">⚠️ Khi tạo phiếu kiểm kê, các SKU sẽ tự động <b>đóng băng</b>. Không thể nhập/xuất/giữ hàng cho đến khi phiếu được duyệt hoặc mở băng.</p>
        </div>
        {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
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
              const diff = it.productId && it.systemQty !== '' && it.actualQty !== '' ? Number(it.actualQty) - Number(it.systemQty) : null;
              return (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-sm" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`sysqty_${i}`] ? 'border-red-400' : ''}`}
                      value={it.systemQty} onChange={e => updateItem(i, 'systemQty', e.target.value)} placeholder="0" />
                    {errors[`sysqty_${i}`] && <p className="text-red-500 text-[10px]">{errors[`sysqty_${i}`]}</p>}
                  </td>
                  <td className="table-cell">
                    <input type="number" min="0" className={`form-input text-sm text-right ${errors[`actqty_${i}`] ? 'border-red-400' : ''}`}
                      value={it.actualQty} onChange={e => updateItem(i, 'actualQty', e.target.value)} placeholder="0" />
                    {errors[`actqty_${i}`] && <p className="text-red-500 text-[10px]">{errors[`actqty_${i}`]}</p>}
                  </td>
                  <td className={`table-cell text-right font-bold text-sm ${diff === null ? '' : diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {diff === null ? '—' : diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && <button className="p-1 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}>✕</button>}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl">
              <div><span className="text-xs text-gray-400">Mã chứng từ</span><p className="font-semibold text-brand-orange">{selectedItem.voucherCode}</p></div>
              <div><span className="text-xs text-gray-400">Ngày</span><p className="font-medium text-sm">{selectedItem.date}</p></div>
              <div><span className="text-xs text-gray-400">Kho</span><p className="font-medium text-sm">{selectedItem.warehouseName}</p></div>
              <div><span className="text-xs text-gray-400">Trạng thái</span><div className="mt-0.5"><Badge status={selectedItem.status} /></div></div>
              <div><span className="text-xs text-gray-400">Tình trạng</span><div className="mt-0.5"><Badge status={selectedItem.condition} /></div></div>
              <div><span className="text-xs text-gray-400">Đóng băng</span>
                <p className={`text-sm font-medium ${selectedItem.isFrozen ? 'text-red-600' : 'text-emerald-600'}`}>
                  {selectedItem.isFrozen ? '🔒 Đang đóng băng' : '🔓 Đã mở băng'}
                </p>
              </div>
              {selectedItem.note && <div className="col-span-2"><span className="text-xs text-gray-400">Ghi chú</span><p className="text-sm">{selectedItem.note}</p></div>}
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
                      <td className={`table-cell text-right font-bold ${it.diff > 0 ? 'text-emerald-600' : it.diff < 0 ? 'text-red-600' : ''}`}>
                        {it.diff > 0 ? `+${it.diff}` : it.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-center text-gray-400 py-8">Không có mặt hàng nào</p>}
          </>
        )}
      </Modal>
    </div>
  );
}
