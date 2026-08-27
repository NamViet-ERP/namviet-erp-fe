import { useState } from 'react';
import {
  CSKH_PHASES,
  type CskhCommandProject,
  type CskhPhaseId,
} from '../../lib/cskh/commandCenter';

interface CskhProjectKanbanProps {
  projects: CskhCommandProject[];
  onMove: (code: string, phaseId: CskhPhaseId) => void;
  onOpen: (code: string) => void;
}

export default function CskhProjectKanban({ projects, onMove, onOpen }: CskhProjectKanbanProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overPhase, setOverPhase] = useState<CskhPhaseId | null>(null);

  return (
    <div className="cskh-kanban" role="list" aria-label="Dự án theo giai đoạn">
      {CSKH_PHASES.map(phase => {
        const cards = projects.filter(p => p.phaseId === phase.id);
        const isOver = overPhase === phase.id;
        return (
          <section
            key={phase.id}
            className={`cskh-kanban__col${isOver ? ' is-over' : ''}`}
            onDragOver={e => {
              e.preventDefault();
              setOverPhase(phase.id);
            }}
            onDragLeave={() => {
              if (overPhase === phase.id) setOverPhase(null);
            }}
            onDrop={e => {
              e.preventDefault();
              const code = e.dataTransfer.getData('text/plain');
              setOverPhase(null);
              setDragging(null);
              if (code) onMove(code, phase.id);
            }}
          >
            <header className="cskh-kanban__head">
              <h3 className="cskh-kanban__title">{phase.label}</h3>
              <span className="cskh-kanban__count">{cards.length}</span>
            </header>
            <div className="cskh-kanban__list">
              {cards.length === 0 ? (
                <p className="cskh-kanban__empty">Thả thẻ vào đây</p>
              ) : (
                cards.map(card => (
                  <article
                    key={card.code}
                    className={`cskh-kanban__card${dragging === card.code ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', card.code);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragging(card.code);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverPhase(null);
                    }}
                  >
                    <button
                      type="button"
                      className="cskh-kanban__open"
                      onClick={() => onOpen(card.code)}
                    >
                      <span className="cskh-kanban__code">{card.code}</span>
                      <span className="cskh-kanban__name">{card.name}</span>
                      <span className="cskh-kanban__meta">
                        Kế hoạch {card.planPct}% · Thực tế {card.actualPct}%
                      </span>
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
