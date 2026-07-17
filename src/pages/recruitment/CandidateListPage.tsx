import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileText, Download, Users, Bell, Briefcase, Calendar, Gift, UserX, Plus } from 'lucide-react';
import HrmDatePicker from '../../components/hr/HrmDatePicker';
import { toIsoDate, isoToDisplay } from '../../lib/dates';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import CandidateStatusBadge from '../../components/recruitment/CandidateStatusBadge';
import CandidateStatusModal, { type CandidateStatusFormValues } from '../../components/recruitment/CandidateStatusModal';
import CandidateCreateModal from '../../components/recruitment/CandidateCreateModal';
import { showToast } from '../../components/ui/Toast';
import { useCandidates, useUpdateCandidateStatus } from '../../hooks/useCandidates';
import { candidatesService } from '../../services/candidatesService';
import { CANDIDATE_STATUS_OPTIONS, RECRUITMENT_SOURCES, type CandidateQuickAction } from '../../constants/recruitment';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import { useHrStaffSelectOptions } from '../../hooks/useHrStaff';
import { formatCandidateAppliedAt } from '../../lib/hrm/candidateApiMapper';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { Candidate } from '../../types/hr';
import PermissionGate from '../../components/auth/PermissionGate';
import { usePermission } from '../../hooks/usePermission';

