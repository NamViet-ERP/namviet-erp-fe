import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileText, Download, Users, Filter, Briefcase } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import { showToast } from '../../components/ui/Toast';
import { useCandidates } from '../../hooks/useCandidates';
import { RECRUITMENT_POSITIONS, RECRUITMENT_SOURCES } from '../../constants/recruitment';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function birthYear(date: string) {
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? '—' : y;
}

export default function CandidateListPage() {
  const navigate = useNavigate();
  const { data: candidates = [], isLoading } = useCandidates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        cand.fullName.toLowerCase().includes(q) ||
        cand.email.toLowerCase().includes(q) ||
        cand.phone.includes(searchQuery);
      const matchPosition = selectedPosition ? cand.position === selectedPosition : true;
      const matchSource = selectedSource ? cand.source === selectedSource : true;
      return matchSearch && matchPosition && matchSource;
    });
  }, [candidates, searchQuery, selectedPosition, selectedSource]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const paginated = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);
  const uniquePositions = useMemo(() => new Set(candidates.map(c => c.position)).size, [candidates]);

  const handleDownloadCV = (cvName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('info', `Bắt đầu tải xuống file: ${cvName}`, 'Tải CV');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPosition('');
    setSelectedSource('');
    setPage(1);
  };

  const hasFilters = searchQuery || selectedPosition || selectedSource;

  return (
    <div className="hrm-page">
      <PageHeader
        eyebrow="TUYỂN DỤNG"
        title="Danh sách ứng viên"
        subtitle="Quản lý hồ sơ ứng viên từ form nộp đơn công khai"
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng hồ sơ" value={candidates.length} icon={Users} tone="primary" />
        <HrmStatCard
          label="Đang hiển thị"
          value={filteredCandidates.length}
          hint={hasFilters ? 'Đã lọc' : 'Tất cả'}
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
            className="form-select h-10 rounded-xl min-w-[160px]"
            value={selectedPosition}
            onChange={e => { setSelectedPosition(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả vị trí</option>
            {RECRUITMENT_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="form-select h-10 rounded-xl min-w-[140px]"
            value={selectedSource}
            onChange={e => { setSelectedSource(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả nguồn</option>
            {RECRUITMENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-outline h-10 px-3 flex items-center gap-2 rounded-xl"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>
        </div>
      </HrmPanel>

      <HrmPanel noPadding>
        <div className="overflow-x-auto">
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
              ) : paginated.length === 0 ? (
                <tr><td colSpan={15} className="hrm-empty">Không tìm thấy ứng viên phù hợp.</td></tr>
              ) : (
                paginated.map(cand => (
                  <tr
                    key={cand.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/recruitment/candidates/${cand.id}`)}
                  >
                    <td className="table-cell text-xs whitespace-nowrap text-center">{formatDate(cand.appliedAt)}</td>
                    <td className="table-cell font-semibold whitespace-nowrap">{cand.fullName}</td>
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
                      <button type="button" onClick={e => handleDownloadCV(cand.cvFileName, e)} className="hrm-cv-chip">
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

      {filteredCandidates.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredCandidates.length}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
