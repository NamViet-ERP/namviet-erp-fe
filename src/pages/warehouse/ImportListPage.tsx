import { useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Trash2, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { imports as initialImports } from '../../data/imports';
import { warehouses } from '../../data/warehouses';
import { products } from '../../data/products';
import { generateCode } from '../../utils/generateCode';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import type { Import, ImportItem } from '../../types';

type EquipmentComponent = 'xyclo' | 'pano' | 'hộp khói' | 'khác';
type ProjectStage = 'Chế tạo' | 'Lắp đặt' | 'Hoàn thiện';

/** Import line decorated with project-specific equipment metadata. */
interface ImportRowItem extends ImportItem {
  equipmentComponent?: EquipmentComponent;
}

/** Import voucher row, extended with project-specific UI fields. */
interface ImportRow extends Omit<Import, 'items'> {
  items: ImportRowItem[];
  invoiceNumber?: string;
  dnttNumber?: string;
  stage?: ProjectStage;
  arisingReason?: string;
  createdTime?: string;
}

interface FormItem {
  productId: string;
  qty: string;
  unitPrice: string;
  equipmentComponent: EquipmentComponent;
}

interface ImportForm {
  supplier: string;
  referenceCode: string;
  warehouseId: string;
  note: string;
  isDirectProcurement: boolean;
  project: string;
  invoiceNumber: string;
  dnttNumber: string;
  stage: 'Chế tạo' | 'Lắp đặt' | 'Hoàn thiện';
  arisingReason: string;
  items: FormItem[];
}

const emptyForm: ImportForm = {
  supplier: '', referenceCode: '', warehouseId: '', note: '',
  isDirectProcurement: false, project: '',
  invoiceNumber: '', dnttNumber: '', stage: 'Chế tạo', arisingReason: '',
  items: [{ productId: '', qty: '', unitPrice: '0', equipmentComponent: 'xyclo' }],
};

// Decorate mock data with project-specific attributes
const decoratedImports: ImportRow[] = initialImports.map((imp, idx) => ({
  ...imp,
  invoiceNumber: `HD-2026-0${idx + 10}`,
  dnttNumber: `DNTT-2026-0${idx + 10}`,
  stage: (idx % 2 === 0 ? 'Chế tạo' : 'Lắp đặt') as ProjectStage,
  arisingReason: idx === 3 ? 'Bổ sung vật tư lắp ráp xyclo phát sinh ngoài dự toán' : '',
  items: imp.items.map((it): ImportRowItem => ({
    ...it,
    equipmentComponent: (idx % 3 === 0 ? 'xyclo' : idx % 3 === 1 ? 'pano' : 'hộp khói') as EquipmentComponent,
  })),
}));

const generateUniqueImportId = () => `im-${Date.now()}`;
const getLocaleDateString = () => new Date().toLocaleDateString('vi-VN');

export default function ImportListPage() {
  const [data, setData] = useState<ImportRow[]>(decoratedImports);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImportRow | null>(null);
  const [form, setForm] = useState<ImportForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Active role detection for price hiding
  const activeRole = localStorage.getItem('nv-user-role') || 'admin';
  const isStorekeeper = activeRole === 'storekeeper';

  const tabs = [
    { id: 'all', label: 'Tất cả', count: data.length },
    { id: 'approved', label: 'Đã Duyệt', count: data.filter(i => i.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: data.filter(i => i.status === 'pending').length },
    { id: 'wh_approved', label: 'Đã duyệt kho', count: data.filter(i => i.warehouseApproval === 'approved').length },
    { id: 'wh_pending', label: 'Chưa duyệt kho', count: data.filter(i => i.warehouseApproval === 'pending').length },
  ];

  let filtered = data;
  if (activeTab === 'approved') filtered = filtered.filter(i => i.status === 'approved');
  else if (activeTab === 'pending') filtered = filtered.filter(i => i.status === 'pending');
  else if (activeTab === 'wh_approved') filtered = filtered.filter(i => i.warehouseApproval === 'approved');
  else if (activeTab === 'wh_pending') filtered = filtered.filter(i => i.warehouseApproval === 'pending');

  if (search) filtered = filtered.filter(i =>
    i.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.toLowerCase().includes(search.toLowerCase()) ||
    i.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
    (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
    (i.dnttNumber && i.dnttNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.supplier.trim()) errs.supplier = 'Vui lòng nhập tên nhà cung cấp';
    if (!form.referenceCode.trim()) errs.referenceCode = 'Vui lòng nhập mã PO tham chiếu';
    if (!form.isDirectProcurement && !form.warehouseId) errs.warehouseId = 'Vui lòng chọn kho nhập';
    if (form.isDirectProcurement && !form.project) errs.project = 'Vui lòng chọn dự án thụ hưởng';
    if (!form.invoiceNumber.trim()) errs.invoiceNumber = 'Vui lòng nhập số hóa đơn';
    if (!form.dnttNumber.trim()) errs.dnttNumber = 'Vui lòng nhập số DNTT';
    
    const validItems = form.items.filter(it => it.productId);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 sản phẩm';
    
    form.items.forEach((it, i) => {
      if (it.productId && (!it.qty || Number(it.qty) <= 0)) errs[`qty_${i}`] = 'Số lượng phải > 0';
      if (!isStorekeeper && it.productId && (!it.unitPrice || Number(it.unitPrice) < 0)) {
        errs[`price_${i}`] = 'Đơn giá không được âm';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const items = form.items.filter(it => it.productId).map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        sku: prod?.sku ?? '',
        name: prod?.name ?? '',
        qty: Number(it.qty),
        unit: prod?.unit ?? '',
        unitPrice: isStorekeeper ? 0 : Number(it.unitPrice),
        equipmentComponent: it.equipmentComponent
      };
    });
    const totalValue = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
    const newItem: ImportRow = {
      id: generateUniqueImportId(),
      voucherCode: generateCode('NK'),
      date: getLocaleDateString(),
      supplier: form.supplier,
      referenceCode: form.referenceCode,
      totalValue,
      status: 'pending',
      warehouseApproval: 'pending',
      approvedBy: '',
      warehouseKeeper: '',
      items,
      createdBy: activeRole.toUpperCase(),
      note: form.note,
      warehouseId: form.isDirectProcurement ? '' : form.warehouseId,
      isDirectProcurement: form.isDirectProcurement,
      project: form.isDirectProcurement ? form.project : '',
      invoiceNumber: form.invoiceNumber,
      dnttNumber: form.dnttNumber,
      stage: form.stage,
      arisingReason: form.arisingReason,
      createdTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setData([newItem, ...data]);
    setShowCreate(false);
    setForm({ ...emptyForm });
    setErrors({});
    showToast('success', `Phiếu nhập kho ${newItem.voucherCode} đã được tạo!`, 'Tạo phiếu thành công');
  };

  const handleApprove = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'approved' as const, approvedBy: activeRole } : i));
    showToast('success', `Đã duyệt phiếu ${item.voucherCode}`);
  };

  const handleApproveWarehouse = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, warehouseApproval: 'approved' as const, warehouseKeeper: activeRole } : i));
    showToast('success', `Đã duyệt kho phiếu ${item.voucherCode}`);
  };

  const handleCancel = (item: Import) => {
    setData(data.map(i => i.id === item.id ? { ...i, status: 'cancelled' as const } : i));
    showToast('warning', `Đã hủy phiếu ${item.voucherCode}`);
  };

  const getWhApprovalBadge = (approval: string) => {
    const map: Record<string, { label: string; style: React.CSSProperties }> = {
      approved: { label: 'Đã duyệt kho', style: { background: 'var(--md-success-container)', color: 'var(--md-on-success-container)' } },
      exported: { label: 'Đã xuất kho', style: { background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' } },
      pending: { label: 'Chưa duyệt kho', style: { background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)' } },
    };
    const config = map[approval] || map.pending;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ ...config.style, whiteSpace: 'nowrap' }}>
        {approval === 'approved' && <Check size={10} />}
        {config.label}
      </span>
    );
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', qty: '', unitPrice: '0', equipmentComponent: 'xyclo' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof FormItem, val: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const formTotal = form.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);

  const getActions = (item: Import) => {
    const a: { label?: string; icon?: LucideIcon; onClick?: () => void; danger?: boolean; divider?: boolean }[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } },
    ];
    if (item.status === 'pending') {
      a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
    }
    if (item.warehouseApproval === 'pending') {
      a.push({ label: 'Duyệt kho', icon: Check, onClick: () => handleApproveWarehouse(item) });
    }
    if (item.status !== 'cancelled') {
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
        title="NHẬP KHO"
        actions={<>
          <button className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
          <button className="btn btn-filled" onClick={() => setShowCreate(true)}><Plus size={16} /> TẠO MỚI</button>
        </>}
      />

      {isStorekeeper && (
        <div className="mb-4 bg-[var(--tint-primary-soft)] border border-[var(--md-outline-variant)] text-[var(--md-primary)] rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>VAI TRÒ THỦ KHO: Đơn giá và tổng giá trị tài chính đã được ẩn để bảo mật 100%.</span>
        </div>
      )}

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)' }}>
        <div className="px-4 pt-4"><TabFilter tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} /></div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="form-select w-24 text-xs py-1.5" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10, 15, 25].map(n => <option key={n} value={n}>{n} mục</option>)}
            </select>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm mã chứng từ, hóa đơn, DNTT..." />
        </div>

        {paginated.length === 0 ? <EmptyState message="Không tìm thấy phiếu nhập kho nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: '1200px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                  <th className="table-header-cell">Ngày chứng từ</th>
                  <th className="table-header-cell">Mã chứng từ</th>
                  <th className="table-header-cell">Nhà cung cấp</th>
                  <th className="table-header-cell">Số hóa đơn</th>
                  <th className="table-header-cell">Mã tham chiếu / DNTT</th>
                  <th className="table-header-cell">Ghi chú/Lý do</th>
                  <th className="table-header-cell text-right">Tổng giá trị</th>
                  <th className="table-header-cell">Người tạo</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Duyệt kho</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((imp) => (
                  <tr key={imp.id} className="table-row cursor-pointer hover:bg-[var(--tint-primary-weak)]"
                    onClick={() => { setSelectedItem(imp); setShowDetail(true); }}>
                    <td className="table-cell text-[var(--md-on-surface)]">{imp.date}</td>
                    <td className="table-cell font-bold text-[var(--md-primary)]">
                      <div>{imp.voucherCode}</div>
                      {imp.isDirectProcurement && (
                        <span className="inline-block text-[9px] font-bold bg-[var(--tint-warning-soft)] text-[var(--md-warning)] px-2 py-0.5 rounded-full border border-[var(--tint-warning-border)] mt-0.5">
                          MUA TRỰC TIẾP DỰ ÁN
                        </span>
                      )}
                    </td>
                    <td className="table-cell max-w-[200px] text-[var(--md-on-surface)]"><p className="font-semibold truncate">{imp.supplier}</p></td>
                    <td className="table-cell font-mono">{imp.invoiceNumber || '—'}</td>
                    <td className="table-cell text-[var(--md-on-surface)]">
                      <div className="font-semibold">{imp.referenceCode}</div>
                      <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5 font-mono">DNTT: {imp.dnttNumber}</div>
                      {imp.isDirectProcurement && (
                        <div className="text-[10px] text-amber-600 mt-0.5 font-bold">Dự án: {imp.project} ({imp.stage})</div>
                      )}
                    </td>
                    <td className="table-cell max-w-[150px] truncate" title={imp.arisingReason || imp.note || ''}>
                      {imp.arisingReason ? (
                        <span className="text-amber-700 font-semibold">{imp.arisingReason}</span>
                      ) : (
                        imp.note || '—'
                      )}
                    </td>
                    <td className="table-cell text-right font-bold text-[var(--md-on-surface)]">
                      {isStorekeeper ? '***' : formatCurrency(imp.totalValue)}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-[var(--md-on-surface)]">{imp.createdBy || 'Hệ thống'}</div>
                      <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5">{imp.date} {imp.createdTime || '08:30'}</div>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <Badge status={imp.status} />
                        {imp.approvedBy && (
                          <span className="text-[10px] text-[var(--md-on-surface-variant)] font-semibold mt-0.5" style={{ whiteSpace: 'nowrap' }}>
                            ({imp.approvedBy})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex flex-col items-center justify-center">
                        {getWhApprovalBadge(imp.warehouseApproval)}
                        {imp.warehouseKeeper && (
                          <div className="text-[10px] text-[var(--md-on-surface-variant)] mt-0.5 font-semibold" style={{ whiteSpace: 'nowrap' }}>
                            ({imp.warehouseKeeper})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}><Dropdown items={getActions(imp)} /></td>
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
        title="TẠO PHIẾU NHẬP KHO CHUYÊN BIỆT DỰ ÁN" size="full"
        footer={<>
          {!isStorekeeper && (
            <div className="flex-1 text-left">
              <span className="text-xs text-[var(--md-on-surface-variant)] uppercase font-bold">Tổng trị giá: </span>
              <span className="text-base font-bold text-[var(--md-primary)]">{formatCurrency(formTotal)} đ</span>
            </div>
          )}
          <button className="btn btn-outline text-xs" onClick={() => { setShowCreate(false); setErrors({}); }}>HỦY BỎ</button>
          <button className="btn btn-primary text-xs" onClick={handleSubmit}>TẠO PHIẾU</button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FormField label="Nhà cung cấp vật tư" required error={errors.supplier}>
            <input className={`form-input ${errors.supplier ? 'border-[var(--md-error)]' : ''}`}
              value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="CÔNG TY TNHH VẬT TƯ..." />
          </FormField>
          <FormField label="Mã PO tham chiếu" required error={errors.referenceCode}>
            <input className={`form-input ${errors.referenceCode ? 'border-[var(--md-error)]' : ''}`}
              value={form.referenceCode} onChange={e => setForm({ ...form, referenceCode: e.target.value })}
              placeholder="PO-000000" />
          </FormField>

          <FormField label="Số hóa đơn VAT" required error={errors.invoiceNumber}>
            <input className={`form-input ${errors.invoiceNumber ? 'border-[var(--md-error)]' : ''}`}
              value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
              placeholder="HD-2026-XXXX" />
          </FormField>
          <FormField label="Số đề nghị thanh toán (DNTT)" required error={errors.dnttNumber}>
            <input className={`form-input ${errors.dnttNumber ? 'border-[var(--md-error)]' : ''}`}
              value={form.dnttNumber} onChange={e => setForm({ ...form, dnttNumber: e.target.value })}
              placeholder="DNTT-2026-XXXX" />
          </FormField>

          <FormField label="Giai đoạn thi công dự án" required>
            <select className="form-select" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as ProjectStage })}>
              <option value="Chế tạo">Chế tạo phụ kiện & máy nén khí</option>
              <option value="Lắp đặt">Lắp đặt tại công trình</option>
              <option value="Hoàn thiện">Hoàn thiện kiểm thử & bàn giao</option>
            </select>
          </FormField>
          <FormField label="Lý do phát sinh ngoài dự toán (nếu có)" error={errors.arisingReason}>
            <input className="form-input" value={form.arisingReason} onChange={e => setForm({ ...form, arisingReason: e.target.value })}
              placeholder="Nhập lý do chênh lệch hoặc mua thêm..." />
          </FormField>
          
          <div className="col-span-1 md:col-span-2 flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="isDirectProcurement"
              className="w-4 h-4 rounded border-gray-300 text-[var(--md-primary)] focus:ring-[var(--md-primary)] accent-[var(--md-primary)]"
              checked={form.isDirectProcurement}
              onChange={e => setForm({ ...form, isDirectProcurement: e.target.checked, warehouseId: '', project: '' })}
            />
            <label htmlFor="isDirectProcurement" className="text-xs font-bold text-[var(--md-on-surface-variant)] uppercase cursor-pointer">
              Mua phát sinh trực tiếp cấp phát công trình (Không tính tồn kho chung)
            </label>
          </div>

          {form.isDirectProcurement ? (
            <FormField label="Dự án nhận hàng" required error={errors.project}>
              <select className={`form-select ${errors.project ? 'border-[var(--md-error)]' : ''}`}
                value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}>
                <option value="">-- Chọn dự án --</option>
                <option value="Dự án Sabeco Bình Dương">Dự án Sabeco Bình Dương</option>
                <option value="Dự án Sữa Vinamilk Củ Chi">Dự án Sữa Vinamilk Củ Chi</option>
                <option value="Dự án Thép Hòa Phát Dung Quất">Dự án Thép Hòa Phát Dung Quất</option>
                <option value="Dự án Lọc dầu Nghi Sơn Thanh Hóa">Dự án Lọc dầu Nghi Sơn Thanh Hóa</option>
                <option value="Dự án Vinhomes Grand Park">Dự án Vinhomes Grand Park</option>
              </select>
            </FormField>
          ) : (
            <FormField label="Kho bãi nhập" required error={errors.warehouseId}>
              <select className={`form-select ${errors.warehouseId ? 'border-[var(--md-error)]' : ''}`}
                value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
                <option value="">-- Chọn kho bãi --</option>
                {warehouses.filter(w => w.group !== 'Kho hư lỗi').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </FormField>
          )}

          <FormField label="Ghi chú thêm" className="md:col-span-2">
            <input className="form-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú..." />
          </FormField>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-xs uppercase text-[var(--md-on-surface)]">Danh sách chi tiết hàng hóa nhập</h4>
          <button className="btn btn-outline text-[10px] py-1 px-2.5" onClick={addItem}><Plus size={12} /> Thêm vật tư</button>
        </div>
        {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}
        
        <div className="overflow-x-auto">
          <table className="form-table text-xs" style={{ minWidth: '1050px' }}>
            <thead>
              <tr>
                <th className="table-header-cell w-10">STT</th>
                <th className="table-header-cell">Sản phẩm vật tư</th>
                <th className="table-header-cell w-20">Số lượng</th>
                <th className="table-header-cell w-56">Linh kiện thiết bị</th>
                {!isStorekeeper && <th className="table-header-cell w-28">Đơn giá (VND)</th>}
                {!isStorekeeper && <th className="table-header-cell w-28 text-right">Thành tiền</th>}
                <th className="table-header-cell w-8"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => {
                const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                return (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-center">{i + 1}</td>
                    <td className="table-cell">
                      <select className="form-select text-xs" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                      </select>
                    </td>
                    <td className="table-cell">
                      <input type="number" min="1" className={`form-input text-xs text-right ${errors[`qty_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                        value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" />
                      {errors[`qty_${i}`] && <p className="text-[var(--md-error)] text-[9px]">{errors[`qty_${i}`]}</p>}
                    </td>
                    <td className="table-cell">
                      <select className="form-select text-xs" value={it.equipmentComponent} onChange={e => updateItem(i, 'equipmentComponent', e.target.value)}>
                        <option value="xyclo">Thiết bị xyclo lọc bụi</option>
                        <option value="pano">Pano tấm che bảo vệ</option>
                        <option value="hộp khói">Hộp thu gom khói thải</option>
                        <option value="khác">Khác / Vật tư rời</option>
                      </select>
                    </td>
                    {!isStorekeeper && (
                      <td className="table-cell">
                        <input type="number" min="0" className={`form-input text-xs text-right ${errors[`price_${i}`] ? 'border-[var(--md-error)]' : ''}`}
                          value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="0" />
                        {errors[`price_${i}`] && <p className="text-[var(--md-error)] text-[9px]">{errors[`price_${i}`]}</p>}
                      </td>
                    )}
                    {!isStorekeeper && <td className="table-cell text-right font-semibold text-xs">{formatCurrency(lineTotal)}</td>}
                    <td className="table-cell text-center">
                      {form.items.length > 1 && <button className="p-1 text-[var(--md-error)] opacity-80 hover:opacity-100" onClick={() => removeItem(i)}><Trash2 size={12} /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Details modal */}
      {selectedItem && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title={`CHI TIẾT CHỨNG TỪ NHẬP KHO — ${selectedItem.voucherCode}`}
          size="lg"
          footer={<button className="btn btn-outline text-xs" onClick={() => setShowDetail(false)}>ĐÓNG</button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs p-4 rounded-xl" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Mã chứng từ:</span>
                <span className="font-bold text-[var(--md-primary)] text-sm">{selectedItem.voucherCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ngày chứng từ:</span>
                <span className="font-bold">{selectedItem.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Số hóa đơn VAT:</span>
                <span className="font-bold font-mono">{selectedItem.invoiceNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Số đề nghị thanh toán (DNTT):</span>
                <span className="font-bold font-mono">{selectedItem.dnttNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Mã PO tham chiếu:</span>
                <span className="font-bold font-mono">{selectedItem.referenceCode || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Giai đoạn & Loại hình:</span>
                <span className="font-bold">
                  {selectedItem.stage || '—'}
                  {selectedItem.isDirectProcurement ? ' (Cấp phát dự án)' : ' (Vào kho tổng)'}
                </span>
              </div>
              <div className="col-span-2 md:col-span-2">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Nhà cung cấp:</span>
                <span className="font-bold block text-xs" style={{ wordBreak: 'break-word' }}>{selectedItem.supplier || '—'}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Người tạo:</span>
                <span className="font-bold block">{selectedItem.createdBy || 'Hệ thống'}</span>
                <span className="text-[10px] text-[var(--md-on-surface-variant)] font-semibold">Lúc {selectedItem.createdTime || '08:30'}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-[10px] text-[var(--md-on-surface-variant)] uppercase font-semibold block">Ghi chú:</span>
                <p className="font-semibold">{selectedItem.note || '—'}</p>
              </div>
              {selectedItem.arisingReason && (
                <div className="col-span-2 md:col-span-3 bg-[var(--tint-warning-soft)] p-2 rounded border border-[var(--tint-warning-border)] text-[var(--status-warning)]">
                  <span className="text-[9px] font-bold block uppercase">Lý do phát sinh ngoài dự toán:</span>
                  <p className="font-semibold text-xs mt-0.5">{selectedItem.arisingReason}</p>
                </div>
              )}
            </div>

            <h4 className="font-bold text-xs uppercase text-[var(--md-on-surface)] mt-4">Danh sách hàng hóa nhập</h4>
            
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                  <th className="py-2 text-left font-semibold">Tên hàng / SKU</th>
                  <th className="py-2 text-center font-semibold w-20">ĐVT</th>
                  <th className="py-2 text-center font-semibold w-24">Linh kiện</th>
                  <th className="py-2 text-right font-semibold w-20">Số lượng</th>
                  {!isStorekeeper && <th className="py-2 text-right font-semibold w-28">Đơn giá</th>}
                  {!isStorekeeper && <th className="py-2 text-right font-semibold w-28">Thành tiền</th>}
                </tr>
              </thead>
              <tbody>
                {selectedItem.items?.map((it, i) => (
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
              <div className="text-right font-bold text-xs">
                Tổng cộng: <span className="text-base font-black text-[var(--md-primary)]">{formatCurrency(selectedItem.totalValue)} đ</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
