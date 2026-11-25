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
  useCreateMaterialBrand,
  useDeleteMaterialBrand,
  useMaterialBrands,
  useUpdateMaterialBrand,
} from '../../../hooks/useMaterialBrands';
import type { MaterialBrandApiDto } from '../../../types/wms';

export default function BrandsTabPanel() {
  const brandsQuery = useMaterialBrands(false);
  const brands = useMemo(() => brandsQuery.data ?? [], [brandsQuery.data]);
  const loadingBrands = brandsQuery.isLoading;
  const errorBrands = brandsQuery.isError;

  const createBrandMutation = useCreateMaterialBrand();
  const updateBrandMutation = useUpdateMaterialBrand();
  const deleteBrandMutation = useDeleteMaterialBrand();

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [editBrandTarget, setEditBrandTarget] = useState<MaterialBrandApiDto | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandCountry, setEditBrandCountry] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<MaterialBrandApiDto | null>(null);

  const filteredBrands = useMemo(() => {
    let list = [...brands];
    if (brandSearch.trim()) {
      const q = brandSearch.trim().toLowerCase();
      list = list.filter(
        b => b.name.toLowerCase().includes(q) || (b.country && b.country.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [brands, brandSearch]);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhãn hiệu/hãng');
      return;
    }
    try {
      await createBrandMutation.mutateAsync({
        name,
        country: newBrandCountry.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm nhãn hiệu "${name}"`);
      setNewBrandName('');
      setNewBrandCountry('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm nhãn hiệu'));
    }
  };

  const handleToggleBrand = async (item: MaterialBrandApiDto) => {
    try {
      await updateBrandMutation.mutateAsync({
        id: item.id,
        body: {
          name: item.name,
          country: item.country,
          description: item.description,
          sortOrder: item.sortOrder,
          isActive: !item.isActive,
        },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditBrand = (item: MaterialBrandApiDto) => {
    setEditBrandTarget(item);
    setEditBrandName(item.name);
    setEditBrandCountry(item.country ?? '');
    setEditBrandDesc(item.description ?? '');
  };

  const handleEditBrandSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editBrandTarget) return;
    const name = editBrandName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhãn hiệu/hãng');
      return;
    }
    try {
      await updateBrandMutation.mutateAsync({
        id: editBrandTarget.id,
        body: {
          name,
          country: editBrandCountry.trim() || null,
          description: editBrandDesc.trim() || null,
          sortOrder: editBrandTarget.sortOrder,
          isActive: editBrandTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật nhãn hiệu "${name}"`);
      setEditBrandTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật nhãn hiệu'));
    }
  };

  const handleDeleteBrandConfirm = async () => {
    if (!deleteBrandTarget) return;
    try {
      await deleteBrandMutation.mutateAsync(deleteBrandTarget.id);
      showToast('success', `Đã xóa nhãn hiệu "${deleteBrandTarget.name}"`);
      setDeleteBrandTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhãn hiệu'));
    }
  };

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleAddBrand} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newBrandName}
            onChange={e => setNewBrandName(e.target.value)}
            placeholder="Tên hãng/nhãn hiệu (VD: Hòa Phát, Wilo, Ebara...)"
            className="hrm-field-input flex-1"
            disabled={createBrandMutation.isPending}
          />
          <input
            type="text"
            value={newBrandCountry}
            onChange={e => setNewBrandCountry(e.target.value)}
            placeholder="Quốc gia (tuỳ chọn)"
            className="hrm-field-input sm:w-44"
            disabled={createBrandMutation.isPending}
          />
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
            disabled={createBrandMutation.isPending}
          >
            <Plus size={18} />
            Thêm hãng
          </button>
        </form>

        <div className="hrm-recruitment-position-search">
          <SearchBar
            value={brandSearch}
            onChange={setBrandSearch}
            placeholder="Tìm theo tên hãng hoặc quốc gia..."
          />
        </div>

        {loadingBrands ? (
          <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
        ) : errorBrands ? (
          <div className="hrm-recruitment-positions-empty">Không thể tải danh sách nhãn hiệu.</div>
        ) : filteredBrands.length === 0 ? (
          <div className="hrm-recruitment-positions-empty">
            {brandSearch ? 'Không tìm thấy nhãn hiệu phù hợp.' : 'Chưa có nhãn hiệu nào.'}
          </div>
        ) : (
          <div className="hrm-recruitment-positions-grid">
            {filteredBrands.map(item => (
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
                    {item.country && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.country}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 truncate" title={item.description}>
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="hrm-recruitment-position-card__actions">
                  <button
                    type="button"
                    onClick={() => openEditBrand(item)}
                    className="hrm-recruitment-position-card__delete"
                    title="Sửa nhãn hiệu"
                    aria-label={`Sửa nhãn hiệu ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleBrand(item)}
                    className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                    role="switch"
                    aria-checked={item.isActive}
                    title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                  >
                    <span className="hrm-toggle-switch__thumb" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteBrandTarget(item)}
                    className="hrm-recruitment-position-card__delete"
                    title="Xóa nhãn hiệu"
                    aria-label={`Xóa nhãn hiệu ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="hrm-recruitment-positions-meta">
          Tổng <strong>{filteredBrands.length}</strong> nhãn hiệu/hãng
          {brandSearch && <> · Đang lọc theo &ldquo;{brandSearch}&rdquo;</>}
        </p>
      </div>

      <Modal
        isOpen={editBrandTarget !== null}
        onClose={() => setEditBrandTarget(null)}
        title="Sửa nhãn hiệu / hãng"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditBrandTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateBrandMutation.isPending}
              onClick={() => void handleEditBrandSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditBrandSave} className="space-y-3">
          <FormField label="Tên nhãn hiệu / hãng" required>
            <input
              type="text"
              value={editBrandName}
              onChange={e => setEditBrandName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Quốc gia (tuỳ chọn)">
            <input
              type="text"
              value={editBrandCountry}
              onChange={e => setEditBrandCountry(e.target.value)}
              className="form-input w-full"
              placeholder="VD: Việt Nam, Đức, Nhật Bản..."
            />
          </FormField>
          <FormField label="Mô tả / Ghi chú">
            <input
              type="text"
              value={editBrandDesc}
              onChange={e => setEditBrandDesc(e.target.value)}
              className="form-input w-full"
              placeholder="Ghi chú thêm về hãng..."
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteBrandTarget !== null}
        title="Xóa nhãn hiệu"
        message={
          deleteBrandTarget
            ? `Bạn có chắc muốn xóa nhãn hiệu "${deleteBrandTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteBrandConfirm}
        onClose={() => setDeleteBrandTarget(null)}
      />
    </>
  );
}
