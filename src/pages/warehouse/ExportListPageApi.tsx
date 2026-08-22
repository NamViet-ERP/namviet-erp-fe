import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import type { Export } from '../../types';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { downloadVoucherExport } from '../../lib/wms/voucherExportDownload';
import { validateExportCreate, getExportFormFieldErrors, type ExportFormFieldErrors } from '../../lib/wms/exportFormSchema';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../lib/wms/voucherDuplicateMaterial';
import { getFrozenProjectError } from '../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../hooks/useFrozenProjects';
import {
  useExports,
  useCreateExport,
  useUpdateExport,
  useApproveExport,
  useSubmitExport,
} from '../../hooks/useExports';
import { getVoucherTabLabels } from '../../lib/wms/voucherStatusLabels';
import { exportToFormLines } from '../../lib/wms/voucherFormPopulate';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateExportDto } from '../../services/exportsService';
import { emptyQtyLine, type MaterialQtyLine } from './voucher/voucherFormTypes';
import { availableExportQty, inventoryRow } from './export/exportUtils';
import { projectInventoryAvailable } from '../../lib/wms/stockQtyFormat';
import ExportTable from './export/ExportTable';
import ExportCreateModal from './export/ExportCreateModal';
import ExportDetailModal from './export/ExportDetailModal';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
export default function ExportListPageRoute() {
  const location = useLocation();
  const state = location.state as { projectCode?: string; openVoucherCode?: string } | null;
  return (
    <ExportListPageApi
      key={location.key}
      initialProjectCode={state?.projectCode}
      openVoucherCode={state?.openVoucherCode}
    />
  );
}

interface ExportListPageApiProps {
  initialProjectCode?: string;
  openVoucherCode?: string;
}

