import { describe, expect, it } from 'vitest';
import {
  bottleneckKpis,
  captureSnapshot,
  filterBottlenecks,
  filterRequests,
  ganttItemPlanPct,
  ganttKpis,
  isoWeekNumber,
  meetingKpis,
  nextOpsCode,
  requestRuntimeStatus,
  snapshotCompare,
} from './opsWorkspace';

describe('cskh ops workspace', () => {
  it('counts open urgent overdue and closed bottlenecks', () => {
    const now = Date.parse('2026-08-27');
    const rows = [
      { id: '1', code: 'NG-001', name: 'A', severity: 'urgent' as const, status: 'open' as const, startedAt: '2026-08-01', expectedAt: '2026-08-20', reason: '', history: [] },
      { id: '2', code: 'NG-002', name: 'B', severity: 'medium' as const, status: 'open' as const, startedAt: '2026-08-18', expectedAt: '2026-11-13', reason: '', history: [] },
      { id: '3', code: 'NG-003', name: 'C', severity: 'low' as const, status: 'closed' as const, startedAt: '2026-07-01', expectedAt: '2026-07-10', reason: '', history: [] },
    ];
    const kpis = bottleneckKpis(rows, now);
    expect(kpis.open).toBe(2);
    expect(kpis.urgent).toBe(1);
    expect(kpis.overdue).toBe(1);
    expect(kpis.closed).toBe(1);
    expect(filterBottlenecks(rows, 'medium')).toHaveLength(1);
    expect(filterBottlenecks(rows, 'closed')).toHaveLength(1);
  });

  it('marks a request overdue when due date passed', () => {
    const now = Date.parse('2026-08-27');
    const row = { id: '1', name: 'Xin so lieu', fromDept: 'tech', toDept: 'acc', dueDate: '2026-08-01', status: 'open' as const, createdAt: '2026-07-20' };
    expect(requestRuntimeStatus(row, now)).toBe('overdue');
    expect(filterRequests([row], 'overdue', now)).toHaveLength(1);
  });

  it('rolls gantt percents and snapshot delta', () => {
    const now = Date.parse('2026-08-27');
    const items = [
      { id: '1', name: 'A', days: 10, startDate: '2026-07-01', endDate: '2026-07-20', actualPct: 100 },
      { id: '2', name: 'B', days: 10, startDate: '2026-08-01', endDate: '2026-11-13', actualPct: 10 },
    ];
    expect(ganttItemPlanPct(items[0]!, now)).toBe(100);
    const kpis = ganttKpis(items, now);
    expect(kpis.total).toBe(2);
    expect(kpis.completed).toBe(1);
    expect(kpis.actualPct).toBe(55);
    const first = captureSnapshot({ bottlenecks: [], requests: [], ganttItems: items, snapshots: [], meetings: [] }, '2026-08-24T15:00:00.000Z', now);
    const second = captureSnapshot(first, '2026-08-27T10:00:00.000Z', now);
    expect(snapshotCompare(second.snapshots).count).toBe(2);
    expect(snapshotCompare(second.snapshots).delta).toBe(0);
  });

  it('counts overdue meeting actions and next codes', () => {
    const now = Date.parse('2026-08-27');
    expect(nextOpsCode('NG', ['NG-001', 'NG-004'])).toBe('NG-005');
    expect(isoWeekNumber(new Date(2026, 7, 27))).toBe(35);
    const kpis = meetingKpis([{
      id: '1',
      name: 'Hop tuan',
      date: '2026-08-20',
      actions: [
        { id: 'a', name: 'Gui BB', dueDate: '2026-08-21', done: false },
        { id: 'b', name: 'Done', dueDate: '2026-08-21', done: true },
      ],
    }], now);
    expect(kpis.total).toBe(1);
    expect(kpis.openActions).toBe(1);
    expect(kpis.overdueActions).toBe(1);
  });
});
