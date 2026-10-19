import { useMemo, useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { Plus, Download, Trash2, Pencil, Upload, FileCheck, Clock, AlertTriangle, FileText } from 'lucide-react';
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
  filterUnifiedDocs,
  unifiedDocsKpis,
  getSeedDocuments,
  getDocTypeTagClass,
  applyDynamicSla,
  type CskhUnifiedDoc,
  type CskhUnifiedDocFilter,
  type CskhUnifiedStatus,
} from '../../lib/cskh/docsPipeline';
import CskhPipelineSteps from './CskhPipelineSteps';
import CskhFilterTabs, { type CskhFilterOption } from './CskhFilterTabs';
import type { CskhProjectRecord } from '../../lib/cskh/commandCenter';

interface CskhDocsPipelinePageProps {
  project: CskhProjectRecord;
}

const EMPTY_DOC_FORM = {
  code: '',
  name: '',
  docType: 'Đệ trình thi công',
  category: 'Đệ trình kỹ thuật',
  author: '',
  slaDueDate: '',
  status: 'drafting' as CskhUnifiedStatus,
  statusLabel: 'Chờ duyệt',
  fileName: '',
  fileSize: '',
};

const FILTERS: CskhFilterOption<CskhUnifiedDocFilter>[] = [
  { id: 'all', label: 'Tất cả hồ sơ', tone: 'navy' },
  { id: 'draft', label: '1. Soạn duyệt nội bộ', tone: 'warn' },
  { id: 'handover', label: '2. Đã giao nhận A-B', tone: 'info' },
  { id: 'feedback', label: '3. Chờ CĐT phản hồi', tone: 'info' },
  { id: 'overdue', label: 'Quá hạn SLA CĐT', tone: 'danger' },
  { id: 'approved', label: 'Đã chấp thuận', tone: 'ok' },
];

