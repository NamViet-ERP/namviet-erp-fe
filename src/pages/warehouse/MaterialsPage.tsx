import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, Image as ImageIcon, Trash2, Upload, Package } from 'lucide-react';
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
import MaterialCountrySelect from '../../components/warehouse/MaterialCountrySelect';
import MaterialBrandSelect from '../../components/warehouse/MaterialBrandSelect';
import { useMaterialRegions } from '../../hooks/useMaterialRegions';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { useMaterials, useCreateMaterial } from '../../hooks/useMaterials';
import { useCategoryCascade } from '../../hooks/useCategories';
import { materialsService } from '../../services/materialsService';
import { queryKeys } from '../../services/queryKeys';
import { resolveMediaUrl } from '../../lib/hrm/employeeApiMapper';
import MaterialDetailView from './MaterialDetailView';
import MaterialImportModal from './MaterialImportModal';
import {
  MATERIAL_CATEGORY_LEVELS,
  MATERIAL_CREATE_REQUIRED_LEVELS,
  MATERIAL_FIELD_PLACEHOLDERS,
  MATERIAL_SELECT_PLACEHOLDER,
  MATERIAL_TABLE_COLUMNS,
  REGION_OPTIONS,
  formatOriginString,
  isEquipmentCategory,
  isSteelCategory,
  materialInputError,
  materialSelectError,
  parseOriginParts,
} from '../../constants/materialCategoryLevels';
import { categoryLevel, resolveLeafCategoryId } from '../../lib/wms/materialCategoryTree';
import CurrencyInput from '../../components/ui/CurrencyInput';

const emptySelection: Array<number | ''> = ['', '', '', '', ''];

function isRequiredOnCreate(level: number) {
  return (MATERIAL_CREATE_REQUIRED_LEVELS as readonly number[]).includes(level);
}

export default function MaterialsPageRoute() {
  const location = useLocation();
  const initialHighlight = (location.state as { highlightCode?: string } | null)?.highlightCode;
  return <MaterialsPage key={location.key} initialHighlight={initialHighlight} />;
}

