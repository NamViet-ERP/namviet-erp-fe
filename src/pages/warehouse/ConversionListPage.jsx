import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2 } from 'lucide-react';
import { conversions as initialConversions } from '../../data/conversions';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { validateTransferQty } from '../../utils/validators';
import { generateCode } from '../../utils/generateCode';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import DetailModal from '../../components/ui/DetailModal';

const emptyForm = { fromWarehouseId: '', toWarehouseId: '', note: '', items: [{ productId: '', qty: '', reason: '' }] };

export default function ConversionListPage() {
  const [data, setData] = useState(initialConversions);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'approved', label: 'Đã duyệt', count: data.filter(c => c.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: data.filter(c => c.status === 'pending').length },
    { id: 'completed', label: 'Hoàn thành', count: data.filter(c => c.status === 'completed').length },
  ];

  let filtered = data;
  if (activeTab !== 'all') filtered = filtered.filter(c => c.status === activeTab);
  if (search) filtered = filtered.filter(c =>
    c.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    c.fromWarehouseName.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const errs = {};
    if (!form.fromWarehouseId) errs.fromWarehouseId = 'Vui lòng chọn kho nguồn';
    if (!form.toWarehouseId) errs.toWarehouseId = 'Vui lòng chọn kho đích';
    if (form.fromWarehouseId === form.toWarehouseId && form.fromWarehouseId) errs.toWarehouseId = 'Kho đích phải khác kho nguồn';
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) errs[`qty_${i}`] = 'Số lượng phải > 0';
      if (it.productId && !it.reason?.trim()) errs[`reason_${i}`] = 'Vui lòng nhập lý do';
      if (it.productId && it.qty) {
        const srcWh = warehouses.find(w => w.id === form.fromWarehouseId);
        if (srcWh) {
          const v = validateTransferQty(Number(it.qty), srcWh.totalStock);
          if (!v.valid) errs[`qty_${i}`] = v.message;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const fromWh = warehouses.find(w => w.id === form.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === form.toWarehouseId);
    const newItem = {
      id: `cv-${Date.now()}`, voucherCode: generateCode('CDK'),
      date: new Date().toLocaleDateString('vi-VN'),
      fromWarehouseId: form.fromWarehouseId, fromWarehouseName: fromWh?.name || '',
      fromType: fromWh?.group || '', toWarehouseId: form.toWarehouseId,
      toWarehouseName: toWh?.name || '', toType: toWh?.group || '',
      items: form.items.filter(it => it.productId).map(it => {
        const prod = products.find(p => p.id === it.productId);
        return { productId: it.productId, sku: prod?.sku, name: prod?.name, qty: Number(it.qty), unit: prod?.unit, reason: it.reason };
      }),
      status: 'pending', createdBy: 'Admin', note: form.note,
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu chuyển đổi ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item) => {
    setData(data.map(c => c.id === item.id ? { ...c, status: 'approved', approvedBy: 'Admin' } : c));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const handleCancel = (item) => {
    if (item.status === 'completed') { showToast('error', 'Không thể hủy phiếu đã hoàn thành'); return; }
    setData(data.map(c => c.id === item.id ? { ...c, status: 'cancelled' } : c));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}`);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '', reason: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items }); };

  const getActions = (item) => {
    const a = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.status === 'pending') {
      a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">CHUYỂN ĐỔI KHO</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
        <div className="px-4 pb-3 flex items-center justify-end">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy phiếu chuyển đổi kho nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header-cell">Ngày chứng từ</th>
                <th className="table-header-cell">Mã chứng từ</th>
                <th className="table-header-cell">Kho nguồn</th>
                <th className="table-header-cell">Loại nguồn</th>
                <th className="table-header-cell">Kho đích</th>
                <th className="table-header-cell">Loại đích</th>
                <th className="table-header-cell">Người tạo</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">{c.date}</td>
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(c); setShowDetail(true); }}>{c.voucherCode}</td>
                    <td className="table-cell">{c.fromWarehouseName}</td>
                    <td className="table-cell text-gray-500 text-xs">{c.fromType}</td>
                    <td className="table-cell">{c.toWarehouseName}</td>
                    <td className="table-cell text-gray-500 text-xs">{c.toType}</td>
                    <td className="table-cell">{c.createdBy}</td>
                    <td className="table-cell"><Badge status={c.status} /></td>
                    <td className="table-cell text-center"><Dropdown items={getActions(c)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU CHUYỂN ĐỔI KHO" size="xl"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Kho nguồn" required error={errors.fromWarehouseId}>
            <select className={`form-select ${errors.fromWarehouseId ? 'border-red-400' : ''}`}
              value={form.fromWarehouseId} onChange={e => setForm({ ...form, fromWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho nguồn --</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} — {w.group}</option>)}
            </select>
          </FormField>
          <FormField label="Kho đích (chuyển đến)" required error={errors.toWarehouseId}>
            <select className={`form-select ${errors.toWarehouseId ? 'border-red-400' : ''}`}
              value={form.toWarehouseId} onChange={e => setForm({ ...form, toWarehouseId: e.target.value })}>
              <option value="">-- Chọn kho đích --</option>
              {warehouses.filter(w => w.id !== form.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name} — {w.group}</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú" className="md:col-span-2">
            <textarea className="form-input" rows={2} value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Nhập ghi chú..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-navy-900">Danh sách hàng hóa</h4>
          <button className="btn btn-outline text-xs" onClick={addItem}><Plus size={14} /> Thêm dòng</button>
        </div>
        {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
        <table className="w-full">
          <thead><tr>
            <th className="table-header-cell w-12">STT</th>
            <th className="table-header-cell">Sản phẩm</th>
            <th className="table-header-cell w-28">Số lượng</th>
            <th className="table-header-cell">Lý do</th>
            <th className="table-header-cell w-12"></th>
          </tr></thead>
          <tbody>
            {form.items.map((it, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell text-center">{i + 1}</td>
                <td className="table-cell">
                  <select className="form-select text-sm" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                </td>
                <td className="table-cell">
                  <input type="number" min="1" className={`form-input text-sm text-right ${errors[`qty_${i}`] ? 'border-red-400' : ''}`}
                    value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                  {errors[`qty_${i}`] && <p className="text-red-500 text-[10px]">{errors[`qty_${i}`]}</p>}
                </td>
                <td className="table-cell">
                  <input className={`form-input text-sm ${errors[`reason_${i}`] ? 'border-red-400' : ''}`}
                    value={it.reason} onChange={e => updateItem(i, 'reason', e.target.value)} placeholder="Lý do lỗi / chuyển đổi" />
                  {errors[`reason_${i}`] && <p className="text-red-500 text-[10px]">{errors[`reason_${i}`]}</p>}
                </td>
                <td className="table-cell text-center">
                  {form.items.length > 1 && <button className="p-1 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU CHUYỂN ĐỔI KHO — ${selectedItem?.voucherCode || ''}`} data={selectedItem}
        columns={[
          { key: 'name', label: 'Tên hàng' },
          { key: 'sku', label: 'Mã SKU' },
          { key: 'qty', label: 'Số lượng', align: 'right' },
          { key: 'reason', label: 'Lý do' },
        ]}
      />
    </div>
  );
}
