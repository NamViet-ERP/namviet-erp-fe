import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { exports as initialExports } from '../../data/exports';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { projects, mockProjectBoms } from '../../data/projects';
import { generateCode } from '../../utils/generateCode';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';

interface FormItem {
  productId: string;
  qty: string;
  equipmentComponent: 'xyclo' | 'pano' | 'hộp khói' | 'khác';
}

interface ExportForm {
  projectId: string;
  recipientTeam: string;
  stage: 'Chế tạo' | 'Lắp đặt' | 'Hoàn thiện';
  warehouseId: string;
  note: string;
  items: FormItem[];
}

const emptyForm: ExportForm = {
  projectId: '',
  recipientTeam: '',
  stage: 'Chế tạo',
  warehouseId: '',
  note: '',
  items: [{ productId: '', qty: '', equipmentComponent: 'xyclo' }]
};

// Decorate mock exports with project-specific fields
const decoratedExports = initialExports.map((exp, idx) => {
  const proj = projects[idx % projects.length];
  return {
    ...exp,
    projectId: proj.id,
    projectName: proj.name,
    recipientTeam: idx % 2 === 0 ? 'Tổ lắp máy 1' : 'Tổ chế tạo 2',
    stage: (idx % 2 === 0 ? 'Chế tạo' : 'Lắp đặt') as 'Chế tạo' | 'Lắp đặt' | 'Hoàn thiện',
    // Add default unitPrice for price masking demonstration
    totalValue: exp.items.reduce((sum, it) => {
      const prod = products.find(p => p.sku === it.sku);
      return sum + (it.qty * (prod?.price || 100000));
    }, 0),
    items: exp.items.map(it => ({
      ...it,
      unitPrice: products.find(p => p.sku === it.sku)?.price || 100000,
      equipmentComponent: (idx % 3 === 0 ? 'xyclo' : idx % 3 === 1 ? 'pano' : 'hộp khói') as 'xyclo' | 'pano' | 'hộp khói' | 'khác'
    }))
  };
});

const generateUniqueExportId = () => `ex-${Date.now()}`;
const getLocaleDateString = () => new Date().toLocaleDateString('vi-VN');

