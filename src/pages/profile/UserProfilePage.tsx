import { useNavigate } from 'react-router-dom';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmProfileStripPhoto from '../../components/hr/HrmProfileStripPhoto';
import EmployeeRecordView from '../../components/hr/EmployeeRecordView';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import { getSessionUser } from '../../constants/systemUsers';
import { useEmployee } from '../../hooks/useEmployees';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const { data: employee, isLoading, isError } = useEmployee(sessionUser?.employeeId);

  if (!sessionUser) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[40dvh]">
        <p className="text-sm text-[var(--md-on-surface-variant)]">Không có phiên đăng nhập.</p>
      </div>
    );
  }

  if (!sessionUser.employeeId) {
    return (
      <HrmNotFound
        message="Tài khoản chưa liên kết hồ sơ nhân viên. Liên hệ quản trị viên để được gắn mã NV."
        onBack={() => navigate(-1)}
      />
    );
  }

  if (isLoading) return <HrmLoadingState />;
  if (isError || !employee) {
    return (
      <HrmNotFound
        message="Không tải được hồ sơ nhân viên."
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate(-1)}
        title={employee.fullName}
        subtitle={employee.code ? `Mã NV: ${employee.code}` : 'Chưa có mã nhân viên'}
      />

      <div className="hrm-profile-strip">
        <HrmProfileStripPhoto
          name={employee.fullName}
          photoUrl={employee.profilePhoto?.previewUrl}
          pending={null}
          isEditing={false}
          onFile={() => {}}
          onRemove={() => {}}
        />
        <div>
          <p className="font-bold text-lg text-[var(--md-on-surface)]">{employee.fullName}</p>
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            {employee.position || 'Chưa có chức vụ'}
          </p>
        </div>
      </div>

      <EmployeeRecordView employee={employee} />
    </div>
  );
}
