import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import type { Transfer } from '../../types';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { downloadVoucherExport } from '../../lib/wms/voucherExportDownload';
import { validateTransferCreate, getTransferFormFieldErrors, type TransferFormFieldErrors } from '../../lib/wms/transferFormSchema';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../lib/wms/voucherDuplicateMaterial';
import { getFrozenProjectError } from '../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../hooks/useFrozenProjects';
import {
  useTransfers,
  useCreateTransfer,
  useUpdateTransfer,
  useApproveTransfer,
  useSubmitTransfer,
} from '../../hooks/useTransfers';
import { getVoucherTabLabels } from '../../lib/wms/voucherStatusLabels';
import { GENERAL_WAREHOUSE_LABEL_LOWER } from '../../lib/wms/stockTerminology';
import { projectInventoryAvailable } from '../../lib/wms/stockQtyFormat';
import { transferToFormLines } from '../../lib/wms/voucherFormPopulate';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateTransferDto } from '../../services/transfersService';
import { emptyQtyPhaseLine } from './voucher/voucherFormTypes';
import {
  availableReturnQty,
  inventoryRow,
  type TransferMode,
  type MaterialQtyPhaseLine,
} from './transfer/transferUtils';
import TransferTable from './transfer/TransferTable';
import TransferCreateModal from './transfer/TransferCreateModal';
import TransferDetailModal from './transfer/TransferDetailModal';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';
export default function TransferListPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <TransferListPageApi key={location.key} initialProjectCode={initialProjectCode} />;
}

interface TransferListPageApiProps {
  initialProjectCode?: string;
}

