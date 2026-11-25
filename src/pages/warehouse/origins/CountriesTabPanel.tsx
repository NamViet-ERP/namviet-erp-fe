import type React from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import SearchBar from '../../../components/ui/SearchBar';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { UI_LOADING } from '../../../lib/uiMessages';
import {
  useCreateMaterialOrigin,
  useDeleteMaterialOrigin,
  useMaterialOrigins,
  useUpdateMaterialOrigin,
} from '../../../hooks/useMaterialOrigins';
import { useMaterialRegions } from '../../../hooks/useMaterialRegions';
import type { MaterialOriginApiDto } from '../../../types/wms';

export default function CountriesTabPanel() {
  const originsQuery = useMaterialOrigins(false);
  const origins = useMemo(() => originsQuery.data ?? [], [originsQuery.data]);
  const loadingOrigins = originsQuery.isLoading;
  const errorOrigins = originsQuery.isError;

  const regionsQuery = useMaterialRegions(false);
  const regions = useMemo(() => regionsQuery.data ?? [], [regionsQuery.data]);

  const createOriginMutation = useCreateMaterialOrigin();
  const updateOriginMutation = useUpdateMaterialOrigin();
  const deleteOriginMutation = useDeleteMaterialOrigin();

  const [newOriginName, setNewOriginName] = useState('');
  const [newOriginRegion, setNewOriginRegion] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [editOriginTarget, setEditOriginTarget] = useState<MaterialOriginApiDto | null>(null);
  const [editOriginName, setEditOriginName] = useState('');
  const [editOriginRegion, setEditOriginRegion] = useState('');
  const [deleteOriginTarget, setDeleteOriginTarget] = useState<MaterialOriginApiDto | null>(null);

  const filteredOrigins = useMemo(() => {
    let list = [...origins];
    if (originSearch.trim()) {
      const q = originSearch.trim().toLowerCase();
      list = list.filter(
        o => o.name.toLowerCase().includes(q) || (o.region && o.region.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [origins, originSearch]);

  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newOriginName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên quốc gia sản xuất');
      return;
    }
    try {
      await createOriginMutation.mutateAsync({
        name,
        region: newOriginRegion.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm quốc gia "${name}"`);
      setNewOriginName('');
      setNewOriginRegion('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm xuất xứ'));
    }
  };

  const handleToggleOrigin = async (item: MaterialOriginApiDto) => {
    try {
      await updateOriginMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, region: item.region, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditOrigin = (item: MaterialOriginApiDto) => {
    setEditOriginTarget(item);
    setEditOriginName(item.name);
    setEditOriginRegion(item.region ?? '');
  };

  const handleEditOriginSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editOriginTarget) return;
    const name = editOriginName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên quốc gia sản xuất');
      return;
    }
    try {
      await updateOriginMutation.mutateAsync({
        id: editOriginTarget.id,
        body: {
          name,
          region: editOriginRegion.trim() || null,
          sortOrder: editOriginTarget.sortOrder,
          isActive: editOriginTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật quốc gia "${name}"`);
      setEditOriginTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật'));
    }
  };

  const handleDeleteOriginConfirm = async () => {
    if (!deleteOriginTarget) return;
    try {
      await deleteOriginMutation.mutateAsync(deleteOriginTarget.id);
      showToast('success', `Đã xóa "${deleteOriginTarget.name}"`);
      setDeleteOriginTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa xuất xứ'));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleAddOrigin} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newOriginName}
            onChange={e => setNewOriginName(e.target.value)}
            placeholder="Tên quốc gia (VD: Việt Nam, Đức, Nhật Bản...)"
            className="hrm-field-input flex-1"
            disabled={createOriginMutation.isPending}
          />
          <select
            value={newOriginRegion}
            onChange={e => setNewOriginRegion(e.target.value)}
            className="hrm-field-select sm:w-48"
            disabled={createOriginMutation.isPending}
          >
            <option value="">-- Nhóm nước --</option>
            {regions.filter(r => r.isActive).map(r => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
            disabled={createOriginMutation.isPending}
          >
            <Plus size={18} />
            Thêm nước
          </button>
        </form>

        <div className="hrm-recruitment-position-search">
          <SearchBar
            value={originSearch}
            onChange={setOriginSearch}
            placeholder="Tìm theo tên quốc gia hoặc nhóm nước..."
          />
        </div>

        {loadingOrigins ? (
          <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
        ) : errorOrigins ? (
          <div className="hrm-recruitment-positions-empty">Không thể tải danh sách xuất xứ.</div>
        ) : filteredOrigins.length === 0 ? (
          <div className="hrm-recruitment-positions-empty">
            {originSearch ? 'Không tìm thấy xuất xứ phù hợp.' : 'Chưa có xuất xứ nào.'}
          </div>
        ) : (
          <div className="hrm-recruitment-positions-grid">
            {filteredOrigins.map(item => (
              <div
                key={item.id}
                className={`hrm-recruitment-position-card hrm-admin-role-card${
                  item.isActive ? '' : ' hrm-recruitment-position-card--inactive'
                }`}
              >
                <div className="hrm-admin-role-card__text min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="hrm-recruitment-position-card__name font-medium" title={item.name}>
                      {item.name}
                    </span>
                    {item.region && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {item.region}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hrm-recruitment-position-card__actions">
                  <button
                    type="button"
                    onClick={() => openEditOrigin(item)}
                    className="hrm-recruitment-position-card__delete"
                    title="Sửa xuất xứ"
                    aria-label={`Sửa xuất xứ ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleOrigin(item)}
                    className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                    role="switch"
                    aria-checked={item.isActive}
                    title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                  >
                    <span className="hrm-toggle-switch__thumb" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOriginTarget(item)}
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
          Tổng <strong>{filteredOrigins.length}</strong> quốc gia
          {originSearch && <> · Đang lọc theo &ldquo;{originSearch}&rdquo;</>}
        </p>
      </div>

      <Modal
        isOpen={editOriginTarget !== null}
        onClose={() => setEditOriginTarget(null)}
        title="Sửa nước sản xuất"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditOriginTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateOriginMutation.isPending}
              onClick={() => void handleEditOriginSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditOriginSave} className="space-y-3">
          <FormField label="Tên nước sản xuất" required>
            <input
              type="text"
              value={editOriginName}
              onChange={e => setEditOriginName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Nhóm nước mặc định">
            <select
              value={editOriginRegion}
              onChange={e => setEditOriginRegion(e.target.value)}
              className="form-input w-full"
            >
              <option value="">-- Chưa gán nhóm nước --</option>
              {regions.filter(r => r.isActive).map(r => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOriginTarget !== null}
        title="Xóa xuất xứ"
        message={
          deleteOriginTarget
            ? `Bạn có chắc muốn xóa xuất xứ "${deleteOriginTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteOriginConfirm}
        onClose={() => setDeleteOriginTarget(null)}
      />
    </>
  );
}
