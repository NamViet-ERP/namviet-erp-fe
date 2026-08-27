import type { CSSProperties } from 'react';
import { AlertTriangle, Check, Clock, FolderKanban, User } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import {
  CSKH_PHASES,
  formatSignedPct,
  progressDelta,
  progressGridCopy,
  progressStatus,
  progressTone,
  type CskhCommandProject,
} from '../../lib/cskh/commandCenter';

interface CskhProjectGridProps {
  projects: CskhCommandProject[];
  loading?: boolean;
  onOpen: (code: string) => void;
}

function displayText(value?: string | null): string {
  const text = value?.trim() ?? '';
  if (!text || text === '-' || text === '\u2014') return '';
  return text;
}

export default function CskhProjectGrid({ projects, loading, onOpen }: CskhProjectGridProps) {
  if (loading) {
    return (
      <div className="cskh-grid" aria-busy="true" aria-label="Đang tải danh sách dự án">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="cskh-grid-card cskh-grid-card--skeleton" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyState icon={FolderKanban} message="Chưa có dự án trên lưới. Bấm Thêm dự án để tạo thẻ." />;
  }

  return (
    <ul className="cskh-grid" aria-label="Danh sách dự án">
      {projects.map(project => {
        const status = progressStatus(project);
        const tone = progressTone(status);
        const copy = progressGridCopy(status);
        const delta = progressDelta(project.planPct, project.actualPct);
        const phase = CSKH_PHASES.find(item => item.id === project.phaseId)?.label ?? project.phaseId;
        const hasBottleneck = project.bottleneckCount > 0;
        const clientName = displayText(project.clientName);
        const pmName = displayText(project.pmName);
        return (
          <li key={project.code} className="cskh-grid__item">
            <button
              type="button"
              className={`cskh-grid-card cskh-grid-card--${tone}`}
              onClick={() => onOpen(project.code)}
            >
              <div className="cskh-grid-card__top">
                <span className="cskh-grid-card__code">{project.code}</span>
                <span className={`cskh-status cskh-status--${tone}`}>
                  <span className="cskh-status__dot" aria-hidden />
                  {copy.badge}
                </span>
              </div>
              <p className="cskh-grid-card__name">{project.name}</p>
              {clientName ? <p className="cskh-grid-card__client">CĐT: {clientName}</p> : null}
              <p className="cskh-grid-card__phase">
                <span className={`cskh-status__dot cskh-tone-${tone}`} aria-hidden />
                {phase}
              </p>
              <div className="cskh-grid-card__progress">
                <div className="cskh-grid-card__progress-head">
                  <span>KH {project.planPct}% - TT</span>
                  <span className={`cskh-tone-${tone}`}>{project.actualPct}%</span>
                </div>
                <div
                  className="cskh-grid-card__bar"
                  style={{ '--cskh-tt': `${project.actualPct}%`, '--cskh-kh': `${project.planPct}%` } as CSSProperties}
                >
                  <span className="cskh-grid-card__bar-fill" />
                  <span className="cskh-grid-card__bar-mark" aria-hidden />
                </div>
                <p className={`cskh-grid-card__summary cskh-tone-${tone}`}>
                  {copy.summary} ({formatSignedPct(delta)})
                </p>
              </div>
              <div className="cskh-grid-card__foot">
                {pmName ? (
                  <span className="cskh-grid-card__pm">
                    <User size={14} aria-hidden />
                    {pmName}
                  </span>
                ) : (
                  <span />
                )}
                <span className={`cskh-grid-card__issue cskh-grid-card__issue--${hasBottleneck ? 'danger' : 'ok'}`}>
                  {hasBottleneck
                    ? <AlertTriangle size={14} aria-hidden />
                    : <Check size={14} aria-hidden />}
                  {hasBottleneck ? `${project.bottleneckCount} điểm nghẽn` : 'Không có điểm nghẽn'}
                </span>
              </div>
              {project.warrantyWatch ? (
                <p className="cskh-grid-card__warranty">
                  <Clock size={14} aria-hidden />
                  Cần chú ý bảo hành
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
