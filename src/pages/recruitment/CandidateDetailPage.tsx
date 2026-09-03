import { useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Download, UserPlus } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import { useCandidate, useUpdateCandidate, useUpdateCandidateStatus } from '../../hooks/useCandidates';
import { useHrStaffSelectOptions } from '../../hooks/useHrStaff';
import { RECRUITMENT_SOURCES, EDUCATION_LEVELS } from '../../constants/recruitment';
import { usePositionSelectOptions } from '../../hooks/usePositions';
import { useDepartments } from '../../hooks/useDepartments';
import { candidatesService } from '../../services/candidatesService';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import DetailSection from '../../components/hr/DetailSection';
import { FieldView, FieldInput, FieldSelect } from '../../components/hr/DetailFields';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmEditActions from '../../components/hr/HrmEditActions';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import CandidateStatusBadge from '../../components/recruitment/CandidateStatusBadge';
import CandidateStatusModal, { type CandidateStatusFormValues } from '../../components/recruitment/CandidateStatusModal';
import { formatCandidateAppliedAt } from '../../lib/hrm/candidateApiMapper';
import { sanitizeCandidateForSave } from '../../lib/hrm/sanitizeInput';
import type { Candidate, UpdateCandidateDto } from '../../types/hr';
import { usePermission } from '../../hooks/usePermission';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const updateMutation = useUpdateCandidate();
  const statusMutation = useUpdateCandidateStatus();
  const { has } = usePermission();
  const canUpdateCandidate = has('hrm.candidates.update');
  const canCreateEmployee = has('hrm.employees.create');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Candidate | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const downloadingCvRef = useRef(false);
  const form = isEditing ? draft : candidate;
  const positionOptions = usePositionSelectOptions(form?.position ?? candidate?.position);
  const hrStaffOptions = useHrStaffSelectOptions(form?.hrResponsible ?? candidate?.hrResponsible);
  const { data: hrDepartments = [] } = useDepartments(true);
  const departmentOptions = useMemo(() => {
    const names = hrDepartments.map(d => d.name);
    const current = form?.targetDepartment?.trim();
    if (current && !names.includes(current)) return [current, ...names];
    return names;
  }, [hrDepartments, form?.targetDepartment]);

  if (isLoading) return <HrmLoadingState />;
  if (isError || !candidate || !form) {
    return (
      <HrmNotFound
        message="Không tìm thấy ứng viên."
        onBack={() => navigate('/recruitment/candidates')}
      />
    );
  }

  const set = (key: keyof Candidate, value: string) => setDraft(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!id || !form) return;
    const sanitized = sanitizeCandidateForSave(form);
    try {
      const dto: UpdateCandidateDto = (({ id: _id, appliedAt: _appliedAt, ...rest }) => {
        void _id;
        void _appliedAt;
        return rest;
      })(sanitized);
      await updateMutation.mutateAsync({ id, dto });
      showToast('success', 'Đã lưu thông tin ứng viên');
      setDraft(null);
      setIsEditing(false);
    } catch {
      showToast('error', 'Không thể lưu thông tin');
    }
  };

  const handleCancel = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setDraft({ ...candidate });
    setIsEditing(true);
  };

  const handleDownloadCv = async () => {
    if (!id || !form.cvFileName) {
      showToast('warning', 'Ứng viên chưa có file CV');
      return;
    }
    if (downloadingCvRef.current) return;
    downloadingCvRef.current = true;
    try {
      await candidatesService.downloadCv(id, form.cvFileName);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, UI_ERROR.loadCv));
    } finally {
      downloadingCvRef.current = false;
    }
  };

  const handleStatusSubmit = async (values: CandidateStatusFormValues) => {
    if (!id) return;
    try {
      await statusMutation.mutateAsync({ id, payload: values });
      showToast('success', 'Đã cập nhật trạng thái ứng viên');
      setStatusModalOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật trạng thái'));
    }
  };

  const editActions = (
    <HrmEditActions
      isEditing={isEditing}
      isSaving={updateMutation.isPending}
      disabled={!canUpdateCandidate}
      onEdit={handleStartEditing}
      onCancel={handleCancel}
      onSave={handleSave}
    />
  );

  const candidateCanBecomeEmployee = candidate.status === 'Offered' || candidate.status === 'Accepted';

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {!isEditing && candidateCanBecomeEmployee && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/members/new', { state: { fromCandidate: candidate } })}
          disabled={!canCreateEmployee}
          title={canCreateEmployee ? undefined : 'Bạn không có quyền tạo nhân viên'}
        >
          <UserPlus size={16} aria-hidden />
          Tạo nhân viên
        </button>
      )}
      {!isEditing && (
        <button
          type="button"
          className="inline-flex"
          title="Cập nhật trạng thái"
          disabled={!canUpdateCandidate}
          onClick={() => setStatusModalOpen(true)}
        >
          <CandidateStatusBadge status={candidate.status} />
        </button>
      )}
      {editActions}
    </div>
  );

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate('/recruitment/candidates')}
        title={candidate.fullName}
        subtitle={`Nộp hồ sơ · ${formatCandidateAppliedAt(candidate.appliedAt)}`}
        actions={headerActions}
      />

      <DetailSection title="Thông tin ứng viên" description="Hồ sơ từ form ứng tuyển công khai">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isEditing ? (
            <>
              <FieldInput label="Họ và tên" value={form.fullName} onChange={v => set('fullName', v)} />
              <FieldInput label="Số điện thoại" value={form.phone} onChange={v => set('phone', v)} phone />
              <FieldInput label="Email" value={form.email} onChange={v => set('email', v)} />
              <FieldSelect label="Giới tính" value={form.gender} onChange={v => set('gender', v)} options={['Nam', 'Nữ']} />
              <FieldInput label="Năm sinh" value={form.birthDate} onChange={v => set('birthDate', v)} type="date" />
              <FieldInput label="Địa chỉ hiện tại" value={form.address} onChange={v => set('address', v)} />
              <FieldSelect label="Trình độ học vấn" value={form.education as string} onChange={v => set('education', v)} options={[...EDUCATION_LEVELS]} />
              <FieldInput label="Trường" value={form.school} onChange={v => set('school', v)} />
              <FieldInput label="Chuyên ngành" value={form.major} onChange={v => set('major', v)} />
              <FieldSelect label="Vị trí ứng tuyển" value={form.position} onChange={v => set('position', v)} options={positionOptions} />
              <FieldInput label="Số năm kinh nghiệm" value={form.experience} onChange={v => set('experience', v)} />
              <FieldSelect label="Nguồn ứng tuyển" value={form.source as string} onChange={v => set('source', v)} options={[...RECRUITMENT_SOURCES]} />
              <FieldSelect label="HR phụ trách" value={form.hrResponsible} onChange={v => set('hrResponsible', v)} options={hrStaffOptions} />
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
              <FieldView label="Kế hoạch tuyển dụng" value={form.recruitmentPlanLabel ?? 'Chưa gán kế hoạch'} />
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
          <button type="button" onClick={handleDownloadCv} disabled={!form.cvFileName} className="btn btn-primary rounded-full text-sm flex items-center gap-2 shrink-0 min-w-[6.5rem] justify-center">
            <Download size={14} /> Tải CV
          </button>
        </div>
      </DetailSection>

      <DetailSection title="Quy trình tuyển dụng" description="Theo dõi từ sơ tuyển đến nhận việc">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isEditing ? (
            <>
              <FieldSelect label="Lọc/ứng tuyển" value={form.screeningType ?? ''} onChange={v => set('screeningType', v)} options={['Lọc', 'Ứng tuyển']} />
              <FieldInput label="Chức vụ cần tuyển" value={form.targetPosition ?? ''} onChange={v => set('targetPosition', v)} />
              <FieldSelect label="Bộ phận cần tuyển" value={form.targetDepartment ?? ''} onChange={v => set('targetDepartment', v)} options={departmentOptions} />
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

      <CandidateStatusModal
        open={statusModalOpen}
        candidate={candidate}
        action="custom"
        onClose={() => setStatusModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isSubmitting={statusMutation.isPending}
      />
    </div>
  );
}
