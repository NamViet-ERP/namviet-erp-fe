import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Baby, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmployeeStatusSwap from '../../components/hr/EmployeeStatusSwap';
import { useEmployees } from '../../hooks/useEmployees';
import { EMPLOYEE_STATUSES } from '../../constants/recruitment';
import type { EmployeeStatus } from '../../types/hr';
import { getApiErrorMessage } from '../../lib/apiClient';
import { compareEmployeeCodeNewestFirst } from '../../lib/hrm/suggestedEmployeeCode';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function MembersPage() {
  const navigate = useNavigate();
  const {
    data: employees,
    isPending,
    isFetching,
    isError,
    error,
  } = useEmployees();
  const employeeList = employees ?? [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const stats = useMemo(() => ({
    active: employeeList.filter(e => e.status === 'Đang làm').length,
    resigned: employeeList.filter(e => e.status === 'Nghỉ việc').length,
    maternity: employeeList.filter(e => e.status === 'Thai sản').length,
  }), [employeeList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employeeList
      .filter(e => {
        const matchSearch =
          e.fullName.toLowerCase().includes(q) ||
          (e.code?.toLowerCase().includes(q) ?? false) ||
          (e.department?.toLowerCase().includes(q) ?? false);
        const matchStatus = statusFilter ? e.status === statusFilter : true;
        return matchSearch && matchStatus;
      })
      .sort(compareEmployeeCodeNewestFirst);
  }, [employeeList, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const loading = isPending || (isFetching && employeeList.length === 0);

  return (
    <div className="hrm-page">
      <PageHeader
        title="Hồ sơ nhân sự"
        subtitle="Quản lý danh sách nhân viên; HR có thể thêm hồ sơ thủ công hoặc nhận từ form khai báo công khai"
        actions={
          <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/members/new')}>
            <Plus size={16} />
            Thêm nhân viên
          </button>
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng" value={employeeList.length} icon={Users} tone="primary" />
        <HrmStatCard label="Đang làm" value={stats.active} icon={UserCheck} tone="success" />
        <HrmStatCard label="Nghỉ việc" value={stats.resigned} icon={UserX} tone="warning" />
        <HrmStatCard label="Thai sản" value={stats.maternity} icon={Baby} tone="neutral" />
      </div>

      <HrmPanel>
        <div className="hrm-filter-bar">
          <div className="flex-1 min-w-[220px]">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm theo tên, mã NV, bộ phận..." />
          </div>
          <select
            className="form-select h-10 min-w-[150px]"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as EmployeeStatus | ''); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </HrmPanel>

      <HrmPanel noPadding>
        <div className="overflow-x-auto table-scroll">
          <table className="w-full min-w-max border-collapse hrm-table">
            <thead>
              <tr>
                {['Mã NV', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Mảng', 'Chi nhánh', 'Bộ phận', 'Chức vụ', 'Vào làm', 'Chính thức', 'Trạng thái', 'Nghỉ việc'].map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="hrm-empty">Đang tải...</td></tr>
              ) : isError ? (
                <tr>
                  <td colSpan={12} className="hrm-empty text-[var(--md-error)]">
                    Không tải được danh sách nhân viên: {getApiErrorMessage(error)}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={12} className="hrm-empty">Không có nhân viên phù hợp.</td></tr>
              ) : (
                paginated.map(emp => (
                  <tr
                    key={emp.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/members/${emp.id}`)}
                  >
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap">{emp.code || '—'}</td>
                    <td className="table-cell font-semibold member-name">{emp.fullName}</td>
                    <td className="table-cell">{emp.gender}</td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(emp.birthDate)}</td>
                    <td className="table-cell">{emp.segment || '—'}</td>
                    <td className="table-cell">{emp.branch || '—'}</td>
                    <td className="table-cell">{emp.department || '—'}</td>
                    <td className="table-cell">{emp.position || '—'}</td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(emp.joinDate)}</td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(emp.officialDate)}</td>
                    <td className="table-cell text-center">
                      <EmployeeStatusSwap employee={emp} />
                    </td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(emp.resignDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      {filtered.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
