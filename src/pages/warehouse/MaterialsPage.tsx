import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useSession } from '../../auth/AuthProvider';
import PermissionGate from '../../components/auth/PermissionGate';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TableShell from '../../components/ui/TableShell';
import { showToast } from '../../components/ui/Toast';
import { MATERIAL_TABLE_COLUMNS } from '../../constants/materialCategoryLevels';
import { isSessionAdmin } from '../../constants/systemUsers';
import { useCategoryCascade } from '../../hooks/useCategories';
import { useMaterials } from '../../hooks/useMaterials';
import { getApiErrorMessage } from '../../lib/apiClient';
import { resolveLeafCategoryId } from '../../lib/wms/materialCategoryTree';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { materialsService, type MaterialStatusFilter } from '../../services/materialsService';
import { queryKeys } from '../../services/queryKeys';
import MaterialDetailView from './MaterialDetailView';
import MaterialImportModal from './MaterialImportModal';
import MaterialClearConfirmModal from './materials/MaterialClearConfirmModal';
import MaterialCreateModal from './materials/MaterialCreateModal';
import MaterialsFilterToolbar from './materials/MaterialsFilterToolbar';
import MaterialsTableRow from './materials/MaterialsTableRow';

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
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>('active');

  const { user } = useSession();
  const isAdmin = isSessionAdmin(user);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ code: string; name: string } | null>(null);
  const [isDeletingRow, setIsDeletingRow] = useState<string | null>(null);

  const { optionsByLevel: filterOptions, isLoading: categoriesLoading } =
    useCategoryCascade(filterSelection);

  const filterCategoryId = resolveLeafCategoryId(filterSelection);
  const { data, isLoading, isError } = useMaterials({
    page,
    pageSize,
    search: search || undefined,
    categoryId: filterCategoryId,
    status: statusFilter,
  });

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
    setStatusFilter('active');
    setPage(1);
  };

  const openMaterialDetail = (code: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('code', code);
      return next;
    });
  };

  const handleConfirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    const { code } = deleteTarget;
    try {
      setIsDeletingRow(code);
      await materialsService.remove(code);
      showToast('success', `Đã xóa vật tư ${code}`);
      setDeleteTarget(null);
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
        onCodeChanged={nextCode => {
          setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('code', nextCode);
            return next;
          }, { replace: true });
        }}
      />
    );
  }

  const colSpan = MATERIAL_TABLE_COLUMNS.length + (isAdmin ? 1 : 0);

  return (
    <PageShell variant="list" className="mat-catalog">
      <PageHeader
        eyebrow="Danh mục Vật tư"
        title="Danh mục vật tư"
        subtitle="Lọc theo cây 5 cấp, bấm dòng để mở chi tiết."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button
                type="button"
                variant="danger"
                leftIcon={Trash2}
                onClick={() => setShowClearModal(true)}
                disabled={isLoading || totalCount === 0}
                title="Dọn sạch toàn bộ danh mục vật tư hiện có (Chỉ Quản trị viên)"
              >
                Dọn sạch danh mục
              </Button>
            )}
            <PermissionGate permission="wms.materials.create">
              <Button type="button" variant="outlined" leftIcon={Upload} onClick={() => setShowImport(true)}>
                Nhập Excel
              </Button>
            </PermissionGate>
            <PermissionGate permission="wms.materials.create">
              <Button type="button" variant="filled" leftIcon={Plus} onClick={() => setShowCreate(true)}>
                Tạo mã vật tư
              </Button>
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
          statusFilter={statusFilter}
          onStatusFilterChange={next => { setStatusFilter(next); setPage(1); }}
          onResetFilters={resetFilters}
        />

        <TableShell
          flushTop
          tableClassName="wms-inventory-table mat-catalog-table"
          colSpan={colSpan}
          loading={isLoading}
          error={isError ? WMS_ERROR.loadMaterials : null}
          isEmpty={items.length === 0}
          emptyMessage={
            statusFilter === 'inactive'
              ? 'Không có vật tư nào đang ngừng sử dụng.'
              : WMS_EMPTY.noMaterials
          }
          pagination={
            totalCount > 0 && !isLoading
              ? {
                  embedded: true,
                  currentPage: page,
                  totalPages,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: s => { setPageSize(s); setPage(1); },
                  totalItems: totalCount,
                }
              : undefined
          }
          header={
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
          }
        >
          {items.map(m => (
            <MaterialsTableRow
              key={m.materialCode}
              material={m}
              isAdmin={isAdmin}
              isDeleting={isDeletingRow === m.materialCode}
              onSelect={openMaterialDetail}
              onDeleteRequest={(code, name) => setDeleteTarget({ code, name })}
            />
          ))}
        </TableShell>
      </SectionCard>

      <MaterialCreateModal isOpen={showCreate} onClose={() => setShowCreate(false)} />

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
        <>
          <MaterialClearConfirmModal
            isOpen={showClearModal}
            totalCount={totalCount}
            onClose={() => setShowClearModal(false)}
            onCleared={async () => {
              await qc.invalidateQueries({ queryKey: queryKeys.materials.all });
              setPage(1);
            }}
          />
          <ConfirmDialog
            isOpen={Boolean(deleteTarget)}
            onClose={() => { if (!isDeletingRow) setDeleteTarget(null); }}
            onConfirm={() => void handleConfirmDeleteSingle()}
            title="Xóa vật tư"
            message={
              deleteTarget
                ? `Bạn có chắc muốn xóa vật tư "${deleteTarget.name}" (${deleteTarget.code})?`
                : ''
            }
            confirmLabel="Xóa vật tư"
            cancelLabel="Hủy"
            variant="danger"
            isLoading={Boolean(isDeletingRow)}
          />
        </>
      )}
    </PageShell>
  );
}