function ExportListPageApi({ initialProjectCode, openVoucherCode }: ExportListPageApiProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(!!initialProjectCode);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Export | null>(null);
  const [editing, setEditing] = useState<Export | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyLine[]>([{ ...emptyQtyLine }]);
  const [createErrors, setCreateErrors] = useState<ExportFormFieldErrors>({});

  const { data: exports = [], isLoading, isError, error } = useExports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateExport();
  const frozenByProjectCode = useFrozenProjects();
  const updateMutation = useUpdateExport();
  const approveMutation = useApproveExport();
  const submitMutation = useSubmitExport();

  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const codes = new Set(
      projectInventory
        .filter(r => projectInventoryAvailable(r) > 0)
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode));
  }, [materials, projectInventory, projectCode]);

  const voucherTabs = getVoucherTabLabels('export');
  const tabs = [
    { id: 'all', label: 'Tất cả', count: exports.length },
    { id: 'draft', label: voucherTabs.draft, count: exports.filter(e => e.status === 'draft').length },
    { id: 'pending', label: voucherTabs.pending, count: exports.filter(e => e.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: exports.filter(e => e.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = exports;
    if (activeTab !== 'all') list = list.filter(e => e.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        e =>
          e.voucherCode.toLowerCase().includes(q) ||
          (e.projectName ?? e.warehouseName).toLowerCase().includes(q) ||
          (e.project ?? '').toLowerCase().includes(q) ||
          e.soCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [exports, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const materialUnit = (code: string) => {
    const inv = inventoryRow(projectInventory, code);
    if (inv?.unit) return inv.unit;
    return materials.find(m => m.materialCode === code)?.unit ?? '—';
  };

  const resetForm = () => {
    setEditing(null);
    setProjectCode('');
    setReferenceCode('');
    setNote('');
    setItems([{ ...emptyQtyLine }]);
    setCreateErrors({});
  };

  const buildDto = (status: 'draft' | 'pending'): CreateExportDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    const overflow = validItems.some((it, idx) => {
      const max = availableExportQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    const fieldErrors = getExportFormFieldErrors(projectCode, items, overflow, frozenByProjectCode);
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});

    const validation = validateExportCreate(projectCode.trim(), validItems);
    if (!validation.success) {
      showToast('error', validation.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return null;
    }

    const mappedItems = validItems.map(it => {
      const mat = materials.find(m => m.materialCode === it.materialCode);
      const inv = inventoryRow(projectInventory, it.materialCode);
      return {
        productId: it.materialCode,
        sku: it.materialCode,
        name: mat?.materialName ?? inv?.materialName ?? it.materialCode,
        qty: Number(it.qty),
        unit: inv?.unit ?? mat?.unit ?? '',
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      soCode: referenceCode.trim(),
      customer: '',
      warehouseId: '',
      items: mappedItems,
      status,
      createdBy: '',
      note,
      project: projectCode.trim(),
    };
  };

  const handleCreate = async (status: 'draft' | 'pending') => {
    const dto = buildDto(status);
    if (!dto) return;
    try {
      const created = await createMutation.mutateAsync(dto);
      showToast(
        'success',
        status === 'draft'
          ? `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`
          : `Phiếu ${created.voucherCode} — xuất dự kiến, chờ duyệt thực tế.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu xuất'));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const status = editing.status === 'draft' ? 'draft' : 'pending';
    const dto = buildDto(status);
    if (!dto) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto: { ...dto, status: editing.status } });
      showToast('success', `Đã cập nhật phiếu ${editing.voucherCode}.`);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu xuất'));
    }
  };

  const openEdit = (exp: Export) => {
    setEditing(exp);
    setProjectCode(exp.project ?? '');
    setReferenceCode(exp.soCode ?? '');
    setNote(exp.note);
    setItems(exportToFormLines(exp.items));
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleSubmit = async (exp: Export) => {
    try {
      await submitMutation.mutateAsync(exp.id);
      showToast('success', `Đã duyệt dự kiến phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (exp: Export) => {
    try {
      await approveMutation.mutateAsync(exp.id);
      showToast('success', `Thủ kho đã duyệt kho phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const openDetail = (exp: Export) => {
    setSelected(exp);
    setShowDetail(true);
  };

  useEffect(() => {
    if (!openVoucherCode || isLoading || exports.length === 0) return;
    const match = exports.find(
      e => e.voucherCode.toLowerCase() === openVoucherCode.toLowerCase(),
    );
    if (match) {
      setSelected(match);
      setShowDetail(true);
      setSearch(openVoucherCode);
    }
  }, [openVoucherCode, isLoading, exports]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await downloadVoucherExport('/api/exports/export', `phieu-xuat-${new Date().toISOString().slice(0, 10)}.xlsx`, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: activeTab,
        search,
      });
      showToast('success', 'Đã xuất danh sách phiếu xuất');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất Excel'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Xuất kho"
        subtitle="Tiêu hao vật tư tại kho dự án — trừ tồn thực tế sau khi thủ kho duyệt."
        actions={
          <>
            <button type="button" className="hrm-header-btn" onClick={() => void handleExportExcel()} disabled={isExporting}>
              <Download size={14} /> {isExporting ? 'Đang xuất…' : 'Xuất Excel'}
            </button>
            <PermissionGate permission="wms.exports.create">
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2 rounded-full px-5"
                onClick={() => { resetForm(); setShowCreate(true); }}
              >
                <Plus size={16} /> Tạo phiếu xuất
              </button>
            </PermissionGate>
          </>
        }
      />

      <HrmPanel noPadding>
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, kho dự án..." />
            <VoucherDateFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={v => { setDateFrom(v); setPage(1); }}
              onToChange={v => { setDateTo(v); setPage(1); }}
              onReset={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            />
          </div>
        </div>

        <ExportTable
          rows={paginated}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onOpenDetail={openDetail}
          onEdit={openEdit}
          onSubmit={handleSubmit}
          onApprove={handleApprove}
        />

        {filtered.length > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="phiếu xuất"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={filtered.length}
          />
        )}
      </HrmPanel>

      <ExportCreateModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        isPending={createMutation.isPending || updateMutation.isPending}
        projects={projects}
        stockMaterials={stockMaterials}
        projectInventory={projectInventory}
        projectCode={projectCode}
        frozenByProjectCode={frozenByProjectCode}
        onProjectCodeChange={code => {
          setProjectCode(code);
          setCreateErrors(e => ({
            ...e,
            projectCode: getFrozenProjectError(frozenByProjectCode, code),
          }));
        }}
        referenceCode={referenceCode}
        onReferenceCodeChange={setReferenceCode}
        note={note}
        onNoteChange={setNote}
        items={items}
        onItemsChange={next => {
          setItems(next);
          setCreateErrors(e => {
            const cleared = { ...e, items: undefined };
            delete cleared.lineErrors;
            return cleared;
          });
        }}
        onDuplicateMaterialAttempt={lineIndex => {
          setCreateErrors(e => ({
            ...e,
            lineErrors: {
              ...e.lineErrors,
              [lineIndex]: { materialCode: DUPLICATE_MATERIAL_MESSAGE },
            },
          }));
        }}
        errors={createErrors}
        onCreate={handleCreate}
        onSave={handleUpdate}
        editVoucher={editing ? { code: editing.voucherCode } : null}
        materialUnit={materialUnit}
      />

      <ExportDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        selected={selected}
        isSubmitPending={submitMutation.isPending}
        isApprovePending={approveMutation.isPending}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
      />
    </div>
  );
}
