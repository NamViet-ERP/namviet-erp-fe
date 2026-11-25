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
  useCreateMaterialRegion,
  useDeleteMaterialRegion,
  useMaterialRegions,
  useUpdateMaterialRegion,
} from '../../../hooks/useMaterialRegions';
import type { MaterialRegionApiDto } from '../../../types/wms';

export default function RegionsTabPanel() {
  const regionsQuery = useMaterialRegions(false);
  const regions = useMemo(() => regionsQuery.data ?? [], [regionsQuery.data]);
  const loadingRegions = regionsQuery.isLoading;
  const errorRegions = regionsQuery.isError;

  const createRegionMutation = useCreateMaterialRegion();
  const updateRegionMutation = useUpdateMaterialRegion();
  const deleteRegionMutation = useDeleteMaterialRegion();

  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionDesc, setNewRegionDesc] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [editRegionTarget, setEditRegionTarget] = useState<MaterialRegionApiDto | null>(null);
  const [editRegionName, setEditRegionName] = useState('');
  const [editRegionDesc, setEditRegionDesc] = useState('');
  const [deleteRegionTarget, setDeleteRegionTarget] = useState<MaterialRegionApiDto | null>(null);

  const filteredRegions = useMemo(() => {
    let list = [...regions];
    if (regionSearch.trim()) {
      const q = regionSearch.trim().toLowerCase();
      list = list.filter(
        r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [regions, regionSearch]);

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRegionName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhóm nước');
      return;
    }
    try {
      await createRegionMutation.mutateAsync({
        name,
        description: newRegionDesc.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm nhóm nước "${name}"`);
      setNewRegionName('');
      setNewRegionDesc('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm nhóm nước'));
    }
  };

  const handleToggleRegion = async (item: MaterialRegionApiDto) => {
    try {
      await updateRegionMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, description: item.description, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditRegion = (item: MaterialRegionApiDto) => {
    setEditRegionTarget(item);
    setEditRegionName(item.name);
    setEditRegionDesc(item.description ?? '');
  };

  const handleEditRegionSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editRegionTarget) return;
    const name = editRegionName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhóm nước');
      return;
    }
    try {
      await updateRegionMutation.mutateAsync({
        id: editRegionTarget.id,
        body: {
          name,
          description: editRegionDesc.trim() || null,
          sortOrder: editRegionTarget.sortOrder,
          isActive: editRegionTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật nhóm nước "${name}"`);
      setEditRegionTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật nhóm nước'));
    }
  };

  const handleDeleteRegionConfirm = async () => {
    if (!deleteRegionTarget) return;
    try {
      await deleteRegionMutation.mutateAsync(deleteRegionTarget.id);
      showToast('success', `Đã xóa nhóm nước "${deleteRegionTarget.name}"`);
      setDeleteRegionTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhóm nước'));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleAddRegion} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newRegionName}
            onChange={e => setNewRegionName(e.target.value)}
            placeholder="Tên nhóm nước (VD: G7, EU, ĐNA, Châu Á, Khác...)"
            className="hrm-field-input flex-1"
            disabled={createRegionMutation.isPending}
          />
          <input
            type="text"
            value={newRegionDesc}
            onChange={e => setNewRegionDesc(e.target.value)}
            placeholder="Mô tả / Ghi chú (tuỳ chọn)"
            className="hrm-field-input sm:w-56"
            disabled={createRegionMutation.isPending}
          />
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
            disabled={createRegionMutation.isPending}
          >
            <Plus size={18} />
            Thêm nhóm
          </button>
        </form>

        <div className="hrm-recruitment-position-search">
          <SearchBar
            value={regionSearch}
            onChange={setRegionSearch}
            placeholder="Tìm theo tên nhóm nước hoặc mô tả..."
          />
        </div>

        {loadingRegions ? (
          <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
        ) : errorRegions ? (
          <div className="hrm-recruitment-positions-empty">Không thể tải danh sách nhóm nước.</div>
        ) : filteredRegions.length === 0 ? (
          <div className="hrm-recruitment-positions-empty">
            {regionSearch ? 'Không tìm thấy nhóm nước phù hợp.' : 'Chưa có nhóm nước nào.'}
          </div>
        ) : (
          <div className="hrm-recruitment-positions-grid">
            {filteredRegions.map(item => (
              <div
                key={item.id}
                className={`hrm-recruitment-position-card hrm-admin-role-card${
                  item.isActive ? '' : ' hrm-recruitment-position-card--inactive'
                }`}
              >
                <div className="hrm-admin-role-card__text min-w-0">
                  <span className="hrm-recruitment-position-card__name font-bold" title={item.name}>
                    {item.name}
                  </span>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 truncate" title={item.description}>
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="hrm-recruitment-position-card__actions">
                  <button
                    type="button"
                    onClick={() => openEditRegion(item)}
                    className="hrm-recruitment-position-card__delete"
                    title="Sửa nhóm nước"
                    aria-label={`Sửa nhóm nước ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleRegion(item)}
                    className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                    role="switch"
                    aria-checked={item.isActive}
                    title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                  >
                    <span className="hrm-toggle-switch__thumb" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteRegionTarget(item)}
                    className="hrm-recruitment-position-card__delete"
                    title="Xóa nhóm nước"
                    aria-label={`Xóa nhóm nước ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="hrm-recruitment-positions-meta">
          Tổng <strong>{filteredRegions.length}</strong> nhóm nước
          {regionSearch && <> · Đang lọc theo &ldquo;{regionSearch}&rdquo;</>}
        </p>
      </div>

      <Modal
        isOpen={editRegionTarget !== null}
        onClose={() => setEditRegionTarget(null)}
        title="Sửa nhóm nước"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditRegionTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateRegionMutation.isPending}
              onClick={() => void handleEditRegionSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditRegionSave} className="space-y-3">
          <FormField label="Tên nhóm nước" required>
            <input
              type="text"
              value={editRegionName}
              onChange={e => setEditRegionName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Mô tả / Diễn giải">
            <input
              type="text"
              value={editRegionDesc}
              onChange={e => setEditRegionDesc(e.target.value)}
              className="form-input w-full"
              placeholder="VD: Khối các nước công nghiệp tiên tiến..."
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteRegionTarget !== null}
        title="Xóa nhóm nước"
        message={
          deleteRegionTarget
            ? `Bạn có chắc muốn xóa nhóm nước "${deleteRegionTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteRegionConfirm}
        onClose={() => setDeleteRegionTarget(null)}
      />
    </>
  );
}
