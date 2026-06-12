import PublicFormLayout from '../../components/layout/PublicFormLayout';
import EmployeeOnboardForm from '../../components/hr/EmployeeOnboardForm';
import ToastContainer from '../../components/ui/Toast';

export default function EmployeeOnboardPage() {
  return (
    <>
      <PublicFormLayout
        wide
        title="Khai báo thông tin nhân viên mới"
        subtitle="Vui lòng điền đầy đủ thông tin cá nhân, liên hệ, học vấn và ngân hàng để hoàn tất hồ sơ nhân viên."
      >
        <EmployeeOnboardForm />
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
