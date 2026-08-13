import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, RotateCcw } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import MaterialUnitSelect from '../../components/warehouse/MaterialUnitSelect';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { useMaterials, useCreateMaterial } from '../../hooks/useMaterials';
import { useCategoryCascade } from '../../hooks/useCategories';
import MaterialDetailView from './MaterialDetailView';
import {
  MATERIAL_CATEGORY_LEVELS,
  MATERIAL_CREATE_REQUIRED_LEVELS,
  MATERIAL_FIELD_PLACEHOLDERS,
  MATERIAL_SELECT_PLACEHOLDER,
  MATERIAL_TABLE_COLUMNS,
  materialInputError,
  materialSelectError,
} from '../../constants/materialCategoryLevels';
import { categoryLevel, resolveLeafCategoryId } from '../../lib/wms/materialCategoryTree';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { MaterialApiDto } from '../../types/wms';

const emptySelection: Array<number | ''> = ['', '', '', '', ''];

function pathCell(m: MaterialApiDto, key: keyof MaterialApiDto['categoryPath']) {
  return m.categoryPath?.[key]?.trim() || '—';
}

/** Tách mã theo dấu `-` để hiển thị chip phân đoạn (prototype SCM-EPC). */
function materialCodeParts(code: string): string[] {
  return code.split('-').map(p => p.trim()).filter(Boolean);
}

function materialNameSubline(m: MaterialApiDto): string {
  return [m.qualityStandard, m.technicalSpec]
    .map(s => s?.trim())
    .filter(Boolean)
    .join(', ');
}

function isRequiredOnCreate(level: number) {
  return (MATERIAL_CREATE_REQUIRED_LEVELS as readonly number[]).includes(level);
}

export default function MaterialsPageRoute() {
  const location = useLocation();
  const initialHighlight = (location.state as { highlightCode?: string } | null)?.highlightCode;
  return <MaterialsPage key={location.key} initialHighlight={initialHighlight} />;
}

