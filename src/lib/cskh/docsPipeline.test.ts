import { describe, expect, it } from 'vitest';
import {
  archiveKpis,
  draftKpis,
  feedbackKpis,
  filterArchive,
  filterFeedback,
  filterHandovers,
  handoverKpis,
  nextProcessOrder,
} from './docsPipeline';

describe('cskh docs pipeline', () => {
  it('counts draft stages and overdue confirmations', () => {
    const now = Date.parse('2026-08-27');
    const kpis = draftKpis([
      { id: '1', name: 'A', processId: 'p', author: 'A', channel: 'email', stage: 'draft' },
      { id: '2', name: 'B', processId: 'p', author: 'A', channel: 'email', stage: 'confirm', confirmDeadline: '2026-08-01' },
      { id: '3', name: 'C', processId: 'p', author: 'A', channel: 'email', stage: 'signed' },
    ], now);
    expect(kpis.processing).toBe(2);
    expect(kpis.waiting).toBe(1);
    expect(kpis.overdue).toBe(1);
    expect(kpis.ready).toBe(1);
  });

  it('filters handover direction and signed state', () => {
    const rows = [
      { id: '1', name: 'Out', direction: 'out' as const, from: 'A', to: 'B', channel: 'email', at: '2026-08-01', signed: false, confirmed: false, fileUploaded: true },
      { id: '2', name: 'In', direction: 'in' as const, from: 'C', to: 'D', channel: 'email', at: '2026-08-01', signed: true, confirmed: false, fileUploaded: true },
    ];
    expect(handoverKpis(rows).outgoing).toBe(1);
    expect(handoverKpis(rows).unsigned).toBe(1);
    expect(filterHandovers(rows, 'out', 'unsigned')).toHaveLength(1);
    expect(filterHandovers(rows, 'in', 'signed')).toHaveLength(1);
  });

  it('classifies feedback due soon and overdue', () => {
    const now = Date.parse('2026-08-27T00:00:00');
    const rows = [
      { id: '1', name: 'Soon', departmentId: 'tech', sentDate: '2026-08-20', dueDate: '2026-08-30', submitCount: 1, done: false },
      { id: '2', name: 'Late', departmentId: 'tech', sentDate: '2026-08-01', dueDate: '2026-08-10', submitCount: 3, done: false },
      { id: '3', name: 'Done', departmentId: 'tech', sentDate: '2026-08-01', dueDate: '2026-08-10', submitCount: 1, done: true },
    ];
    const kpis = feedbackKpis(rows, now);
    expect(kpis.waiting).toBe(2);
    expect(kpis.dueSoon).toBe(1);
    expect(kpis.overdue).toBe(1);
    expect(kpis.resubmit).toBe(1);
    expect(filterFeedback(rows, 'overdue', now)).toHaveLength(1);
  });

  it('lists archive rows and next process order', () => {
    const drafts = [
      { id: '1', name: 'A', processId: 'p', author: 'A', channel: 'email', stage: 'archive' as const },
      { id: '2', name: 'B', processId: 'p', author: 'A', channel: 'email', stage: 'sign' as const },
    ];
    expect(archiveKpis(drafts).valid).toBe(1);
    expect(filterArchive(drafts, 'pending')).toHaveLength(1);
    expect(nextProcessOrder([{ id: '1', name: 'X', departmentId: 'tech', active: true, order: 5 }])).toBe(6);
  });
});
