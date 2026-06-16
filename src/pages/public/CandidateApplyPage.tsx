import PublicFormLayout from '../../components/layout/PublicFormLayout';
import CandidateForm from '../../components/recruitment/CandidateForm';
import ToastContainer from '../../components/ui/Toast';

export default function CandidateApplyPage() {
  return (
    <>
      <PublicFormLayout
        wide
        eyebrow="NAM VIỆT GROUP TUYỂN DỤNG"
        eyebrowAsTitle
        title=""
        subtitle="Vui lòng điền đầy đủ thông tin để chúng tôi có thể liên hệ và phản hồi sớm nhất"
      >
        <CandidateForm />
      </PublicFormLayout>
      <ToastContainer />
    </>
  );
}
