import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, RotateCcw } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
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
  return m.categoryPath?.[key]?.trim() || '-';
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
    generalTechnicalSpec: '',
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
      generalTechnicalSpec: '',
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
    if (categoryId && categoryLevel(categories, categoryId)! < 2) {
      errors.level2 = 'Vui lòng chọn đến cấp Nhóm vật tư';
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
        generalTechnicalSpec: createForm.generalTechnicalSpec.trim() || null,
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
    <div className="page-shell mat-catalog">
      <PageHeader
        eyebrow="SLC"
        title="Danh mục vật tư"
        subtitle="Lọc theo cây 5 cấp, bấm dòng để mở chi tiết."
        actions={
          <PermissionGate permission="wms.materials.create">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { resetCreateForm(); setShowCreate(true); }}
            >
              <Plus size={16} aria-hidden />
              Tạo mã vật tư
            </button>
          </PermissionGate>
        }
      />

      <div className="mat-catalog__help">
        Chọn Danh mục trước, các cấp sau hiện theo nhánh đã chọn (không bắt buộc).
        Khi tạo mã: chọn ba cấp đầu rồi nhập mã và tên vật tư.
      </div>

      <HrmPanel noPadding className="mat-catalog-board">
        <div className="mat-catalog-board__head">
          <h2 className="mat-catalog-board__title">Danh sách mã vật tư</h2>
          <p className="mat-catalog-board__desc">
            Mã hiển thị theo phân đoạn cây vật tư. Bấm dòng để mở chi tiết.
          </p>
        </div>

        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <div className="mat-catalog__filters">
              {MATERIAL_CATEGORY_LEVELS.map((lvl, idx) => (
                <label key={lvl.key} className="mat-catalog__filter-field">
                  <span>{lvl.label}</span>
                  <select
                    className="form-input form-input-md"
                    disabled={categoriesLoading || (idx > 0 && filterSelection[idx - 1] === '')}
                    value={filterSelection[idx]}
                    onChange={e => {
                      const v = e.target.value;
                      setFilterLevel(idx, v === '' ? '' : Number(v));
                    }}
                  >
                    <option value="">- Tất cả -</option>
                    {filterOptions[idx]
                      ?.filter(c => idx > 0 || c.code !== 'UNCATEGORIZED')
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mat-catalog__toolbar">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Tìm mã vật tư, tên vật tư..."
              />
              <button
                type="button"
                onClick={() => { setShowInactive(v => !v); setPage(1); }}
                className={`mat-catalog__status${showInactive ? ' is-on' : ''}`}
                aria-pressed={showInactive}
              >
                {showInactive ? 'Hiện cả ngừng SD' : 'Chỉ đang dùng'}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-text"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw size={14} aria-hidden />
                Xóa lọc
              </button>
            </div>
          </div>
        </div>

        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
          <table className="wms-inventory-table mat-catalog-table">
            <thead>
              <tr>
                {MATERIAL_TABLE_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`table-header-cell text-left whitespace-nowrap${col.key === 'ceilingPrice' ? ' mat-col-ceiling' : ''}${col.key === 'generalTechnicalSpec' ? ' mat-col-general-spec' : ''}`}
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
                    className="table-row cursor-pointer"
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
                          <span className="badge badge-warning">Ngừng SD</span>
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
                    <td className="table-cell">{m.technicalSpec ?? '-'}</td>
                    <td className="table-cell mat-col-general-spec">
                      <div className="mat-spec-cell" title={m.generalTechnicalSpec ?? undefined}>
                        {m.generalTechnicalSpec?.trim() || '-'}
                      </div>
                    </td>
                    <td className="table-cell">{m.qualityStandard ?? '-'}</td>
                    <td className="table-cell table-cell--money mat-col-ceiling">
                      {m.ceilingPrice != null ? formatCurrencyFull(m.ceilingPrice) : '-'}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalCount > 0 && !isLoading && (
          <Pagination
            embedded
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={totalCount}
          />
        )}
      </HrmPanel>

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
        <div className="space-y-4 modal-form-bordered mat-catalog-create">
          {!createCategoriesLoading && (createOptions[0]?.length ?? 0) === 0 && (
            <p className="alert-banner alert-banner--error">
              Chưa có dữ liệu cây vật tư. Vào <strong>SLC - Thiết lập - Cây vật tư</strong> để khai báo trước khi tạo vật tư mới.
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
                  className="form-input form-input-md w-full"
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
                className="form-input w-full"
                value={createForm.materialCode}
                onChange={e => setCreateForm(f => ({ ...f, materialCode: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.materialCode}
              />
            </FormField>
            <FormField label="Tên vật tư" required error={createErrors.materialName}>
              <input
                className="form-input w-full"
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
                className="form-input w-full"
                value={createForm.technicalSpec}
                onChange={e => setCreateForm(f => ({ ...f, technicalSpec: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
              />
            </FormField>
            <FormField label="Thông số kỹ thuật chung" className="sm:col-span-2">
              <textarea
                className="form-input w-full"
                rows={4}
                value={createForm.generalTechnicalSpec}
                onChange={e => setCreateForm(f => ({ ...f, generalTechnicalSpec: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
              />
            </FormField>
            <FormField label="Tiêu chuẩn chất lượng" className="sm:col-span-2">
              <input
                className="form-input w-full"
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
