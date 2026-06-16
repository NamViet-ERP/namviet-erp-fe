import PublicFormLayout from '../../components/layout/PublicFormLayout';
import EmployeeOnboardForm from '../../components/hr/EmployeeOnboardForm';
import ToastContainer from '../../components/ui/Toast';

export default function EmployeeOnboardPage() {
  return (
    <>
      <PublicFormLayout
        wide
        eyebrow="THÔNG TIN NHÂN VIÊN MỚI - NAM VIỆT GROUP"
        eyebrowAsTitle
        title="Cập nhật thông tin nhân viên"
        subtitle="Vui lòng cung cấp đầy đủ và chính xác thông tin để hoàn tất hồ sơ nhân sự"
      >
        <EmployeeOnboardForm />
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
