export const RECRUITMENT_SOURCES = [
  'Facebook', 'Zalo', '24h - lọc', '24h - ứng tuyển', 'TopCV', 'Glints',
] as const;

export const EDUCATION_LEVELS = [
  'Đại học', 'Cao đẳng', 'THPT', 'Sau đại học', 'Khác',
] as const;

export const EMPLOYEE_STATUSES = ['Đang làm', 'Nghỉ việc', 'Thai sản'] as const;

/** API status values (CandidateStatus enum on BE) — 12 bước pipeline + Cancelled nội bộ */
export type CandidatePipelineStatus =
  | 'New'
  | 'Screening'
  | 'InterviewScheduled'
  | 'Interview1'
  | 'Interview2'
  | 'InterviewPassed'
  | 'Rejected'
  | 'Offered'
  | 'OfferDeclined'
  | 'Accepted'
  | 'Probation'
  | 'Official'
  | 'Cancelled';

/** 12 trạng thái hiển thị trên UI (khớp reference) */
export const CANDIDATE_STATUS_OPTIONS: { value: CandidatePipelineStatus; label: string }[] = [
  { value: 'New', label: 'CV mới' },
  { value: 'Screening', label: 'Đang xem xét' },
  { value: 'InterviewScheduled', label: 'Đã hẹn PV' },
  { value: 'Interview1', label: 'PV Vòng 1' },
  { value: 'Interview2', label: 'PV Vòng 2' },
  { value: 'InterviewPassed', label: 'Đạt PV' },
  { value: 'Rejected', label: 'PV nhưng không đạt' },
  { value: 'Offered', label: 'Gửi Offer' },
  { value: 'OfferDeclined', label: 'Từ chối nhận việc' },
  { value: 'Accepted', label: 'Đã tuyển' },
  { value: 'Probation', label: 'Thử việc' },
  { value: 'Official', label: 'Chính thức' },
];

export const CANDIDATE_STATUS_BADGE: Record<
  CandidatePipelineStatus,
  { label: string; className: string }
> = {
  /* Mỗi trạng thái một class riêng — xem .badge-hrm-* trong components.css */
  New: { label: 'CV mới', className: 'badge-hrm-new' },
  Screening: { label: 'Đang xem xét', className: 'badge-hrm-screening' },
  InterviewScheduled: { label: 'Đã hẹn PV', className: 'badge-hrm-scheduled' },
  Interview1: { label: 'PV Vòng 1', className: 'badge-hrm-interview-1' },
  Interview2: { label: 'PV Vòng 2', className: 'badge-hrm-interview-2' },
  InterviewPassed: { label: 'Đạt PV', className: 'badge-hrm-pv-passed' },
  Rejected: { label: 'PV không đạt', className: 'badge-error' },
  Offered: { label: 'Gửi Offer', className: 'badge-hrm-offered' },
  OfferDeclined: { label: 'Từ chối NV', className: 'badge-hrm-offer-declined' },
  Accepted: { label: 'Đã tuyển', className: 'badge-hrm-hired' },
  Probation: { label: 'Thử việc', className: 'badge-hrm-probation' },
  Official: { label: 'Chính thức', className: 'badge-hrm-official' },
  Cancelled: { label: 'Đã hủy', className: 'badge-neutral' },
};

export const INTERVIEW_PIPELINE_STATUSES: CandidatePipelineStatus[] = [
  'InterviewScheduled', 'Interview1', 'Interview2', 'InterviewPassed',
];

export const OFFER_PIPELINE_STATUSES: CandidatePipelineStatus[] = [
  'Offered', 'Accepted', 'Probation', 'Official',
];

export const RECRUITMENT_PLAN_STATUSES = ['Active', 'Draft', 'Closed'] as const;

export type CandidateQuickAction = 'interview' | 'offer' | 'reject';

export function planDisplayStatus(plan: {
  status: string;
  remainingCount: number;
  headcount: number;
  hiredCount: number;
}): { label: string; className: string } {
  if (plan.remainingCount <= 0 && plan.headcount > 0) {
    return { label: 'Đã đủ số lượng', className: 'badge-error' };
  }
  if (plan.status === 'Closed') {
    return { label: 'Đã ngưng tuyển', className: 'badge-error' };
  }
  if (plan.status === 'Active') {
    return { label: 'Đang tuyển', className: 'badge-success' };
  }
  return { label: 'Nháp', className: 'badge-pending' };
}
