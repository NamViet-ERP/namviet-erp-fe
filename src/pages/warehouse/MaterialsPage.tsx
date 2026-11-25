import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Package } from 'lucide-react';
import { useSession } from '../../auth/AuthProvider';
import { isSessionAdmin } from '../../constants/systemUsers';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import PageHeader from '../../components/ui/PageHeader';
import SectionCard from '../../components/ui/SectionCard';
import PermissionGate from '../../components/auth/PermissionGate';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { useMaterials } from '../../hooks/useMaterials';
import { useCategoryCascade } from '../../hooks/useCategories';
import { materialsService } from '../../services/materialsService';
import { queryKeys } from '../../services/queryKeys';
import { resolveMediaUrl } from '../../lib/hrm/employeeApiMapper';
import MaterialDetailView from './MaterialDetailView';
import MaterialImportModal from './MaterialImportModal';
import MaterialCreateModal from './materials/MaterialCreateModal';
import MaterialClearConfirmModal from './materials/MaterialClearConfirmModal';
import MaterialsFilterToolbar from './materials/MaterialsFilterToolbar';
import {
  MATERIAL_TABLE_COLUMNS,
  materialCodeParts,
  parseOriginParts,
} from '../../constants/materialCategoryLevels';
import { resolveLeafCategoryId } from '../../lib/wms/materialCategoryTree';

const emptySelection: Array<number | ''> = ['', '', '', '', ''];

export default function MaterialsPageRoute() {
  const location = useLocation();
  const initialHighlight = (location.state as { highlightCode?: string } | null)?.highlightCode;
  return <MaterialsPage initialHighlight={initialHighlight} />;
}

