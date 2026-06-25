import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ruler, Plus, Trash2, Package, Pencil } from 'lucide-react';
import HrmPanel from '../../components/hr/HrmPanel';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { UI_LOADING } from '../../lib/uiMessages';
import {
  useMaterialUnits,
  useCreateMaterialUnit,
  useUpdateMaterialUnit,
  useDeleteMaterialUnit,
} from '../../hooks/useMaterialUnits';
import type { MaterialUnitApiDto } from '../../types/wms';

export default function MaterialUnitsSettingsPanel() {
  const { data: units = [], isLoading, isError } = useMaterialUnits(false);
  const createMutation = useCreateMaterialUnit();
  const updateMutation = useUpdateMaterialUnit();
  const deleteMutation = useDeleteMaterialUnit();

  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MaterialUnitApiDto | null>(null);
  const [editTarget, setEditTarget] = useState<MaterialUnitApiDto | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = useMemo(() => {
    let list = [...units];
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [units, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên đơn vị tính');
      return;
    }
    try {
      await createMutation.mutateAsync({ name, isActive: true });
      showToast('success', `Đã thêm đơn vị tính "${name}"`);
      setNewName('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm đơn vị tính'));
    }
  };

  const handleToggle = async (item: MaterialUnitApiDto) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEdit = (item: MaterialUnitApiDto) => {
    setEditTarget(item);
    setEditName(item.name);
  };

  const handleEditSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên đơn vị tính');
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
      showToast('error', getApiErrorMessage(err, 'Không thể xóa đơn vị tính'));
    }
  };

  return (
    <>
      <div className="hrm-settings-grid hrm-settings-grid--recruitment">
        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
              <Ruler size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Danh sách đơn vị tính</h2>
              <p className="hrm-settings-card__desc">
                Sửa tên, bật/tắt hoặc xóa đơn vị — tên được chuẩn hóa tự động (VD: mét khối → Mét khối).
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="hrm-recruitment-add-form hrm-admin-role-add-form">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Tên đơn vị (VD: Cái, Mét khối)"
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
              placeholder="Tìm theo tên đơn vị..."
            />
          </div>

          {isLoading ? (
            <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
          ) : isError ? (
            <div className="hrm-recruitment-positions-empty">{WMS_ERROR.loadMaterialUnits}</div>
          ) : filtered.length === 0 ? (
            <div className="hrm-recruitment-positions-empty">
              {searchTerm ? 'Không tìm thấy đơn vị phù hợp.' : 'Chưa có đơn vị tính nào.'}
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
                      title="Sửa tên đơn vị"
                      aria-label={`Sửa đơn vị ${item.name}`}
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
                      title="Xóa đơn vị"
                      aria-label={`Xóa đơn vị ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="hrm-recruitment-positions-meta">
            Tổng <strong>{filtered.length}</strong> đơn vị
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
            <li><strong>Sửa tên:</strong> Cập nhật tên hiển thị — vật tư đang dùng đơn vị này cũng được đổi theo.</li>
            <li><strong>Bật:</strong> Đơn vị hiển thị khi tạo hoặc sửa mã vật tư.</li>
            <li><strong>Tắt:</strong> Ẩn khỏi danh sách chọn — không xóa vật tư đang dùng đơn vị đó.</li>
            <li><strong>Xóa:</strong> Chỉ xóa được khi không còn vật tư nào dùng đơn vị này.</li>
          </ul>
          <Link to="/warehouse/materials" className="hrm-settings-link">
            <Package size={15} />
            Đi tới danh sách vật tư
          </Link>
        </HrmPanel>
      </div>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Sửa tên đơn vị tính"
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
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        {editTarget && (
          <form id="material-unit-edit-form" onSubmit={handleEditSave} className="space-y-4 modal-form-bordered">
            <FormField label="Tên đơn vị" required>
              <input
                className="form-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="VD: Cái"
                autoFocus
              />
            </FormField>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Tên sẽ được chuẩn hóa (bỏ khoảng trắng thừa, viết hoa chữ cái đầu).
            </p>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa đơn vị tính"
        message={
          deleteTarget ? (
            <>
              Bạn có chắc muốn xóa đơn vị{' '}
              <strong className="confirm-dialog__emphasis">&ldquo;{deleteTarget.name}&rdquo;</strong>?
              <br />
              <span className="confirm-dialog__subtext">Chỉ xóa được khi không còn vật tư dùng đơn vị này.</span>
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy bỏ"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