function TransferListPageApi({ initialProjectCode }: TransferListPageApiProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(!!initialProjectCode);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [editing, setEditing] = useState<Transfer | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [toProjectCode, setToProjectCode] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('return');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyPhaseLine[]>([{ ...emptyQtyPhaseLine }]);
  const [createErrors, setCreateErrors] = useState<TransferFormFieldErrors>({});

  const { data: transfers = [], isLoading, isError, error } = useTransfers({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateTransfer();
  const updateMutation = useUpdateTransfer();
  const approveMutation = useApproveTransfer();
  const submitMutation = useSubmitTransfer();
  const frozenByProjectCode = useFrozenProjects();

  useEffect(() => {
    if (!showCreate) return;
    const sourceErr = getFrozenProjectError(frozenByProjectCode, projectCode);
    const destErr = transferMode === 'cross-project'
      ? getFrozenProjectError(frozenByProjectCode, toProjectCode)
      : undefined;
    if (!sourceErr && !destErr) return;
    // Keep an already-open transfer draft aligned with asynchronous freeze status updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync freeze errors into open create form
    setCreateErrors(prev => ({
      ...prev,
      ...(sourceErr ? { projectCode: sourceErr } : {}),
      ...(destErr ? { toProjectCode: destErr } : {}),
    }));
  }, [showCreate, frozenByProjectCode, projectCode, toProjectCode, transferMode]);

  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const targetProjects = useMemo(
    () => projects.filter(p => p.projectCode !== projectCode),
    [projects, projectCode],
  );

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const codes = new Set(
      projectInventory
        .filter(r => projectInventoryAvailable(r) > 0)
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode));
  }, [materials, projectInventory, projectCode]);

  const voucherTabs = getVoucherTabLabels('transfer');
  const tabs = [
    { id: 'all', label: 'Tất cả', count: transfers.length },
    { id: 'draft', label: voucherTabs.draft, count: transfers.filter(t => t.status === 'draft').length },
    { id: 'pending', label: voucherTabs.pending, count: transfers.filter(t => t.status === 'pending').length },
    { id: 'approved', label: voucherTabs.approved, count: transfers.filter(t => t.status === 'approved').length },
  ];

  const filtered = useMemo(() => {
    let list = transfers;
    if (activeTab !== 'all') list = list.filter(t => t.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.voucherCode.toLowerCase().includes(q) ||
          (t.projectName ?? t.fromWarehouseName).toLowerCase().includes(q) ||
          (t.project ?? '').toLowerCase().includes(q) ||
          (t.toProjectName ?? t.toProject ?? '').toLowerCase().includes(q) ||
          t.toWarehouseName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transfers, activeTab, search]);

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
    setToProjectCode('');
    setTransferMode('return');
    setNote('');
    setItems([{ ...emptyQtyPhaseLine }]);
    setCreateErrors({});
  };

  const buildDto = (status: 'draft' | 'pending'): CreateTransferDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    const overflow = validItems.some((it, idx) => {
      const max = availableReturnQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    const fieldErrors = getTransferFormFieldErrors(
      projectCode,
      toProjectCode,
      transferMode,
      items,
      overflow,
      frozenByProjectCode,
    );
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }
    setCreateErrors({});

    const validation = validateTransferCreate(projectCode.trim(), validItems);
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
        constructionPhase: it.constructionPhase.trim() || undefined,
      };
    });

    return {
      voucherCode: '',
      date: new Date().toLocaleDateString('vi-VN'),
      fromWarehouseId: '',
      toWarehouseId: '',
      items: mappedItems,
      status,
      createdBy: '',
      note,
      project: projectCode.trim(),
      toProject: transferMode === 'cross-project' ? toProjectCode.trim() : undefined,
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
          : `Phiếu ${created.voucherCode} — chuyển dự kiến, chờ duyệt thực tế.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu chuyển kho'));
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
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu chuyển kho'));
    }
  };

  const openEdit = (tf: Transfer) => {
    setEditing(tf);
    setProjectCode(tf.project ?? '');
    setToProjectCode(tf.toProject ?? '');
    setTransferMode(tf.toProject ? 'cross-project' : 'return');
    setNote(tf.note);
    setItems(transferToFormLines(tf.items));
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleSubmit = async (tf: Transfer) => {
    try {
      await submitMutation.mutateAsync(tf.id);
      showToast('success', `Đã duyệt dự kiến phiếu ${tf.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (tf: Transfer) => {
    try {
      await approveMutation.mutateAsync(tf.id);
      showToast('success', `Thủ kho đã duyệt kho phiếu ${tf.voucherCode}.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const openDetail = (tf: Transfer) => {
    setSelected(tf);
    setShowDetail(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await downloadVoucherExport('/api/transfers/export', `phieu-chuyen-${new Date().toISOString().slice(0, 10)}.xlsx`, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: activeTab,
        search,
      });
      showToast('success', 'Đã xuất danh sách phiếu chuyển');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xuất Excel'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Chuyển kho"
        subtitle={`Hàng vào ${GENERAL_WAREHOUSE_LABEL_LOWER} chỉ khi hoàn trả và thủ kho duyệt. Nhập/xuất thực tế không cộng kho tổng.`}
        actions={
          <>
            <button type="button" className="hrm-header-btn" onClick={() => void handleExportExcel()} disabled={isExporting}>
              <Download size={14} /> {isExporting ? 'Đang xuất…' : 'Xuất Excel'}
            </button>
            <PermissionGate permission="wms.transfers.create">
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2 rounded-full px-5"
                onClick={() => { resetForm(); setShowCreate(true); }}
              >
                <Plus size={16} /> Tạo phiếu chuyển
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

        <TransferTable
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
            itemLabel="phiếu chuyển"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={filtered.length}
          />
        )}
      </HrmPanel>

      <TransferCreateModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        isPending={createMutation.isPending || updateMutation.isPending}
        projects={projects}
        targetProjects={targetProjects}
        stockMaterials={stockMaterials}
        projectInventory={projectInventory}
        frozenByProjectCode={frozenByProjectCode}
        transferMode={transferMode}
        onTransferModeChange={setTransferMode}
        projectCode={projectCode}
        onProjectCodeChange={code => {
          setProjectCode(code);
          setCreateErrors(e => ({
            ...e,
            projectCode: getFrozenProjectError(frozenByProjectCode, code),
          }));
        }}
        toProjectCode={toProjectCode}
        onToProjectCodeChange={code => {
          setToProjectCode(code);
          setCreateErrors(e => ({
            ...e,
            toProjectCode: getFrozenProjectError(frozenByProjectCode, code),
          }));
        }}
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

      <TransferDetailModal
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
