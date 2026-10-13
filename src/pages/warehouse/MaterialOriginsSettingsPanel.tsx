import type React from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Trash2, Package, Pencil } from 'lucide-react';
import HrmPanel from '../../components/hr/HrmPanel';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_LOADING } from '../../lib/uiMessages';
import {
  useMaterialOrigins,
  useCreateMaterialOrigin,
  useUpdateMaterialOrigin,
  useDeleteMaterialOrigin,
} from '../../hooks/useMaterialOrigins';
import type { MaterialOriginApiDto } from '../../types/wms';

export default function MaterialOriginsSettingsPanel() {
  const { data: origins = [], isLoading, isError } = useMaterialOrigins(false);
  const createMutation = useCreateMaterialOrigin();
  const updateMutation = useUpdateMaterialOrigin();
  const deleteMutation = useDeleteMaterialOrigin();

  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MaterialOriginApiDto | null>(null);
  const [editTarget, setEditTarget] = useState<MaterialOriginApiDto | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = useMemo(() => {
    let list = [...origins];
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [origins, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên xuất xứ');
      return;
    }
    try {
      await createMutation.mutateAsync({ name, isActive: true });
      showToast('success', `Đã thêm xuất xứ "${name}"`);
      setNewName('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm xuất xứ'));
    }
  };

  const handleToggle = async (item: MaterialOriginApiDto) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEdit = (item: MaterialOriginApiDto) => {
    setEditTarget(item);
    setEditName(item.name);
  };

  const handleEditSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên xuất xứ');
      return;
    }
    if (name === editTarget.name) {
      setEditTarget(null);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        body: { name, sortOrder: editTarget.sortOrder, isActive: editTarget.isActive },
      });
      showToast('success', `Đã đổi tên thành "${name}"`);
      setEditTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa "${deleteTarget.name}"`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa xuất xứ'));
    }
  };

  return (
    <>
      <div className="hrm-settings-grid hrm-settings-grid--recruitment">
        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Danh sách xuất xứ vật tư</h2>
              <p className="hrm-settings-card__desc">
                Thêm, sửa tên, bật/tắt hoặc xóa xuất xứ — dùng làm gợi ý dropdown khi tạo mã vật tư.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="hrm-recruitment-add-form hrm-admin-role-add-form">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Tên xuất xứ (VD: Việt Nam, Nhật Bản, Đức, Hàn Quốc)"
              className="hrm-field-input flex-1"
              disabled={createMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
              disabled={createMutation.isPending}
            >
              <Plus size={18} />
              Thêm
            </button>
          </form>

          <div className="hrm-recruitment-position-search">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo tên xuất xứ..."
            />
          </div>

          {isLoading ? (
            <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
          ) : isError ? (
            <div className="hrm-recruitment-positions-empty">Không thể tải danh sách xuất xứ.</div>
          ) : filtered.length === 0 ? (
            <div className="hrm-recruitment-positions-empty">
              {searchTerm ? 'Không tìm thấy xuất xứ phù hợp.' : 'Chưa có xuất xứ nào.'}
            </div>
          ) : (
            <div className="hrm-recruitment-positions-grid">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className={`hrm-recruitment-position-card hrm-admin-role-card${item.isActive ? '' : ' hrm-recruitment-position-card--inactive'}`}
                >
                  <div className="hrm-admin-role-card__text min-w-0">
                    <span className="hrm-recruitment-position-card__name" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="hrm-recruitment-position-card__actions">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="hrm-recruitment-position-card__delete"
                      title="Sửa tên xuất xứ"
                      aria-label={`Sửa xuất xứ ${item.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggle(item)}
                      className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                      role="switch"
                      aria-checked={item.isActive}
                      title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                    >
                      <span className="hrm-toggle-switch__thumb" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="hrm-recruitment-position-card__delete"
                      title="Xóa xuất xứ"
                      aria-label={`Xóa xuất xứ ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="hrm-recruitment-positions-meta">
            Tổng <strong>{filtered.length}</strong> xuất xứ
            {searchTerm && (
              <> · Đang lọc theo &ldquo;{searchTerm}&rdquo;</>
            )}
          </p>
        </HrmPanel>

        <HrmPanel className="hrm-settings-card">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--neutral">
              <Package size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Hướng dẫn vận hành</h2>
            </div>
          </div>
          <ul className="hrm-settings-list">
            <li><strong>Sửa tên:</strong> Cập nhật tên hiển thị — vật tư đang dùng xuất xứ này cũng được đổi theo.</li>
            <li><strong>Bật:</strong> Xuất xứ hiển thị trong dropdown khi tạo hoặc sửa mã vật tư.</li>
            <li><strong>Tắt:</strong> Ẩn khỏi dropdown chọn mới — không làm mất thông tin của vật tư đã gắn xuất xứ.</li>
            <li><strong>Xóa:</strong> Chỉ xóa được khi chưa có vật tư nào gắn xuất xứ này.</li>
          </ul>
          <Link to="/operations/materials" className="hrm-settings-link">
            <Package size={15} />
            Đi tới danh mục vật tư
          </Link>
        </HrmPanel>
      </div>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Sửa tên xuất xứ"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>Hủy</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              onClick={() => void handleEditSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditSave} className="space-y-4">
          <FormField label="Tên xuất xứ" required>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Xóa xuất xứ"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa xuất xứ "${deleteTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
