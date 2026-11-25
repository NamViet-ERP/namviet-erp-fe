import { CANDIDATE_STATUS_BADGE, type CandidatePipelineStatus } from '../constants/recruitment';
import type { StatusTone } from '../components/ui/StatusBadge';

export interface RecruitmentStatusBadgeConfig {
  tone: StatusTone;
  label: string;
  className?: string;
}

const PIPELINE_TONE: Record<CandidatePipelineStatus, StatusTone> = {
  New: 'primary',
  Screening: 'warning',
  InterviewScheduled: 'info',
  Interview1: 'info',
  Interview2: 'info',
  InterviewPassed: 'success',
  Rejected: 'error',
  Offered: 'primary',
  OfferDeclined: 'error',
  Accepted: 'success',
  Probation: 'warning',
  Official: 'success',
  Cancelled: 'neutral',
};

/** Maps HR recruitment candidate pipeline status to canonical StatusBadge props. */
export function getCandidateStatusBadge(
  status: CandidatePipelineStatus | string,
): RecruitmentStatusBadgeConfig {
  const key = status as CandidatePipelineStatus;
  const meta = CANDIDATE_STATUS_BADGE[key];
  if (!meta) {
    return { tone: 'neutral', label: status || '—' };
  }
  const tone = PIPELINE_TONE[key];
  const redundantClass = meta.className === 'badge-error' || meta.className === 'badge-neutral';
  return {
    tone,
    label: meta.label,
    ...(redundantClass ? {} : { className: meta.className }),
  };
}
