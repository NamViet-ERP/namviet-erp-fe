import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileText, Download, Users, Filter, Briefcase } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import { showToast } from '../../components/ui/Toast';
import { useCandidates } from '../../hooks/useCandidates';
import { candidatesService } from '../../services/candidatesService';
import { RECRUITMENT_SOURCES } from '../../constants/recruitment';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import { useHrStaffSelectOptions } from '../../hooks/useHrStaff';
import { formatCandidateAppliedAt } from '../../lib/hrm/candidateApiMapper';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

function birthYear(date: string) {
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? '—' : y;
}

function EmptyCell({ value }: { value?: string }) {
  if (!value || value === '—') return <span className="hrm-empty-cell">—</span>;
  return <>{value}</>;
}

export default function CandidateListPage() {
  const navigate = useNavigate();
  const positionFilterOptions = usePositionSelectOptions();
  const hrStaffFilterOptions = useHrStaffSelectOptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedHr, setSelectedHr] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

  const { data, isLoading, isError, error } = useCandidates({
    page,
    pageSize,
    search: searchQuery || undefined,
    position: selectedPosition || undefined,
    source: selectedSource || undefined,
    hrResponsible: selectedHr || undefined,
  });

  const candidates = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const totalUnfiltered = data?.totalUnfiltered ?? 0;
  const uniquePositions = data?.uniquePositionCount ?? 0;

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
    setPage(1);
  };

  const hasFilters = Boolean(searchQuery || selectedPosition || selectedSource || selectedHr);

  return (
    <div className="hrm-page">
      <PageHeader
        title="Danh sách ứng viên"
        subtitle="Hồ sơ từ cổng ứng tuyển công khai — lọc theo vị trí, nguồn và HR phụ trách."
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng hồ sơ" value={totalUnfiltered} icon={Users} tone="primary" />
        <HrmStatCard
          label="Đang hiển thị"
          value={totalCount}
          hint={hasFilters ? 'Đã lọc' : ''}
          icon={Filter}
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
              placeholder="Tìm theo tên, email, SĐT..."
            />
            <div className="hrm-list-toolbar__filters-right">
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
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                  <RotateCcw size={14} />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full min-w-max border-collapse hrm-table">
            <thead>
              <tr>
                {['Ngày nhận', 'Họ và tên', 'SĐT', 'Email', 'Giới tính', 'Địa chỉ', 'Năm sinh', 'Học vấn', 'Trường', 'Chuyên ngành', 'Vị trí', 'KN', 'Nguồn', 'CV', 'HR phụ trách'].map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={15}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={15}>
                    <EmptyState
                      message={getApiErrorMessage(error, UI_ERROR.loadCandidates)}
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={15}>
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
                    <td className="table-cell text-xs whitespace-nowrap tabular-nums text-center">
                      {formatCandidateAppliedAt(cand.appliedAt)}
                    </td>
                    <td className="table-cell whitespace-nowrap candidate-name">{cand.fullName}</td>
                    <td className="table-cell tabular-nums">{cand.phone}</td>
                    <td className="table-cell text-sm max-w-[180px] truncate" title={cand.email}>{cand.email}</td>
                    <td className="table-cell text-center">{cand.gender}</td>
                    <td className="table-cell max-w-[140px] truncate" title={cand.address}>{cand.address}</td>
                    <td className="table-cell text-center tabular-nums">{birthYear(cand.birthDate)}</td>
                    <td className="table-cell text-center">{cand.education}</td>
                    <td className="table-cell"><EmptyCell value={cand.school} /></td>
                    <td className="table-cell"><EmptyCell value={cand.major} /></td>
                    <td className="table-cell text-[var(--md-primary)] font-medium max-w-[140px] truncate" title={cand.position}>
                      {cand.position}
                    </td>
                    <td className="table-cell whitespace-nowrap text-center tabular-nums">{cand.experience}</td>
                    <td className="table-cell whitespace-nowrap text-center">{cand.source}</td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={e => handleDownloadCV(cand, e)} className="hrm-cv-chip">
                        <FileText size={13} />
                        <span className="max-w-[72px] truncate">{cand.cvFileName || '—'}</span>
                        <Download size={12} />
                      </button>
                    </td>
                    <td className="table-cell whitespace-nowrap"><EmptyCell value={cand.hrResponsible} /></td>
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
    </div>
  );
}
