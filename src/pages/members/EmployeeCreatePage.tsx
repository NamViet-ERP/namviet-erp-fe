import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import EmployeeOnboardForm from '../../components/hr/EmployeeOnboardForm';
import PageHeader from '../../components/ui/PageHeader';
import SectionCard from '../../components/ui/SectionCard';
import { showToast } from '../../components/ui/Toast';
import { queryKeys } from '../../services/queryKeys';
import type { Candidate } from '../../types/hr';

type EmployeeCreateLocationState = {
  fromCandidate?: Candidate;
};

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const fromCandidate = (location.state as EmployeeCreateLocationState | null)?.fromCandidate;

  return (
    <div className="hrm-page w-full max-w-4xl mx-auto">
      <PageHeader
        variant="detail"
        onBack={() => navigate(fromCandidate ? `/recruitment/candidates/${fromCandidate.id}` : '/members/list')}
        title="Thêm nhân viên"
        subtitle={
          fromCandidate
            ? `Điền hồ sơ từ ứng viên ${fromCandidate.fullName} — các trường đã được gợi ý sẵn.`
            : 'HR nhập hồ sơ thủ công theo cùng form khai báo nhân viên công khai'
        }
      />
      <SectionCard>
        <EmployeeOnboardForm
          mode="hr"
          prefillFromCandidate={fromCandidate}
          onCreated={emp => {
            qc.invalidateQueries({ queryKey: queryKeys.employees.all });
            showToast('success', 'Đã thêm nhân viên thành công');
            navigate(`/members/${emp.id}`);
          }}
        />
      </SectionCard>
    </div>
  );
}
