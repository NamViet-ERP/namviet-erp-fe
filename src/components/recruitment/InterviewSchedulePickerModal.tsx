import { useState } from 'react';
import Modal from '../ui/Modal';
import SearchBar from '../ui/SearchBar';
import CandidateStatusBadge from './CandidateStatusBadge';
import { useCandidates } from '../../hooks/useCandidates';
import type { Candidate, CandidatePipelineStatus } from '../../types/hr';

interface InterviewSchedulePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (candidate: Candidate) => void;
}

export default function InterviewSchedulePickerModal({
  open,
  onClose,
  onSelect,
}: InterviewSchedulePickerModalProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCandidates({
    page: 1,
    pageSize: 20,
    search: search || undefined,
  });

  const candidates = data?.items ?? [];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Đặt lịch phỏng vấn"
      size="md"
      footer={(
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Hủy
        </button>
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--md-on-surface-variant)]">
          Chọn ứng viên để hẹn lịch phỏng vấn.
        </p>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, SĐT, email…"
        />
        <div className="recruitment-cal-picker-list">
          {isLoading ? (
            <p className="text-sm text-[var(--md-on-surface-variant)] p-2">Đang tải…</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)] p-2">Không tìm thấy ứng viên.</p>
          ) : (
            candidates.map(candidate => (
              <button
                key={candidate.id}
                type="button"
                className="recruitment-cal-picker-item"
                onClick={() => onSelect(candidate)}
              >
                <span className="recruitment-cal-picker-item__main">
                  <strong>{candidate.fullName}</strong>
                  <span className="recruitment-cal-picker-item__meta">
                    {candidate.position || '—'}
                    {candidate.phone ? ` · ${candidate.phone}` : ''}
                  </span>
                </span>
                <CandidateStatusBadge status={candidate.status as CandidatePipelineStatus} />
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
