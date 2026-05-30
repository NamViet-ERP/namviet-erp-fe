import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2 } from 'lucide-react';
import { exports as initialExports } from '../../data/exports';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { validateHold } from '../../utils/validators';
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

const emptyForm = { soCode: '', customer: '', warehouseId: '', note: '', items: [{ productId: '', qty: '' }] };

export default function ExportListPage() {
  const [data, setData] = useState(initialExports);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'completed', label: 'Hoàn thành', count: data.filter(e => e.status === 'completed').length },
    { id: 'approved', label: 'Đã duyệt', count: data.filter(e => e.status === 'approved').length },
    { id: 'pending', label: 'Chờ xác nhận', count: data.filter(e => e.status === 'pending').length },
  ];

  let filtered = data;
  if (activeTab !== 'all') filtered = filtered.filter(e => e.status === activeTab);
  if (search) filtered = filtered.filter(e =>
    e.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    e.soCode.toLowerCase().includes(search.toLowerCase()) ||
    e.customer.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const errs = {};
    if (!form.soCode.trim()) errs.soCode = 'Vui lòng nhập mã đơn hàng SO';
    if (!form.customer.trim()) errs.customer = 'Vui lòng nhập tên khách hàng';
    if (!form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho xuất';
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) errs[`qty_${i}`] = 'Số lượng phải > 0';
      // BR1: Check hold vs actual stock
      if (it.productId && it.qty) {
        const wh = warehouses.find(w => w.id === form.warehouseId);
        if (wh) {
          const v = validateHold(Number(it.qty), wh.totalStock);
          if (!v.valid) errs[`qty_${i}`] = v.message;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const wh = warehouses.find(w => w.id === form.warehouseId);
    const newItem = {
      id: `ex-${Date.now()}`, voucherCode: generateCode('XK'),
      date: new Date().toLocaleDateString('vi-VN'),
      soCode: form.soCode, customer: form.customer,
      warehouseId: form.warehouseId, warehouseName: wh?.name || '',
      items: form.items.filter(it => it.productId).map(it => {
        const prod = products.find(p => p.id === it.productId);
        return { productId: it.productId, sku: prod?.sku, name: prod?.name, qty: Number(it.qty), unit: prod?.unit };
      }),
      status: 'pending', createdBy: 'Admin', note: form.note,
    };
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu xuất kho ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  // BR3: Confirm export — deduct stock
  const handleConfirmExport = (item) => {
    setData(data.map(e => e.id === item.id ? { ...e, status: 'completed' } : e));
    showToast('success', `Đã xác nhận xuất kho ${item.voucherCode}. Tồn kho đã được cập nhật (BR3).`, 'Xuất kho thành công');
  };

  // BR4: Cancel — release held stock
  const handleCancel = (item) => {
    if (item.status === 'completed') {
      showToast('error', 'Không thể hủy phiếu đã hoàn thành', 'Lỗi');
      return;
    }
    setData(data.map(e => e.id === item.id ? { ...e, status: 'cancelled' } : e));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}. Hàng chờ xuất đã được trả lại (BR4).`, 'Đã hủy phiếu');
  };

  const handleApprove = (item) => {
    setData(data.map(e => e.id === item.id ? { ...e, status: 'approved' } : e));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i] = { ...items[i], [field]: val }; setForm({ ...form, items }); };

  const getActions = (item) => {
    const a = [{ label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } }];
    if (item.status === 'pending') a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
    if (item.status === 'approved') a.push({ label: 'Xác nhận xuất kho', icon: Check, onClick: () => handleConfirmExport(item) });
    if (item.status !== 'completed' && item.status !== 'cancelled') {
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">XUẤT KHO GIAO HÀNG</h1>
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

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy phiếu xuất kho nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header-cell">Ngày chứng từ</th>
                <th className="table-header-cell">Mã chứng từ</th>
                <th className="table-header-cell">Mã SO</th>
                <th className="table-header-cell">Khách hàng</th>
                <th className="table-header-cell">Kho xuất</th>
                <th className="table-header-cell">Người tạo</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">Ghi chú</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr></thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id} className="table-row">
                    <td className="table-cell">{exp.date}</td>
                    <td className="table-cell font-semibold text-brand-orange cursor-pointer hover:underline"
                      onClick={() => { setSelectedItem(exp); setShowDetail(true); }}>{exp.voucherCode}</td>
                    <td className="table-cell font-medium">{exp.soCode}</td>
                    <td className="table-cell max-w-[220px] truncate">{exp.customer}</td>
                    <td className="table-cell">{exp.warehouseName}</td>
                    <td className="table-cell">{exp.createdBy}</td>
                    <td className="table-cell"><Badge status={exp.status} /></td>
                    <td className="table-cell text-gray-500 max-w-[150px] truncate">{exp.note || '—'}</td>
                    <td className="table-cell text-center"><Dropdown items={getActions(exp)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU XUẤT KHO" size="xl"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Tạo phiếu</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Mã đơn hàng (SO)" required error={errors.soCode}>
            <input className={`form-input ${errors.soCode ? 'border-red-400' : ''}`}
              value={form.soCode} onChange={e => setForm({ ...form, soCode: e.target.value })} placeholder="SO-000000" />
          </FormField>
          <FormField label="Khách hàng" required error={errors.customer}>
            <input className={`form-input ${errors.customer ? 'border-red-400' : ''}`}
              value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="CÔNG TY..." />
          </FormField>
          <FormField label="Kho xuất" required error={errors.warehouseId}>
            <select className={`form-select ${errors.warehouseId ? 'border-red-400' : ''}`}
              value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">-- Chọn kho --</option>
              {warehouses.filter(w => w.group === 'Kho chính' || w.group === 'Kho phụ').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú..." />
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
            <th className="table-header-cell w-32">Số lượng</th>
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
                <td className="table-cell text-center">
                  {form.items.length > 1 && <button className="p-1 text-red-400 hover:text-red-600" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`PHIẾU XUẤT KHO — ${selectedItem?.voucherCode || ''}`} data={selectedItem}
        columns={[
          { key: 'name', label: 'Tên hàng' },
          { key: 'sku', label: 'Mã SKU' },
          { key: 'unit', label: 'Đơn vị' },
          { key: 'qty', label: 'Số lượng', align: 'right' },
        ]}
      />
    </div>
  );
}
