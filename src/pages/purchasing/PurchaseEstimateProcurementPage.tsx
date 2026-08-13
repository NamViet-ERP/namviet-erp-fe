import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ProjectAutocomplete from '../../components/purchasing/ProjectAutocomplete';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import TabFilter from '../../components/ui/TabFilter';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../constants/pagination';
import {
  useCreatePurchaseEstimate,
  usePurchaseEstimates,
  useShareEstimateLink,
} from '../../hooks/usePurchaseEstimates';
import { usePermission } from '../../hooks/usePermission';
import { useProjects } from '../../hooks/useProjects';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  canShareEstimate,
  estimateStatusBadge,
  estimateStatusLabel,
} from '../../lib/purchaseEstimateStatus';
import RfqQuotesPanel from './RfqQuotesPanel';
import type { TabItem } from '../../types';

export default function PurchaseEstimateProcurementPage() {
  const { has } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canViewEstimates = has('purchasing.estimates.view');
  const canViewRfq = has('purchasing.rfq.view');
  const canWriteEstimate = has('purchasing.estimates.create');
  const canUpdateEstimate = has('purchasing.estimates.update');
  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');
  const requestedTab = params.get('tab') === 'rfq' ? 'rfq' : 'estimates';
  const tab = requestedTab === 'rfq'
    ? (canViewRfq ? 'rfq' : 'estimates')
    : (canViewEstimates ? 'estimates' : 'rfq');
  const setTab = (next: 'rfq' | 'estimates') => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [createProject, setCreateProject] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareCode, setShareCode] = useState('');

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      projectCode: projectCode || undefined,
    }),
    [page, pageSize, search, projectCode],
  );
  const list = usePurchaseEstimates(listParams);
  const createMutation = useCreatePurchaseEstimate();
  const shareMutation = useShareEstimateLink();
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const projects = projectsPage?.items ?? [];

  const saveCreate = async () => {
    if (!createProject || !title.trim()) {
      showToast('error', 'Nhập dự án và tiêu đề mẫu dự toán.');
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        projectCode: createProject,
        title: title.trim(),
        lines: [],
      });
      showToast('success', `Đã tạo ${created.code} (Ver 1) theo danh mục vật tư.`);
      setCreating(false);
      navigate(`/purchasing/estimate-procurement/${created.id}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được mẫu dự toán.'));
    }
  };

  const openShare = async (id: string, code: string) => {
    try {
      const link = await shareMutation.mutateAsync(id);
      setShareCode(code);
      setShareUrl(`${window.location.origin}${link.path}`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lấy được link điền.'));
    }
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('success', 'Đã sao chép link.');
    } catch {
      showToast('error', 'Không sao chép được. Hãy chọn và copy thủ công.');
    }
  };

  return (
    <PurchasingListLayout
      title="Mua hàng dự toán"
      subtitle="Giá chào thầu và dự toán vật tư theo dự án"
      hideSearch={tab === 'rfq'}
      search={search}
      onSearchChange={v => { setSearch(v); setPage(1); }}
      searchPlaceholder="Tìm mã DT / tiêu đề…"
      filters={tab === 'estimates' ? (
        <div className="flex flex-wrap gap-2">
          <ProjectAutocomplete
            value={projectCode}
            onChange={v => { setProjectCode(v); setPage(1); }}
            projects={projects}
            placeholder="Lọc dự án"
          />
        </div>
      ) : null}
      hasFilters={Boolean(projectCode)}
      onResetFilters={() => { setProjectCode(''); setPage(1); }}
      actions={tab === 'estimates' && canWriteEstimate ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => {
          setCreating(true);
          setTitle('');
          setCreateProject(projectCode);
        }}>
          <Plus size={14} aria-hidden />
          Tạo mẫu dự toán
        </button>
      ) : null}
    >
      <TabFilter
        tabs={[
          ...(canViewEstimates ? [{ id: 'estimates', label: 'Dự toán' }] : []),
          ...(canViewRfq ? [{ id: 'rfq', label: 'Giá chào thầu' }] : []),
        ] satisfies TabItem[]}
        activeTab={tab}
        onChange={id => setTab(id as 'rfq' | 'estimates')}
      />

      {tab === 'rfq' ? (
        <RfqQuotesPanel canWrite={canWriteRfq} canUpdate={canUpdateRfq} />
      ) : (
        <>
          <p className="mb-3 text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            SC tạo mẫu theo dự án → lấy link → tự gửi Zalo / email cho người lập (không cần tài khoản, không chọn phòng ban) → người điền Double check rồi gửi → SC kiểm tra → gửi duyệt → duyệt xong chuyển thành Kế hoạch mua hàng.
          </p>
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã DT</th>
                  <th className="table-header-cell">Tiêu đề / Dự án</th>
                  <th className="table-header-cell">Người lập</th>
                  <th className="table-header-cell">Đã điền</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Ver</th>
                  <th className="table-header-cell"> </th>
                </tr>
              </thead>
              <tbody>
                {list.isError ? (
                  <tr>
                    <td colSpan={7} className="table-cell">
                      <EmptyState message={getApiErrorMessage(list.error, 'Không tải được danh sách dự toán.')} />
                    </td>
                  </tr>
                ) : list.isLoading ? (
                  <TableSkeletonRows colSpan={7} />
                ) : (list.data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell">
                      <EmptyState message="Chưa có dự toán. Tạo mẫu mới để bắt đầu." />
                    </td>
                  </tr>
                ) : (
                  (list.data?.items ?? []).map(row => (
                    <tr
                      key={row.id}
                      className="table-row"
                      onClick={() => navigate(`/purchasing/estimate-procurement/${row.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="table-cell font-mono">{row.code}</td>
                      <td className="table-cell">
                        <div className="font-medium">{row.title}</div>
                        <div className="text-[var(--md-on-surface-variant)]">{row.projectCode}</div>
                      </td>
                      <td className="table-cell">{row.preparerName || 'Chưa có'}</td>
                      <td className="table-cell tabular-nums">{row.filledLineCount}/{row.lineCount}</td>
                      <td className="table-cell">
                        <span className={`badge ${estimateStatusBadge(row.status)}`}>
                          {estimateStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="table-cell">Ver {row.currentVersion}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/purchasing/estimate-procurement/${row.id}`);
                            }}
                          >
                            Xem / Xử lý
                          </button>
                          {canUpdateEstimate && canShareEstimate(row.status) ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={shareMutation.isPending}
                              onClick={e => {
                                e.stopPropagation();
                                void openShare(row.id, row.code);
                              }}
                            >
                              Lấy link điền
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, list.data?.totalPages ?? 1)}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            totalItems={list.data?.totalCount ?? 0}
          />
        </>
      )}

      <Modal isOpen={creating} onClose={() => !createMutation.isPending && setCreating(false)} title="Tạo mẫu dự toán mới" size="md">
        <div className="space-y-3">
          <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Mẫu sẽ liệt kê toàn bộ vật tư đang dùng, chia theo nhóm hàng, để người nhận chỉ điền số lượng.
          </p>
          <FormField label="Dự án" required>
            <ProjectAutocomplete value={createProject} onChange={setCreateProject} projects={projects} />
          </FormField>
          <FormField label="Tiêu đề dự toán" required>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" disabled={createMutation.isPending} onClick={() => setCreating(false)}>Hủy</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={createMutation.isPending} onClick={() => void saveCreate()}>
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo mẫu Ver 1'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(shareUrl)} onClose={() => setShareUrl('')} title={`Link điền dự toán - ${shareCode}`} size="md">
        <div className="space-y-3">
          <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)]">
            Sao chép link rồi gửi Zalo / email cho người lập dự toán. Họ mở link, nhập họ tên và điền số lượng - không cần tài khoản, không cần phòng ban trên hệ thống. Sau khi Double check và gửi, dữ liệu cập nhật ngay tại đây.
          </p>
          <FormField label="Đường dẫn chia sẻ">
            <input className="form-input font-mono" value={shareUrl} readOnly onFocus={e => e.target.select()} />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShareUrl('')}>Đóng</button>
            <a className="btn btn-outline btn-sm" href={shareUrl} target="_blank" rel="noreferrer">Mở thử</a>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyShare()}>Sao chép link</button>
          </div>
        </div>
      </Modal>
    </PurchasingListLayout>
  );
}
