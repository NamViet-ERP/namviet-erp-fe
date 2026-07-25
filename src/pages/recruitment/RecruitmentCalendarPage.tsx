import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import InterviewCalendarEventModal from '../../components/recruitment/InterviewCalendarEventModal';
import InterviewCalendarDayModal from '../../components/recruitment/InterviewCalendarDayModal';
import InterviewSchedulePickerModal from '../../components/recruitment/InterviewSchedulePickerModal';
import RecruitmentCalMonthYearPicker from '../../components/recruitment/RecruitmentCalMonthYearPicker';
import CandidateStatusModal, { type CandidateStatusFormValues } from '../../components/recruitment/CandidateStatusModal';
import { showToast } from '../../components/ui/Toast';
import { MONTH_NAMES_TITLE } from '../../hooks/dashboard/calendarConstants';
import { useRecruitmentInterviewCalendar } from '../../hooks/useRecruitmentInterviewCalendar';
import { useCandidate, useUpdateCandidateStatus } from '../../hooks/useCandidates';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { ParsedInterviewEvent } from '../../lib/hrm/interviewCalendarUtils';
import { resolveEventTimeLabel } from '../../lib/hrm/interviewCalendarUtils';
import type { Candidate } from '../../types/hr';

const MAX_CHIPS_PER_CELL = 3;