function MaterialsPage({ initialHighlight }: { initialHighlight?: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState(initialHighlight ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filterSelection, setFilterSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [detailCode, setDetailCode] = useState<string | null>(initialHighlight ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [createSelection, setCreateSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [createForm, setCreateForm] = useState({
    materialCode: '',
    materialName: '',
    unit: '',
    origin: '',
    technicalSpec: '',
    generalTechnicalSpec: '',
    qualityStandard: '',
    ceilingPrice: '',
    imageUrl: '',
  });
  // 3-part Origin state
  const [originBrand, setOriginBrand] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [originRegion, setOriginRegion] = useState('');

  // Dynamic Steel geometry state
  const [steelDimension, setSteelDimension] = useState('');
  const [steelThickness, setSteelThickness] = useState('');
  const [steelLength, setSteelLength] = useState('');
  const [steelGrade, setSteelGrade] = useState('');

  // Dynamic Equipment / Pump / Fan specs state
  const [pumpPower, setPumpPower] = useState('');
  const [pumpFlow, setPumpFlow] = useState('');
  const [pumpPressure, setPumpPressure] = useState('');
  const [pumpVoltage, setPumpVoltage] = useState('');
  const [pumpDrive, setPumpDrive] = useState('');

  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const { optionsByLevel: filterOptions, isLoading: categoriesLoading } =
    useCategoryCascade(filterSelection);
  const { categories, optionsByLevel: createOptions, isLoading: createCategoriesLoading } =
    useCategoryCascade(createSelection);
  const createMutation = useCreateMaterial();

  const selectedL1Cat = categories.find(c => c.id === createSelection[0]);
  const isSteel = isSteelCategory(selectedL1Cat?.name);
  const isEquipment = isEquipmentCategory(selectedL1Cat?.name);

  const { data: dbRegions = [] } = useMaterialRegions(true);
  const regionOptions = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const add = (name?: string | null) => {
      const t = name?.trim();
      if (!t) return;
      const k = t.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        list.push(t);
      }
    };
    dbRegions.forEach(r => add(r.name));
    REGION_OPTIONS.forEach(r => add(r));
    return list;
  }, [dbRegions]);

  const updateOrigin = (brand: string, country: string, region: string) => {
    setOriginBrand(brand);
    setOriginCountry(country);
    setOriginRegion(region);
    setCreateForm(f => ({ ...f, origin: formatOriginString(brand, country, region) }));
  };

  const updateSteel = (dim: string, thick: string, len: string, grade: string) => {
    setSteelDimension(dim);
    setSteelThickness(thick);
    setSteelLength(len);
    setSteelGrade(grade);
    const dims = [dim.trim(), thick.trim(), len.trim()].filter(Boolean);
    const spec = dims.length > 0 ? dims.join('x') + (dims.some(d => d.endsWith('mm')) ? '' : 'mm') : '';
    setCreateForm(f => ({
      ...f,
      technicalSpec: spec,
      qualityStandard: grade.trim() || f.qualityStandard,
    }));
  };

  const updatePump = (power: string, flow: string, pressure: string, voltage: string, drive: string) => {
    setPumpPower(power);
    setPumpFlow(flow);
    setPumpPressure(pressure);
    setPumpVoltage(voltage);
    setPumpDrive(drive);
    const parts = [
      power.trim() && (power.toLowerCase().endsWith('kw') ? power.trim() : `${power.trim()}kW`),
      flow.trim() && (flow.toLowerCase().includes('m3') ? flow.trim() : `${flow.trim()} m³/h`),
      pressure.trim() && (pressure.toLowerCase().includes('pa') || pressure.toLowerCase().includes('h2o') ? pressure.trim() : `${pressure.trim()} Pa`),
      voltage.trim() && `Điện áp ${voltage.trim()}`,
      drive.trim(),
    ].filter(Boolean);
    setCreateForm(f => ({
      ...f,
      generalTechnicalSpec: parts.join(' | '),
    }));
  };

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
      origin: '',
      technicalSpec: '',
      generalTechnicalSpec: '',
      qualityStandard: '',
      ceilingPrice: '',
      imageUrl: '',
    });
    setOriginBrand('');
    setOriginCountry('');
    setOriginRegion('');
    setSteelDimension('');
    setSteelThickness('');
    setSteelLength('');
    setSteelGrade('');
    setPumpPower('');
    setPumpFlow('');
    setPumpPressure('');
    setPumpVoltage('');
    setPumpDrive('');
    setCreateImageFile(null);
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImagePreview(null);
    setCreateErrors({});
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('warning', 'Kích thước ảnh tối đa là 10MB');
      return;
    }
    setCreateImageFile(file);
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setCreateImageFile(null);
    if (createImagePreview) URL.revokeObjectURL(createImagePreview);
    setCreateImagePreview(null);
    setCreateForm(f => ({ ...f, imageUrl: '' }));
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
      let finalImageUrl = createForm.imageUrl.trim() || null;
      if (createImageFile) {
        setIsUploadingImage(true);
        try {
          const res = await materialsService.uploadImage(createImageFile, createForm.materialCode.trim());
          finalImageUrl = res.imageUrl;
        } catch (uploadErr) {
          showToast('error', getApiErrorMessage(uploadErr, 'Không thể tải ảnh lên'));
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }

      await createMutation.mutateAsync({
        materialCode: createForm.materialCode.trim(),
        materialName: createForm.materialName.trim(),
        categoryId,
        unit: createForm.unit.trim(),
        origin: createForm.origin.trim() || null,
        imageUrl: finalImageUrl,
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
        eyebrow="Danh mục Vật tư"
        title="Danh mục vật tư"
        subtitle="Lọc theo cây 5 cấp, bấm dòng để mở chi tiết."
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate permission="wms.materials.create">
              <button
                type="button"
                className="btn btn-outline flex items-center gap-1.5"
                onClick={() => setShowImport(true)}
              >
                <Upload size={16} aria-hidden />
                Nhập Excel
              </button>
            </PermissionGate>
            <PermissionGate permission="wms.materials.create">
              <button
                type="button"
                className="btn btn-primary flex items-center gap-1.5"
                onClick={() => { resetCreateForm(); setShowCreate(true); }}
              >
                <Plus size={16} aria-hidden />
                Tạo mã vật tư
              </button>
            </PermissionGate>
          </div>
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
                    className={`table-header-cell text-left whitespace-nowrap${col.key === 'unit' ? ' text-center w-24' : ''}${col.key === 'image' ? ' text-center w-12' : ''}`}
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
                  const parsedOrigin = parseOriginParts(m.origin);
                  const categoryBreadcrumb = [
                    m.categoryPath?.danhMuc,
                    m.categoryPath?.nhomVatTu,
                    m.categoryPath?.loaiVatTu,
                  ]
                    .filter(Boolean)
                    .join(' › ');

                  return (
                    <tr
                      key={m.materialCode}
                      className="table-row cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setDetailCode(m.materialCode)}
                    >
                      {/* 1. Ảnh */}
                      <td className="table-cell text-center" style={{ width: '48px', minWidth: '48px' }}>
                        {m.imageUrl?.trim() ? (
                          <img
                            src={resolveMediaUrl(m.imageUrl.trim())}
                            alt={m.materialName}
                            className="w-9 h-9 object-cover rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] inline-block shadow-2xs"
                            onError={e => {
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              const sibling = img.nextElementSibling as HTMLElement | null;
                              if (sibling) sibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-9 h-9 rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] flex items-center justify-center mx-auto text-xs font-medium"
                          style={{ display: m.imageUrl?.trim() ? 'none' : 'flex' }}
                        >
                          <Package size={16} className="opacity-40" />
                        </div>
                      </td>

                      {/* 2. Mã & Tên vật tư */}
                      <td className="table-cell">
                        <div className="flex flex-col gap-1 py-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                              {m.materialCode}
                            </span>
                            {m.isActive === false && (
                              <span className="badge badge-warning text-[10px] py-0 px-1.5">Ngừng SD</span>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-slate-900 leading-snug">
                            {m.materialName}
                          </span>
                          {m.qualityStandard && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              Tiêu chuẩn: <span className="text-slate-700 font-medium">{m.qualityStandard}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Phân cấp danh mục (Breadcrumb gộp 5 cấp) */}
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <span className="text-xs font-semibold text-slate-800">
                            {categoryBreadcrumb || '-'}
                          </span>
                          {(m.categoryPath?.phanLoai || m.categoryPath?.kieu) && (
                            <span className="text-[11px] text-slate-400">
                              {[m.categoryPath?.phanLoai, m.categoryPath?.kieu].filter(Boolean).join(' › ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. ĐVT */}
                      <td className="table-cell text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100/80 text-slate-700 text-xs font-semibold border border-slate-200/60 shadow-2xs">
                          {m.unit || '-'}
                        </span>
                      </td>

                      {/* 5. Quy cách / Thông số chính */}
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5 py-0.5 max-w-sm">
                          {m.technicalSpec ? (
                            <span className="text-xs font-bold text-slate-800">
                              {m.technicalSpec}
                            </span>
                          ) : null}
                          {m.generalTechnicalSpec ? (
                            <span className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={m.generalTechnicalSpec}>
                              {m.generalTechnicalSpec}
                            </span>
                          ) : null}
                          {!m.technicalSpec && !m.generalTechnicalSpec && (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Hãng & Xuất xứ (Gộp 3 cấp) */}
                      <td className="table-cell whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 py-0.5">
                          {parsedOrigin.brand ? (
                            <span className="text-xs font-bold text-slate-900">
                              {parsedOrigin.brand}
                            </span>
                          ) : null}
                          {parsedOrigin.country ? (
                            <span className="text-[11px] text-slate-600 font-medium">
                              {parsedOrigin.country}
                              {parsedOrigin.region ? (
                                <span className="ml-1 inline-block px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                                  {parsedOrigin.region}
                                </span>
                              ) : null}
                            </span>
                          ) : !parsedOrigin.brand ? (
                            <span className="text-xs text-slate-600">{m.origin || '-'}</span>
                          ) : null}
                        </div>
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
              disabled={createMutation.isPending || isUploadingImage}
              onClick={() => void handleCreate()}
            >
              {isUploadingImage ? 'Đang tải ảnh...' : createMutation.isPending ? 'Đang lưu...' : 'Tạo mới'}
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
            {/* Cụm Xuất xứ 3 cấp: Nhãn hiệu / Nước sản xuất / Nhóm nước */}
            <div className="sm:col-span-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Xuất xứ & Nhãn hiệu
                </span>
                {createForm.origin && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Chuỗi: {createForm.origin}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <MaterialBrandSelect
                  value={originBrand}
                  onChange={brand => updateOrigin(brand, originCountry, originRegion)}
                />
                <MaterialCountrySelect
                  value={originCountry}
                  onChange={(country, defaultRegion) => {
                    const nextRegion = defaultRegion || originRegion;
                    updateOrigin(originBrand, country, nextRegion);
                  }}
                />
                <FormField label="Nhóm nước">
                  <select
                    className="form-input w-full"
                    value={originRegion}
                    onChange={e => updateOrigin(originBrand, originCountry, e.target.value)}
                  >
                    <option value="">-- Chọn nhóm nước --</option>
                    {regionOptions.map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            {isSteel ? (
              /* Cụm thông số hình học cho Thép / Kim khí */
              <div className="sm:col-span-2 p-3 rounded-lg border border-blue-200 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    Thông số hình học (Thép & Nguyên vật liệu)
                  </span>
                  {createForm.technicalSpec && (
                    <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                      Quy cách: {createForm.technicalSpec}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <FormField label="Phi / Rộng (mm)">
                    <input
                      className="form-input w-full"
                      value={steelDimension}
                      onChange={e => updateSteel(e.target.value, steelThickness, steelLength, steelGrade)}
                      placeholder="VD: Ø355 hoặc 1500"
                    />
                  </FormField>
                  <FormField label="Độ dày (mm)">
                    <input
                      className="form-input w-full"
                      value={steelThickness}
                      onChange={e => updateSteel(steelDimension, e.target.value, steelLength, steelGrade)}
                      placeholder="VD: 9 hoặc 4"
                    />
                  </FormField>
                  <FormField label="Chiều dài (mm)">
                    <input
                      className="form-input w-full"
                      value={steelLength}
                      onChange={e => updateSteel(steelDimension, steelThickness, e.target.value, steelGrade)}
                      placeholder="VD: 6000"
                    />
                  </FormField>
                  <FormField label="Mác thép / Tiêu chuẩn">
                    <input
                      className="form-input w-full"
                      value={steelGrade}
                      onChange={e => updateSteel(steelDimension, steelThickness, steelLength, e.target.value)}
                      placeholder="VD: SS400, SA516"
                    />
                  </FormField>
                </div>
              </div>
            ) : isEquipment ? (
              /* Cụm thông số kỹ thuật cho Động cơ / Bơm / Quạt */
              <div className="sm:col-span-2 p-3 rounded-lg border border-amber-200 bg-amber-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                    Thông số cơ điện (Động cơ / Bơm / Quạt)
                  </span>
                  {createForm.generalTechnicalSpec && (
                    <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-2xs max-w-xs truncate">
                      {createForm.generalTechnicalSpec}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <FormField label="Công suất (kW)">
                    <input
                      className="form-input w-full"
                      value={pumpPower}
                      onChange={e => updatePump(e.target.value, pumpFlow, pumpPressure, pumpVoltage, pumpDrive)}
                      placeholder="VD: 160kW hoặc 5.5kW"
                    />
                  </FormField>
                  <FormField label="Lưu lượng (m³/h)">
                    <input
                      className="form-input w-full"
                      value={pumpFlow}
                      onChange={e => updatePump(pumpPower, e.target.value, pumpPressure, pumpVoltage, pumpDrive)}
                      placeholder="VD: 71500 m³/h"
                    />
                  </FormField>
                  <FormField label="Cột áp (Pa / mH2O)">
                    <input
                      className="form-input w-full"
                      value={pumpPressure}
                      onChange={e => updatePump(pumpPower, pumpFlow, e.target.value, pumpVoltage, pumpDrive)}
                      placeholder="VD: 5600Pa hoặc 24-42 mH2O"
                    />
                  </FormField>
                  <FormField label="Điện áp">
                    <input
                      className="form-input w-full"
                      value={pumpVoltage}
                      onChange={e => updatePump(pumpPower, pumpFlow, pumpPressure, e.target.value, pumpDrive)}
                      placeholder="VD: 3phase/380V/50Hz"
                    />
                  </FormField>
                  <FormField label="Kiểu truyền động" className="sm:col-span-2">
                    <input
                      className="form-input w-full"
                      value={pumpDrive}
                      onChange={e => updatePump(pumpPower, pumpFlow, pumpPressure, pumpVoltage, e.target.value)}
                      placeholder="VD: Truyền động trực tiếp / Gián tiếp qua dây đai"
                    />
                  </FormField>
                </div>
              </div>
            ) : null}

            <FormField label="Quy cách chi tiết">
              <input
                className="form-input w-full"
                value={createForm.technicalSpec}
                onChange={e => setCreateForm(f => ({ ...f, technicalSpec: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.technicalSpec}
              />
            </FormField>
            <FormField label="Giá trần tham chiếu">
              <CurrencyInput
                value={createForm.ceilingPrice}
                onChange={ceilingPrice => setCreateForm(f => ({ ...f, ceilingPrice }))}
                placeholder="Dùng cảnh báo khi mua vượt giá"
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
            <FormField label="Thông số kỹ thuật chung / Diễn giải" className="sm:col-span-2">
              <textarea
                className="form-input w-full"
                rows={3}
                value={createForm.generalTechnicalSpec}
                onChange={e => setCreateForm(f => ({ ...f, generalTechnicalSpec: e.target.value }))}
                placeholder={MATERIAL_FIELD_PLACEHOLDERS.generalTechnicalSpec}
              />
            </FormField>
            <div className="sm:col-span-2 border-t border-[var(--color-border)] pt-3">
              <label className="hrm-label block mb-1.5 font-medium">Hình ảnh vật tư</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-hover)]/30">
                {createImagePreview ? (
                  <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0 shadow-xs">
                    <img
                      src={createImagePreview}
                      alt="Xem trước ảnh vật tư"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-xs font-medium cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
                    <ImageIcon size={28} className="opacity-40 mb-1" />
                    <span className="text-[11px]">Chưa có ảnh</span>
                  </div>
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="btn btn-sm btn-outline cursor-pointer inline-flex items-center gap-1.5">
                      <Upload size={14} />
                      <span>{createImagePreview ? 'Đổi ảnh khác' : 'Chọn ảnh tải lên'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>
                    {createImagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1 inline" />
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Kích thước tối đa 10MB. Ảnh tải lên sẽ được lưu và gắn vào danh mục vật tư.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <MaterialImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: queryKeys.materials.all });
          qc.invalidateQueries({ queryKey: queryKeys.categories.tree });
          qc.invalidateQueries({ queryKey: queryKeys.materialUnits.all });
          qc.invalidateQueries({ queryKey: queryKeys.materialOrigins.all });
        }}
      />
    </div>
  );
}
