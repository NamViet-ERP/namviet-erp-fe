import { useMemo, useState } from 'react';
import { Download, ExternalLink, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import Button from '../../components/ui/Button';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import TableShell from '../../components/ui/TableShell';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import { useProjects } from '../../hooks/useProjects';
import { usePurchaseDocuments } from '../../hooks/usePurchaseDocuments';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import {
  PURCHASE_DOC_TYPE_OPTIONS,
  purchaseDocTypeLabel,
} from '../../lib/purchasing/purchaseDocTypes';
import { purchaseDocumentsService } from '../../services/purchaseDocumentsService';

const COL_COUNT = 8;
const DOC_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  ...PURCHASE_DOC_TYPE_OPTIONS,
];

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

  const pagination = totalItems > 0 && !isLoading
    ? {
        embedded: true,
        currentPage: page,
        totalPages,
        pageSize,
        totalItems,
        onPageChange: setPage,
        onPageSizeChange: (size: ListPageSize) => {
          setPageSize(size);
          setPage(1);
        },
      }
    : undefined;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Mua hàng"
        title="Hồ sơ mua hàng"
        subtitle="CO, CQ, CNXK, BBGH, BBNT, tờ khai, IV, PL và chứng từ gắn PO"
      />
      <SectionCard noPadding>
        <FilterToolbar
          search={search}
          onSearchChange={value => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Tìm theo tên file, PO, NCC…"
          hasActiveFilters={hasFilters}
          onReset={handleResetFilters}
          filters={(
            <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
              <ProjectAutocomplete
                value={projectCode}
                onChange={nextCode => {
                  setProjectCode(nextCode);
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
              <SelectField
                value={docType}
                onChange={next => {
                  setDocType(next);
                  setPage(1);
                }}
                options={DOC_TYPE_OPTIONS}
                aria-label="Lọc loại hồ sơ"
                selectClassName="form-input"
              />
            </div>
          )}
        />
        <TableShell
          tableClassName="wms-inventory-table"
          colSpan={COL_COUNT}
          loading={isLoading}
          skeletonRows={8}
          error={isError ? getApiErrorMessage(error, 'Không tải được danh sách hồ sơ.') : null}
          isEmpty={items.length === 0}
          emptyIcon={FolderOpen}
          emptyMessage="Chưa có hồ sơ. Tải lên từ chi tiết đơn hàng."
          pagination={pagination}
          header={(
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
          )}
        >
          {items.map(row => (
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
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    disabled={downloadingId === row.id}
                    aria-label={`Tải ${row.fileName}`}
                    onClick={() => {
                      void onDownload(row);
                    }}
                  >
                    <Download size={14} aria-hidden />
                  </Button>
                  <Link
                    to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                    className="btn btn-text btn-sm"
                    aria-label={`Mở PO ${row.poCode}`}
                    title="Mở PO"
                  >
                    <ExternalLink size={14} aria-hidden />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      </SectionCard>
    </PageShell>
  );
}