function MaterialsPage({ initialHighlight }: { initialHighlight?: string }) {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailCode = searchParams.get('code') || null;

  const initialAppliedRef = useRef(false);
  useEffect(() => {
    if (initialHighlight && !initialAppliedRef.current && !searchParams.get('code')) {
      initialAppliedRef.current = true;
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('code', initialHighlight);
          return next;
        },
        { replace: true },
      );
    }
  }, [initialHighlight, searchParams, setSearchParams]);

  const [search, setSearch] = useState(initialHighlight ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filterSelection, setFilterSelection] = useState<Array<number | ''>>([...emptySelection]);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { user } = useSession();
  const isAdmin = isSessionAdmin(user);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeletingRow, setIsDeletingRow] = useState<string | null>(null);

  const { optionsByLevel: filterOptions, isLoading: categoriesLoading } =
    useCategoryCascade(filterSelection);

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

  const handleDeleteSingleMaterial = async (code: string, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa vật tư "${name}" (${code})?`);
    if (!confirmed) return;
    try {
      setIsDeletingRow(code);
      await materialsService.remove(code);
      showToast('success', `Đã xóa vật tư ${code}`);
      await qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa vật tư'));
    } finally {
      setIsDeletingRow(null);
    }
  };

  if (detailCode) {
    return (
      <MaterialDetailView
        code={detailCode}
        onBack={() => {
          setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('code');
            return next;
          });
        }}
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
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline flex items-center gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 hover:border-rose-400 dark:hover:bg-rose-950/30"
                onClick={() => setShowClearModal(true)}
                disabled={isLoading || totalCount === 0}
                title="Dọn sạch toàn bộ danh mục vật tư hiện có (Chỉ Quản trị viên)"
              >
                <Trash2 size={16} aria-hidden />
                Dọn sạch danh mục
              </button>
            )}
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
                onClick={() => setShowCreate(true)}
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

      <SectionCard noPadding className="mat-catalog-board">
        <div className="mat-catalog-board__head">
          <h2 className="mat-catalog-board__title">Danh sách mã vật tư</h2>
          <p className="mat-catalog-board__desc">
            Mã hiển thị theo phân đoạn cây vật tư. Bấm dòng để mở chi tiết.
          </p>
        </div>

        <MaterialsFilterToolbar
          filterSelection={filterSelection}
          filterOptions={filterOptions}
          categoriesLoading={categoriesLoading}
          onFilterLevelChange={setFilterLevel}
          search={search}
          onSearchChange={v => { setSearch(v); setPage(1); }}
          showInactive={showInactive}
          onToggleInactive={() => { setShowInactive(v => !v); setPage(1); }}
          onResetFilters={resetFilters}
        />

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
                {isAdmin && (
                  <th className="table-header-cell text-center w-16 whitespace-nowrap">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={MATERIAL_TABLE_COLUMNS.length + (isAdmin ? 1 : 0)} />
              ) : isError ? (
                <tr>
                  <td colSpan={MATERIAL_TABLE_COLUMNS.length + (isAdmin ? 1 : 0)}>
                    <EmptyState message={WMS_ERROR.loadMaterials} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={MATERIAL_TABLE_COLUMNS.length + (isAdmin ? 1 : 0)}>
                    <EmptyState message={WMS_EMPTY.noMaterials} />
                  </td>
                </tr>
              ) : (
                items.map(m => {
                  const parsedOrigin = parseOriginParts(m.origin);
                  const codeParts = materialCodeParts(m.materialCode);
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
                      onClick={() => {
                        setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          next.set('code', m.materialCode);
                          return next;
                        });
                      }}
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

                      {/* 2. Mã vật tư */}
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
                          {(parsedOrigin.brand || parsedOrigin.country || m.origin) && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {parsedOrigin.brand && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                                  title={`Hãng: ${parsedOrigin.brand}`}
                                >
                                  <span className="text-[10px] text-indigo-400 font-normal">Hãng:</span>
                                  {parsedOrigin.brand}
                                </span>
                              )}
                              {(parsedOrigin.country || m.origin) && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                                  title={`Xuất xứ: ${parsedOrigin.country || m.origin}${parsedOrigin.region ? ` (${parsedOrigin.region})` : ''}`}
                                >
                                  <span className="text-[10px] text-slate-400 font-normal">XX:</span>
                                  {parsedOrigin.country || m.origin}
                                  {parsedOrigin.region && (
                                    <span className="ml-0.5 px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                                      {parsedOrigin.region}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                          {m.isActive === false && (
                            <span className="badge badge-warning text-[10px] py-0 px-1.5">Ngừng SD</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Tên vật tư */}
                      <td className="table-cell">
                        <div className="mat-name-cell">
                          <span className="mat-name-cell__title font-semibold text-sm text-slate-900 leading-snug">
                            {m.materialName}
                          </span>
                          {m.qualityStandard && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              Tiêu chuẩn: <span className="text-slate-700 font-medium">{m.qualityStandard}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Phân cấp danh mục (Breadcrumb gộp 5 cấp) */}
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

                      {/* 5. ĐVT */}
                      <td className="table-cell text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100/80 text-slate-700 text-xs font-semibold border border-slate-200/60 shadow-2xs">
                          {m.unit || '-'}
                        </span>
                      </td>

                      {/* 6. Quy cách / Thông số chính */}
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

                      {/* 7. Hãng */}
                      <td className="table-cell whitespace-nowrap">
                        {parsedOrigin.brand ? (
                          <span className="text-xs font-bold text-slate-900">
                            {parsedOrigin.brand}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* 8. Xuất xứ */}
                      <td className="table-cell whitespace-nowrap">
                        {parsedOrigin.country ? (
                          <span className="text-[11px] text-slate-600 font-medium">
                            {parsedOrigin.country}
                            {parsedOrigin.region ? (
                              <span className="ml-1 inline-block px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                                {parsedOrigin.region}
                              </span>
                            ) : null}
                          </span>
                        ) : m.origin ? (
                          <span className="text-xs text-slate-600">{m.origin}</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* 9. Thao tác xóa lẻ (Chỉ Quản trị viên) */}
                      {isAdmin && (
                        <td
                          className="table-cell text-center whitespace-nowrap"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={`Xóa vật tư ${m.materialCode}`}
                            disabled={isDeletingRow === m.materialCode}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteSingleMaterial(m.materialCode, m.materialName);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
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
      </SectionCard>

      <MaterialCreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

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

      {isAdmin && (
        <MaterialClearConfirmModal
          isOpen={showClearModal}
          totalCount={totalCount}
          onClose={() => setShowClearModal(false)}
          onCleared={async () => {
            await qc.invalidateQueries({ queryKey: queryKeys.materials.all });
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
