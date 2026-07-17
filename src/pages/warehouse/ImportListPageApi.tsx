import { useState, useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import { Plus, Download } from 'lucide-react';

import type { ImportBudgetExceededApiDto } from '../../types/api/importBudgetApi';
import type { Import } from '../../types';

import TabFilter from '../../components/ui/TabFilter';

import SearchBar from '../../components/ui/SearchBar';

import Pagination from '../../components/ui/Pagination';

import PageHeader from '../../components/ui/PageHeader';

import PermissionGate from '../../components/auth/PermissionGate';

import HrmPanel from '../../components/hr/HrmPanel';

import { showToast } from '../../components/ui/Toast';

import { getApiErrorMessage } from '../../lib/apiClient';

import { parseImportBudgetExceeded } from '../../lib/wms/projectBudget';
import { downloadVoucherExport } from '../../lib/wms/voucherExportDownload';

import { formatCurrencyFull } from '../../utils/formatCurrency';

import ConfirmDialog from '../../components/ui/ConfirmDialog';

import { validateImportCreate, getImportFormFieldErrors, isImportLineComplete, type ImportFormFieldErrors } from '../../lib/wms/importFormSchema';
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

} from '../../hooks/useImports';

import { useMaterials } from '../../hooks/useMaterials';

import { useProjects } from '../../hooks/useProjects';

import { useSuppliers } from '../../hooks/useSuppliers';

import { findSupplierByName } from '../../services/suppliersService';
import { suggestImportUnitPrice } from '../../lib/wms/suggestImportUnitPrice';

import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

import type { CreateImportDto } from '../../services/importsService';
import { importsService } from '../../services/importsService';
import type { ImportParseErrorApiDto } from '../../types/api/importParseApi';

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

  const [showCreate, setShowCreate] = useState(!!initialProjectCode);

  const [showDetail, setShowDetail] = useState(false);

  const [selected, setSelected] = useState<Import | null>(null);

  const [budgetConfirmImport, setBudgetConfirmImport] = useState<Import | null>(null);

  const [budgetExceeded, setBudgetExceeded] = useState<ImportBudgetExceededApiDto | null>(null);

  const [editing, setEditing] = useState<Import | null>(null);



  const [defaultSupplier, setDefaultSupplier] = useState('');

  const [referenceCode, setReferenceCode] = useState('');

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');

  const [note, setNote] = useState('');

  const [items, setItems] = useState<MaterialQtyPriceLine[]>([{ ...emptyQtyPriceLine }]);

  const [createErrors, setCreateErrors] = useState<ImportFormFieldErrors>({});
  const [importErrors, setImportErrors] = useState<ImportParseErrorApiDto[]>([]);
  const [isImportParsing, setIsImportParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: imports = [], isLoading, isError, error } = useImports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: materialsPage } = useMaterials({ pageSize: 200 });

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });

  const { data: suppliersPage } = useSuppliers({ all: true });

  const createMutation = useCreateImport();
  const frozenByProjectCode = useFrozenProjects();

  const updateMutation = useUpdateImport();

  const approveMutation = useApproveImport();

  const submitMutation = useSubmitImport();



  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);

  const handleMaterialLineChange = async (index: number, materialCode: string) => {
    const supplier = findSupplierByName(suppliers, defaultSupplier);
    if (!materialCode || !supplier) return;
    const price = await suggestImportUnitPrice(materialCode, supplier.id);
    if (!price) return;
    setItems(prev => {
      const next = [...prev];
      const line = next[index];
      if (!line || (line.unitPrice && Number(line.unitPrice) > 0)) return prev;
      next[index] = { ...line, unitPrice: String(price) };
      return next;
    });
  };



  const voucherTabs = getVoucherTabLabels('import');

  const tabs = [

    { id: 'all', label: 'Tất cả', count: imports.length },

    { id: 'draft', label: voucherTabs.draft, count: imports.filter(i => i.status === 'draft').length },

    { id: 'pending', label: voucherTabs.pending, count: imports.filter(i => i.status === 'pending').length },

    { id: 'approved', label: voucherTabs.approved, count: imports.filter(i => i.status === 'approved').length },

  ];



  const filtered = useMemo(() => {

    let list = imports;

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

  }, [imports, activeTab, search]);



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

    setProjectCode('');

    setNote('');

    setItems([{ ...emptyQtyPriceLine }]);

    setCreateErrors({});
    setImportErrors([]);

  };



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

    const validItems = items.filter(isImportLineComplete);

    const supplierValid = Boolean(findSupplierByName(suppliers, defaultSupplier));

    const fieldErrors = getImportFormFieldErrors(
      projectCode,
      referenceCode,
      defaultSupplier,
      supplierValid,
      items,
      frozenByProjectCode,
    );

    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      return null;
    }

    setCreateErrors({});

    const validation = validateImportCreate(projectCode.trim(), validItems);

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



  const handleCreate = async (status: 'draft' | 'pending') => {

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

      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật phiếu nhập'));

    }

  };



  const openEdit = (imp: Import) => {

    setEditing(imp);

    setProjectCode(imp.project ?? '');

    setDefaultSupplier(imp.supplier);

    setReferenceCode(imp.referenceCode);

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



  const handleApprove = (imp: Import) => {

    void runApprove(imp, false);

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



  return (

    <div className="hrm-page">

      <PageHeader

        title="Nhập kho"

        subtitle="Nhập vật tư từ NCC vào kho dự án — chọn NCC, thêm vật tư và đơn giá."

        actions={

          <>

            <button type="button" className="hrm-header-btn" onClick={() => void handleExportExcel()} disabled={isExporting}>

              <Download size={14} /> {isExporting ? 'Đang xuất…' : 'Xuất Excel'}

            </button>

            <PermissionGate permission="wms.imports.create">
              <button

                type="button"

                className="btn btn-primary flex items-center gap-2 rounded-full px-5"

                onClick={() => { resetForm(); setShowCreate(true); }}

              >

                <Plus size={16} /> Tạo phiếu nhập

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

          onApprove={handleApprove}

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

        isPending={createMutation.isPending || updateMutation.isPending}

        projects={projects}

        suppliers={suppliers}

        materials={materials}

        projectCode={projectCode}

        frozenByProjectCode={frozenByProjectCode}

        onProjectCodeChange={code => {
          setProjectCode(code);
          setCreateErrors(e => ({
            ...e,
            projectCode: getFrozenProjectError(frozenByProjectCode, code),
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
          setItems(next);
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

        editVoucher={editing ? { code: editing.voucherCode } : null}

        materialUnit={materialUnit}

        isImportParsing={isImportParsing}

        importErrors={importErrors}

        onDownloadTemplate={handleDownloadImportTemplate}

        onImportFile={handleImportFile}

        onMaterialLineChange={handleMaterialLineChange}

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

        isSubmitPending={submitMutation.isPending}

        isApprovePending={approveMutation.isPending}

        onSubmit={handleSubmit}

        onApprove={handleApprove}

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

