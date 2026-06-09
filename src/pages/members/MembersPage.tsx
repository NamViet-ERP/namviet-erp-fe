import { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, Calendar } from 'lucide-react';
import { initialMembers, memberRoles, type Member } from '../../data/members';
import { showToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import Dropdown from '../../components/ui/Dropdown';
import Badge from '../../components/ui/Badge';
import FormField from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';

interface MemberForm {
  code: string;
  name: string;
  role: 'admin' | 'storekeeper' | 'accountant' | 'procurement' | 'pm';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState<Member | null>(null);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>({
    code: '',
    name: '',
    role: 'storekeeper',
    email: '',
    phone: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) {
      errs.code = 'Vui lòng nhập mã nhân viên';
    } else if (!editingItem && members.some(m => m.code.toUpperCase() === form.code.trim().toUpperCase())) {
      errs.code = 'Mã nhân viên đã tồn tại';
    }

    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ và tên';
    
    if (!form.email.trim()) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Email không hợp lệ';
    }

    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      code: '',
      name: '',
      role: 'storekeeper',
      email: '',
      phone: '',
      status: 'active'
    });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: Member) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      role: item.role,
      email: item.email,
      phone: item.phone,
      status: item.status
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    const roleLabel = memberRoles.find(r => r.value === form.role)?.label || 'Nhân viên';

    if (editingItem) {
      setMembers(prev => prev.map(m => m.id === editingItem.id ? { ...m, ...form, roleLabel } : m));
      showToast('success', `Đã cập nhật thông tin thành viên "${form.name}"`, 'Cập nhật thành công');
    } else {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const newMember: Member = {
        id: `m-${Date.now()}`,
        ...form,
        roleLabel,
        joinedDate: formattedDate
      };
      setMembers(prev => [...prev, newMember]);
      showToast('success', `Đã thêm thành viên "${form.name}" thành công!`, 'Thêm thành công');
    }
    setShowModal(false);
    setErrors({});
  };

  const handleDelete = (item: Member) => {
    setMembers(prev => prev.filter(m => m.id !== item.id));
    showToast('warning', `Đã xóa thành viên "${item.name}" khỏi hệ thống`, 'Xóa thành công');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="NHÂN SỰ"
        title="THÀNH VIÊN BAN QUẢN LÝ KHO"
        actions={<button onClick={openCreate} className="btn btn-filled"><Plus size={16} /> THÊM THÀNH VIÊN</button>}
      />

      <div className="rounded-2xl shadow-card overflow-hidden" style={{ background: 'var(--md-surface-container)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-2">
            <select className="form-select w-24 text-xs py-1.5" value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 15, 25].map(n => <option key={n} value={n}>{n} mục</option>)}
            </select>
            <span className="text-sm text-[var(--md-on-surface-variant)]">{filtered.length} thành viên</span>
          </div>
          <SearchBar value={search} onChange={e => { setSearch(e); setPage(1); }} placeholder="Tìm tên, mã hoặc email..." />
        </div>

        {filtered.length === 0 ? <EmptyState message="Không tìm thấy thành viên nào!" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th className="table-header-cell">Mã nhân viên</th>
                  <th className="table-header-cell">Họ và tên</th>
                  <th className="table-header-cell">Vai trò</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Số điện thoại</th>
                  <th className="table-header-cell">Ngày tham gia</th>
                  <th className="table-header-cell text-center">Trạng thái</th>
                  <th className="table-header-cell text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell font-semibold text-[var(--md-primary)] cursor-pointer hover:underline"
                      onClick={() => { setDetailItem(m); setShowDetail(true); }}>{m.code}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-[var(--md-on-surface)]">
                        <User size={14} className="text-[var(--md-outline)]" />
                        {m.name}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: m.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' :
                                      m.role === 'storekeeper' ? 'rgba(59, 130, 246, 0.15)' :
                                      m.role === 'pm' ? 'rgba(167, 139, 250, 0.15)' :
                                      m.role === 'accountant' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                          color: m.role === 'admin' ? '#ef4444' :
                                 m.role === 'storekeeper' ? '#3b82f6' :
                                 m.role === 'pm' ? '#a78bfa' :
                                 m.role === 'accountant' ? '#10b981' : '#6b7280',
                          border: `1px solid ${
                            m.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' :
                            m.role === 'storekeeper' ? 'rgba(59, 130, 246, 0.25)' :
                            m.role === 'pm' ? 'rgba(167, 139, 250, 0.25)' :
                            m.role === 'accountant' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(107, 114, 128, 0.25)'
                          }`
                        }}
                      >
                        {m.roleLabel}
                      </span>
                    </td>
                    <td className="table-cell text-[var(--md-on-surface-variant)]">{m.email}</td>
                    <td className="table-cell text-[var(--md-on-surface-variant)]">{m.phone}</td>
                    <td className="table-cell text-[var(--md-on-surface-variant)]">{m.joinedDate}</td>
                    <td className="table-cell text-center">
                      <Badge status={m.status} />
                    </td>
                    <td className="table-cell text-center">
                      <Dropdown items={[
                        { label: 'Xem chi tiết', icon: User, onClick: () => { setDetailItem(m); setShowDetail(true); } },
                        { label: 'Chỉnh sửa', icon: Edit, onClick: () => openEdit(m) },
                        { divider: true },
                        { label: 'Xóa', icon: Trash2, danger: true, onClick: () => handleDelete(m) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage}
            pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setErrors({}); }}
        title={editingItem ? 'CHỈNH SỬA THÀNH VIÊN' : 'THÊM THÀNH VIÊN MỚI'} size="lg"
        footer={<>
          <button onClick={() => { setShowModal(false); setErrors({}); }} className="btn btn-outline">Hủy bỏ</button>
          <button onClick={handleSave} className="btn btn-primary">{editingItem ? 'Cập nhật' : 'Tạo mới'}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mã nhân viên" required error={errors.code}>
            <input className="form-input" value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: NV-0099"
              disabled={!!editingItem} />
          </FormField>
          <FormField label="Họ và tên" required error={errors.name}>
            <input className="form-input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Nguyễn Văn A" />
          </FormField>
          <FormField label="Vai trò / Chức danh" required>
            <select className="form-select" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as any })}>
              {memberRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </FormField>
          <FormField label="Trạng thái">
            <select className="form-select" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
          </FormField>
          <FormField label="Email" required error={errors.email} className="col-span-2">
            <input type="email" className="form-input" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="VD: email@namviet.vn" />
          </FormField>
          <FormField label="Số điện thoại" required error={errors.phone} className="col-span-2">
            <input className="form-input" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="VD: 0909.123.456" />
          </FormField>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={`CHI TIẾT THÀNH VIÊN — ${detailItem?.code || ''}`} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setShowDetail(false); if (detailItem) openEdit(detailItem); }}>
            <Edit size={14} /> Chỉnh sửa
          </button>
          <button className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
        </>}
      >
        {detailItem && (
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl p-4" style={{ background: 'var(--md-surface-container-low)' }}>
              <span className="text-xs text-[var(--md-on-surface-variant)]">Mã nhân viên</span>
              <p className="font-bold text-[var(--md-primary)] text-lg">{detailItem.code}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--md-surface-container-low)' }}>
              <span className="text-xs text-[var(--md-on-surface-variant)]">Họ và tên</span>
              <p className="font-semibold text-[var(--md-on-surface)] text-lg">{detailItem.name}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--md-on-surface-variant)]">Vai trò</span>
              <p className="mt-1 font-medium text-[var(--md-on-surface)]">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: detailItem.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' :
                                detailItem.role === 'storekeeper' ? 'rgba(59, 130, 246, 0.15)' :
                                detailItem.role === 'pm' ? 'rgba(167, 139, 250, 0.15)' :
                                detailItem.role === 'accountant' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: detailItem.role === 'admin' ? '#ef4444' :
                           detailItem.role === 'storekeeper' ? '#3b82f6' :
                           detailItem.role === 'pm' ? '#a78bfa' :
                           detailItem.role === 'accountant' ? '#10b981' : '#6b7280',
                    border: `1px solid ${
                      detailItem.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' :
                      detailItem.role === 'storekeeper' ? 'rgba(59, 130, 246, 0.25)' :
                      detailItem.role === 'pm' ? 'rgba(167, 139, 250, 0.25)' :
                      detailItem.role === 'accountant' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(107, 114, 128, 0.25)'
                    }`
                  }}
                >
                  {detailItem.roleLabel}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-[var(--md-on-surface-variant)]">Trạng thái</span>
              <div className="mt-1"><Badge status={detailItem.status} /></div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-[var(--md-on-surface-variant)]">Email liên hệ</span>
              <p className="text-sm flex items-center gap-2 text-[var(--md-on-surface)] mt-1">
                <Mail size={14} className="text-[var(--md-outline)]" />
                {detailItem.email}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-[var(--md-on-surface-variant)]">Số điện thoại</span>
              <p className="text-sm flex items-center gap-2 text-[var(--md-on-surface)] mt-1">
                <Phone size={14} className="text-[var(--md-outline)]" />
                {detailItem.phone}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-[var(--md-on-surface-variant)]">Ngày tham gia hệ thống</span>
              <p className="text-sm flex items-center gap-2 text-[var(--md-on-surface)] mt-1">
                <Calendar size={14} className="text-[var(--md-outline)]" />
                {detailItem.joinedDate}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