export default function ExportListPage() {
  const [data, setData] = useState<any[]>(decoratedExports);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [form, setForm] = useState<ExportForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Active role detection for price hiding
  const activeRole = localStorage.getItem('nv-user-role') || 'admin';
  const isStorekeeper = activeRole === 'storekeeper';

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
    e.projectName.toLowerCase().includes(search.toLowerCase()) ||
    e.recipientTeam.toLowerCase().includes(search.toLowerCase())
  );

  // BOM quota helper
  const getBomQuota = (projId: string, prodId: string): number | null => {
    if (!projId || !prodId) return null;
    const projBOM = mockProjectBoms[projId];
    if (!projBOM) return null;
    return projBOM[prodId] !== undefined ? projBOM[prodId] : 0; // 0 means not in BOM
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.projectId) errs.projectId = 'Vui lòng chọn dự án cấp phát';
    if (!form.recipientTeam.trim()) errs.recipientTeam = 'Vui lòng nhập tổ nhận vật tư';
    if (!form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho xuất';
    
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) {
        errs[`qty_${i}`] = 'Số lượng phải > 0';
      }
      
      // Verify BOM Budget
      if (form.projectId && it.productId && it.qty) {
        const quota = getBomQuota(form.projectId, it.productId);
        if (quota !== null && Number(it.qty) > quota) {
          errs[`qty_${i}`] = `Vượt quá định mức định biên BOM cho phép (Định mức tối đa: ${quota} Cái)`;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const wh = warehouses.find(w => w.id === form.warehouseId);
    const proj = projects.find(p => p.id === form.projectId);
    
    const items = form.items.filter(it => it.productId).map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        sku: prod?.sku ?? '',
        name: prod?.name ?? '',
        qty: Number(it.qty),
        unit: prod?.unit ?? '',
        unitPrice: prod?.price || 0,
        equipmentComponent: it.equipmentComponent
      };
    });

    const totalValue = items.reduce((sum, it) => sum + (it.qty * it.unitPrice), 0);

    const newItem = {
      id: generateUniqueExportId(),
      voucherCode: generateCode('XK'),
      date: getLocaleDateString(),
      projectId: form.projectId,
      projectName: proj?.name || '',
      recipientTeam: form.recipientTeam,
      stage: form.stage,
      warehouseId: form.warehouseId,
      warehouseName: wh?.name || '',
      items,
      totalValue,
      status: 'pending',
      createdBy: activeRole.toUpperCase(),
      note: form.note,
      createdTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu xuất kho ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  const handleConfirmExport = (item: any) => {
    setData(data.map(e => e.id === item.id ? { ...e, status: 'completed' as const } : e));
    showToast('success', `Đã xác nhận thực tế xuất kho ${item.voucherCode}. Tồn kho dự án đã được cập nhật.`, 'Xuất kho thành công');
  };

  const handleCancel = (item: any) => {
    if (item.status === 'completed') {
      showToast('error', 'Không thể hủy phiếu đã hoàn thành', 'Lỗi');
      return;
    }
    setData(data.map(e => e.id === item.id ? { ...e, status: 'cancelled' as const } : e));
    showToast('warning', `Đã hủy phiếu xuất ${item.voucherCode}. Vật tư chờ xuất đã được giải phóng.`, 'Đã hủy phiếu');
  };

  const handleApprove = (item: any) => {
    setData(data.map(e => e.id === item.id ? { ...e, status: 'approved' as const } : e));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '', equipmentComponent: 'xyclo' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof FormItem, val: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const getActions = (item: any) => {
    const a: { label?: string; icon?: LucideIcon; onClick?: () => void; danger?: boolean; divider?: boolean }[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } },
    ];
    if (item.status === 'pending') a.push({ label: 'Duyệt xuất kho', icon: Check, onClick: () => handleApprove(item) });
    if (item.status === 'approved') a.push({ label: 'Xác nhận thực tế xuất', icon: Check, onClick: () => handleConfirmExport(item) });
    if (item.status !== 'completed' && item.status !== 'cancelled') {
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({ label: 'In phiếu', icon: FileText, onClick: () => showToast('info', 'Đang chuẩn bị in...') });
    return a;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="KHO HÀNG"
        title="XUẤT KHO THI CÔNG DỰ ÁN"
        actions={<>
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT BÁO CÁO</button>
          <button className="btn btn-filled" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO PHIẾU XUẤT</button>
        </>}
      />

      {isStorekeeper && (
        <div className="mb-4 bg-[rgba(103,80,164,0.06)] border border-[var(--md-outline-variant)] text-[var(--md-primary)] rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>VAI TRÒ THỦ KHO: Đơn giá và trị giá xuất kho được bảo mật, ẩn hoàn toàn.</span>
        </div>
      )}

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
        <div className="px-4 pb-3 flex items-center justify-end">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm kiếm dự án, mã chứng từ, tổ nhận..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy phiếu xuất kho dự án nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th className="table-header-cell">Ngày xuất</th>
                  <th className="table-header-cell">Mã chứng từ</th>
                  <th className="table-header-cell">Dự án thụ hưởng</th>
                  <th className="table-header-cell">Tổ nhận vật tư</th>
                  <th className="table-header-cell">Giai đoạn</th>
                  <th className="table-header-cell">Kho xuất phát</th>
                  <th className="table-header-cell">Ghi chú/Lý do</th>
                  {!isStorekeeper && <th className="table-header-cell text-right">Tổng giá trị</th>}
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Người tạo</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id} className="table-row cursor-pointer hover:bg-[rgba(103,80,164,0.04)]"
                    onClick={() => { setSelectedItem(exp); setShowDetail(true); }}>
                    <td className="table-cell text-[var(--md-on-surface)]">{exp.date}</td>
                    <td className="table-cell font-bold text-[var(--md-primary)]">{exp.voucherCode}</td>
                    <td className="table-cell font-bold text-[var(--md-on-surface)]">{exp.projectName}</td>
                    <td className="table-cell font-semibold text-[var(--md-on-surface)]">{exp.recipientTeam}</td>
                    <td className="table-cell font-semibold">{exp.stage || 'Chế tạo'}</td>
                    <td className="table-cell text-[var(--md-on-surface)]">{exp.warehouseName}</td>
                    <td className="table-cell max-w-[150px] truncate" title={exp.note || ''}>{exp.note || '—'}</td>
                    {!isStorekeeper && <td className="table-cell text-right font-bold text-[var(--md-primary)]">{formatCurrency(exp.totalValue)}</td>}
                    <td className="table-cell"><Badge status={exp.status} /></td>
                    <td className="table-cell">
                      <div className="font-semibold text-[var(--md-on-surface)]">{exp.createdBy || 'Hệ thống'}</div>
                      <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">{exp.date} {exp.createdTime || '09:30'}</div>
                    </td>
                    <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}><Dropdown items={getActions(exp)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO YÊU CẦU XUẤT KHO VẬT TƯ DỰ ÁN" size="full"
        footer={<>
          <button className="btn btn-outline text-xs" onClick={() => { setShowCreate(false); setErrors({}); }}>HỦY BỎ</button>
          <button className="btn btn-filled text-xs" onClick={handleSubmit}>TẠO PHIẾU XUẤT</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Dự án thụ hưởng" required error={errors.projectId}>
            <select className={`form-select ${errors.projectId ? 'border-[var(--md-error)]' : ''}`}
              value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, items: [{ productId: '', qty: '', equipmentComponent: 'xyclo' }] })}>
              <option value="">-- Chọn dự án thụ hưởng --</option>
              {projects.filter(p => p.stage !== 'Đóng/Hoàn thành').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>
              ))}
            </select>
          </FormField>
          
          <FormField label="Tổ nhận vật tư phụ trách" required error={errors.recipientTeam}>
            <input className={`form-input ${errors.recipientTeam ? 'border-[var(--md-error)]' : ''}`}
              value={form.recipientTeam} onChange={e => setForm({ ...form, recipientTeam: e.target.value })}
              placeholder="VD: Tổ lắp máy 1, Tổ hàn phụ trợ..." />
          </FormField>

          <FormField label="Giai đoạn thi công lắp ráp" required>
            <select className="form-select" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as any })}>
              <option value="Chế tạo">Chế tạo cấu kiện</option>
              <option value="Lắp đặt">Lắp đặt cơ khí / Thiết bị</option>
              <option value="Hoàn thiện">Hoàn thiện hệ thống</option>
            </select>
          </FormField>

          <FormField label="Kho xuất vật tư bãi" required error={errors.warehouseId}>
            <select className={`form-select ${errors.warehouseId ? 'border-[var(--md-error)]' : ''}`}
              value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">-- Chọn kho bãi xuất --</option>
              {warehouses.filter(w => w.group === 'Kho chính' || w.group === 'Kho phụ').map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Ghi chú chi tiết xuất" className="md:col-span-2">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú xuất kho..." />
          </FormField>
        </div>

        {form.projectId && (
          <div className="bg-[rgba(103,80,164,0.04)] border border-[var(--md-outline-variant)] rounded-xl p-3 text-xs mb-4">
            <h5 className="font-bold text-[var(--md-primary)] uppercase mb-1.5 flex items-center gap-1">
              <AlertTriangle size={13} />
              ĐỊNH BIÊN DỰ TOÁN BOM CHO DỰ ÁN ĐÃ CHỌN:
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(mockProjectBoms[form.projectId] || {}).map(([prodId, limit]) => {
                const prod = products.find(p => p.id === prodId);
                return (
                  <div key={prodId} className="flex justify-between bg-[var(--md-surface-container)] px-2.5 py-1.5 rounded border">
                    <span className="font-medium text-[var(--md-on-surface-variant)]">{prod?.name}:</span>
                    <span className="font-bold text-[var(--md-primary)]">{limit} {prod?.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-xs uppercase text-[var(--md-on-surface)]">Danh sách hàng hóa xuất cấp phát</h4>
          <button className="btn btn-outline text-[10px] py-1 px-2" onClick={addItem}><Plus size={12} /> Thêm dòng</button>
        </div>
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}
        
        <div className="overflow-x-auto">
          <table className="form-table text-xs" style={{ minWidth: '950px' }}>
            <thead>
              <tr>
                <th className="table-header-cell w-10">STT</th>
                <th className="table-header-cell">Sản phẩm vật tư</th>
                <th className="table-header-cell w-24">Số lượng xuất</th>
                <th className="table-header-cell w-56">Linh kiện chi định</th>
                <th className="table-header-cell w-8"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell text-center">{i + 1}</td>
                  <td className="table-cell">
                    <select className="form-select text-xs" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-cell">
                    <input type="number" min="1" className={`form-input text-xs text-right ${errors[`qty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                      value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                    {errors[`qty_${i}`] && <p className="text-[var(--md-error)] text-[9px] mt-0.5">{errors[`qty_${i}`]}</p>}
                  </td>
                  <td className="table-cell">
                    <select className="form-select text-xs" value={it.equipmentComponent} onChange={e => updateItem(i, 'equipmentComponent', e.target.value)}>
                      <option value="xyclo">Thiết bị xyclo lọc bụi</option>
                      <option value="pano">Pano tấm che bảo vệ</option>
                      <option value="hộp khói">Hộp thu gom khói thải</option>
                      <option value="khác">Khác / Vật tư rời</option>
                    </select>
                  </td>
                  <td className="table-cell text-center">
                    {form.items.length > 1 && <button className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100" onClick={() => removeItem(i)}><Trash2 size={12} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title={`CHI TIẾT CHỨNG TỪ XUẤT KHO — ${selectedItem.voucherCode}`}
          size="lg"
          footer={<button className="btn btn-outline text-xs" onClick={() => setShowDetail(false)}>ĐÓNG</button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs p-4 rounded-xl" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Mã chứng từ xuất:</span>
                <span className="font-bold text-[var(--md-primary)] text-sm">{selectedItem.voucherCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ngày xuất kho:</span>
                <span className="font-bold">{selectedItem.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Dự án thi công nhận:</span>
                <span className="font-bold text-[var(--md-on-surface)]">{selectedItem.projectName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Tổ đội nhận vật tư:</span>
                <span className="font-bold text-xs">{selectedItem.recipientTeam}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Giai đoạn dự án:</span>
                <span className="font-bold">{selectedItem.stage || 'Chế tạo'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Kho xuất hàng:</span>
                <span className="font-bold">{selectedItem.warehouseName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Người tạo:</span>
                <span className="font-bold block">{selectedItem.createdBy || 'Hệ thống'}</span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] font-semibold">Lúc {selectedItem.createdTime || '09:30'}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ghi chú xuất kho:</span>
                <p className="font-semibold">{selectedItem.note || '—'}</p>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase text-[var(--md-on-surface)] mt-4">Danh sách hàng hóa cấp phát</h4>
            
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                  <th className="py-2 text-left font-semibold">Tên hàng / SKU</th>
                  <th className="py-2 text-center font-semibold w-20">ĐVT</th>
                  <th className="py-2 text-center font-semibold w-24">Linh kiện</th>
                  <th className="py-2 text-right font-semibold w-20">Số lượng xuất</th>
                  {!isStorekeeper && <th className="py-2 text-right font-semibold w-28">Đơn giá</th>}
                  {!isStorekeeper && <th className="py-2 text-right font-semibold w-28">Thành tiền</th>}
                </tr>
              </thead>
              <tbody>
                {selectedItem.items?.map((it: any, i: number) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                    <td className="py-2">
                      <div className="font-bold">{it.name}</div>
                      <div className="text-[10px] font-mono text-[var(--md-on-surface-variant)]">{it.sku}</div>
                    </td>
                    <td className="py-2 text-center">{it.unit}</td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)' }}>
                        {it.equipmentComponent || 'Vật tư rời'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-bold">{it.qty}</td>
                    {!isStorekeeper && <td className="py-2 text-right">{formatCurrency(it.unitPrice)}</td>}
                    {!isStorekeeper && <td className="py-2 text-right font-bold">{formatCurrency(it.qty * it.unitPrice)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            {!isStorekeeper && (
              <div className="text-right font-bold text-xs mt-4">
                Tổng cộng giá trị xuất: <span className="text-base font-black text-[var(--md-primary)]">{formatCurrency(selectedItem.totalValue)} đ</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
