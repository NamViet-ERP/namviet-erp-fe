import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Baby, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import PermissionGate from '../../components/auth/PermissionGate';
import EmployeeStatusSwap from '../../components/hr/EmployeeStatusSwap';
import { useEmployees } from '../../hooks/useEmployees';
import { EMPLOYEE_STATUSES } from '../../constants/recruitment';
import type { EmployeeStatus } from '../../types/hr';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { compareEmployeeCodeNewestFirst } from '../../lib/hrm/suggestedEmployeeCode';
import { formatDateCell } from '../../lib/hrm/formatters';

import HrmProfileAvatar from '../../components/hr/HrmProfileAvatar';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';

function EmptyCell({ value }: { value?: string }) {
  if (!value || value === '—') {
    return <span className="hrm-empty-cell">—</span>;
  }
  return <>{value}</>;
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
  const employeeList = useMemo(() => employees ?? [], [employees]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

  const stats = useMemo(() => ({
    active: employeeList.filter(e => e.status === 'Đang làm').length,
    resigned: employeeList.filter(e => e.status === 'Nghỉ việc').length,
    maternity: employeeList.filter(e => e.status === 'Thai sản').length,
  }), [employeeList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employeeList
      .filter(e => {
        const matchSearch =
          !q ||
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
  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className="hrm-page">
      <PageHeader
        title="Danh sách nhân viên"
        subtitle="Quản lý hồ sơ nhân sự — thêm thủ công hoặc nhận từ form khai báo công khai."
        actions={
          <PermissionGate permission="hrm.employees.create">
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2 rounded-full px-5"
              onClick={() => navigate('/members/new')}
            >
              <Plus size={16} />
              Thêm nhân viên
            </button>
          </PermissionGate>
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng" value={employeeList.length} icon={Users} tone="primary" />
        <HrmStatCard label="Đang làm" value={stats.active} icon={UserCheck} tone="success" />
        <HrmStatCard label="Nghỉ việc" value={stats.resigned} icon={UserX} tone="warning" />
        <HrmStatCard label="Thai sản" value={stats.maternity} icon={Baby} tone="neutral" />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Tìm theo tên, mã NV, bộ phận..."
            />
            <div className="hrm-filter-select-wrap">
              <select
                className="hrm-filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as EmployeeStatus | ''); setPage(1); }}
                aria-label="Lọc trạng thái"
              >
                <option value="">Tất cả trạng thái</option>
                {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll hrm-table-wrap">
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={12}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      message={getApiErrorMessage(error, UI_ERROR.loadMembers)}
                      icon={UserX}
                    />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      message={hasFilters ? 'Không có nhân viên phù hợp bộ lọc.' : 'Chưa có nhân viên nào.'}
                      icon={Users}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map(emp => (
                  <tr
                    key={emp.id}
                    className="table-row hrm-table-row--interactive"
                    onClick={() => navigate(`/members/${emp.id}`)}
                  >
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)] whitespace-nowrap tabular-nums hrm-table-sticky-col">
                      {emp.code || '—'}
                    </td>
                    <td className="table-cell member-name hrm-table-sticky-col hrm-table-sticky-col--name">
                      <div className="hrm-member-cell">
                        <HrmProfileAvatar name={emp.fullName} photoUrl={emp.profilePhoto?.previewUrl} />
                        <span className="truncate max-w-[180px]" title={emp.fullName}>{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="table-cell">{emp.gender}</td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{formatDateCell(emp.birthDate)}</td>
                    <td className="table-cell"><EmptyCell value={emp.segment} /></td>
                    <td className="table-cell"><EmptyCell value={emp.branch} /></td>
                    <td className="table-cell">{emp.department || <span className="hrm-empty-cell">Chưa phân phòng</span>}</td>
                    <td className="table-cell"><EmptyCell value={emp.position} /></td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{formatDateCell(emp.joinDate)}</td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{formatDateCell(emp.officialDate)}</td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <EmployeeStatusSwap employee={emp} />
                    </td>
                    <td className="table-cell whitespace-nowrap tabular-nums">{formatDateCell(emp.resignDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && !loading && (
          <Pagination
            embedded
            itemLabel="nhân viên"
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </HrmPanel>
    </div>
  );
}
