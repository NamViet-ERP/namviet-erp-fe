import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import { useCskhAction } from '../../hooks/cskh/useCskhAction';
import { apiClient, saveBlob } from '../../lib/apiClient';
import { useMemo, useState, useRef, type ChangeEvent } from 'react';
import { Archive, Plus, ShieldCheck, Download, Trash2, Pencil, Upload, FileText, HardDrive } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import { showToast } from '../../components/ui/Toast';
import { isoToDisplay } from '../../lib/dates';
import { projectsService } from '../../services/projectsService';
import { cskhProjectTabMeta } from '../../constants/cskhProject';
import { ICON_SIZE } from '../../constants/icons';
import {
  filterArchiveDocs,
  getDocTypeTagClass,
  applyDynamicSla,
  type CskhArchiveCategoryFilter,
  type CskhUnifiedDoc,
} from '../../lib/cskh/docsPipeline';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsArchivePageProps {
  project: CskhProjectRecord;
}

const EMPTY_DOC_FORM = {
  code: '',
  name: '',
  docType: 'As-built',
  category: 'Bản vẽ As-built',
  author: '',
  handoverDate: '',
  fileName: '',
  fileSize: '',
};

const FILTERS: CskhFilterOption<CskhArchiveCategoryFilter>[] = [
  { id: 'all', label: 'Tất cả tài liệu', tone: 'navy' },
  { id: 'acceptance', label: 'Nghiệm thu lắp đặt', tone: 'ok' },
  { id: 'cocq', label: 'CO/CQ & Xuất xưởng', tone: 'info' },
  { id: 'asbuilt', label: 'Bản vẽ As-built', tone: 'warn' },
  { id: 'warranty', label: 'Vận hành & Bảo dưỡng 48T', tone: 'navy' },
];

