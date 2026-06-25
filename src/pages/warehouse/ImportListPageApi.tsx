import { useState, useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import { Plus, Download } from 'lucide-react';

import type { Import } from '../../types';

import TabFilter from '../../components/ui/TabFilter';

import SearchBar from '../../components/ui/SearchBar';

import Pagination from '../../components/ui/Pagination';

import PageHeader from '../../components/ui/PageHeader';

import HrmPanel from '../../components/hr/HrmPanel';

import { showToast } from '../../components/ui/Toast';

import { getApiErrorMessage } from '../../lib/apiClient';

import { validateImportCreate, getImportFormFieldErrors, type ImportFormFieldErrors } from '../../lib/wms/importFormSchema';

import { parseCurrencyInput } from '../../utils/currencyInput';

import {

  useImports,

  useCreateImport,

  useApproveImport,

  useSubmitImport,

} from '../../hooks/useImports';

import { useMaterials } from '../../hooks/useMaterials';

import { useProjects } from '../../hooks/useProjects';

import { useSuppliers } from '../../hooks/useSuppliers';

import { findSupplierByName } from '../../services/suppliersService';

import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

import type { CreateImportDto } from '../../services/importsService';

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



  const [defaultSupplier, setDefaultSupplier] = useState('');

  const [referenceCode, setReferenceCode] = useState('');

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');

  const [note, setNote] = useState('');

  const [items, setItems] = useState<MaterialQtyPriceLine[]>([{ ...emptyQtyPriceLine }]);

  const [createErrors, setCreateErrors] = useState<ImportFormFieldErrors>({});

  const { data: imports = [], isLoading, isError, error } = useImports({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: materialsPage } = useMaterials({ pageSize: 200 });

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });

  const { data: suppliersPage } = useSuppliers({ all: true });

  const createMutation = useCreateImport();

  const approveMutation = useApproveImport();

  const submitMutation = useSubmitImport();



  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const suppliers = useMemo(() => suppliersPage?.items ?? [], [suppliersPage?.items]);



  const tabs = [

    { id: 'all', label: 'Tất cả', count: imports.length },

    { id: 'draft', label: 'Nháp', count: imports.filter(i => i.status === 'draft').length },

    { id: 'pending', label: 'Chờ duyệt', count: imports.filter(i => i.status === 'pending').length },

    { id: 'approved', label: 'Đã duyệt', count: imports.filter(i => i.status === 'approved').length },

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

    setDefaultSupplier('');

    setReferenceCode('');

    setProjectCode('');

    setNote('');

    setItems([{ ...emptyQtyPriceLine }]);

    setCreateErrors({});

  };



  const buildDto = (status: 'draft' | 'pending'): CreateImportDto | null => {

    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);

    const supplierValid = Boolean(findSupplierByName(suppliers, defaultSupplier));

    const fieldErrors = getImportFormFieldErrors(
      projectCode,
      referenceCode,
      defaultSupplier,
      supplierValid,
      items,
    );

    if (Object.keys(fieldErrors).length > 0) {

      setCreateErrors(fieldErrors);

      showToast('error', 'Vui lòng kiểm tra lại các ô được đánh dấu.');

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

      createdBy: 'USER',

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

          ? `Phiếu nháp ${created.voucherCode} — đã ghi dự kiến nhập dự án.`

          : `Phiếu ${created.voucherCode} đã duyệt dự kiến, chờ thủ kho duyệt kho.`,

      );

      setShowCreate(false);

      resetForm();

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu nhập'));

    }

  };



  const handleSubmit = async (imp: Import) => {

    try {

      await submitMutation.mutateAsync(imp.id);

      showToast('success', `Đã duyệt dự kiến phiếu ${imp.voucherCode}`);

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));

    }

  };



  const handleApprove = async (imp: Import) => {

    try {

      await approveMutation.mutateAsync(imp.id);

      showToast('success', `Thủ kho đã duyệt kho phiếu ${imp.voucherCode}`);

    } catch (err) {

      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));

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

            <button type="button" className="hrm-header-btn"><Download size={14} /> Xuất Excel</button>

            <button

              type="button"

              className="btn btn-primary flex items-center gap-2 rounded-full px-5"

              onClick={() => { resetForm(); setShowCreate(true); }}

            >

              <Plus size={16} /> Tạo phiếu nhập

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

        onClose={() => setShowCreate(false)}

        isPending={createMutation.isPending}

        projects={projects}

        suppliers={suppliers}

        materials={materials}

        projectCode={projectCode}

        onProjectCodeChange={code => {
          setProjectCode(code);
          setCreateErrors(e => ({ ...e, projectCode: undefined }));
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
          setCreateErrors(e => ({ ...e, items: undefined }));
        }}

        formGrandTotal={formGrandTotal}

        errors={createErrors}

        onCreate={handleCreate}

        materialUnit={materialUnit}

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

    </div>

  );

}

