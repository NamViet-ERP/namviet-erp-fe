import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { getVoucherTabLabels } from '../../lib/wms/voucherStatusLabels';
import { getExportReturnFormFieldErrors } from '../../lib/wms/exportReturnFormSchema';
import { getFrozenProjectError } from '../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../hooks/useFrozenProjects';
import { useProjects } from '../../hooks/useProjects';
import {
  useExportReturns,
  useReturnableExports,
  useReturnableLines,
  useCreateExportReturn,
  useUpdateExportReturn,
  useApproveExportReturn,
  useSubmitExportReturn,
} from '../../hooks/useExportReturns';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { exportReturnsService, type CreateExportReturnDto } from '../../services/exportReturnsService';
import type { ExportReturn } from '../../types';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
import ExportReturnTable from './materialReturn/ExportReturnTable';
import ExportReturnDetailModal from './materialReturn/ExportReturnDetailModal';
import ExportReturnCreateModal from './materialReturn/ExportReturnCreateModal';
import { linesToFormLines, mergeEditFormLines, type ExportReturnFormLine } from './materialReturn/exportReturnFormTypes';

export default function MaterialReturnPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <MaterialReturnPage key={location.key} initialProjectCode={initialProjectCode} />;
}

interface MaterialReturnPageProps {
  initialProjectCode?: string;
}

