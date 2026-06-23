import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import type { Export } from '../../types';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { validateExportCreate } from '../../lib/wms/exportFormSchema';
import {
  useExports,
  useCreateExport,
  useApproveExport,
  useSubmitExport,
} from '../../hooks/useExports';
import { useMaterials } from '../../hooks/useMaterials';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { CreateExportDto } from '../../services/exportsService';
import { emptyQtyLine, type MaterialQtyLine } from './voucher/voucherFormTypes';
import { availableExportQty, inventoryRow } from './export/exportUtils';
import ExportTable from './export/ExportTable';
import ExportCreateModal from './export/ExportCreateModal';
import ExportDetailModal from './export/ExportDetailModal';

export default function ExportListPageRoute() {
  const location = useLocation();
  const initialProjectCode = (location.state as { projectCode?: string } | null)?.projectCode;
  return <ExportListPageApi key={location.key} initialProjectCode={initialProjectCode} />;
}

interface ExportListPageApiProps {
  initialProjectCode?: string;
}

function ExportListPageApi({ initialProjectCode }: ExportListPageApiProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showCreate, setShowCreate] = useState(!!initialProjectCode);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Export | null>(null);

  const [projectCode, setProjectCode] = useState(initialProjectCode ?? '');
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MaterialQtyLine[]>([{ ...emptyQtyLine }]);

  const { data: exports = [], isLoading, isError, error } = useExports();
  const { data: materialsPage } = useMaterials({ pageSize: 200 });
  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const { data: projectInventory = [] } = useProjectInventory(projectCode || undefined);
  const createMutation = useCreateExport();
  const approveMutation = useApproveExport();
  const submitMutation = useSubmitExport();

  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);

  const stockMaterials = useMemo(() => {
    if (!projectCode) return materials;
    const codes = new Set(
      projectInventory
        .filter(r => r.actualInventoryQty - r.plannedExportQty > 0)
        .map(r => r.materialCode),
    );
    return materials.filter(m => codes.has(m.materialCode));
  }, [materials, projectInventory, projectCode]);

  const tabs = [
    { id: 'all', label: 'Tất cả', count: exports.length },
    { id: 'draft', label: 'Nháp', count: exports.filter(e => e.status === 'draft').length },
    { id: 'pending', label: 'Chờ duyệt', count: exports.filter(e => e.status === 'pending').length },
    { id: 'approved', label: 'Đã duyệt', count: exports.filter(e => e.status === 'approved').length },
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
    setProjectCode('');
    setReferenceCode('');
    setNote('');
    setItems([{ ...emptyQtyLine }]);
  };

  const buildDto = (status: 'draft' | 'pending'): CreateExportDto | null => {
    const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
    const validation = validateExportCreate(projectCode.trim(), validItems);
    if (!validation.success) {
      showToast('error', validation.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return null;
    }

    const overflow = validItems.some((it, idx) => {
      const max = availableExportQty(projectInventory, it.materialCode, items, idx);
      return Number(it.qty) > max;
    });
    if (overflow) {
      showToast('error', 'Số lượng xuất vượt tồn khả dụng tại kho dự án.');
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
      createdBy: 'USER',
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
          ? `Phiếu nháp ${created.voucherCode} — đã ghi dự kiến xuất.`
          : `Phiếu ${created.voucherCode} đã chốt, chờ thủ kho duyệt.`,
      );
      setShowCreate(false);
      resetForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu xuất'));
    }
  };

  const handleSubmit = async (exp: Export) => {
    try {
      await submitMutation.mutateAsync(exp.id);
      showToast('success', `Đã chốt phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể chốt phiếu'));
    }
  };

  const handleApprove = async (exp: Export) => {
    try {
      await approveMutation.mutateAsync(exp.id);
      showToast('success', `Thủ kho đã duyệt phiếu ${exp.voucherCode}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu'));
    }
  };

  const openDetail = (exp: Export) => {
    setSelected(exp);
    setShowDetail(true);
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Xuất kho"
        subtitle="Tiêu hao vật tư tại kho dự án — trừ tồn thực tế sau khi thủ kho duyệt."
        actions={
          <>
            <button type="button" className="hrm-header-btn"><Download size={14} /> Xuất Excel</button>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => { resetForm(); setShowCreate(true); }}
            >
              <Plus size={16} /> Tạo phiếu xuất
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
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã chứng từ, kho dự án..." />
          </div>
        </div>

        <ExportTable
          rows={paginated}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onOpenDetail={openDetail}
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
        onClose={() => setShowCreate(false)}
        isPending={createMutation.isPending}
        projects={projects}
        stockMaterials={stockMaterials}
        projectInventory={projectInventory}
        projectCode={projectCode}
        onProjectCodeChange={setProjectCode}
        referenceCode={referenceCode}
        onReferenceCodeChange={setReferenceCode}
        note={note}
        onNoteChange={setNote}
        items={items}
        onItemsChange={setItems}
        onCreate={handleCreate}
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
