import { CANDIDATE_STATUS_BADGE, type CandidatePipelineStatus } from '../../constants/recruitment';

interface CandidateStatusBadgeProps {
  status: CandidatePipelineStatus | string;
  className?: string;
}

export default function CandidateStatusBadge({ status, className = '' }: CandidateStatusBadgeProps) {
  const key = status as CandidatePipelineStatus;
  const config = CANDIDATE_STATUS_BADGE[key];
  if (!config) {
    return <span className={`badge badge-md-neutral ${className}`}>{status || '—'}</span>;
  }
  return (
    <span className={`badge ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