function MaterialReturnPage({ initialProjectCode }: MaterialReturnPageProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(!!initialProjectCode);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<ExportReturn | null>(null);
  const [editing, setEditing] = useState<ExportReturn | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [sourceExportId, setSourceExportId] = useState('');
  const [note, setNote] = useState('');
  const [formLines, setFormLines] = useState<ExportReturnFormLine[]>([]);
  const [createPhotoFiles, setCreatePhotoFiles] = useState<File[]>([]);
  const [createErrors, setCreateErrors] = useState<ReturnType<typeof getExportReturnFormFieldErrors>>({});

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const frozenByProjectCode = useFrozenProjects();

  const excludeReturnId = editing?.id;

  const {
    data: returnableExports = [],
    isLoading: exportsLoading,
  } = useReturnableExports(showCreate ? projectCode || undefined : undefined, excludeReturnId);

  const {
    data: returnableLines = [],
    isLoading: linesLoading,
    isError: linesError,
  } = useReturnableLines(
    showCreate && sourceExportId ? sourceExportId : undefined,
    excludeReturnId,
  );

  const {
    data: exportReturns = [],
    isLoading: returnsLoading,
    isError: returnsError,
    error: returnsQueryError,
  } = useExportReturns({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const createMutation = useCreateExportReturn();
  const updateMutation = useUpdateExportReturn();
  const approveMutation = useApproveExportReturn();
  const submitMutation = useSubmitExportReturn();

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate return form lines from selected source export */
  useEffect(() => {
    if (!showCreate || !sourceExportId || linesLoading) return;
    if (linesError) {
      setFormLines([]);
      return;
    }
    if (editing) {
      setFormLines(mergeEditFormLines(returnableLines, editing.items));
      return;
    }
    setFormLines(linesToFormLines(returnableLines));
  }, [showCreate, sourceExportId, returnableLines, linesLoading, linesError, editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const voucherTabs = getVoucherTabLabels('exportReturn');
  const tabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: exportReturns.length },
    { id: 'draft', label: voucherTabs.draft, count: exportReturns.filter(r => r.status === 'draft').length },
    { id: 'pending', label: voucherTabs.pending, count: exportReturns.filter(r => r.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: exportReturns.filter(r => r.status === 'approved').length },
  ], [exportReturns, voucherTabs]);

  const filtered = useMemo(() => {
    let list = exportReturns;
    if (activeTab !== 'all') list = list.filter(r => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        r =>
          r.voucherCode.toLowerCase().includes(q)
          || r.sourceExportCode.toLowerCase().includes(q)
          || (r.projectName ?? '').toLowerCase().includes(q)
          || (r.project ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [exportReturns, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setEditing(null);
    setProjectCode(initialProjectCode ?? '');
    setSourceExportId('');
    setNote('');
    setFormLines([]);
    setCreatePhotoFiles([]);
    setCreateErrors({});
  };

  const buildDto = (status: 'draft' | 'pending', requireNote: boolean): CreateExportReturnDto | null => {
    const validLines = formLines.filter(l => l.sku && Number(l.returnQty) > 0);
    const qtyOverflow = validLines.some(l => Number(l.returnQty) > l.remainingQty);
    const fieldErrors = getExportReturnFormFieldErrors(
      projectCode,
      sourceExportId,
      validLines.map(l => ({
        sku: l.sku,
        returnQty: l.returnQty,
        remainingQty: l.remainingQty,
      })),
      qtyOverflow,
      frozenByProjectCode,
      requireNote ? note : undefined,
    );
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      sourceExportId,
      project: projectCode.trim(),
      items: validLines.map(line => ({
        productId: line.sku,
        sku: line.sku,
        name: line.name,
        qty: Number(line.returnQty),
        unit: line.unit,
      })),
      status,
      createdBy: '',
      note,
    };
  };

  const handleCreate = async (status: 'draft' | 'pending') => {
    const dto = buildDto('draft', true);
    if (!dto) return;
    if (status === 'pending' && createPhotoFiles.length === 0) {
      showToast('error', 'Chốt hoàn trả dự kiến cần ít nhất 1 ảnh minh chứng.');
      return;
    }
    try {
      const created = await createMutation.mutateAsync(dto);
      for (const file of createPhotoFiles) {
        await exportReturnsService.uploadAttachment(created.id, file, 'photo');
      }
      if (status === 'pending') {
        await submitMutation.mutateAsync(created.id);
        showToast('success', `Phiếu ${created.voucherCode} — hoàn trả dự kiến, chờ duyệt thực tế.`);
      } else {
        showToast('success', `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`);
      }
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được phiếu hoàn trả.'));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const status = editing.status === 'draft' ? 'draft' : 'pending';
    const dto = buildDto(status, true);
    if (!dto) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto: { ...dto, status: editing.status } });
      showToast('success', `Đã cập nhật phiếu ${editing.voucherCode}.`);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được phiếu hoàn trả.'));
    }
  };

  const openDetail = async (row: ExportReturn) => {
    setSelected(row);
    setShowDetail(true);
    try {
      const fresh = await exportReturnsService.getById(row.id);
      setSelected(fresh);
    } catch {
      /* giữ bản list nếu tải chi tiết lỗi */
    }
  };

  const openEdit = (row: ExportReturn) => {
    setEditing(row);
    setProjectCode(row.project ?? '');
    setSourceExportId(row.sourceExportId);
    setNote(row.note);
    setFormLines([]);
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleSubmit = async (row: ExportReturn) => {
    try {
      await submitMutation.mutateAsync(row.id);
      showToast('success', 'Đã chốt dự kiến phiếu hoàn trả.');
      setShowDetail(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không chốt được phiếu hoàn trả.'));
    }
  };

  const handleApprove = async (row: ExportReturn) => {
    try {
      await approveMutation.mutateAsync(row.id);
      showToast('success', 'Đã duyệt phiếu hoàn trả — vật tư đã về kho dự án.');
      setShowDetail(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không duyệt được phiếu hoàn trả.'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Hoàn trả vật tư"
        subtitle="Hoàn trả vật tư chưa dùng hết về kho dự án theo phiếu xuất nguồn."
        actions={
          <PermissionGate permission="wms.export_returns.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => { resetForm(); setShowCreate(true); }}
            >
              <Plus size={16} /> Tạo phiếu hoàn trả
            </button>
          </PermissionGate>
        }
      />

      <HrmPanel noPadding>
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm mã HT, phiếu xuất, kho dự án..."
            />
            <VoucherDateFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={v => { setDateFrom(v); setPage(1); }}
              onToChange={v => { setDateTo(v); setPage(1); }}
              onReset={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            />
          </div>
        </div>

        <ExportReturnTable
          rows={paginated}
          isLoading={returnsLoading}
          isError={returnsError}
          error={returnsQueryError}
          onOpenDetail={row => { void openDetail(row); }}
          onEdit={openEdit}
          onSubmit={row => void handleSubmit(row)}
          onApprove={row => void handleApprove(row)}
        />

        {filtered.length > 0 && !returnsLoading && (
          <Pagination
            embedded
            itemLabel="phiếu hoàn trả"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={filtered.length}
          />
        )}
      </HrmPanel>

      <ExportReturnCreateModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        isPending={createMutation.isPending || updateMutation.isPending}
        projects={projects}
        returnableExports={returnableExports}
        exportsLoading={exportsLoading}
        projectCode={projectCode}
        frozenByProjectCode={frozenByProjectCode}
        onProjectCodeChange={code => {
          setProjectCode(code);
          setCreateErrors(e => ({
            ...e,
            projectCode: getFrozenProjectError(frozenByProjectCode, code),
          }));
        }}
        sourceExportId={sourceExportId}
        onSourceExportIdChange={setSourceExportId}
        note={note}
        onNoteChange={setNote}
        lines={formLines}
        onLinesChange={setFormLines}
        linesLoading={linesLoading}
        errors={createErrors}
        photoFiles={createPhotoFiles}
        onPhotoFilesChange={setCreatePhotoFiles}
        onCreate={status => void handleCreate(status)}
        onSave={() => void handleUpdate()}
        editVoucher={editing ? { code: editing.voucherCode } : null}
      />

      <ExportReturnDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        selected={selected}
        isSubmitPending={submitMutation.isPending}
        isApprovePending={approveMutation.isPending}
        onSubmit={row => void handleSubmit(row)}
        onApprove={row => void handleApprove(row)}
        onReload={async () => {
          if (!selected) return;
          const fresh = await exportReturnsService.getById(selected.id);
          setSelected(fresh);
        }}
      />
    </div>
  );
}
