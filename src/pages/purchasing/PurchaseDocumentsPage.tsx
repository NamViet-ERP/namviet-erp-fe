import { useMemo, useState } from 'react';
import { Download, ExternalLink, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { usePurchaseDocuments } from '../../hooks/usePurchaseDocuments';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { purchaseDocumentsService } from '../../services/purchaseDocumentsService';
import {
  PURCHASE_DOC_TYPE_OPTIONS,
  purchaseDocTypeLabel,
} from '../../lib/purchasing/purchaseDocTypes';

const COL_COUNT = 8;

export default function PurchaseDocumentsPage() {
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [poCode, setPoCode] = useState('');
  const [docType, setDocType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode.trim() || undefined,
      poCode: poCode.trim() || undefined,
      docType: docType || undefined,
    }),
    [page, pageSize, search, projectCode, poCode, docType],
  );
  const hasFilters = Boolean(search.trim() || projectCode.trim() || poCode.trim() || docType);
  const handleResetFilters = () => {
    setSearch('');
    setProjectCode('');
    setPoCode('');
    setDocType('');
    setPage(1);
  };

  const { data, isLoading, isError, error } = usePurchaseDocuments(listParams);
  const items = data?.items ?? [];
  const totalItems = data?.totalCount ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const onDownload = async (row: { id: string; poCode: string; fileName: string }) => {
    setDownloadingId(row.id);
    try {
      await purchaseDocumentsService.download(row.poCode, row.id, row.fileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tải được tệp.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PurchasingListLayout
      title="Hồ sơ mua hàng"
      subtitle="CO, CQ, CNXK, BBGH, BBNT, tờ khai, IV, PL và chứng từ gắn PO"
      search={search}
      onSearchChange={value => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Tìm theo tên file, PO, NCC…"
      hasFilters={hasFilters}
      onResetFilters={handleResetFilters}
      filters={(
        <>
          <ProjectAutocomplete
            value={projectCode}
            onChange={code => {
              setProjectCode(code);
              setPage(1);
            }}
            projects={projects}
            placeholder="Lọc dự án"
            compact
          />
          <input
            className="form-input"
            value={poCode}
            onChange={e => {
              setPoCode(e.target.value);
              setPage(1);
            }}
            placeholder="Mã PO"
            aria-label="Lọc mã PO"
          />
          <select
            className="form-input"
            value={docType}
            onChange={e => {
              setDocType(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc loại hồ sơ"
          >
            <option value="">Tất cả loại</option>
            {PURCHASE_DOC_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      )}
    >
      {isError ? (
        <EmptyState message={getApiErrorMessage(error, 'Không tải được danh sách hồ sơ.')} />
      ) : (
        <>
          <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Loại</th>
                  <th className="table-header-cell">Tên file</th>
                  <th className="table-header-cell">PO</th>
                  <th className="table-header-cell">Dự án</th>
                  <th className="table-header-cell">NCC</th>
                  <th className="table-header-cell">Người tải</th>
                  <th className="table-header-cell">Ngày tải</th>
                  <th className="table-header-cell text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows rows={8} colSpan={COL_COUNT} />
                ) : items.length === 0 ? (
                  <tr className="table-row">
                    <td className="table-cell" colSpan={COL_COUNT}>
                      <EmptyState
                        icon={FolderOpen}
                        message="Chưa có hồ sơ. Tải lên từ chi tiết đơn hàng."
                      />
                    </td>
                  </tr>
                ) : (
                  items.map(row => (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell">
                        <span className="pur-erp__pill">{purchaseDocTypeLabel(row.docType)}</span>
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold truncate" title={row.fileName}>
                          {row.fileName}
                        </div>
                      </td>
                      <td className="table-cell">
                        <EntityCodeLink
                          code={row.poCode}
                          to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                        />
                      </td>
                      <td className="table-cell">
                        {row.projectCode ? (
                          <EntityCodeLink
                            code={row.projectCode}
                            to={`/warehouse/projects/${encodeURIComponent(row.projectCode)}`}
                          />
                        ) : '—'}
                      </td>
                      <td className="table-cell">{row.supplierName || '—'}</td>
                      <td className="table-cell">{row.uploadedByName || '—'}</td>
                      <td className="table-cell tabular-nums">
                        {formatDateTimeVi(row.uploadedAt) ?? '—'}
                      </td>
                      <td className="table-cell text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={downloadingId === row.id}
                            aria-label={`Tải ${row.fileName}`}
                            onClick={() => {
                              void onDownload(row);
                            }}
                          >
                            <Download size={14} aria-hidden />
                          </button>
                          <Link
                            to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`Mở PO ${row.poCode}`}
                            title="Mở PO"
                          >
                            <ExternalLink size={14} aria-hidden />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalItems > 0 && !isLoading ? (
            <Pagination
              embedded
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}
    </PurchasingListLayout>
  );
}
