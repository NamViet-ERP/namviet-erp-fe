import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileText, Download, Users, Filter, Briefcase } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
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

function birthYear(date: string) {
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? '—' : y;
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
  const [pageSize, setPageSize] = useState(10);

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
      showToast('error', getApiErrorMessage(err, 'Không thể tải CV'));
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPosition('');
    setSelectedSource('');
    setSelectedHr('');
    setPage(1);
  };

  const hasFilters = searchQuery || selectedPosition || selectedSource || selectedHr;

  return (
    <div className="hrm-page">
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

      <HrmPanel>
        <div className="hrm-filter-bar">
          <div className="flex-1 min-w-[220px]">
            <SearchBar
              value={searchQuery}
              onChange={v => { setSearchQuery(v); setPage(1); }}
              placeholder="Tìm theo tên, email, SĐT..."
            />
          </div>
          <select
            className="form-select h-10 min-w-[160px]"
            value={selectedPosition}
            onChange={e => { setSelectedPosition(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả vị trí</option>
            {positionFilterOptions.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select
            className="form-select h-10 min-w-[140px]"
            value={selectedSource}
            onChange={e => { setSelectedSource(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả nguồn</option>
            {RECRUITMENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="form-select h-10 min-w-[160px]"
            value={selectedHr}
            onChange={e => { setSelectedHr(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả HR</option>
            {hrStaffFilterOptions.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-3 flex items-center gap-2 rounded bg-[#fc2d42] text-white whitespace-nowrap btn-clear-filters"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">XÓA BỘ LỌC</span>
          </button>
        </div>
      </HrmPanel>

      <HrmPanel noPadding>
        <div className="overflow-x-auto scrollbar">
          <table className="w-full min-w-max border-collapse hrm-table">
            <thead>
              <tr>
                {['Ngày nhận', 'Họ và tên', 'SĐT', 'Email', 'Giới tính', 'Địa chỉ', 'Năm sinh', 'Học vấn', 'Trường', 'Chuyên ngành', 'Vị trí', 'KN', 'Nguồn', 'CV', 'HR'].map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={15} className="hrm-empty">Đang tải...</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={15} className="hrm-empty text-[var(--md-error)]">
                    Không tải được danh sách ứng viên: {getApiErrorMessage(error)}
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr><td colSpan={15} className="hrm-empty">Không tìm thấy ứng viên phù hợp.</td></tr>
              ) : (
                candidates.map(cand => (
                  <tr
                    key={cand.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/recruitment/candidates/${cand.id}`)}
                  >
                    <td className="table-cell text-xs whitespace-nowrap text-center">{formatCandidateAppliedAt(cand.appliedAt)}</td>
                    <td className="table-cell font-semibold whitespace-nowrap candidate-name">{cand.fullName}</td>
                    <td className="table-cell">{cand.phone}</td>
                    <td className="table-cell text-sm">{cand.email}</td>
                    <td className="table-cell text-center">{cand.gender}</td>
                    <td className="table-cell max-w-[140px] truncate" title={cand.address}>{cand.address}</td>
                    <td className="table-cell text-center">{birthYear(cand.birthDate)}</td>
                    <td className="table-cell text-center">{cand.education}</td>
                    <td className="table-cell">{cand.school || '—'}</td>
                    <td className="table-cell">{cand.major || '—'}</td>
                    <td className="table-cell text-[var(--md-primary)] font-medium max-w-[140px] truncate" title={cand.position}>{cand.position}</td>
                    <td className="table-cell whitespace-nowrap text-center">{cand.experience}</td>
                    <td className="table-cell whitespace-nowrap text-center">{cand.source}</td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={e => handleDownloadCV(cand, e)} className="hrm-cv-chip">
                        <FileText size={13} />
                        <span className="max-w-[72px] truncate">{cand.cvFileName}</span>
                        <Download size={12} />
                      </button>
                    </td>
                    <td className="table-cell whitespace-nowrap">{cand.hrResponsible || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      {totalCount > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
