import { describe, expect, it } from 'vitest';
import {
  dueAwareStatus,
  receiptGanttSpan,
  receiptProgressStatus,
  showGanttActualMark,
} from './purchasingProgressStatus';

describe('dueAwareStatus', () => {
  it('keeps completed even after the due date', () => {
    expect(dueAwareStatus('completed', '2026-08-01', '2026-08-18')).toBe('completed');
  });

  it('switches in-progress to late the day after planned end', () => {
    expect(dueAwareStatus('in_progress', '2026-08-10', '2026-08-11')).toBe('late');
  });

  it('stays in-progress on the due date', () => {
    expect(dueAwareStatus('in_progress', '2026-08-10', '2026-08-10')).toBe('in_progress');
  });
});

describe('receiptProgressStatus', () => {
  it('maps approved NK to actual receipt and never late', () => {
    expect(receiptProgressStatus('approved', '2026-08-01', '2026-08-18')).toBe('actual_receipt');
  });

  it('maps pending NK to planned receipt before due', () => {
    expect(receiptProgressStatus('pending', '2026-08-20', '2026-08-18')).toBe('planned_receipt');
  });

  it('maps pending NK to late after PO due', () => {
    expect(receiptProgressStatus('pending', '2026-08-10', '2026-08-18')).toBe('late');
  });

  it('maps draft NK to late after PO due', () => {
    expect(receiptProgressStatus('draft', '2026-08-10', '2026-08-18')).toBe('late');
  });
});

describe('receiptGanttSpan', () => {
  it('pins approved NK to the receipt date', () => {
    expect(receiptGanttSpan('approved', '2026-08-07', '2026-08-10')).toEqual({
      plannedStart: '2026-08-07',
      plannedEnd: '2026-08-07',
      actualEnd: '2026-08-07',
    });
  });

  it('spans pending NK from created date to PO due', () => {
    expect(receiptGanttSpan('pending', '2026-08-02', '2026-08-10')).toEqual({
      plannedStart: '2026-08-02',
      plannedEnd: '2026-08-10',
      actualEnd: null,
    });
  });

  it('still shows a bar when pending NK is created after PO due', () => {
    expect(receiptGanttSpan('pending', '2026-08-18', '2026-08-10')).toEqual({
      plannedStart: '2026-08-10',
      plannedEnd: '2026-08-18',
      actualEnd: null,
    });
  });
});

describe('showGanttActualMark', () => {
  it('hides the mark on an incomplete late plan', () => {
    expect(showGanttActualMark('plan', 'late', '2026-08-08', 40)).toBe(false);
  });

  it('shows the mark on a completed project', () => {
    expect(showGanttActualMark('project', 'completed', '2026-08-08', 100)).toBe(true);
  });

  it('shows the mark only on approved NK', () => {
    expect(showGanttActualMark('nk', 'late', null, 0)).toBe(false);
    expect(showGanttActualMark('nk', 'actual_receipt', '2026-08-08', 100)).toBe(true);
  });
});
