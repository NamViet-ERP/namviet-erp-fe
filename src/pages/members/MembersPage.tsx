import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Baby } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import EmployeeStatusSwap from '../../components/hr/EmployeeStatusSwap';
import { useEmployees } from '../../hooks/useEmployees';
import { EMPLOYEE_STATUSES } from '../../constants/recruitment';
import type { EmployeeStatus } from '../../types/hr';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function MembersPage() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useEmployees();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const stats = useMemo(() => ({
    active: employees.filter(e => e.status === 'Đang làm').length,
    resigned: employees.filter(e => e.status === 'Nghỉ việc').length,
    maternity: employees.filter(e => e.status === 'Thai sản').length,
  }), [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e => {
      const matchSearch =
        e.fullName.toLowerCase().includes(q) ||
        (e.code?.toLowerCase().includes(q) ?? false) ||
        (e.department?.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter ? e.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [employees, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="hrm-page">

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng" value={employees.length} icon={Users} tone="primary" />
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse hrm-table">
            <thead>
              <tr>
                {['Mã NV', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Mảng', 'Chi nhánh', 'Bộ phận', 'Chức vụ', 'Vào làm', 'Chính thức', 'Trạng thái', 'Nghỉ việc'].map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} className="hrm-empty">Đang tải...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={12} className="hrm-empty">Không có nhân viên phù hợp.</td></tr>
              ) : (
                paginated.map(emp => (
                  <tr
                    key={emp.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/members/${emp.id}`)}
                  >
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)]">{emp.code || '—'}</td>
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