export default function RecruitmentCalendarPage() {
  const navigate = useNavigate();
  const statusMutation = useUpdateCandidateStatus();
  const {
    viewYear,
    viewMonth,
    today,
    isViewingCurrentMonth,
    shiftMonth,
    goToday,
    setViewMonthYear,
    yearOptions,
    interviewsByDay,
    calendarCells,
    weekdayLabels,
    isLoading,
    isError,
    error,
  } = useRecruitmentInterviewCalendar();

  const [selectedEvent, setSelectedEvent] = useState<ParsedInterviewEvent | null>(null);
  const [dayModal, setDayModal] = useState<{ label: string; events: ParsedInterviewEvent[] } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [pickedCandidate, setPickedCandidate] = useState<Candidate | null>(null);

  const { data: editingCandidate } = useCandidate(editingCandidateId ?? undefined);
  const statusModalCandidate = pickedCandidate ?? editingCandidate ?? null;

  const openEvent = (ev: ParsedInterviewEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(ev);
  };

  const openEditFromEvent = () => {
    if (!selectedEvent) return;
    setEditingCandidateId(selectedEvent.candidateId);
    setPickedCandidate(null);
    setSelectedEvent(null);
  };

  const handleScheduleSelect = (candidate: Candidate) => {
    setPickerOpen(false);
    setPickedCandidate(candidate);
    setEditingCandidateId(null);
  };

  const closeStatusModal = () => {
    setEditingCandidateId(null);
    setPickedCandidate(null);
  };

  const handleStatusSubmit = async (values: CandidateStatusFormValues) => {
    const id = statusModalCandidate?.id;
    if (!id) return;
    try {
      await statusMutation.mutateAsync({ id, payload: values });
      showToast('success', 'Đã cập nhật lịch phỏng vấn');
      closeStatusModal();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật lịch'));
    }
  };

  return (
    <div className="hrm-page space-y-4">
      <PageHeader
        title="Lịch phỏng vấn"
        subtitle="Xem và quản lý lịch PV theo tháng — bấm vào buổi PV để xem chi tiết."
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => setPickerOpen(true)}>
            <Plus size={16} aria-hidden />
            Đặt lịch mới
          </button>
        )}
      />

      <HrmPanel className="surface-panel surface-panel--table flex flex-col !p-0 overflow-hidden">
        <div className="recruitment-cal-nav">
          <div className="recruitment-cal-nav__left">
            <button type="button" className="recruitment-cal-nav__today" onClick={goToday}>
              Hôm nay
            </button>
            <RecruitmentCalMonthYearPicker
              month={viewMonth}
              year={viewYear}
              yearOptions={yearOptions}
              onChange={setViewMonthYear}
            />
          </div>

          <div className="recruitment-cal-nav__actions">
            <button type="button" onClick={() => shiftMonth(-1)} className="portal-calendar-nav__btn" aria-label="Tháng trước">
              <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
            </button>
            <button type="button" onClick={() => shiftMonth(1)} className="portal-calendar-nav__btn" aria-label="Tháng sau">
              <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="p-4 text-sm text-[var(--md-on-surface-variant)]">Đang tải lịch…</p>
        ) : isError ? (
          <div className="p-4">
            <EmptyState message={getApiErrorMessage(error, 'Không tải được lịch PV')} icon={CalendarDays} />
          </div>
        ) : (
          <div className="recruitment-cal-body">
            <div className="recruitment-cal-weekdays">
              {weekdayLabels.map(label => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="recruitment-cal-grid">
              {calendarCells.map((cell, idx) => {
                const isToday = cell.isCurrentMonth && cell.day === today && isViewingCurrentMonth;
                const dayEvents = cell.isCurrentMonth ? (interviewsByDay[cell.day] ?? []) : [];
                const visibleEvents = dayEvents.slice(0, MAX_CHIPS_PER_CELL);
                const overflow = dayEvents.length - visibleEvents.length;

                return (
                  <div
                    key={`${cell.isCurrentMonth ? 'in' : 'out'}-${cell.day}-${idx}`}
                    className={[
                      'recruitment-cal-cell',
                      !cell.isCurrentMonth && 'recruitment-cal-cell--muted',
                      isToday && 'recruitment-cal-cell--today',
                    ].filter(Boolean).join(' ')}
                  >
                    <span
                      className={[
                        'recruitment-cal-cell__day',
                        isToday && 'recruitment-cal-cell__day--today',
                      ].filter(Boolean).join(' ')}
                    >
                      {cell.day}
                    </span>

                    {cell.isCurrentMonth && (
                      <div className="recruitment-cal-cell__events">
                        {visibleEvents.map(ev => {
                          const timeLabel = resolveEventTimeLabel(ev);
                          return (
                          <button
                            key={`${ev.candidateId}-${ev.sortAt}`}
                            type="button"
                            className="recruitment-cal-chip"
                            onClick={e => openEvent(ev, e)}
                            title={`${timeLabel ? `${timeLabel} · ` : ''}${ev.fullName} — ${ev.position}`}
                          >
                            {timeLabel && (
                              <span className="recruitment-cal-chip__time">{timeLabel}</span>
                            )}
                            <span className="recruitment-cal-chip__name">{ev.fullName}</span>
                          </button>
                          );
                        })}
                        {overflow > 0 && (
                          <button
                            type="button"
                            className="recruitment-cal-chip recruitment-cal-chip--more"
                            onClick={e => {
                              e.stopPropagation();
                              setDayModal({
                                label: `${cell.day} ${MONTH_NAMES_TITLE[viewMonth - 1]} ${viewYear}`,
                                events: dayEvents,
                              });
                            }}
                          >
                            +{overflow} buổi
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </HrmPanel>

      <InterviewCalendarDayModal
        open={Boolean(dayModal)}
        dayLabel={dayModal?.label ?? ''}
        events={dayModal?.events ?? []}
        onClose={() => setDayModal(null)}
        onSelectEvent={ev => {
          setDayModal(null);
          setSelectedEvent(ev);
        }}
      />

      <InterviewCalendarEventModal
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEditSchedule={openEditFromEvent}
        onViewProfile={() => {
          if (selectedEvent) navigate(`/recruitment/candidates/${selectedEvent.candidateId}`);
        }}
      />

      <InterviewSchedulePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleScheduleSelect}
      />

      <CandidateStatusModal
        open={Boolean(statusModalCandidate)}
        candidate={statusModalCandidate}
        action="interview"
        onClose={closeStatusModal}
        onSubmit={handleStatusSubmit}
        isSubmitting={statusMutation.isPending}
      />
    </div>
  );
}
