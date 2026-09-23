import { describe, it, expect } from 'vitest';
import type { Transfer } from '../../../types';
import { isCrossProjectTransfer, destinationLabel } from './transferUtils';

function createMockTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: 'tf-1',
    voucherCode: 'KC-0001',
    date: '2026-09-23',
    fromWarehouseId: 'w-1',
    fromWarehouseName: 'Kho Liên Hạnh',
    toWarehouseId: 'w-2',
    toWarehouseName: 'Kho trung tâm',
    items: [],
    status: 'approved',
    createdBy: 'admin',
    note: '',
    ...overrides,
  };
}

describe('transferUtils', () => {
  describe('isCrossProjectTransfer', () => {
    it('returns false for returns to general warehouse', () => {
      const tf = createMockTransfer({
        toProject: undefined,
        toProjectName: undefined,
        toWarehouseName: 'Kho trung tâm',
      });
      expect(isCrossProjectTransfer(tf)).toBe(false);
    });

    it('returns true when toProject is set', () => {
      const tf = createMockTransfer({
        toProject: 'DA-INTERFRESH',
        toProjectName: 'INTERFRESH',
      });
      expect(isCrossProjectTransfer(tf)).toBe(true);
    });

    it('returns true when only toProjectName is set', () => {
      const tf = createMockTransfer({
        toProject: undefined,
        toProjectName: 'INTERFRESH',
      });
      expect(isCrossProjectTransfer(tf)).toBe(true);
    });
  });

  describe('destinationLabel', () => {
    it('prioritizes toProjectName', () => {
      const tf = createMockTransfer({
        toProject: 'DA-01',
        toProjectName: 'Dự án Alpha',
      });
      expect(destinationLabel(tf)).toBe('Dự án Alpha');
    });

    it('falls back to toProject if toProjectName missing', () => {
      const tf = createMockTransfer({
        toProject: 'DA-01',
        toProjectName: undefined,
      });
      expect(destinationLabel(tf)).toBe('DA-01');
    });

    it('falls back to toWarehouseName for general return', () => {
      const tf = createMockTransfer({
        toWarehouseName: 'Kho trung tâm',
      });
      expect(destinationLabel(tf)).toBe('Kho trung tâm');
    });
  });
});
