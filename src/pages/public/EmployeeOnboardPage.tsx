import { useSearchParams } from 'react-router-dom';
import PublicFormLayout from '../../components/layout/PublicFormLayout';
import EmployeeOnboardForm from '../../components/hr/EmployeeOnboardForm';
import ToastContainer from '../../components/ui/Toast';
import { useValidateOnboardingInvite } from '../../hooks/useOnboardingInvites';

export default function EmployeeOnboardPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const validation = useValidateOnboardingInvite(token);

  let content;
  if (!token) {
    content = (
      <div className="hrm-success-state" role="alert">
        <h3 className="hrm-success-state__title">Liên kết không hợp lệ</h3>
        <p className="hrm-success-state__desc">Vui lòng sử dụng liên kết do Phòng Nhân sự cung cấp.</p>
      </div>
    );
  } else if (validation.isPending) {
    content = (
      <div className="hrm-success-state" role="status" aria-live="polite">
        <p className="hrm-success-state__desc">Đang kiểm tra liên kết...</p>
      </div>
    );
  } else if (validation.isError) {
    content = (
      <div className="hrm-success-state" role="alert">
        <h3 className="hrm-success-state__title">Không thể kiểm tra liên kết</h3>
        <p className="hrm-success-state__desc">Vui lòng thử lại sau hoặc liên hệ Phòng Nhân sự.</p>
      </div>
    );
  } else if (!validation.data?.valid) {
    content = (
      <div className="hrm-success-state" role="alert">
        <h3 className="hrm-success-state__title">Liên kết đã hết hiệu lực</h3>
        <p className="hrm-success-state__desc">Liên kết có thể đã được sử dụng, thu hồi hoặc hết hạn.</p>
      </div>
    );
  } else {
    content = <EmployeeOnboardForm inviteToken={token} />;
  }

  return (
    <>
      <PublicFormLayout
        wide
        eyebrow="THÔNG TIN NHÂN VIÊN MỚI - NAM VIỆT GROUP"
        eyebrowAsTitle
        title="Cập nhật thông tin nhân viên"
        subtitle="Vui lòng cung cấp đầy đủ và chính xác thông tin để hoàn tất hồ sơ nhân sự"
      >
        {content}
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
