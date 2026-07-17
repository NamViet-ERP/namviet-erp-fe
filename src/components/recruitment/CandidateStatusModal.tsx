import { useState } from 'react';
import Modal from '../ui/Modal';
import HrmDatePicker from '../hr/HrmDatePicker';
import HrmTimeInput from '../hr/HrmTimeInput';
import type { Candidate, CandidatePipelineStatus } from '../../types/hr';
import {
  CANDIDATE_STATUS_OPTIONS,
  INTERVIEW_PIPELINE_STATUSES,
  OFFER_PIPELINE_STATUSES,
  type CandidateQuickAction,
} from '../../constants/recruitment';
import { inputDateToApi } from '../../lib/hrm/candidateApiMapper';
import { useRecruitmentPlans } from '../../hooks/useRecruitmentPlans';

export interface CandidateStatusFormValues {
  status: CandidatePipelineStatus;
  interviewDate?: string;
  interviewTime?: string;
  evaluator?: string;
  startDate?: string;
  offerSalary?: string;
  offerNote?: string;
  rejectReason?: string;
  recruitmentPlanId?: string | null;
}

interface CandidateStatusModalProps {
  open: boolean;
  candidate: Candidate | null;
  action: CandidateQuickAction | 'custom';
  initialStatus?: CandidatePipelineStatus;
  onClose: () => void;
  onSubmit: (values: CandidateStatusFormValues) => void;
  isSubmitting?: boolean;
}

function defaultStatusForAction(action: CandidateQuickAction): CandidatePipelineStatus {
  switch (action) {
    case 'interview':
      return 'InterviewScheduled';
    case 'offer':
      return 'Offered';
    case 'reject':
      return 'Rejected';
    default:
      return 'New';
  }
}

function isInterviewStatus(status: CandidatePipelineStatus) {
  return INTERVIEW_PIPELINE_STATUSES.includes(status) || status === 'Interview1' || status === 'Interview2';
}

function isOfferStatus(status: CandidatePipelineStatus) {
  return OFFER_PIPELINE_STATUSES.includes(status) || status === 'Offered';
}

function isRejectStatus(status: CandidatePipelineStatus) {
  return status === 'Rejected' || status === 'OfferDeclined';
}

