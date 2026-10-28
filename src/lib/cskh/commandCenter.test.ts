import { describe, expect, it } from 'vitest';
import {
  actualPctFromStock,
  clampPct,
  formatSignedPct,
  getProjectRecord,
  mergeCommandProjects,
  nextProjectCode,
  patchProjectRecord,
  deleteProjectRecord,
  phaseLabel,
  planPctFromDates,
  listFilterYears,
  progressGridCopy,
  progressStatus,
  progressTone,
} from './commandCenter';
import type { WarehouseProjectApiDto } from '../../types/wms';

function sampleWms(over: Partial<WarehouseProjectApiDto> = {}): WarehouseProjectApiDto {
  return {
    projectCode: 'DA-01',
    projectName: 'Nha may thu',
    projectType: 'EPC',
    pmId: '00000000-0000-0000-0000-000000000000',
    pmName: 'PM',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    materialBudget: 0,
    status: 'Active',
    stockActualQty: 40,
    stockPlannedQty: 100,
    stockReservedQty: 0,
    stockMaterialCount: 1,
    approvedImportValue: 0,
    materialBudgetRemaining: 0,
    ...over,
  };
}

describe('cskh command center', () => {
  it('clamps percent and derives stock actual', () => {
    expect(clampPct(140)).toBe(100);
    expect(clampPct(-8)).toBe(0);
    expect(actualPctFromStock(40, 100)).toBe(40);
    expect(actualPctFromStock(10, 0)).toBe(0);
  });

  it('marks blocked when actual lags plan heavily', () => {
    expect(progressStatus({ planPct: 90, actualPct: 40, bottleneckCount: 0 })).toBe('blocked');
    expect(progressStatus({ planPct: 90, actualPct: 88, bottleneckCount: 0 })).toBe('slight_delay');
    expect(progressStatus({ planPct: 80, actualPct: 80, bottleneckCount: 0 })).toBe('on_track');
  });

  it('maps progress to ok / warn / danger tones', () => {
    expect(progressTone('on_track')).toBe('ok');
    expect(progressTone('slight_delay')).toBe('warn');
    expect(progressTone('blocked')).toBe('danger');
  });

  it('labels grid cards like the command-center status chips', () => {
    expect(progressGridCopy('blocked')).toEqual({ badge: 'Nghẽn nặng', summary: 'Đang nghẽn' });
    expect(progressGridCopy('slight_delay')).toEqual({ badge: 'Chậm nhẹ', summary: 'Chậm nhẹ' });
    expect(progressGridCopy('on_track')).toEqual({ badge: 'Đúng tiến độ', summary: 'Đúng / vượt tiến độ' });
    expect(formatSignedPct(-53)).toBe('-53%');
    expect(formatSignedPct(0)).toBe('+0%');
  });

  it('uses canonical stage while merging CSKH metrics', () => {
    const rows = mergeCommandProjects([sampleWms({ stage: 'mech' })], {
      overlays: { 'DA-01': { phaseId: 'survey', bottleneckCount: 2 } },
      localProjects: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.phaseId).toBe('mech');
    expect(rows[0]?.bottleneckCount).toBe(2);
    expect(rows[0]?.actualPct).toBe(40);
    expect(rows[0]?.pmName).toBe('PM');
  });

  it('computes plan percent from dates', () => {
    const start = new Date('2026-01-01T00:00:00Z').toISOString();
    const end = new Date('2026-12-31T00:00:00Z').toISOString();
    const mid = Date.parse('2026-07-02T00:00:00Z');
    expect(planPctFromDates(start, end, mid)).toBeGreaterThan(40);
    expect(planPctFromDates(start, end, mid)).toBeLessThan(70);
  });

  it('allocates the next empty project code', () => {
    expect(nextProjectCode(['DA-2026-001', 'DA-2026-002'], new Date('2026-08-27'))).toBe('DA-2026-003');
    expect(nextProjectCode(['DA-2026-001', 'DA-2026-002'], 2026)).toBe('DA-2026-003');
  });

  it('allocates the lowest unused sequence, ignoring random large numbers', () => {
    // Có mã DA-2026-230 do random trước đây, vẫn phải sinh DA-2026-002
    expect(nextProjectCode(['DA-2026-001', 'DA-2026-230'], 2026)).toBe('DA-2026-002');
  });

  it('resets project code to 001 for the next year', () => {
    expect(nextProjectCode(['DA-2026-001', 'DA-2026-002'], 2027)).toBe('DA-2027-001');
    expect(nextProjectCode(['DA-2026-001'], new Date('2027-01-01'))).toBe('DA-2027-001');
  });

  it('lists project years plus the current calendar year', () => {
    expect(listFilterYears([2026], new Date('2026-08-27'))).toEqual([2026]);
    expect(listFilterYears([2024], new Date('2026-08-27'))).toEqual([2026, 2024]);
    expect(listFilterYears([2026, 2027], new Date('2026-08-27'))).toEqual([2027, 2026]);
    expect(listFilterYears([2026], new Date('2027-01-02'))).toEqual([2027, 2026]);
  });

  it('keeps local CĐT and PA on merged cards', () => {
    const rows = mergeCommandProjects([], {
      overlays: {},
      localProjects: [{
        code: 'LH-11',
        name: 'Nha may giay',
        year: 2026,
        phaseId: 'survey',
        planPct: 0,
        actualPct: 0,
        bottleneckCount: 0,
        pendingDocs: 0,
        warrantyWatch: false,
        clientName: 'Tap doan An Phat',
        pmName: 'PA Van',
      }],
    });
    expect(rows[0]?.clientName).toBe('Tap doan An Phat');
    expect(rows[0]?.pmName).toBe('PA Van');
  });

  it('reads and patches CSKH overlay without a warehouse row', () => {
    const store = patchProjectRecord({
      overlays: {},
      localProjects: [{
        code: 'LH-11',
        name: 'Nha may giay',
        year: 2026,
        phaseId: 'survey',
        planPct: 10,
        actualPct: 8,
        bottleneckCount: 0,
        pendingDocs: 0,
        warrantyWatch: false,
      }],
    }, 'LH-11', {
      phaseId: 'fabricate',
      phaseMode: 'manual',
      acceptanceDate: '2026-08-01',
      warrantyMonths: 12,
    });
    const row = getProjectRecord([], store, 'LH-11');
    expect(row?.phaseId).toBe('fabricate');
    expect(row?.phaseMode).toBe('manual');
    expect(row?.acceptanceDate).toBe('2026-08-01');
    expect(row?.warrantyMonths).toBe(12);
    expect(getProjectRecord([], store, 'NOPE')).toBeNull();
  });

  it('keeps advance date and bottleneck overlay on a local project', () => {
    const base = {
      overlays: {},
      localProjects: [{
        code: 'LH-11',
        name: 'Nha may giay',
        year: 2026,
        phaseId: 'survey',
        planPct: 10,
        actualPct: 8,
        bottleneckCount: 0,
        pendingDocs: 0,
        warrantyWatch: false,
        advanceDate: '2026-07-20',
      }],
    };
    const store = patchProjectRecord(base, 'LH-11', { bottleneckCount: 2, planPct: 24, actualPct: 10 });
    const row = getProjectRecord([], store, 'LH-11');
    expect(row?.advanceDate).toBe('2026-07-20');
    expect(row?.bottleneckCount).toBe(2);
    expect(row?.planPct).toBe(24);
    expect(row?.actualPct).toBe(10);
  });

  it('stores CSKH fields on a warehouse project overlay', () => {
    const store = patchProjectRecord({ overlays: {}, localProjects: [] }, 'DA-01', {
      acceptanceDate: '2026-09-15',
      warrantyMonths: 18,
      phaseMode: 'auto',
    });
    const row = getProjectRecord([sampleWms()], store, 'DA-01');
    expect(row?.source).toBe('wms');
    expect(row?.acceptanceDate).toBe('2026-09-15');
    expect(row?.warrantyMonths).toBe(18);
    expect(row?.phaseMode).toBe('auto');
  });

  it('resolves phase labels from catalog then fallback list', () => {
    expect(phaseLabel('fabricate')).toBe('Chế tạo thiết bị tại xưởng');
    expect(phaseLabel('gd-1', [{ id: 'gd-1', name: 'Khảo sát hiện trường' }])).toBe('Khảo sát hiện trường');
  });

  it('patches all banner fields including targetCodDate, boilerType, pmName, clientName', () => {
    const base = {
      overlays: {},
      localProjects: [{
        code: 'LH-01',
        name: 'Lò Hơi 30T',
        year: 2026,
        phaseId: 'survey',
        planPct: 10,
        actualPct: 0,
        bottleneckCount: 0,
        pendingDocs: 0,
        warrantyWatch: false,
      }],
    };
    const store = patchProjectRecord(base, 'LH-01', {
      name: 'Lò Hơi Cải Tiến 35T',
      clientName: 'Tập đoàn An Phát',
      pmName: 'Chỉ huy trưởng Nguyễn Văn A',
      boilerType: 'Lò Hơi CFB Tuần Hoàn',
      capacity: '35 T/h',
      targetCodDate: '2026-12-15',
      notes: 'Đang đẩy nhanh tiến độ COD',
    });
    const record = getProjectRecord([], store, 'LH-01');
    expect(record?.name).toBe('Lò Hơi Cải Tiến 35T');
    expect(record?.clientName).toBe('Tập đoàn An Phát');
    expect(record?.pmName).toBe('Chỉ huy trưởng Nguyễn Văn A');
    expect(record?.boilerType).toBe('Lò Hơi CFB Tuần Hoàn');
    expect(record?.capacity).toBe('35 T/h');
    expect(record?.targetCodDate).toBe('2026-12-15');
    expect(record?.notes).toBe('Đang đẩy nhanh tiến độ COD');
  });

  it('deletes a project record and excludes it from mergeCommandProjects', () => {
    const base = {
      overlays: {},
      localProjects: [{
        code: 'LH-DEL',
        name: 'Dự án tạm',
        year: 2026,
        phaseId: 'survey',
        planPct: 0,
        actualPct: 0,
        bottleneckCount: 0,
        pendingDocs: 0,
        warrantyWatch: false,
      }],
    };
    const deletedStore = deleteProjectRecord(base, 'LH-DEL');
    expect(deletedStore.localProjects.find(p => p.code === 'LH-DEL')).toBeUndefined();
    const rows = mergeCommandProjects([], deletedStore);
    expect(rows.find(p => p.code === 'LH-DEL')).toBeUndefined();
  });
});
