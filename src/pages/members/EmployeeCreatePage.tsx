import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import EmployeeOnboardForm from '../../components/hr/EmployeeOnboardForm';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmPanel from '../../components/hr/HrmPanel';
import { showToast } from '../../components/ui/Toast';
import { queryKeys } from '../../services/queryKeys';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  return (
    <div className="hrm-page w-full max-w-4xl mx-auto">
      <HrmDetailHeader
        onBack={() => navigate('/members/list')}
        title="Thêm nhân viên"
        subtitle="HR nhập hồ sơ thủ công theo cùng form khai báo nhân viên công khai"
      />
      <HrmPanel>
        <EmployeeOnboardForm
          mode="hr"
          onCreated={emp => {
            qc.invalidateQueries({ queryKey: queryKeys.employees.all });
            showToast('success', 'Đã thêm nhân viên thành công');
            navigate(`/members/${emp.id}`);
          }}
        />
      </HrmPanel>
    </div>
  );
}