export default function CandidateStatusModal({
  open,
  candidate,
  action,
  initialStatus,
  onClose,
  onSubmit,
  isSubmitting,
}: CandidateStatusModalProps) {
  const [status, setStatus] = useState<CandidatePipelineStatus>('InterviewScheduled');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [startDate, setStartDate] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [recruitmentPlanId, setRecruitmentPlanId] = useState('');
  const { data: activePlans = [], isLoading: isLoadingPlans } = useRecruitmentPlans(
    { status: 'Active' },
    open,
  );
  const resetKey = open && candidate
    ? `${candidate.id}:${action}:${initialStatus ?? ''}`
    : '';
  const [appliedResetKey, setAppliedResetKey] = useState('');

  if (resetKey !== appliedResetKey && candidate) {
    setAppliedResetKey(resetKey);
    const nextStatus = initialStatus ?? (action === 'custom' ? candidate.status : defaultStatusForAction(action));
    setStatus(nextStatus);
    setInterviewDate(candidate.interviewDate ?? '');
    setInterviewTime(candidate.interviewTime ?? '');
    setEvaluator(candidate.evaluator ?? candidate.hrResponsible ?? '');
    setStartDate(candidate.startDate ?? '');
    setOfferSalary(candidate.offerSalary ?? '');
    setOfferNote('');
    setRejectReason(candidate.offerRejectReason ?? '');
    setRecruitmentPlanId(candidate.recruitmentPlanId ?? '');
  }

  if (!candidate) return null;

  const showInterviewFields = isInterviewStatus(status) || action === 'interview';
  const showOfferFields = isOfferStatus(status) || action === 'offer';
  const showRejectFields = isRejectStatus(status) || action === 'reject';
  const compatiblePlans = activePlans.filter(
    plan => plan.positionName.trim().toLocaleLowerCase('vi')
      === candidate.position.trim().toLocaleLowerCase('vi'),
  );
  const currentPlanMissingFromOptions = Boolean(
    recruitmentPlanId && !compatiblePlans.some(plan => plan.id === recruitmentPlanId),
  );
  const modalTitle = action === 'custom'
    ? `Cập nhật trạng thái & Hồ sơ — ${candidate.fullName}`
    : `Cập nhật trạng thái & Hồ sơ — ${candidate.fullName}`;

  const handleSubmit = () => {
    onSubmit({
      status,
      interviewDate: showInterviewFields && interviewDate ? inputDateToApi(interviewDate) : undefined,
      interviewTime: showInterviewFields ? interviewTime || undefined : undefined,
      evaluator: showInterviewFields ? evaluator || undefined : undefined,
      startDate: showOfferFields && startDate ? inputDateToApi(startDate) : undefined,
      offerSalary: showOfferFields ? offerSalary || undefined : undefined,
      offerNote: showOfferFields ? offerNote || undefined : undefined,
      rejectReason: showRejectFields ? rejectReason || undefined : undefined,
      recruitmentPlanId: recruitmentPlanId || null,
    });
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Đang lưu…' : 'Lưu cập nhật'}
          </button>
        </>
      }
    >
      <div className="recruitment-status-modal flex flex-col gap-4">
        <p className="text-sm text-[var(--md-on-surface-variant)]">
          Vị trí: <strong>{candidate.position || '—'}</strong>
          {' · '}
          Nguồn: <strong>{candidate.source || '—'}</strong>
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Chọn trạng thái mới</span>
          <select
            className="form-input form-input-md"
            value={status}
            onChange={e => setStatus(e.target.value as CandidatePipelineStatus)}
          >
            {CANDIDATE_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Kế hoạch tuyển dụng</span>
          <select
            className="form-input form-input-md"
            value={recruitmentPlanId}
            onChange={e => setRecruitmentPlanId(e.target.value)}
            disabled={isLoadingPlans}
          >
            <option value="">Chưa gán kế hoạch</option>
            {currentPlanMissingFromOptions && (
              <option value={recruitmentPlanId}>
                {candidate.recruitmentPlanLabel ?? `Kế hoạch #${recruitmentPlanId}`} (không còn hoạt động)
              </option>
            )}
            {compatiblePlans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.period
                  ? `${plan.period} - ${plan.departmentName}`
                  : `${plan.positionName} - ${plan.departmentName}`}
              </option>
            ))}
          </select>
        </label>

        {showInterviewFields && (
          <div className="recruitment-status-modal__section recruitment-status-modal__section--interview">
            <h3 className="recruitment-status-modal__section-title">Lên lịch phỏng vấn</h3>
            <div className="recruitment-status-modal__schedule-row">
              <label className="recruitment-status-modal__field">
                <span className="recruitment-status-modal__field-label">Ngày hẹn PV</span>
                <HrmDatePicker value={interviewDate} onChange={setInterviewDate} placeholder="dd/mm/yyyy" />
              </label>
              <label className="recruitment-status-modal__field">
                <span className="recruitment-status-modal__field-label">Giờ hẹn PV</span>
                <HrmTimeInput value={interviewTime} onChange={setInterviewTime} />
              </label>
            </div>
            <label className="recruitment-status-modal__field mt-3">
              <span className="recruitment-status-modal__field-label">Người PV / Hội đồng</span>
              <input
                className="hrm-field-input"
                value={evaluator}
                onChange={e => setEvaluator(e.target.value)}
                placeholder="VD: Giám đốc, HR + Trưởng phòng"
              />
            </label>
          </div>
        )}

        {showOfferFields && (
          <div className="recruitment-status-modal__section recruitment-status-modal__section--offer">
            <h3 className="recruitment-status-modal__section-title">Thông tin Offer / Nhận việc</h3>
            <div className="recruitment-status-modal__schedule-row">
              <label className="recruitment-status-modal__field">
                <span className="recruitment-status-modal__field-label">Ngày nhận việc</span>
                <HrmDatePicker value={startDate} onChange={setStartDate} placeholder="dd/mm/yyyy" />
              </label>
              <label className="recruitment-status-modal__field">
                <span className="recruitment-status-modal__field-label">Mức lương Offer</span>
                <input
                  className="hrm-field-input"
                  value={offerSalary}
                  onChange={e => setOfferSalary(e.target.value)}
                  placeholder="VD: 12.000.000"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm mt-3">
              <span className="font-medium">Ghi chú offer</span>
              <textarea
                className="form-input form-input-md min-h-[72px]"
                value={offerNote}
                onChange={e => setOfferNote(e.target.value)}
                placeholder="Điều khoản, phụ cấp, thời hạn thử việc..."
              />
            </label>
          </div>
        )}

        {showRejectFields && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Lý do loại / từ chối</span>
            <textarea
              className="form-input form-input-md min-h-[72px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Không phù hợp vị trí, ứng viên từ chối offer..."
            />
          </label>
        )}
      </div>
    </Modal>
  );
}