export default function CskhDocsArchivePage({ project }: CskhDocsArchivePageProps) {
  const meta = cskhProjectTabMeta('docs-archive');
  
  const documentsQuery = useQuery({
    queryKey: queryKeys.cskh.documents(project.code),
    queryFn: async (): Promise<CskhUnifiedDoc[]> => (await projectsService.listDocuments(project.code)).map(doc => applyDynamicSla(doc)),
  });
  const docsList = documentsQuery.data ?? [];
  const loadData = () => documentsQuery.refetch();
  const { run, isPending, error: actionError } = useCskhAction();

  const archiveDocs = docsList.filter(d => d.stage === 'archived' || d.stage === 'approved');
  const kpis = {
    total: archiveDocs.length,
    signed: archiveDocs.filter(d => d.handoverSigned).length,
    sizeStr: String(archiveDocs.filter(doc => doc.downloadUrl).length),
  };

  const [filter, setFilter] = useState<CskhArchiveCategoryFilter>('all');
  
  const [openModal, setOpenModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CskhUnifiedDoc | null>(null);
  const [form, setForm] = useState(EMPTY_DOC_FORM);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<CskhUnifiedDoc | null>(null);

  const rows = useMemo(() => filterArchiveDocs(docsList, filter), [docsList, filter]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const openCreate = () => {
    setEditingDoc(null);
    setForm(EMPTY_DOC_FORM);
    setFileToUpload(null);
    setOpenModal(true);
  };

  const openEdit = (doc: CskhUnifiedDoc) => {
    setEditingDoc(doc);
    setForm({
      code: doc.code,
      name: doc.name,
      docType: doc.docType || 'As-built',
      category: doc.category || 'Bản vẽ As-built',
      author: doc.author || '',
      handoverDate: doc.handoverDate || '',
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || '',
    });
    setFileToUpload(null);
    setOpenModal(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFileToUpload(f);
      const sizeMb = f.size / (1024 * 1024);
      const sizeStr = sizeMb < 1 ? `${Math.round(f.size / 1024)} KB` : `${sizeMb.toFixed(1)} MB`;
      setForm(prev => ({
        ...prev,
        fileName: f.name,
        fileSize: sizeStr,
      }));
    }
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      showToast('error', 'Vui lòng nhập mã và tên hồ sơ');
      return;
    }
    await run(async () => {
      let savedDoc;
      if (editingDoc) {
        savedDoc = await projectsService.updateDocument(project.code, editingDoc.id, {
          code: form.code.trim(),
          name: form.name.trim(),
          docType: form.docType,
          category: form.category,
          author: form.author,
          handoverDate: form.handoverDate || null,
          fileName: form.fileName,
          fileSize: form.fileSize,
        });

      } else {
        savedDoc = await projectsService.createDocument(project.code, {
          code: form.code.trim(),
          name: form.name.trim(),
          docType: form.docType,
          category: form.category,
          author: form.author,
          handoverDate: form.handoverDate || null,
          fileName: form.fileName,
          fileSize: form.fileSize,
          stage: 'archived',
          status: 'approved',
          statusLabel: 'Lưu trữ chính thức',
          internalApproved: true,
          handoverSigned: true,
        });

      }

      // Retain the newly created record so retrying a failed upload updates it.
      setEditingDoc(savedDoc);
      if (savedDoc && fileToUpload) {
        await projectsService.uploadDocumentFile(project.code, savedDoc.id, fileToUpload);

      }

      setOpenModal(false);
      showToast('success', 'Đã lưu hồ sơ và tệp đính kèm.');
      await loadData();
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await run(async () => {
      await projectsService.deleteDocument(project.code, deleteTarget.id);

      setDeleteTarget(null);
      await loadData();
    });
  };

  const downloadFile = async (doc: CskhUnifiedDoc) => {
    if (!doc.downloadUrl) {
      showToast('warning', 'Hồ sơ chưa có tệp đính kèm.');
      return;
    }
    try {
      const endpoint = `/api/warehouse/projects/${encodeURIComponent(project.code)}/documents/${encodeURIComponent(doc.id)}/download`;
      await saveBlob(await apiClient.getBlob(endpoint), doc.fileName || `${doc.code}.pdf`);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được tệp. Vui lòng thử lại.');
    }
  };

  return (
    <div className="page-stack cskh-desk space-y-4">
      {documentsQuery.isLoading && <p role="status">Đang tải hồ sơ…</p>}
      {documentsQuery.isError && <p role="alert">Không tải được hồ sơ. <button type="button" onClick={() => void loadData()}>Thử lại</button></p>}
      {actionError && <p role="alert">{actionError}</p>}
      <PageHeader 
        title={meta.title} 
        subtitle={`${project.code} - ${meta.subtitle}`} 
        actions={
          <Button variant="filled" onClick={openCreate} className="gap-1.5 shadow-sm">
            <Plus size={16} /> Nhập kho hồ sơ
          </Button>
        }
      />

      <CskhPipelineSteps code={project.code} current="docs-archive" />

      {/* KPI Cards — Standard ERP Dashboard Grid */}
      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số lưu trữ">
        <Card
          title="Tổng hồ sơ lưu trữ"
          value={kpis.total}
          subtitle="Bản cứng kho & bản mềm Cloud"
          accent="blue"
          icon={Archive}
        />
        <Card
          title="Tệp đính kèm"
          value={kpis.sizeStr}
          subtitle="Hồ sơ có tệp đã tải lên"
          accent="purple"
          icon={HardDrive}
        />
        <Card
          title="Chuẩn pháp lý bàn giao"
          value={`${kpis.signed} hồ sơ`}
          subtitle="Đã ký biên bản 3 bên & mộc đỏ"
          accent="success"
          icon={ShieldCheck}
        />
      </div>

      <HrmPanel className="cskh-desk__panel" noPadding>
        <div className="cskh-split-toolbar">
          <CskhFilterTabs options={FILTERS} value={filter} onChange={val => setFilter(val as typeof filter)} />
          <div className="text-xs text-[var(--md-on-surface-variant)] font-medium">
            Hiển thị <span className="font-semibold text-[var(--md-on-surface)]">{rows.length}</span> hồ sơ hoàn công
          </div>
        </div>

        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell text-center" style={{ width: '3rem' }}>STT</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '7.5rem' }}>Mã hồ sơ</th>
                <th className="table-header-cell" style={{ minWidth: '16rem' }}>Tên tài liệu hoàn công</th>
                <th className="table-header-cell whitespace-nowrap" style={{ width: '11rem' }}>Danh mục / Loại</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '12rem' }}>Pháp lý & Ký tá</th>
                <th className="table-header-cell whitespace-nowrap" style={{ width: '12rem' }}>Tệp lưu trữ</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '6rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState 
                      icon={Archive} 
                      message="Không có tài liệu nào trong danh mục này." 
                      action={
                        <Button variant="outlined" size="sm" onClick={openCreate} className="mt-2 gap-1.5">
                          <Plus size={14} /> Nhập kho tài liệu mới
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const stt = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell text-center tabular-nums text-xs text-[var(--md-on-surface-variant)]">
                        {stt}
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        <EntityCodeLink code={row.code} onClick={() => openEdit(row)} />
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-[var(--md-on-surface)] leading-snug">{row.name}</div>
                        {row.author && (
                          <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                            Phụ trách: <span className="font-medium text-[var(--md-on-surface)]">{row.author}</span>
                          </div>
                        )}
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <span className={`cskh-tag ${getDocTypeTagClass(row.category || row.docType)}`}>
                          {row.category || row.docType || 'Hồ sơ kỹ thuật'}
                        </span>
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        {row.handoverSigned ? (
                          <span className="cskh-status cskh-status--ok">
                            <span className="cskh-status__dot" aria-hidden />
                            <span>Đã có mộc đỏ 3 bên</span>
                          </span>
                        ) : (
                          <span className="cskh-status cskh-status--warn">
                            <span className="cskh-status__dot" aria-hidden />
                            <span>Bản scan chờ hoàn công</span>
                          </span>
                        )}
                        <div className="text-[11px] text-[var(--md-on-surface-variant)] mt-0.5">
                          Ngày ký: <span className="font-medium text-[var(--md-on-surface)]">{row.handoverDate ? isoToDisplay(row.handoverDate) : '—'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {row.fileName ? (
                          <div 
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium max-w-[180px] truncate"
                            onClick={() => downloadFile(row)}
                            title={`${row.fileName} (${row.fileSize || 'Tải về'})`}
                          >
                            <FileText size={14} className="shrink-0 text-blue-500" />
                            <span className="truncate">{row.fileName}</span>
                            {row.fileSize && <span className="text-[10px] text-slate-400 font-normal">({row.fileSize})</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        <div className="hrm-table-row-actions justify-center">
                          <button 
                            type="button"
                            className="icon-btn" 
                            title="Tải về"
                            aria-label={`Tải về ${row.code}`}
                            onClick={() => downloadFile(row)} 
                          >
                            <Download size={ICON_SIZE.dense} aria-hidden />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn" 
                            title="Sửa"
                            aria-label={`Sửa ${row.code}`}
                            onClick={() => openEdit(row)} 
                          >
                            <Pencil size={ICON_SIZE.dense} aria-hidden />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn icon-btn--danger" 
                            title="Xóa"
                            aria-label={`Xóa ${row.code}`}
                            onClick={() => setDeleteTarget(row)} 
                          >
                            <Trash2 size={ICON_SIZE.dense} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      
        <Pagination 
          embedded 
          itemLabel="tài liệu" 
          currentPage={page} 
          pageSize={pageSize} 
          totalItems={rows.length} 
          totalPages={Math.ceil(rows.length / pageSize) || 1} 
          onPageChange={setPage} 
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} 
        />
      </HrmPanel>

      {/* Modal Nhập kho / Chỉnh sửa hồ sơ */}
      <Modal 
        isOpen={openModal} 
        onClose={() => setOpenModal(false)} 
        title={editingDoc ? "Cập Nhật Hồ Sơ Hoàn Công" : "Nhập Kho Hồ Sơ Chính Thức"} 
        size="lg"
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Mã tài liệu *">
              <input 
                className="form-input w-full" 
                placeholder="VD: ARC-05 hoặc HS-305" 
                value={form.code} 
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))} 
              />
            </FormField>
            <FormField label="Tên hồ sơ nghiệm thu / hoàn công *">
              <input 
                className="form-input w-full" 
                placeholder="VD: Bản vẽ hoàn công tuyến ống hơi chính" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Danh mục lưu kho (Tủ hồ sơ)">
              <select 
                className="form-select w-full" 
                value={form.category} 
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="Nghiệm thu lắp đặt">Nghiệm thu lắp đặt</option>
                <option value="CO/CQ & Xuất xưởng">CO/CQ & Xuất xưởng</option>
                <option value="Bản vẽ As-built">Bản vẽ As-built</option>
                <option value="Vận hành & Bảo dưỡng 48T">Vận hành & Bảo dưỡng 48T</option>
              </select>
            </FormField>
            <FormField label="Loại giấy tờ">
              <input 
                className="form-input w-full" 
                placeholder="VD: Biên bản nghiệm thu, Bản vẽ..." 
                value={form.docType} 
                onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} 
              />
            </FormField>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Ngày ký nghiệm thu / Bàn giao">
              <input 
                type="date" 
                className="form-input w-full" 
                value={form.handoverDate} 
                onChange={e => setForm(f => ({ ...f, handoverDate: e.target.value }))} 
              />
            </FormField>
            <FormField label="Đơn vị lập / Chịu trách nhiệm">
              <input 
                className="form-input w-full" 
                placeholder="VD: Ban chỉ huy công trường Nam Việt" 
                value={form.author} 
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))} 
              />
            </FormField>
          </div>

          {/* S3 File Upload Box */}
          <div 
            className="border-2 border-dashed border-sky-200 bg-sky-50/40 rounded-xl p-6 text-center cursor-pointer hover:bg-sky-50 hover:border-sky-300 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2">
              <Upload size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {fileToUpload ? fileToUpload.name : form.fileName ? form.fileName : 'Nhấn để chọn tệp tài liệu (PDF, DWG, DOCX...)'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {fileToUpload 
                ? `Kích thước: ${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB · Sẵn sàng đồng bộ AWS S3` 
                : form.fileSize 
                  ? `Dung lượng hiện tại: ${form.fileSize}` 
                  : 'Hỗ trợ lưu trữ Cloud an toàn và chia sẻ cho CĐT'}
            </p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outlined" onClick={() => setOpenModal(false)}>Hủy</Button>
            <Button variant="filled" disabled={isPending} onClick={handleSave}>
              {editingDoc ? 'Lưu thay đổi' : 'Nhập kho & Tải lên'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isLoading={isPending} 
        isOpen={Boolean(deleteTarget)} 
        title="Xóa hồ sơ lưu trữ" 
        message={`Bạn có chắc chắn muốn xóa hồ sơ ${deleteTarget?.code} - ${deleteTarget?.name}?`} 
        onConfirm={handleDelete} 
        onClose={() => setDeleteTarget(null)} 
      />
    </div>
  );
}