export default function CandidateListPage() {
  const navigate = useNavigate();
  const positionFilterOptions = usePositionSelectOptions();
  const hrStaffFilterOptions = useHrStaffSelectOptions();
  const statusMutation = useUpdateCandidateStatus();
  const { has } = usePermission();
  const canUpdateCandidates = has('hrm.candidates.update');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedHr, setSelectedHr] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [newCvOnly, setNewCvOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [statusModal, setStatusModal] = useState<{
    candidate: Candidate;
    action: CandidateQuickAction;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error } = useCandidates({
    page,
    pageSize,
    search: searchQuery || undefined,
    position: selectedPosition || undefined,
    source: selectedSource || undefined,
    hrResponsible: selectedHr || undefined,
    status: newCvOnly ? 'New' : (selectedStatus || undefined),
    dateFrom: dateFrom ? isoToDisplay(dateFrom) : undefined,
    dateTo: dateTo ? isoToDisplay(dateTo) : undefined,
  });

  const candidates = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const totalUnfiltered = data?.totalUnfiltered ?? 0;
  const uniquePositions = data?.uniquePositionCount ?? 0;
  const newCvCount = data?.newCvCount ?? 0;

  const handleDownloadCV = async (cand: { id: string; cvFileName: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cand.cvFileName) {
      showToast('warning', 'Ứng viên chưa có file CV');
      return;
    }
    try {
      await candidatesService.downloadCv(cand.id, cand.cvFileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, UI_ERROR.loadCv));
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPosition('');
    setSelectedSource('');
    setSelectedHr('');
    setSelectedStatus('');
    setNewCvOnly(false);
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const setTodayFilter = () => {
    const today = toIsoDate(new Date());
    setDateFrom(today);
    setDateTo(today);
    setPage(1);
  };

  const hasFilters = Boolean(
    searchQuery || selectedPosition || selectedSource || selectedHr
    || selectedStatus || newCvOnly || dateFrom || dateTo,
  );

  const openQuickAction = (candidate: Candidate, action: CandidateQuickAction, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusModal({ candidate, action });
  };

  const handleStatusSubmit = async (values: CandidateStatusFormValues) => {
    if (!statusModal) return;
    try {
      await statusMutation.mutateAsync({
        id: statusModal.candidate.id,
        payload: values,
      });
      showToast('success', 'Đã cập nhật trạng thái ứng viên');
      setStatusModal(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật trạng thái'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Hồ sơ ứng viên"
        subtitle="Quản lý pipeline tuyển dụng — lọc theo khoảng ngày, trạng thái và cập nhật nhanh PV / Offer."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {newCvCount > 0 && (
              <span className="recruitment-new-cv-badge" title="Ứng viên trạng thái CV mới">
                <Bell size={14} aria-hidden />
                {newCvCount} CV mới
              </span>
            )}
            <PermissionGate
              permission="hrm.candidates.create"
              fallback={<button type="button" className="btn btn-primary" disabled title="Bạn không có quyền tạo ứng viên"><Plus size={16} aria-hidden /> Thêm CV mới</button>}
            >
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} aria-hidden />
                Thêm CV mới
              </button>
            </PermissionGate>
          </div>
        )}
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng hồ sơ" value={totalUnfiltered} icon={Users} tone="primary" />
        <HrmStatCard
          label="Đang hiển thị"
          value={totalCount}
          hint={hasFilters ? 'Đã lọc' : ''}
          icon={Users}
          tone="neutral"
        />
        <HrmStatCard label="Vị trí khác nhau" value={uniquePositions} icon={Briefcase} tone="success" />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={searchQuery}
              onChange={v => { setSearchQuery(v); setPage(1); }}
              placeholder="Nhập tên ứng viên..."
              ariaLabel="Tìm kiếm ứng viên"
            />
            <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={newCvOnly ? 'new' : selectedStatus}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === 'new') {
                      setNewCvOnly(true);
                      setSelectedStatus('');
                    } else {
                      setNewCvOnly(false);
                      setSelectedStatus(v);
                    }
                    setPage(1);
                  }}
                  aria-label="Lọc trạng thái"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="new">CV mới</option>
                  {CANDIDATE_STATUS_OPTIONS.filter(o => o.value !== 'New').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={selectedPosition}
                  onChange={e => { setSelectedPosition(e.target.value); setPage(1); }}
                  aria-label="Lọc vị trí"
                >
                  <option value="">Tất cả vị trí</option>
                  {positionFilterOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={selectedSource}
                  onChange={e => { setSelectedSource(e.target.value); setPage(1); }}
                  aria-label="Lọc nguồn"
                >
                  <option value="">Tất cả nguồn</option>
                  {RECRUITMENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={selectedHr}
                  onChange={e => { setSelectedHr(e.target.value); setPage(1); }}
                  aria-label="Lọc HR phụ trách"
                >
                  <option value="">Tất cả HR</option>
                  {hrStaffFilterOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>
            <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--dates">
              <div className="hrm-filter-date-range">
                <HrmDatePicker
                  className="hrm-filter-date-picker"
                  value={dateFrom}
                  onChange={v => { setDateFrom(v); setPage(1); }}
                  placeholder="Từ ngày"
                />
                <span className="hrm-filter-date-range__sep" aria-hidden>—</span>
                <HrmDatePicker
                  className="hrm-filter-date-picker"
                  value={dateTo}
                  onChange={v => { setDateTo(v); setPage(1); }}
                  placeholder="Đến ngày"
                />
                <button type="button" className="hrm-filter-today" onClick={setTodayFilter}>
                  Hôm nay
                </button>
              </div>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                  <RotateCcw size={14} aria-hidden />
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table hrm-table--candidates">
            <thead>
              <tr>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__name">Tên ứng viên</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__cv">CV</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__position">Vị trí</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__date">Ngày nộp</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__source">Nguồn</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__status">Trạng thái</th>
                <th className="table-header-cell whitespace-nowrap hrm-table-candidates__actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={7}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      message={getApiErrorMessage(error, UI_ERROR.loadCandidates)}
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      message={hasFilters ? 'Không có ứng viên phù hợp bộ lọc.' : 'Chưa có hồ sơ ứng viên.'}
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : (
                candidates.map(cand => (
                  <tr
                    key={cand.id}
                    className="table-row hrm-table-row--interactive"
                    onClick={() => navigate(`/recruitment/candidates/${cand.id}`)}
                  >
                    <td className="table-cell whitespace-nowrap candidate-name text-[var(--md-primary)] font-medium hrm-table-candidates__name">{cand.fullName}</td>
                    <td className="table-cell hrm-table-candidates__cv" onClick={e => e.stopPropagation()}>
                      {cand.cvFileName ? (
                        <button type="button" onClick={e => handleDownloadCV(cand, e)} className="hrm-cv-chip" title="Xem và tải CV">
                          <FileText size={11} aria-hidden />
                          CV
                          <Download size={10} aria-hidden />
                        </button>
                      ) : (
                        <span className="text-sm text-[var(--md-on-surface-variant)]">Không có</span>
                      )}
                    </td>
                    <td className="table-cell text-[var(--md-primary)] font-medium hrm-table-candidates__position truncate" title={cand.position}>
                      {cand.position}
                    </td>
                    <td className="table-cell text-xs whitespace-nowrap tabular-nums hrm-table-candidates__date">
                      {formatCandidateAppliedAt(cand.appliedAt).split(',')[0]}
                    </td>
                    <td className="table-cell whitespace-nowrap hrm-table-candidates__source truncate" title={cand.source}>{cand.source}</td>
                    <td className="table-cell hrm-table-candidates__status" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="inline-flex"
                        title={canUpdateCandidates ? 'Cập nhật trạng thái' : 'Bạn không có quyền cập nhật ứng viên'}
                        disabled={!canUpdateCandidates}
                        onClick={e => {
                          e.stopPropagation();
                          setStatusModal({ candidate: cand, action: 'custom' as CandidateQuickAction });
                        }}
                      >
                        <CandidateStatusBadge status={cand.status} />
                      </button>
                    </td>
                    <td className="table-cell hrm-table-candidates__actions" onClick={e => e.stopPropagation()}>
                      <div className="hrm-candidate-quick-actions">
                        <button
                          type="button"
                          className="hrm-candidate-action-btn"
                          title={canUpdateCandidates ? 'Hẹn phỏng vấn' : 'Bạn không có quyền cập nhật ứng viên'}
                          disabled={!canUpdateCandidates}
                          onClick={e => openQuickAction(cand, 'interview', e)}
                        >
                          <Calendar size={11} aria-hidden />
                          Hẹn PV
                        </button>
                        <button
                          type="button"
                          className="hrm-candidate-action-btn"
                          title={canUpdateCandidates ? 'Gửi offer' : 'Bạn không có quyền cập nhật ứng viên'}
                          disabled={!canUpdateCandidates}
                          onClick={e => openQuickAction(cand, 'offer', e)}
                        >
                          <Gift size={11} aria-hidden />
                          Offer
                        </button>
                        <button
                          type="button"
                          className="hrm-candidate-action-btn hrm-candidate-action-btn--danger"
                          title={canUpdateCandidates ? 'Loại ứng viên' : 'Bạn không có quyền cập nhật ứng viên'}
                          disabled={!canUpdateCandidates}
                          onClick={e => openQuickAction(cand, 'reject', e)}
                        >
                          <UserX size={11} aria-hidden />
                          Loại
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="ứng viên"
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </HrmPanel>

      <CandidateCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <CandidateStatusModal
        open={Boolean(statusModal)}
        candidate={statusModal?.candidate ?? null}
        action={statusModal?.action === 'interview' || statusModal?.action === 'offer' || statusModal?.action === 'reject'
          ? statusModal.action
          : 'custom'}
        onClose={() => setStatusModal(null)}
        onSubmit={handleStatusSubmit}
        isSubmitting={statusMutation.isPending}
      />
    </div>
  );
}
