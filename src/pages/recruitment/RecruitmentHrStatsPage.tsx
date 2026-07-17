import { useMemo } from 'react';
import { Users, UserCheck, UserX, Baby } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import PageLoader from '../../components/ui/PageLoader';
import { useEmployees } from '../../hooks/useEmployees';
import { useRecruitmentDashboard } from '../../hooks/useRecruitmentDashboard';

export default function RecruitmentHrStatsPage() {
  const { data: employees, isLoading: empLoading } = useEmployees();
  const { kpi } = useRecruitmentDashboard(6);

  const employeeList = useMemo(() => employees ?? [], [employees]);
  const stats = useMemo(() => ({
    total: employeeList.length,
    active: employeeList.filter(e => e.status === 'Đang làm').length,
    resigned: employeeList.filter(e => e.status === 'Nghỉ việc').length,
    maternity: employeeList.filter(e => e.status === 'Thai sản').length,
  }), [employeeList]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employeeList) {
      const dept = e.department?.trim() || 'Chưa phân loại';
      map.set(dept, (map.get(dept) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  }, [employeeList]);

  if (empLoading || kpi.isLoading) return <PageLoader />;
  const k = kpi.data;

  return (
    <div className="hrm-page space-y-4">
      <PageHeader
        title="Thống kê nhân sự"
        subtitle="Tổng quan nhân sự hiện hữu và liên kết với pipeline tuyển dụng."
      />

      <div>
        <h2 className="text-sm font-semibold text-[var(--md-on-surface-variant)] mb-2">Nhân sự</h2>
        <div className="hrm-stat-grid">
          <HrmStatCard label="Tổng NV" value={stats.total} icon={Users} tone="primary" />
          <HrmStatCard label="Đang làm" value={stats.active} icon={UserCheck} tone="success" />
          <HrmStatCard label="Nghỉ việc" value={stats.resigned} icon={UserX} tone="warning" />
          <HrmStatCard label="Thai sản" value={stats.maternity} icon={Baby} tone="neutral" />
        </div>
      </div>

      {k && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--md-on-surface-variant)] mb-2">Tuyển dụng (kỳ hiện tại)</h2>
          <div className="hrm-stat-grid">
            <HrmStatCard label="Tổng CV" value={k.totalCandidates} icon={Users} tone="primary" />
            <HrmStatCard label="Đã PV" value={k.interviewedCount} icon={Users} tone="neutral" />
            <HrmStatCard label="Đã tuyển" value={k.acceptedCount} icon={UserCheck} tone="success" />
            <HrmStatCard label="Còn thiếu KHTD" value={k.totalRemaining} icon={Users} tone="warning" />
          </div>
        </div>
      )}

      <HrmPanel noPadding>
        <div className="p-4 border-b border-[var(--md-outline-variant)]">
          <h2 className="text-base font-semibold">Nhân sự theo phòng ban</h2>
        </div>
        <div className="overflow-x-auto hrm-table-wrap">
          <table className="w-full border-collapse hrm-table hrm-table--dept-stats">
            <colgroup>
              <col className="hrm-table--dept-stats__col-dept" />
              <col className="hrm-table--dept-stats__col-num" />
              <col className="hrm-table--dept-stats__col-num" />
            </colgroup>
            <thead>
              <tr>
                {['Phòng ban', 'Số NV', 'Tỷ trọng'].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDepartment.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-cell text-center py-8 text-sm text-[var(--md-on-surface-variant)]">
                    Chưa có dữ liệu nhân sự.
                  </td>
                </tr>
              ) : (
                byDepartment.map(row => (
                  <tr key={row.department} className="table-row">
                    <td className="table-cell font-medium hrm-table--dept-stats__dept">{row.department}</td>
                    <td className="table-cell tabular-nums text-center">{row.count}</td>
                    <td className="table-cell tabular-nums text-center">
                      {stats.total > 0 ? `${Math.round((row.count / stats.total) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>
    </div>
  );
}