export default function CskhDocsPipelinePage({ project }: CskhDocsPipelinePageProps) {
  const meta = cskhProjectTabMeta('docs');
  
  // Initialize with seed documents to avoid empty flash
  const [docsList, setDocsList] = useState<CskhUnifiedDoc[]>(() => {
    return getSeedDocuments(project.code);
  });

  const loadData = useCallback(async () => {
    try {
      const data = await projectsService.listDocuments(project.code);
      if (Array.isArray(data)) {
        setDocsList(data.map(d => applyDynamicSla(d)));
      }
    } catch (err) {
      console.warn('[CSKH Docs Pipeline] Could not load from API, keeping fallback data:', err);
    }
  }, [project.code]);

  useEffect(() => {
    let ignore = false;
    projectsService.listDocuments(project.code)
      .then(data => {
        if (!ignore && Array.isArray(data)) {
          setDocsList(data.map(d => applyDynamicSla(d)));
        }
      })
      .catch(err => {
        console.warn('[CSKH Docs Pipeline] Could not load from API, keeping fallback data:', err);
      });
    return () => {
      ignore = true;
    };
  }, [project.code]);

  const kpis = unifiedDocsKpis(docsList);
  const [filter, setFilter] = useState<CskhUnifiedDocFilter>('all');
  
  const [openModal, setOpenModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CskhUnifiedDoc | null>(null);
  const [form, setForm] = useState(EMPTY_DOC_FORM);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<CskhUnifiedDoc | null>(null);

  const rows = useMemo(() => filterUnifiedDocs(docsList, filter), [docsList, filter]);
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
      docType: doc.docType,
      category: doc.category || 'Đệ trình kỹ thuật',
      author: doc.author || '',
      slaDueDate: doc.slaDueDate || '',
      status: doc.status,
      statusLabel: doc.statusLabel,
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
    try {
      let savedDoc;
      if (editingDoc) {
        savedDoc = await projectsService.updateDocument(project.code, editingDoc.id, {
          ...form,
          stage: editingDoc.stage,
        });
        showToast('success', 'Đã cập nhật hồ sơ');
      } else {
        savedDoc = await projectsService.createDocument(project.code, {
          ...form,
          stage: 'draft_review',
          internalApproved: false,
          handoverSigned: false,
        });
        showToast('success', 'Đã tạo hồ sơ mới thành công');
      }

      if (savedDoc && fileToUpload && projectsService.uploadDocumentFile) {
        await projectsService.uploadDocumentFile(project.code, savedDoc.id, fileToUpload);
        showToast('success', 'Đã tải lên tệp đính kèm');
      }

      setOpenModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectsService.deleteDocument(project.code, deleteTarget.id);
      showToast('success', 'Đã xóa hồ sơ');
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast('error', 'Lỗi khi xóa hồ sơ');
    }
  };

  const downloadFile = (doc: CskhUnifiedDoc) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    } else {
      showToast('info', `Tải tệp mô phỏng: ${doc.fileName || doc.code + '.pdf'}`);
    }
  };

  const getStatusBadge = (status: CskhUnifiedStatus, statusLabel: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="cskh-status cskh-status--ok">
            <span className="cskh-status__dot" aria-hidden />
            <span>{statusLabel || 'Đã chấp thuận'}</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="cskh-status cskh-status--danger">
            <span className="cskh-status__dot" aria-hidden />
            <span>{statusLabel || 'Quá hạn SLA'}</span>
          </span>
        );
      case 'awaiting_client':
        return (
          <span className="cskh-status cskh-status--warn">
            <span className="cskh-status__dot" aria-hidden />
            <span>{statusLabel || 'Chờ CĐT phản hồi'}</span>
          </span>
        );
      case 'pending_handover':
        return (
          <span className="cskh-status cskh-status--info">
            <span className="cskh-status__dot" aria-hidden />
            <span>{statusLabel || 'Đã giao nhận A-B'}</span>
          </span>
        );
      default:
        return (
          <span className="cskh-status cskh-status--info">
            <span className="cskh-status__dot" aria-hidden />
            <span>{statusLabel || 'Soạn duyệt nội bộ'}</span>
          </span>
        );
    }
  };

  return (
    <div className="page-stack cskh-desk space-y-4">
      <PageHeader 
        title={meta.title} 
        subtitle={`${project.code} - ${meta.subtitle}`} 
        actions={
          <Button variant="filled" onClick={openCreate} className="gap-1.5 shadow-sm">
            <Plus size={16} /> Thêm hồ sơ đệ trình
          </Button>
        }
      />

      <CskhPipelineSteps code={project.code} current="docs" />

      {/* KPI Cards — Standard ERP Dashboard Grid */}
      <div className="dashboard-kpi-grid cskh-project__kpi" role="list" aria-label="Chỉ số luồng hồ sơ">
        <Card
          title="Tổng hồ sơ theo dõi"
          value={kpis.total}
          subtitle="Quy trình 3 khâu khép kín"
          accent="blue"
          icon={FileCheck}
        />
        <Card
          title="Khâu 1: Soạn duyệt"
          value={kpis.internalReview}
          subtitle="Đang duyệt nội bộ Mayzer"
          accent="amber"
          icon={Clock}
        />
        <Card
          title="Khâu 2: Giao nhận A-B"
          value={kpis.handoverSigned}
          subtitle="Đã ký biên bản giao nhận"
          accent="blue"
          icon={FileText}
        />
        <Card
          title="Quá hạn SLA CĐT"
          value={kpis.slaOverdue}
          subtitle="Cần đôn đốc TVGS & CĐT"
          accent="danger"
          icon={AlertTriangle}
        />
      </div>

      <HrmPanel className="cskh-desk__panel" noPadding>
        <div className="cskh-split-toolbar">
          <CskhFilterTabs options={FILTERS} value={filter} onChange={val => setFilter(val as typeof filter)} />
          <div className="text-xs text-[var(--md-on-surface-variant)] font-medium">
            Hiển thị <span className="font-semibold text-[var(--md-on-surface)]">{rows.length}</span> hồ sơ
          </div>
        </div>

        <div className="wms-inventory-table-wrap overflow-x-auto table-scroll">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell text-center" style={{ width: '3rem' }}>STT</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '7.5rem' }}>Mã hồ sơ</th>
                <th className="table-header-cell" style={{ minWidth: '16rem' }}>Tiêu đề hồ sơ & Phụ trách</th>
                <th className="table-header-cell whitespace-nowrap" style={{ width: '9.5rem' }}>Loại đệ trình</th>
                <th className="table-header-cell whitespace-nowrap" style={{ width: '10.5rem' }}>Thời hạn (SLA)</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '10rem' }}>Trạng thái tiến trình</th>
                <th className="table-header-cell whitespace-nowrap" style={{ width: '12rem' }}>Tệp đính kèm</th>
                <th className="table-header-cell text-center whitespace-nowrap" style={{ width: '6rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState 
                      icon={FileCheck} 
                      message="Không có hồ sơ nào thuộc bộ lọc này." 
                      action={
                        <Button variant="outlined" size="sm" onClick={openCreate} className="mt-2 gap-1.5">
                          <Plus size={14} /> Thêm hồ sơ mới
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
                        <span className={`cskh-tag ${getDocTypeTagClass(row.docType || row.category)}`}>
                          {row.docType || row.category || '—'}
                        </span>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <div className="text-xs text-[var(--md-on-surface)]">
                          Hạn chót: <strong>{row.slaDueDate ? isoToDisplay(row.slaDueDate) : 'Chưa áp SLA'}</strong>
                        </div>
                        {(row.overdueDays || 0) > 0 ? (
                          <div className="text-xs text-rose-600 font-semibold mt-0.5">
                            Trễ SLA: {row.overdueDays} ngày
                          </div>
                        ) : null}
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        {getStatusBadge(row.status, row.statusLabel)}
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
          itemLabel="hồ sơ" 
          currentPage={page} 
          pageSize={pageSize} 
          totalItems={rows.length} 
          totalPages={Math.ceil(rows.length / pageSize) || 1} 
          onPageChange={setPage} 
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} 
        />
      </HrmPanel>

      {/* Modal Thêm mới / Sửa hồ sơ đệ trình */}
      <Modal 
        isOpen={openModal} 
        onClose={() => setOpenModal(false)} 
        title={editingDoc ? 'Cập Nhật Hồ Sơ Đệ Trình' : 'Thêm Mới Hồ Sơ Đệ Trình'} 
        size="lg"
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Mã hồ sơ *">
              <input 
                className="form-input w-full" 
                placeholder="VD: HS-309" 
                value={form.code} 
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))} 
              />
            </FormField>
            <FormField label="Tiêu đề hồ sơ *">
              <input 
                className="form-input w-full" 
                placeholder="VD: Đệ trình biện pháp thi công lắp balong" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Loại hồ sơ">
              <input 
                className="form-input w-full" 
                placeholder="VD: Đệ trình kỹ thuật, Nghiệm thu..." 
                value={form.docType} 
                onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} 
              />
            </FormField>
            <FormField label="Người phụ trách lập hồ sơ">
              <input 
                className="form-input w-full" 
                placeholder="VD: Kỹ sư Nguyễn Văn A" 
                value={form.author} 
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))} 
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Hạn chót SLA">
              <input 
                type="date" 
                className="form-input w-full" 
                value={form.slaDueDate} 
                onChange={e => setForm(f => ({ ...f, slaDueDate: e.target.value }))} 
              />
            </FormField>
            <FormField label="Trạng thái tiến trình">
              <select 
                className="form-select w-full" 
                value={form.status} 
                onChange={e => {
                  const val = e.target.value as CskhUnifiedStatus;
                  const labelMap: Record<CskhUnifiedStatus, string> = {
                    drafting: 'Đang soạn thảo',
                    pending_handover: 'Chờ giao nhận',
                    awaiting_client: 'Chờ CĐT phản hồi',
                    approved: 'Đã chấp thuận',
                    overdue: 'Quá hạn SLA',
                  };
                  setForm(f => ({ ...f, status: val, statusLabel: labelMap[val] || val }));
                }}
              >
                <option value="drafting">1. Đang soạn thảo nội bộ</option>
                <option value="pending_handover">2. Chờ bàn giao hiện trường</option>
                <option value="awaiting_client">3. Chờ CĐT xem duyệt</option>
                <option value="approved">4. Đã chấp thuận chính thức</option>
                <option value="overdue">5. Quá hạn SLA (Cần họp đôn đốc)</option>
              </select>
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
            <Button variant="filled" onClick={handleSave}>
              {editingDoc ? 'Lưu thay đổi' : 'Tạo hồ sơ & Tải lên'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={Boolean(deleteTarget)} 
        title="Xác nhận xóa hồ sơ" 
        message={`Bạn có chắc chắn muốn xóa hồ sơ ${deleteTarget?.code} - ${deleteTarget?.name}?`} 
        onConfirm={handleDelete} 
        onClose={() => setDeleteTarget(null)} 
      />
    </div>
  );
}
