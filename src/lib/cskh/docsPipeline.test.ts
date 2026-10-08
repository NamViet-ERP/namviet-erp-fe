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
  applyDynamicSla,
  getDocTypeTagClass,
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

  it('calculates dynamic SLA overdue days accurately based on target date', () => {
    const fixedNow = Date.parse('2026-10-05T12:00:00');

    // 1. Hồ sơ quá hạn: Hạn 2026-09-10 vs Hôm nay 2026-10-05 => 25 ngày
    const docOverdue = {
      id: 'doc-1',
      code: 'HS-301',
      name: 'Phương án Thử áp lực',
      docType: 'Đệ trình thi công',
      stage: 'feedback_pending' as const,
      internalApproved: true,
      handoverSigned: true,
      slaDueDate: '2026-09-10',
      overdueDays: 0,
      status: 'pending_handover' as const,
      statusLabel: 'Chờ phản hồi',
    };
    const resOverdue = applyDynamicSla(docOverdue, fixedNow);
    expect(resOverdue.overdueDays).toBe(25);
    expect(resOverdue.status).toBe('overdue');
    expect(resOverdue.statusLabel).toBe('Quá hạn SLA 25 ngày');

    // 2. Hồ sơ đã chấp thuận: Không bao giờ trễ
    const docApproved = {
      ...docOverdue,
      stage: 'approved' as const,
      status: 'approved' as const,
    };
    const resApproved = applyDynamicSla(docApproved, fixedNow);
    expect(resApproved.overdueDays).toBe(0);
    expect(resApproved.status).toBe('approved');

    // 3. Hồ sơ còn hạn trong tương lai
    const docFuture = {
      ...docOverdue,
      slaDueDate: '2026-10-15',
    };
    const resFuture = applyDynamicSla(docFuture, fixedNow);
    expect(resFuture.overdueDays).toBe(0);
    expect(resFuture.status).toBe('pending_handover');
  });

  it('returns semantic color tag classes for document types', () => {
    expect(getDocTypeTagClass('Nghiệm thu giai đoạn')).toBe('cskh-tag--inspection');
    expect(getDocTypeTagClass('Hồ sơ vật tư')).toBe('cskh-tag--material');
    expect(getDocTypeTagClass('Đệ trình thiết bị quạt')).toBe('cskh-tag--equipment');
    expect(getDocTypeTagClass('Đệ trình thi công')).toBe('cskh-tag--submission');
    expect(getDocTypeTagClass('CO/CQ xuất xưởng')).toBe('cskh-tag--cocq');
    expect(getDocTypeTagClass('Bản vẽ As-built')).toBe('cskh-tag--asbuilt');
    expect(getDocTypeTagClass('Vận hành & Bảo dưỡng 48T')).toBe('cskh-tag--operation');
    expect(getDocTypeTagClass('Khác')).toBe('cskh-tag--default');
  });
});
