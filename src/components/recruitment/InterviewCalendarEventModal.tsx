import { Calendar, Mail, Phone, User } from 'lucide-react';
import Modal from '../ui/Modal';
import CandidateStatusBadge from './CandidateStatusBadge';
import { formatCandidateAppliedAt } from '../../lib/hrm/candidateApiMapper';
import { formatInterviewDateOnly, resolveEventTimeLabel } from '../../lib/hrm/interviewCalendarUtils';
import type { ParsedInterviewEvent } from '../../lib/hrm/interviewCalendarUtils';
import type { CandidatePipelineStatus } from '../../types/hr';

interface InterviewCalendarEventModalProps {
  open: boolean;
  event: ParsedInterviewEvent | null;
  onClose: () => void;
  onEditSchedule: () => void;
  onViewProfile: () => void;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="recruitment-cal-modal__field">
      <span className="recruitment-cal-modal__label">{label}</span>
      <span className="recruitment-cal-modal__value">{value || '—'}</span>
    </div>
  );
}

export default function InterviewCalendarEventModal({
  open,
  event,
  onClose,
  onEditSchedule,
  onViewProfile,
}: InterviewCalendarEventModalProps) {
  if (!event) return null;

  const appliedLabel = formatCandidateAppliedAt(event.appliedAt);
  const interviewDateLabel = formatInterviewDateOnly(event.interviewDate);
  const interviewTimeLabel = resolveEventTimeLabel(event);
  const evaluator = event.evaluator || event.hrResponsible || '—';

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={event.fullName}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button type="button" className="btn btn-secondary" onClick={onViewProfile}>
            Xem hồ sơ
          </button>
          <button type="button" className="btn btn-primary" onClick={onEditSchedule}>
            Sửa lịch PV
          </button>
        </>
      }
    >
      <div className="recruitment-cal-modal">
        <div className="recruitment-cal-modal__contact">
          <span className="recruitment-cal-modal__contact-item">
            <Mail size={14} aria-hidden />
            {event.email || '—'}
          </span>
          <span className="recruitment-cal-modal__contact-item">
            <Phone size={14} aria-hidden />
            {event.phone || '—'}
          </span>
        </div>

        <div className="recruitment-cal-modal__grid">
          <FieldRow label="Vị trí" value={event.position} />
          <FieldRow label="Nguồn" value={event.source} />
          <FieldRow label="Ngày nộp" value={appliedLabel} />
          <div className="recruitment-cal-modal__field">
            <span className="recruitment-cal-modal__label">Trạng thái</span>
            <CandidateStatusBadge status={event.status as CandidatePipelineStatus} />
          </div>
        </div>

        <div className="recruitment-cal-modal__schedule">
          <h4 className="recruitment-cal-modal__schedule-title">
            <Calendar size={14} aria-hidden />
            Lịch phỏng vấn
          </h4>
          <div className="recruitment-cal-modal__schedule-line">
            <span className="recruitment-cal-modal__schedule-date">{interviewDateLabel}</span>
            {interviewTimeLabel && (
              <span className="recruitment-cal-modal__schedule-time">{interviewTimeLabel}</span>
            )}
          </div>
          <p className="recruitment-cal-modal__schedule-meta">
            <User size={12} aria-hidden />
            Người PV: {evaluator}
          </p>
        </div>
      </div>
    </Modal>
  );
}