function MaterialsPage({ initialHighlight }: { initialHighlight?: string }) {
  const [search, setSearch] = useState(initialHighlight ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filterSelection, setFilterSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [detailCode, setDetailCode] = useState<string | null>(initialHighlight ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [createSelection, setCreateSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [createForm, setCreateForm] = useState({
    materialCode: '',
    materialName: '',
    unit: '',
    technicalSpec: '',
    qualityStandard: '',
    ceilingPrice: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const { optionsByLevel: filterOptions, isLoading: categoriesLoading } =
    useCategoryCascade(filterSelection);
  const { categories, optionsByLevel: createOptions, isLoading: createCategoriesLoading } =
    useCategoryCascade(createSelection);
  const createMutation = useCreateMaterial();

  const filterCategoryId = resolveLeafCategoryId(filterSelection);

  const listParams = {
    page,
    pageSize,
    search: search || undefined,
    categoryId: filterCategoryId,
    includeInactive: showInactive || undefined,
  };

  const { data, isLoading, isError } = useMaterials(listParams);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const setFilterLevel = (levelIndex: number, value: number | '') => {
    setFilterSelection(prev => {
      const next = [...prev];
      next[levelIndex] = value;
      for (let i = levelIndex + 1; i < 5; i++) next[i] = '';
      return next;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setFilterSelection([...emptySelection]);
    setSearch('');
    setPage(1);
  };

  const resetCreateForm = () => {
    setCreateSelection([...emptySelection]);
    setCreateForm({
      materialCode: '',
      materialName: '',
      unit: '',
      technicalSpec: '',
      qualityStandard: '',
      ceilingPrice: '',
    });
    setCreateErrors({});
  };

  const setCreateLevel = (levelIndex: number, value: number | '') => {
    setCreateSelection(prev => {
      const next = [...prev];
      next[levelIndex] = value;
      for (let i = levelIndex + 1; i < 5; i++) next[i] = '';
      return next;
    });
  };

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const lvl of MATERIAL_CREATE_REQUIRED_LEVELS) {
      if (createSelection[lvl - 1] === '') {
        const label = MATERIAL_CATEGORY_LEVELS[lvl - 1].label;
        errors[`level${lvl}`] = materialSelectError(label);
      }
    }
    if (!createForm.materialCode.trim()) errors.materialCode = materialInputError('mã vật tư');
    if (!createForm.materialName.trim()) errors.materialName = materialInputError('tên vật tư');
    if (!createForm.unit.trim()) errors.unit = materialSelectError('đơn vị tính');

    const categoryId = resolveLeafCategoryId(createSelection);
    if (categoryId && categoryLevel(categories, categoryId)! < 3) {
      errors.level3 = 'Vui lòng chọn đến cấp Loại vật tư';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    const categoryId = resolveLeafCategoryId(createSelection);
    if (!categoryId) return;

    try {
      await createMutation.mutateAsync({
        materialCode: createForm.materialCode.trim(),
        materialName: createForm.materialName.trim(),
        categoryId,
        unit: createForm.unit.trim(),
        technicalSpec: createForm.technicalSpec.trim() || null,
        qualityStandard: createForm.qualityStandard.trim() || null,
        ceilingPrice: createForm.ceilingPrice
          ? Number(String(createForm.ceilingPrice).replace(/[^\d.-]/g, '')) || null
          : null,
        isConsumable: false,
      });
      showToast('success', 'Đã tạo mã vật tư mới');
      setShowCreate(false);
      resetCreateForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo vật tư'));
    }
  };

  if (detailCode) {
    return (
      <MaterialDetailView
        code={detailCode}
        onBack={() => setDetailCode(null)}
      />
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Vận hành"
        title="Danh mục vật tư"
        actions={
          <PermissionGate permission="wms.materials.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2"
              onClick={() => { resetCreateForm(); setShowCreate(true); }}
            >
              <Plus size={16} />
              Tạo mã vật tư
            </button>
          </PermissionGate>
        }
      />

      <p className="text-xs text-[var(--md-on-surface-variant)] max-w-4xl">
        Lọc theo cây danh mục — chọn Danh mục trước, các cấp sau hiện theo nhánh đã chọn (không bắt buộc).
        Khi tạo mã vật tư: chọn ba cấp danh mục đầu và nhập mã, tên vật tư.
      </p>

      <div className="surface-panel surface-panel--rounded-xl p-4 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => (
            <label key={lvl.key} className="text-xs space-y-1">
              <span className="font-semibold text-[var(--md-on-surface-variant)]">{lvl.label}</span>
              <select
                className="form-select w-full text-sm"
                disabled={categoriesLoading || (idx > 0 && filterSelection[idx - 1] === '')}
                value={filterSelection[idx]}
                onChange={e => {
                  const v = e.target.value;
                  setFilterLevel(idx, v === '' ? '' : Number(v));
                }}
              >
                <option value="">— Tất cả —</option>
                {filterOptions[idx]
                  ?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED')
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </label>
          ))}
        </div>
        <div className="hrm-filter-bar">
          <div className="hrm-filter-bar__search flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã vật tư, tên vật tư..."
            />
          </div>
          <button
            type="button"
            onClick={() => { setShowInactive(v => !v); setPage(1); }}
            className={`h-10 px-3 flex items-center gap-2 rounded whitespace-nowrap text-sm font-semibold border ${
              showInactive
                ? 'bg-[var(--md-secondary-container)] border-[var(--md-outline)] text-[var(--md-on-secondary-container)]'
                : 'border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)]'
            }`}
          >
            {showInactive ? 'Đang hiện cả ngừng SD' : 'Chỉ đang dùng'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-clear-filters"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">XÓA BỘ LỌC</span>
          </button>
        </div>
      </div>

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-xs table-min-w--1400">
            <thead>
              <tr>
                {MATERIAL_TABLE_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`table-header-cell text-left whitespace-nowrap${col.key === 'ceilingPrice' ? ' mat-col-ceiling' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={MATERIAL_TABLE_COLUMNS.length} />
              ) : isError ? (
                <tr>
                  <td colSpan={MATERIAL_TABLE_COLUMNS.length}>
                    <EmptyState message={WMS_ERROR.loadMaterials} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={MATERIAL_TABLE_COLUMNS.length}>
                    <EmptyState message={WMS_EMPTY.noMaterials} />
                  </td>
                </tr>
              ) : (
                items.map(m => {
                  const codeParts = materialCodeParts(m.materialCode);
                  const nameSub = materialNameSubline(m);
                  return (
                  <tr
                    key={m.materialCode}
                    className="table-row border-b border-[var(--md-outline-variant)] cursor-pointer hover:bg-[var(--md-surface-container-high)]"
                    onClick={() => setDetailCode(m.materialCode)}
                  >
                    <td className="table-cell">
                      <div className="mat-code-cell">
                        <span className="mat-code-cell__badge">{m.materialCode}</span>
                        {codeParts.length > 1 && (
                          <div className="mat-code-cell__parts" aria-hidden>
                            {codeParts.map((part, i) => (
                              <span
                                key={`${m.materialCode}-${i}`}
                                className={`mat-code-cell__part mat-code-cell__part--${(i % 4) + 1}`}
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.isActive === false && (
                          <span className="wms-badge-inactive">Ngừng SD</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="mat-name-cell">
                        <span className="mat-name-cell__title">{m.materialName}</span>
                        {nameSub ? <span className="mat-name-cell__sub">{nameSub}</span> : null}
                      </div>
                    </td>
                    <td className="table-cell">{pathCell(m, 'danhMuc')}</td>
                    <td className="table-cell">{pathCell(m, 'nhomVatTu')}</td>
                    <td className="table-cell">{pathCell(m, 'loaiVatTu')}</td>
                    <td className="table-cell">{pathCell(m, 'phanLoai')}</td>
                    <td className="table-cell">{pathCell(m, 'kieu')}</td>
                    <td className="table-cell">{m.technicalSpec ?? '—'}</td>
                    <td className="table-cell">{m.qualityStandard ?? '—'}</td>
                    <td className="table-cell table-cell--money mat-col-ceiling">
                      {m.ceilingPrice != null ? formatCurrencyFull(m.ceilingPrice) : '—'}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalCount > 0 && !isLoading && (
          <div className="surface-panel__footer px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              totalItems={totalCount}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetCreateForm(); }}
        title="Tạo mã vật tư mới"
        size="xl"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setShowCreate(false); resetCreateForm(); }}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={createMutation.isPending}
              onClick={() => void handleCreate()}
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo mới'}
            </button>
          </>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          {!createCategoriesLoading && (createOptions[0]?.length ?? 0) === 0 && (
            <p className="alert-banner alert-banner--error text-xs">
              Chưa có dữ liệu cây vật tư. Vào <strong>Vận hành → Thiết lập → Cây vật tư</strong> để khai báo trước khi tạo vật tư mới.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => (
              <FormField
                key={lvl.key}
                label={lvl.label}
                required={isRequiredOnCreate(lvl.level)}
                error={createErrors[`level${lvl.level}`]}
              >
                <select
                  className="form-select w-full text-sm"
                  disabled={createCategoriesLoading || (idx > 0 && createSelection[idx - 1] === '')}
                  value={createSelection[idx]}
                  onChange={e => {
                    const v = e.target.value;
                    setCreateLevel(idx, v === '' ? '' : Number(v));
                  }}
                >
                  <option value="">{MATERIAL_SELECT_PLACEHOLDER}</option>
                  {createOptions[idx]
                    ?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED')
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </FormField>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Mã vật tư" required error={createErrors.materialCode}>
              <input
                className="form-input w-full text-sm"
                value={createForm.materialCode}
                onChange={e => setCreateForm(f => ({ ...f, materialCode: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialCode}
              />
            </FormField>
            <FormField label="Tên vật tư" required error={createErrors.materialName}>
              <input
                className="form-input w-full text-sm"
                value={createForm.materialName}
                onChange={e => setCreateForm(f => ({ ...f, materialName: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialName}
              />
            </FormField>
            <MaterialUnitSelect
              value={createForm.unit}
              onChange={unit => setCreateForm(f => ({ ...f, unit }))}
              required
              error={createErrors.unit}
            />
            <FormField label="Quy cách">
              <input
                className="form-input w-full text-sm"
                value={createForm.technicalSpec}
                onChange={e => setCreateForm(f => ({ ...f, technicalSpec: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
              />
            </FormField>
            <FormField label="Tiêu chuẩn chất lượng" className="sm:col-span-2">
              <input
                className="form-input w-full text-sm"
                value={createForm.qualityStandard}
                onChange={e => setCreateForm(f => ({ ...f, qualityStandard: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.qualityStandard}
              />
            </FormField>
            <FormField label="Giá trần tham chiếu">
              <CurrencyInput
                value={createForm.ceilingPrice}
                onChange={ceilingPrice => setCreateForm(f => ({ ...f, ceilingPrice }))}
                placeholder="Dùng cảnh báo khi mua vượt giá"
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
