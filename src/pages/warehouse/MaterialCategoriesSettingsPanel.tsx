import { useMemo, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchBar from '../../components/ui/SearchBar';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories';
import { MATERIAL_CATEGORY_LEVELS } from '../../constants/materialCategoryLevels';
import { generateCategoryCode } from '../../services/categoriesService';
import type { MaterialCategoryApiDto } from '../../types/wms';

function parentName(categories: MaterialCategoryApiDto[], parentId: number | null): string {
  if (!parentId) return '—';
  return categories.find(c => c.id === parentId)?.name ?? '—';
}

export default function MaterialCategoriesSettingsPanel() {
  const { data: categories = [], isLoading, isError } = useCategoryTree();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [activeLevel, setActiveLevel] = useState(1);
  const [parentId, setParentId] = useState<number | ''>('');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MaterialCategoryApiDto | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const parentLevel = activeLevel - 1;
  const parentCandidates = useMemo(() => {
    if (activeLevel <= 1) return [];
    return categories
      .filter(c => c.level === parentLevel && c.isActive && c.code !== 'UNCATEGORIZED')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'));
  }, [categories, activeLevel, parentLevel]);

  const visibleItems = useMemo(() => {
    let items = categories.filter(
      c => c.level === activeLevel && c.code !== 'UNCATEGORIZED',
    );
    if (activeLevel > 1 && parentId !== '') {
      items = items.filter(c => c.parentId === parentId);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(c => c.name.toLowerCase().includes(q));
    }
    return items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'));
  }, [categories, activeLevel, parentId, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên danh mục');
      return;
    }
    if (activeLevel > 1 && parentId === '') {
      showToast('warning', `Chọn ${MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} cha trước`);
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: generateCategoryCode(),
        name,
        level: activeLevel,
        parentId: activeLevel === 1 ? null : (parentId as number),
        sortOrder: visibleItems.length,
        isActive: true,
      });
      showToast('success', `Đã thêm "${name}"`);
      setNewName('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm danh mục'));
    }
  };

  const handleToggle = async (item: MaterialCategoryApiDto) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        body: {
          code: item.code,
          name: item.name,
          level: item.level,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          isActive: !item.isActive,
        },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const startEdit = (item: MaterialCategoryApiDto) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = async (item: MaterialCategoryApiDto) => {
    const name = editName.trim();
    if (!name) {
      showToast('warning', 'Tên không được để trống');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        body: {
          code: item.code,
          name,
          level: item.level,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        },
      });
      setEditingId(null);
      showToast('success', 'Đã cập nhật tên');
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
      showToast('error', getApiErrorMessage(err, 'Không thể xóa danh mục'));
    }
  };

  const levelLabel = MATERIAL_CATEGORY_LEVELS[activeLevel - 1]?.label ?? `Cấp ${activeLevel}`;
  const totalAtLevel = categories.filter(
    c => c.level === activeLevel && c.code !== 'UNCATEGORIZED',
  ).length;

  return (
    <div
      className="rounded-2xl p-6 shadow-card"
      style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline-variant)' }}
        >
          <Package size={20} style={{ color: 'var(--md-primary)' }} />
        </div>
        <div>
          <h3 className="font-bold text-lg uppercase" style={{ color: 'var(--md-on-surface)' }}>
            CÂY VẬT TƯ
          </h3>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
            Quản lý 5 cấp: Danh mục → Nhóm → Loại → Phân loại → Kiểu (một bảng <code>material_categories</code>)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {MATERIAL_CATEGORY_LEVELS.map(lvl => (
          <button
            key={lvl.level}
            type="button"
            className={`btn btn-sm ${activeLevel === lvl.level ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveLevel(lvl.level); setParentId(''); setSearch(''); }}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {activeLevel > 1 && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-[var(--md-on-surface-variant)]">
            {MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} (cha)
          </label>
          <select
            className="form-select w-full mt-1 text-sm"
            value={parentId}
            onChange={e => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">— Chọn {MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} —</option>
            {parentCandidates.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={`Thêm ${levelLabel} mới...`}
          className="hrm-field-input flex-1"
          disabled={createMutation.isPending || (activeLevel > 1 && parentId === '')}
        />
        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2 px-4 h-10"
          disabled={createMutation.isPending || (activeLevel > 1 && parentId === '')}
        >
          <Plus size={18} />
          Thêm
        </button>
      </form>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Tìm ${levelLabel.toLowerCase()}...`}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-[var(--md-on-surface-variant)]">Đang tải...</div>
      ) : isError ? (
        <div className="text-center py-8 text-sm text-[var(--md-error)]">
          Không tải được cây vật tư. Kiểm tra API và khởi động lại backend.
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--md-on-surface-variant)]">
          {activeLevel > 1 && parentId === ''
            ? `Chọn ${MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} cha để xem danh sách.`
            : search
              ? 'Không tìm thấy.'
              : `Chưa có ${levelLabel.toLowerCase()} nào.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
          {visibleItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-3 rounded-xl"
              style={{
                background: item.isActive ? 'var(--md-surface-container-low)' : 'rgba(0,0,0,0.05)',
                border: '1px solid var(--md-outline-variant)',
                opacity: item.isActive ? 1 : 0.65,
              }}
            >
              <div className="min-w-0 flex-1">
                {editingId === item.id ? (
                  <input
                    className="hrm-field-input w-full text-sm"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') void saveEdit(item);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    {activeLevel > 1 && (
                      <div className="text-[10px] text-[var(--md-on-surface-variant)] truncate">
                        Thuộc: {parentName(categories, item.parentId)}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === item.id ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => void saveEdit(item)}
                  >
                    Lưu
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => startEdit(item)}
                  >
                    Sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggle(item)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    item.isActive ? 'bg-[var(--md-primary)]' : 'bg-gray-400'
                  }`}
                  role="switch"
                  aria-checked={item.isActive}
                  title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      item.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="text-[var(--md-error)] p-1 rounded-lg hover:bg-[var(--md-error-container)]"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="mt-4 pt-3 flex justify-between text-xs text-[var(--md-on-surface-variant)]"
        style={{ borderTop: '1px solid var(--md-outline-variant)' }}
      >
        <span>Tổng {levelLabel}: <strong>{totalAtLevel}</strong></span>
        <span>Đang hiển thị: <strong>{visibleItems.length}</strong></span>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa danh mục"
        message={
          <>
            Xóa <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
            <br />
            <span className="text-[13px] opacity-85">Không xóa được nếu còn mục con hoặc vật tư đang dùng.</span>
          </>
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
