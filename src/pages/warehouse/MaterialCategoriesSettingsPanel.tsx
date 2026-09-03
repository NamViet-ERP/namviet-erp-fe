import { useMemo, useState } from 'react';
import { Package, Plus, Trash2, RotateCcw } from 'lucide-react';
import HrmPanel from '../../components/hr/HrmPanel';
import IOSSwitch from '../../components/ui/IOSSwitch';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
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
  if (!parentId) return '-';
  return categories.find(c => c.id === parentId)?.name ?? '-';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
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

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleItems.slice(start, start + pageSize);
  }, [visibleItems, page, pageSize]);

  const resetFilters = () => {
    setSearch('');
    setParentId('');
    setPage(1);
  };

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
          parentId: item.parentId ?? null,
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
          parentId: item.parentId ?? null,
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

  const categoryColSpan = activeLevel > 1 ? 4 : 3;
  const emptyCategoryMessage =
    activeLevel > 1 && parentId === ''
      ? `Chọn ${MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} cha để xem danh sách.`
      : search
        ? 'Không tìm thấy.'
        : `Chưa có ${levelLabel.toLowerCase()} nào.`;

  return (
    <HrmPanel noPadding className="mat-cat-settings-board">
      <div className="mat-cat-settings-board__head">
        <Package size={18} aria-hidden />
        <div>
          <h2 className="mat-cat-settings-board__title">Cây vật tư</h2>
          <p className="mat-cat-settings-board__desc">
            Quản lý 5 cấp: Danh mục - Nhóm - Loại - Phân loại - Kiểu
          </p>
        </div>
      </div>

      <div className="mat-cat-levels" role="tablist" aria-label="Cấp cây vật tư">
        {MATERIAL_CATEGORY_LEVELS.map(lvl => {
          const isActive = activeLevel === lvl.level;
          return (
            <button
              key={lvl.level}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mat-cat-levels__btn${isActive ? ' is-active' : ''}`}
              onClick={() => { setActiveLevel(lvl.level); setParentId(''); setSearch(''); setPage(1); }}
            >
              {lvl.label}
            </button>
          );
        })}
      </div>

      <div className="mat-cat-settings-board__body">
        {activeLevel > 1 && (
          <label className="mat-cat-settings-board__parent">
            <span>{MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} (cha)</span>
            <select
              className="form-input form-input-md"
              value={parentId}
              onChange={e => { setParentId(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
            >
              <option value="">- Chọn {MATERIAL_CATEGORY_LEVELS[activeLevel - 2].label} -</option>
              {parentCandidates.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
        )}

        <form onSubmit={handleAdd} className="mat-cat-settings-board__add">
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
            className="btn btn-primary"
            disabled={createMutation.isPending || (activeLevel > 1 && parentId === '')}
          >
            <Plus size={16} aria-hidden />
            Thêm
          </button>
        </form>
      </div>

      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <div className="mat-cat-settings-board__toolbar">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder={`Tìm ${levelLabel.toLowerCase()}...`}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-text btn-sm"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={14} aria-hidden />
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell text-left">Tên {levelLabel.toLowerCase()}</th>
              {activeLevel > 1 && (
                <th className="table-header-cell text-left">Thuộc</th>
              )}
              <th className="table-header-cell text-center">Trạng thái</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={categoryColSpan} />
            ) : isError ? (
              <tr>
                <td colSpan={categoryColSpan}>
                  <EmptyState message={WMS_ERROR.loadCategories} />
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={categoryColSpan}>
                  <EmptyState message={emptyCategoryMessage} />
                </td>
              </tr>
            ) : (
              paginatedItems.map(item => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      {editingId === item.id ? (
                        <input
                          className="hrm-field-input w-full"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') void saveEdit(item);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className={!item.isActive ? 'mat-cat-settings-board__name--off' : undefined}>
                          {item.name}
                        </span>
                      )}
                    </td>
                    {activeLevel > 1 && (
                      <td className="table-cell">
                        {parentName(categories, item.parentId ?? null)}
                      </td>
                    )}
                    <td className="table-cell text-center">
                      <span className={item.isActive ? 'badge badge-success' : 'badge badge-error'}>
                        {item.isActive ? 'Đang dùng' : 'Tắt'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="mat-cat-settings-board__actions">
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
                        <IOSSwitch
                          checked={item.isActive}
                          onChange={() => void handleToggle(item)}
                          title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                          stopPropagation
                        />
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="mat-cat-settings-board__delete"
                          title="Xóa"
                          aria-label={`Xóa ${item.name}`}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && visibleItems.length > 0 && (
        <Pagination
          embedded
          itemLabel="mục"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          totalItems={visibleItems.length}
        />
      )}

      <div className="mat-cat-settings-board__foot">
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
            Không xóa được nếu còn mục con hoặc vật tư đang dùng.
          </>
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        isLoading={deleteMutation.isPending}
      />
    </HrmPanel>
  );
}
