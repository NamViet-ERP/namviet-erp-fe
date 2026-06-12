import PublicFormLayout from '../../components/layout/PublicFormLayout';
import CandidateForm from '../../components/recruitment/CandidateForm';
import ToastContainer from '../../components/ui/Toast';

export default function CandidateApplyPage() {
  return (
    <>
      <PublicFormLayout
        wide
        title="Nộp đơn ứng tuyển"
        subtitle="Vui lòng cung cấp các thông tin tuyển dụng dưới đây để nộp hồ sơ xin việc của bạn vào hệ thống nhân sự Vinh Việt."
      >
        <CandidateForm />
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
