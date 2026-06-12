import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Save, X, FileText, Download } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { useCandidate, useUpdateCandidate } from '../../hooks/useCandidates';
import { getHrStaff } from '../../constants/systemUsers';
import { RECRUITMENT_POSITIONS, RECRUITMENT_SOURCES, EDUCATION_LEVELS } from '../../constants/recruitment';
import DetailSection from '../../components/hr/DetailSection';
import { FieldView, FieldInput, FieldSelect } from '../../components/hr/DetailFields';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import type { Candidate } from '../../types/hr';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const updateMutation = useUpdateCandidate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Candidate | null>(null);
  const hrStaff = getHrStaff();

  useEffect(() => {
    if (candidate) setForm({ ...candidate });
  }, [candidate]);

  if (isLoading) return <div className="hrm-empty">Đang tải...</div>;
  if (isError || !candidate || !form) {
    return (
      <div className="hrm-empty">
        <p className="mb-4">Không tìm thấy ứng viên.</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/recruitment/candidates')}>Quay lại</button>
      </div>
    );
  }

  const set = (key: keyof Candidate, value: string) => setForm(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!id || !form) return;
    try {
      const { id: _id, appliedAt, ...dto } = form;
      await updateMutation.mutateAsync({ id, dto });
      showToast('success', 'Đã lưu thông tin ứng viên');
      setIsEditing(false);
    } catch {
      showToast('error', 'Không thể lưu thông tin');
    }
  };

  const handleCancel = () => {
    setForm({ ...candidate });
    setIsEditing(false);
  };

  const editActions = !isEditing ? (
    <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary rounded-full px-5 flex items-center gap-2">
      <Edit size={16} /> Chỉnh sửa
    </button>
  ) : (
    <>
      <button type="button" onClick={handleCancel} className="btn btn-outline rounded-full px-5 flex items-center gap-2">
        <X size={16} /> Hủy
      </button>
      <button type="button" onClick={handleSave} disabled={updateMutation.isPending} className="btn btn-primary rounded-full px-5 flex items-center gap-2">
        <Save size={16} /> Lưu
      </button>
    </>
  );

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate('/recruitment/candidates')}
        title={candidate.fullName}
        subtitle={`Nộp hồ sơ: ${new Date(candidate.appliedAt).toLocaleString('vi-VN')}`}
        actions={editActions}
      />

      <DetailSection title="Thông tin ứng viên" description="Hồ sơ từ form ứng tuyển công khai">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isEditing ? (
            <>
              <FieldInput label="Họ và tên" value={form.fullName} onChange={v => set('fullName', v)} />
              <FieldInput label="Số điện thoại" value={form.phone} onChange={v => set('phone', v)} />
              <FieldInput label="Email" value={form.email} onChange={v => set('email', v)} />
              <FieldSelect label="Giới tính" value={form.gender} onChange={v => set('gender', v)} options={['Nam', 'Nữ']} />
              <FieldInput label="Năm sinh" value={form.birthDate} onChange={v => set('birthDate', v)} type="date" />
              <FieldInput label="Địa chỉ hiện tại" value={form.address} onChange={v => set('address', v)} />
              <FieldSelect label="Trình độ học vấn" value={form.education as string} onChange={v => set('education', v)} options={[...EDUCATION_LEVELS]} />
              <FieldInput label="Trường" value={form.school} onChange={v => set('school', v)} />
              <FieldInput label="Chuyên ngành" value={form.major} onChange={v => set('major', v)} />
              <FieldSelect label="Vị trí ứng tuyển" value={form.position} onChange={v => set('position', v)} options={[...RECRUITMENT_POSITIONS]} />
              <FieldInput label="Số năm kinh nghiệm" value={form.experience} onChange={v => set('experience', v)} />
              <FieldSelect label="Nguồn ứng tuyển" value={form.source as string} onChange={v => set('source', v)} options={[...RECRUITMENT_SOURCES]} />
              <FieldSelect label="HR phụ trách" value={form.hrResponsible} onChange={v => set('hrResponsible', v)} options={hrStaff.map(h => h.name)} />
            </>
          ) : (
            <>
              <FieldView label="Họ và tên" value={form.fullName} />
              <FieldView label="Số điện thoại" value={form.phone} />
              <FieldView label="Email" value={form.email} />
              <FieldView label="Giới tính" value={form.gender} />
              <FieldView label="Ngày sinh" value={new Date(form.birthDate).toLocaleDateString('vi-VN')} />
              <FieldView label="Địa chỉ hiện tại" value={form.address} />
              <FieldView label="Trình độ học vấn" value={form.education as string} />
              <FieldView label="Trường" value={form.school} />
              <FieldView label="Chuyên ngành" value={form.major} />
              <FieldView label="Vị trí ứng tuyển" value={form.position} />
              <FieldView label="Số năm kinh nghiệm" value={form.experience} />
              <FieldView label="Nguồn ứng tuyển" value={form.source as string} />
              <FieldView label="HR phụ trách" value={form.hrResponsible} />
            </>
          )}
        </div>
        <div className="hrm-cv-banner">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[var(--md-primary)]" />
            <div>
              <p className="font-semibold text-sm">{form.cvFileName}</p>
              <p className="text-xs text-[var(--md-on-surface-variant)]">{form.cvFileSize}</p>
            </div>
          </div>
          <button type="button" onClick={() => showToast('info', `Tải ${form.cvFileName}`, 'Tải CV')} className="btn btn-outline rounded-full text-sm flex items-center gap-2">
            <Download size={14} /> Tải CV
          </button>
        </div>
      </DetailSection>

      <DetailSection title="Quy trình tuyển dụng (HR)" description="Theo dõi pipeline từ sơ tuyển đến nhận việc">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isEditing ? (
            <>
              <FieldSelect label="Lọc/ứng tuyển" value={form.screeningType ?? ''} onChange={v => set('screeningType', v)} options={['Lọc', 'Ứng tuyển']} />
              <FieldInput label="Chức vụ cần tuyển" value={form.targetPosition ?? ''} onChange={v => set('targetPosition', v)} />
              <FieldInput label="Bộ phận cần tuyển" value={form.targetDepartment ?? ''} onChange={v => set('targetDepartment', v)} />
              <FieldSelect label="Sơ tuyển qua ĐT/Zalo/FB" value={form.preScreenResult ?? ''} onChange={v => set('preScreenResult', v)} options={['ĐT', 'Zalo', 'FB', 'Khác']} />
              <FieldInput label="Kết quả liên hệ" value={form.contactResult ?? ''} onChange={v => set('contactResult', v)} />
              <FieldInput label="Ngày phỏng vấn" value={form.interviewDate ?? ''} onChange={v => set('interviewDate', v)} type="date" />
              <FieldSelect label="Phỏng vấn" value={form.interviewAttended ?? ''} onChange={v => set('interviewAttended', v)} options={['Đến', 'Không đến']} />
              <FieldInput label="Người đánh giá" value={form.evaluator ?? ''} onChange={v => set('evaluator', v)} />
              <FieldSelect label="Đánh giá" value={form.evaluationResult ?? ''} onChange={v => set('evaluationResult', v)} options={['Đạt', 'Không đạt']} />
              <FieldSelect label="Offer" value={form.offerStatus ?? ''} onChange={v => set('offerStatus', v)} options={['Đồng ý', 'Từ chối']} />
              <FieldInput label="Lý do không đồng ý offer" value={form.offerRejectReason ?? ''} onChange={v => set('offerRejectReason', v)} />
              <FieldInput label="Ngày nhận việc" value={form.startDate ?? ''} onChange={v => set('startDate', v)} type="date" />
              <FieldSelect label="Nhận việc" value={form.onboardingAttended ?? ''} onChange={v => set('onboardingAttended', v)} options={['Đến', 'Không đến']} />
              <FieldInput label="Lý do không đến nhận việc" value={form.onboardingRejectReason ?? ''} onChange={v => set('onboardingRejectReason', v)} />
            </>
          ) : (
            <>
              <FieldView label="Lọc/ứng tuyển" value={form.screeningType} />
              <FieldView label="Chức vụ cần tuyển" value={form.targetPosition} />
              <FieldView label="Bộ phận cần tuyển" value={form.targetDepartment} />
              <FieldView label="Sơ tuyển qua ĐT/Zalo/FB" value={form.preScreenResult} />
              <FieldView label="Kết quả liên hệ" value={form.contactResult} />
              <FieldView label="Ngày phỏng vấn" value={form.interviewDate ? new Date(form.interviewDate).toLocaleDateString('vi-VN') : undefined} />
              <FieldView label="Phỏng vấn" value={form.interviewAttended} />
              <FieldView label="Người đánh giá" value={form.evaluator} />
              <FieldView label="Đánh giá" value={form.evaluationResult} />
              <FieldView label="Offer" value={form.offerStatus} />
              <FieldView label="Lý do không đồng ý offer" value={form.offerRejectReason} />
              <FieldView label="Ngày nhận việc" value={form.startDate ? new Date(form.startDate).toLocaleDateString('vi-VN') : undefined} />
              <FieldView label="Nhận việc" value={form.onboardingAttended} />
              <FieldView label="Lý do không đến nhận việc" value={form.onboardingRejectReason} />
            </>
          )}
        </div>
      </DetailSection>
    </div>
  );
}
