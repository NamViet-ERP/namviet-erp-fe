import { useEffect, useMemo, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { Download } from 'lucide-react';

import type { ImportBudgetExceededApiDto } from '../../types/api/importBudgetApi';
import type { Import } from '../../types';
import type { ImportParseErrorApiDto } from '../../types/api/importParseApi';

import TabFilter from '../../components/ui/TabFilter';

import SearchBar from '../../components/ui/SearchBar';

import Pagination from '../../components/ui/Pagination';

import PageHeader from '../../components/ui/PageHeader';

import { usePermission } from '../../hooks/usePermission';

import HrmPanel from '../../components/hr/HrmPanel';

import { showToast } from '../../components/ui/Toast';

import { getApiErrorMessage, saveBlob } from '../../lib/apiClient';

import { parseImportBudgetExceeded } from '../../lib/wms/projectBudget';
import { downloadVoucherExport } from '../../lib/wms/voucherExportDownload';

import { formatCurrencyFull } from '../../utils/formatCurrency';

import ConfirmDialog from '../../components/ui/ConfirmDialog';

import { validateImportCreate, getImportFormFieldErrors, isImportLineComplete, type ImportFormFieldErrors } from '../../lib/wms/importFormSchema';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import { DUPLICATE_MATERIAL_MESSAGE } from '../../lib/wms/voucherDuplicateMaterial';
import { getFrozenProjectError } from '../../lib/wms/stocktakeFreeze';
import { useFrozenProjects } from '../../hooks/useFrozenProjects';

import { parseCurrencyInput } from '../../utils/currencyInput';

import { getVoucherTabLabels } from '../../lib/wms/voucherStatusLabels';

import { importToFormLines } from '../../lib/wms/voucherFormPopulate';

import {

  useImports,

  useCreateImport,

  useUpdateImport,

  useApproveImport,

  useSubmitImport,
  useCreateImportFromPo,
  usePoImportPreview,

} from '../../hooks/useImports';

import { useMaterials } from '../../hooks/useMaterials';

import { useProjects } from '../../hooks/useProjects';

import { useSuppliers } from '../../hooks/useSuppliers';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';

import { findSupplierByName } from '../../services/suppliersService';

import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

import type { CreateImportDto } from '../../services/importsService';
import { importsService } from '../../services/importsService';

import { emptyQtyPriceLine, type MaterialQtyPriceLine } from './voucher/voucherFormTypes';

import { importLineTotal } from './import/importUtils';

import ImportTable from './import/ImportTable';

import ImportCreateModal from './import/ImportCreateModal';

import ImportDetailModal from './import/ImportDetailModal';
import VoucherDateFilter from '../../components/warehouse/VoucherDateFilter';

export default function ImportListPageRoute() {

  const location = useLocation();

  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;

  return <ImportListPageApi key={location.key} initialProjectCode={initialProjectCode} />;

}



interface ImportListPageApiProps {

  initialProjectCode?: string;

}



function ImportListPageApi({ initialProjectCode }: ImportListPageApiProps) {

  const [activeTab, setActiveTab] = useState('all');

  const [search, setSearch] = useState('');

  const [dateFrom, setDateFrom] = useState('');

  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

  const [showCreate, setShowCreate] = useState(false);

  const [showDetail, setShowDetail] = useState(false);

  const [selected, setSelected] = useState<Import | null>(null);
  const [isEvidencePending, setIsEvidencePending] = useState(false);

  const [budgetConfirmImport, setBudgetConfirmImport] = useState<Import | null>(null);

  const [budgetExceeded, setBudgetExceeded] = useState<ImportBudgetExceededApiDto | null>(null);

  const [editing, setEditing] = useState<Import | null>(null);



  const [defaultSupplier, setDefaultSupplier] = useState('');

  const [referenceCode, setReferenceCode] = useState('');
  const [selectedPoCode, setSelectedPoCode] = useState('');

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');

  const [note, setNote] = useState('');

  const [items, setItems] = useState<MaterialQtyPriceLine[]>([{ ...emptyQtyPriceLine }]);

  const [createErrors, setCreateErrors] = useState<ImportFormFieldErrors>({});
  const [isExporting, setIsExporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportParseErrorApiDto[]>([]);
  const [isImportParsing, setIsImportParsing] = useState(false);

  const { data: imports = [], isLoading, isError, error } = useImports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: materialsPage } = useMaterials({ pageSize: 500 });

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });

  const { data: suppliersPage } = useSuppliers({ all: true });

  const createMutation = useCreateImport();
  const createFromPoMutation = useCreateImportFromPo();
  const frozenByProjectCode = useFrozenProjects();

  const updateMutation = useUpdateImport();

  const approveMutation = useApproveImport();

  const submitMutation = useSubmitImport();

  const { has } = usePermission();
  const canEditImport = has('wms.imports.update');
  const canApproveImport = has('wms.imports.approve');
  const canViewPrices = useCanViewWmsPrices();
  // Màn Kho hàng: không tạo / chốt dự kiến / xóa — làm trên PO.



  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);
  const purchaseOrdersQuery = usePurchaseOrders({
    page: 1,
    pageSize: 200,
    orderPlacementStatus: 'placed',
  });
  const poOptions = useMemo(
    () => (purchaseOrdersQuery.data?.items ?? []).filter(po => po.deliveryStatus !== 'complete'),
    [purchaseOrdersQuery.data?.items],
  );
  const poPreviewQuery = usePoImportPreview(
    selectedPoCode || undefined,
    showCreate && Boolean(selectedPoCode),
    editing?.voucherCode,
  );

  const voucherTabs = getVoucherTabLabels('import');

  // Thủ kho: chỉ dự kiến + thực tế (phiếu nháp quản lý trên PO).
  const warehouseImports = useMemo(
    () => imports.filter(i => i.status === 'pending' || i.status === 'approved'),
    [imports],
  );

  const tabs = [

    { id: 'all', label: 'Tất cả', count: warehouseImports.length },

    { id: 'pending', label: voucherTabs.pending, count: warehouseImports.filter(i => i.status === 'pending').length },

    { id: 'approved', label: voucherTabs.approved, count: warehouseImports.filter(i => i.status === 'approved').length },

  ];



  const filtered = useMemo(() => {

    let list = warehouseImports;

    if (activeTab !== 'all') list = list.filter(i => i.status === activeTab);

    if (search.trim()) {

      const q = search.toLowerCase();

      list = list.filter(

        i =>

          i.voucherCode.toLowerCase().includes(q) ||

          i.supplier.toLowerCase().includes(q) ||

          i.referenceCode.toLowerCase().includes(q) ||

          (i.project ?? '').toLowerCase().includes(q),

      );

    }

    return list;

  }, [warehouseImports, activeTab, search]);



  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);



  const formGrandTotal = useMemo(

    () => items.reduce((sum, it) => sum + importLineTotal(it), 0),

    [items],

  );



  const projectName = (code?: string) =>

    projects.find(p => p.projectCode === code)?.projectName ?? code ?? '—';



  const materialUnit = (code: string) =>

    materials.find(m => m.materialCode === code)?.unit ?? '—';



  const resetForm = () => {

    setEditing(null);

    setDefaultSupplier('');

    setReferenceCode('');
    setSelectedPoCode('');

    setProjectCode('');

    setNote('');

    setItems([{ ...emptyQtyPriceLine }]);

    setCreateErrors({});
    setImportErrors([]);

  };

  useEffect(() => {
    if (editing || !showCreate) return;
    const preview = poPreviewQuery.data;
    if (!preview) return;
    setDefaultSupplier(preview.supplierName ?? '');
    setReferenceCode(preview.poCode ?? '');
    if (preview.projectCode) setProjectCode(preview.projectCode);
    setCreateErrors({});
  }, [poPreviewQuery.data, editing, showCreate]);

  const handleDownloadImportTemplate = async () => {
    try {
      await importsService.downloadImportTemplate();
      showToast('success', 'Đã tải mẫu import.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tải mẫu import'));
    }
  };

  const handleImportFile = async (file: File) => {
    setIsImportParsing(true);
    setImportErrors([]);
    try {
      const result = await importsService.parseImportFile(file);
      if (result.lines.length === 0) {
        setImportErrors(result.errors);
        showToast('error', 'Không có dòng hợp lệ để import.');
        return;
      }

      setItems(
        result.lines.map(line => ({
          materialCode: line.materialCode,
          qty: String(line.qty),
          unitPrice: line.unitPrice > 0 ? String(line.unitPrice) : '',
        })),
      );
      setImportErrors(result.errors);
      setCreateErrors(e => ({ ...e, items: undefined }));

      if (result.errors.length > 0) {
        showToast(
          'success',
          `Đã import ${result.validRowCount}/${result.totalRows} dòng. ${result.errorRowCount} dòng lỗi — xem chi tiết bên dưới.`,
        );
      } else {
        showToast('success', `Đã import ${result.validRowCount} dòng vật tư.`);
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể import file'));
    } finally {
      setIsImportParsing(false);
    }
  };

  const buildDto = (status: 'draft' | 'pending'): CreateImportDto | null => {
    const priceOpts = { requireUnitPrice: canViewPrices };

    const validItems = items.filter(line => isImportLineComplete(line, priceOpts));

    const supplierValid = Boolean(findSupplierByName(suppliers, defaultSupplier));

    const fieldErrors = getImportFormFieldErrors(
      projectCode,
      referenceCode,
      defaultSupplier,
      supplierValid,
      items,
      frozenByProjectCode,
      priceOpts,
    );

    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }

    setCreateErrors({});

    const validation = validateImportCreate(projectCode.trim(), validItems, priceOpts);

    if (!validation.success) {

      showToast('error', validation.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');

      return null;

    }



    const supplierMatch = findSupplierByName(suppliers, defaultSupplier.trim());

    const mappedItems = validItems.map(it => {

      const mat = materials.find(m => m.materialCode === it.materialCode);

      return {

        productId: it.materialCode,

        sku: it.materialCode,

        name: mat?.materialName ?? it.materialCode,

        qty: Number(it.qty),

        unit: mat?.unit ?? '',

        unitPrice: parseCurrencyInput(it.unitPrice),

        supplier: defaultSupplier.trim(),

        supplierId: supplierMatch?.id,

        notes: it.notes?.trim() ? it.notes.trim() : undefined,

      };

    });



    const totalValue = mappedItems.reduce((s, it) => s + it.qty * it.unitPrice, 0);

    return {

      voucherCode: '',

      date: new Date().toLocaleDateString('vi-VN'),

      supplier: defaultSupplier.trim(),

      referenceCode: referenceCode.trim(),

      totalValue,

      status,

      warehouseApproval: 'pending',

      approvedBy: '',

      warehouseKeeper: '',

      items: mappedItems,

      createdBy: '',

      note,

      warehouseId: '',

      isDirectProcurement: false,

      project: projectCode.trim(),

    };

  };



  const handleCreate = async (
    status: 'draft' | 'pending',
    evidence?: { files: File[]; evaluation: string },
  ) => {
    if (!editing) {
      if (!selectedPoCode) {
        setCreateErrors(e => ({ ...e, referenceCode: 'Vui lòng chọn PO đã đặt NCC.' }));
        return;
      }
      const selectedItems = items
        .map(line => {
          const match = /poItem:(\d+)/i.exec((line.notes ?? '').trim());
          const poItemId = match ? Number(match[1]) : NaN;
          const qty = Number(line.qty);
          return Number.isFinite(poItemId) && poItemId > 0 && Number.isFinite(qty) && qty > 0
            ? { poItemId, qty }
            : null;
        })
        .filter((x): x is { poItemId: number; qty: number } => Boolean(x));

      if (selectedItems.length === 0) {
        setCreateErrors(e => ({ ...e, items: 'PO chưa có dòng hợp lệ để nhập kho.' }));
        return;
      }

      try {
        const created = await createFromPoMutation.mutateAsync({
          poCode: selectedPoCode,
          request: { items: selectedItems },
        });

        const files = evidence?.files ?? [];
        const evaluation = (evidence?.evaluation ?? '').trim();
        if (evaluation) {
          await importsService.updateReceiptEvaluation(created.id, evaluation);
        }
        for (const file of files) {
          const kind = file.type.startsWith('image/') ? 'photo' : 'document';
          await importsService.uploadAttachment(created.id, file, kind);
        }

        if (status === 'pending') {
          await submitMutation.mutateAsync(created.id);
        }

        showToast(
          'success',
          status === 'draft'
            ? `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`
            : `Phiếu ${created.voucherCode} — nhập dự kiến, chờ duyệt thực tế.`,
        );
        setShowCreate(false);
        resetForm();
      } catch (err) {
        showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập từ PO'));
      }
      return;
    }

    const dto = buildDto(status);
    if (!dto) return;
    try {
      const created = await createMutation.mutateAsync(dto);

      showToast(
        'success',
        status === 'draft'
          ? `Phiếu nháp ${created.voucherCode} — chưa chốt dự kiến.`
          : `Phiếu ${created.voucherCode} — nhập dự kiến, chờ duyệt thực tế.`,
      );

      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập'));
    }
  };



  const handleUpdate = async (payload?: { evaluation: string }) => {

    if (!editing) return;

    const status = editing.status === 'draft' ? 'draft' : 'pending';

    const dto = buildDto(status);

    if (!dto) return;

    try {

      await updateMutation.mutateAsync({ id: editing.id, dto: { ...dto, status: editing.status } });

      const evaluation = (payload?.evaluation ?? '').trim();
      if (evaluation !== (editing.receiptEvaluation ?? '').trim()) {
        await importsService.updateReceiptEvaluation(editing.id, evaluation);
      }

      showToast('success', `Đã cập nhật phiếu ${editing.voucherCode}.`);

      setShowCreate(false);

      resetForm();

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu nhập'));

    }

  };



  const openEdit = (imp: Import) => {
    if (imp.status !== 'draft') {
      openDetail(imp);
      return;
    }

    setShowDetail(false);

    setEditing(imp);

    setProjectCode(imp.project ?? '');

    setDefaultSupplier(imp.supplier);

    setReferenceCode(imp.referenceCode);
    setSelectedPoCode(imp.referenceCode?.trim() || '');

    setNote(imp.note);

    setItems(importToFormLines(imp.items));

    setCreateErrors({});

    setShowCreate(true);

  };



  const handleSubmit = async (imp: Import) => {

    try {

      await submitMutation.mutateAsync(imp.id);

      showToast('success', `Đã duyệt dự kiến phiếu ${imp.voucherCode}`);

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));

    }

  };



  const runApprove = async (imp: Import, confirmOverBudget = false) => {

    try {

      await approveMutation.mutateAsync({ id: imp.id, confirmOverBudget });

      setBudgetConfirmImport(null);

      setBudgetExceeded(null);

      showToast('success', `Thủ kho đã duyệt kho phiếu ${imp.voucherCode}`);

    } catch (err) {

      const exceeded = parseImportBudgetExceeded(err);

      if (exceeded) {

        setBudgetConfirmImport(imp);

        setBudgetExceeded(exceeded);

        return;

      }

      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));

    }

  };



  const handleApprove = async (imp: Import, evaluationText?: string) => {
    const text = (evaluationText ?? imp.receiptEvaluation ?? '').trim();
    const hasPhoto = (imp.attachments ?? []).some(a => a.kind === 'photo');
    const hasDocument = (imp.attachments ?? []).some(a => a.kind === 'document');

    if (!text || !hasPhoto || !hasDocument) {
      if (evaluationText === undefined) {
        openDetail(imp);
      }
      showToast(
        'error',
        !text
          ? 'Thiếu đánh giá nhận hàng. Nhập trên chi tiết phiếu trước khi duyệt.'
          : !hasPhoto
            ? 'Thiếu ảnh nhận hàng. Tải ảnh trên chi tiết phiếu trước khi duyệt.'
            : 'Thiếu file chứng từ. Tải file trên chi tiết phiếu trước khi duyệt.',
      );
      return;
    }

    try {
      if ((imp.receiptEvaluation ?? '').trim() !== text) {
        setIsEvidencePending(true);
        await importsService.updateReceiptEvaluation(imp.id, text);
        await reloadImport(imp.id);
      }
      await runApprove(imp, false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleExportExcel = async () => {

    setIsExporting(true);

    try {

      await downloadVoucherExport('/api/imports/export', `phieu-nhap-${new Date().toISOString().slice(0, 10)}.xlsx`, {

        dateFrom: dateFrom || undefined,

        dateTo: dateTo || undefined,

        status: activeTab,

        search,

      });

      showToast('success', 'Đã xuất danh sách phiếu nhập');

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể xuất Excel'));

    } finally {

      setIsExporting(false);

    }

  };



  const openDetail = (imp: Import) => {

    setSelected(imp);

    setShowDetail(true);

  };

  const reloadImport = async (id: string) => {
    const refreshed = await importsService.getById(id);
    setSelected(prev => (prev?.id === id ? refreshed : prev));
    setEditing(prev => (prev?.id === id ? refreshed : prev));
    return refreshed;
  };

  const handleUploadAttachment = async (
    imp: Import,
    file: File,
    kind: 'document' | 'photo',
  ) => {
    try {
      setIsEvidencePending(true);
      await importsService.uploadAttachment(imp.id, file, kind);
      await reloadImport(imp.id);
      showToast('success', 'Đã tải file lên phiếu nhập.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDeleteAttachment = async (imp: Import, attachmentId: string) => {
    try {
      setIsEvidencePending(true);
      await importsService.deleteAttachment(imp.id, attachmentId);
      await reloadImport(imp.id);
      showToast('success', 'Đã xóa file.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không xóa được file.'));
    } finally {
      setIsEvidencePending(false);
    }
  };

  const handleDownloadAttachment = async (
    imp: Import,
    attachmentId: string,
    fileName: string,
  ) => {
    try {
      const blob = await importsService.downloadAttachment(imp.id, attachmentId);
      await saveBlob(blob, fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được file.'));
    }
  };

  const handleSaveEvaluation = async (imp: Import, evaluation: string) => {
    try {
      await importsService.updateReceiptEvaluation(imp.id, evaluation);
      await reloadImport(imp.id);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được đánh giá nhận hàng.'));
    }
  };



  return (

    <div className="hrm-page">

      <PageHeader

        title="Nhập kho"

        subtitle="Phiếu nhập dự kiến chờ duyệt thực tế và phiếu đã nhập — tạo phiếu nháp/dự kiến trên đơn hàng PO."

        actions={

          <>

            <button type="button" className="hrm-header-btn" onClick={() => void handleExportExcel()} disabled={isExporting}>

              <Download size={14} /> {isExporting ? 'Đang xuất…' : 'Xuất Excel'}

            </button>

          </>

        }

      />



      <HrmPanel noPadding>

        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">

          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />

        </div>

        <div className="hrm-list-toolbar">

          <div className="hrm-list-toolbar__filters">

            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, NCC, kho dự án..." />

            <VoucherDateFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={v => { setDateFrom(v); setPage(1); }}
              onToChange={v => { setDateTo(v); setPage(1); }}
              onReset={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            />

          </div>

        </div>



        <ImportTable

          rows={paginated}

          isLoading={isLoading}

          isError={isError}

          error={error}

          projectName={projectName}

          onOpenDetail={openDetail}

          onEdit={openEdit}

          onSubmit={handleSubmit}

          canEdit={false}

          canSubmit={false}

          canDelete={false}

          showPrices={canViewPrices}

        />



        {filtered.length > 0 && !isLoading && (

          <Pagination

            embedded

            itemLabel="phiếu nhập"

            currentPage={page}

            totalPages={totalPages}

            onPageChange={setPage}

            pageSize={pageSize}

            onPageSizeChange={s => { setPageSize(s); setPage(1); }}

            totalItems={filtered.length}

          />

        )}

      </HrmPanel>



      <ImportCreateModal

        isOpen={showCreate}

        onClose={() => { setShowCreate(false); resetForm(); }}

        isPending={createMutation.isPending || createFromPoMutation.isPending || updateMutation.isPending || approveMutation.isPending}

        isImportParsing={isImportParsing}

        projects={projects}

        suppliers={suppliers}

        materials={materials}

        projectCode={projectCode}

        frozenByProjectCode={frozenByProjectCode}

        onProjectCodeChange={code => {
          setProjectCode(code);
          setSelectedPoCode('');
          setCreateErrors(e => ({
            ...e,
            projectCode: getFrozenProjectError(frozenByProjectCode, code),
            referenceCode: undefined,
            items: undefined,
          }));
        }}

        defaultSupplier={defaultSupplier}

        onDefaultSupplierChange={name => {
          setDefaultSupplier(name);
          setCreateErrors(e => ({ ...e, defaultSupplier: undefined }));
        }}

        referenceCode={referenceCode}

        onReferenceCodeChange={code => {
          setReferenceCode(code);
          setCreateErrors(e => ({ ...e, referenceCode: undefined }));
        }}

        note={note}

        onNoteChange={setNote}

        items={items}

        onItemsChange={next => {
          // Tạo từ PO / sửa theo PO: giữ notes poItem:* từ bảng chọn dòng.
          // Sửa tự do (không PO): đổi mã VT thì bỏ notes cũ để tránh khớp sai khi duyệt.
          setItems(prev => {
            if (!editing || selectedPoCode) return next;
            return next.map((line, idx) => {
              const prevLine = prev[idx];
              if (prevLine && prevLine.materialCode === line.materialCode) return line;
              if (line.notes) return { ...line, notes: undefined };
              return line;
            });
          });
          setCreateErrors(e => {
            const cleared = { ...e, items: undefined };
            delete cleared.lineErrors;
            return cleared;
          });
        }}

        formGrandTotal={formGrandTotal}

        errors={createErrors}

        onCreate={handleCreate}

        onSave={handleUpdate}

        importErrors={importErrors}

        onDownloadTemplate={handleDownloadImportTemplate}

        onImportFile={handleImportFile}

        editVoucher={
          editing
            ? {
                code: editing.voucherCode,
                receiptEvaluation: editing.receiptEvaluation,
                status: editing.status,
              }
            : null
        }

        materialUnit={materialUnit}
        editAttachments={editing?.attachments ?? []}
        isEvidencePending={isEvidencePending}
        onUploadEditAttachment={
          editing && canEditImport
            ? (file, kind) => handleUploadAttachment(editing, file, kind)
            : undefined
        }
        onDeleteEditAttachment={
          editing && canEditImport
            ? attachmentId => handleDeleteAttachment(editing, attachmentId)
            : undefined
        }
        onDownloadEditAttachment={
          editing
            ? (attachmentId, fileName) => handleDownloadAttachment(editing, attachmentId, fileName)
            : undefined
        }
        poOptions={poOptions}
        selectedPoCode={selectedPoCode}
        onSelectedPoCodeChange={code => {
          setSelectedPoCode(code);
          const po = poOptions.find(p => p.code === code);
          setProjectCode(po?.projectCode ?? '');
          setDefaultSupplier(po?.supplierName ?? '');
          setReferenceCode(code);
          setCreateErrors(e => ({ ...e, referenceCode: undefined, items: undefined, projectCode: undefined }));
          setItems([{ ...emptyQtyPriceLine }]);
        }}
        poLoading={purchaseOrdersQuery.isLoading || poPreviewQuery.isLoading}
        poPreviewLines={poPreviewQuery.data?.lines ?? []}

        onDuplicateMaterialAttempt={lineIndex => {
          setCreateErrors(e => ({
            ...e,
            lineErrors: {
              ...e.lineErrors,
              [lineIndex]: { materialCode: DUPLICATE_MATERIAL_MESSAGE },
            },
          }));
        }}

      />



      <ImportDetailModal

        isOpen={showDetail}

        onClose={() => setShowDetail(false)}

        selected={selected}

        projectName={projectName}

        onApprove={canApproveImport ? (imp, evaluation) => { void handleApprove(imp, evaluation); } : undefined}

        isApproving={approveMutation.isPending}

        onDownloadAttachment={handleDownloadAttachment}

        canUpdateEvidence={canApproveImport}

        isEvidencePending={isEvidencePending}

        onUploadAttachment={handleUploadAttachment}

        onDeleteAttachment={handleDeleteAttachment}

        onSaveEvaluation={handleSaveEvaluation}

        showPrices={canViewPrices}

      />

      <ConfirmDialog

        isOpen={budgetConfirmImport != null && budgetExceeded != null}

        onClose={() => {

          setBudgetConfirmImport(null);

          setBudgetExceeded(null);

        }}

        onConfirm={() => {

          if (budgetConfirmImport) void runApprove(budgetConfirmImport, true);

        }}

        title="Vượt ngân sách vật tư"

        variant="default"

        confirmLabel="Vẫn duyệt"

        isLoading={approveMutation.isPending}

        message={budgetExceeded ? (

          <div className="space-y-2 text-sm">

            <p>

              Kho dự án <strong>{budgetExceeded.projectCode}</strong> sẽ vượt hạn mức sau khi duyệt phiếu{' '}

              <strong>{budgetConfirmImport?.voucherCode}</strong>.

            </p>

            <ul className="text-left space-y-1 tabular-nums">

              <li>Hạn mức: {formatCurrencyFull(budgetExceeded.materialBudget)}</li>

              <li>Đã nhập (đã duyệt): {formatCurrencyFull(budgetExceeded.approvedImportValue)}</li>

              <li>Giá trị phiếu này: {formatCurrencyFull(budgetExceeded.importValue)}</li>

              <li className="text-[var(--md-error)] font-semibold">

                Vượt: {formatCurrencyFull(budgetExceeded.overflowAmount)}

              </li>

            </ul>

          </div>

        ) : null}

      />

    </div>

  );

}

