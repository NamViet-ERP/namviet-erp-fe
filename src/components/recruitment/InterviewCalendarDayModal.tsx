import Modal from '../ui/Modal';
import CandidateStatusBadge from './CandidateStatusBadge';
import type { ParsedInterviewEvent } from '../../lib/hrm/interviewCalendarUtils';
import { resolveEventTimeLabel } from '../../lib/hrm/interviewCalendarUtils';
import type { CandidatePipelineStatus } from '../../types/hr';

interface InterviewCalendarDayModalProps {
  open: boolean;
  dayLabel: string;
  events: ParsedInterviewEvent[];
  onClose: () => void;
  onSelectEvent: (ev: ParsedInterviewEvent) => void;
}

export default function InterviewCalendarDayModal({
  open,
  dayLabel,
  events,
  onClose,
  onSelectEvent,
}: InterviewCalendarDayModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Lịch PV — ${dayLabel}`}
      size="md"
      footer={(
        <button type="button" className="btn btn-secondary" onClick={onClose}>Đóng</button>
      )}
    >
      {events.length === 0 ? (
        <p className="text-sm text-[var(--md-on-surface-variant)]">Không có buổi phỏng vấn.</p>
      ) : (
        <ul className="recruitment-cal-day-list">
          {events.map(ev => {
            const timeLabel = resolveEventTimeLabel(ev);
            return (
            <li key={`${ev.candidateId}-${ev.sortAt}`}>
              <button
                type="button"
                className="recruitment-cal-day-list__item"
                onClick={() => onSelectEvent(ev)}
              >
                {timeLabel && (
                  <span className="recruitment-cal-day-list__time">{timeLabel}</span>
                )}
                <span className="recruitment-cal-day-list__name">{ev.fullName}</span>
                <span className="recruitment-cal-day-list__meta">{ev.position}</span>
                <CandidateStatusBadge status={ev.status as CandidatePipelineStatus} className="shrink-0" />
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
