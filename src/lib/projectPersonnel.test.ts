import { describe, it, expect } from 'vitest';
import {
  isSystemRoleAccount,
  formatPmDisplayName,
  hasValidPm,
  EMPTY_PM_FALLBACK,
} from './projectPersonnel';

describe('projectPersonnel helper', () => {
  describe('isSystemRoleAccount', () => {
    it('returns true for falsy, dash, or empty values', () => {
      expect(isSystemRoleAccount(null)).toBe(true);
      expect(isSystemRoleAccount(undefined)).toBe(true);
      expect(isSystemRoleAccount('')).toBe(true);
      expect(isSystemRoleAccount('   ')).toBe(true);
      expect(isSystemRoleAccount('—')).toBe(true);
      expect(isSystemRoleAccount('-')).toBe(true);
    });

    it('identifies role and system account names', () => {
      expect(isSystemRoleAccount('Kho hàng')).toBe(true);
      expect(isSystemRoleAccount('Kho hang')).toBe(true);
      expect(isSystemRoleAccount('khohang')).toBe(true);
      expect(isSystemRoleAccount('Thủ kho')).toBe(true);
      expect(isSystemRoleAccount('Thu kho')).toBe(true);
      expect(isSystemRoleAccount('Warehouse')).toBe(true);
      expect(isSystemRoleAccount('Warehouse Keeper')).toBe(true);
      expect(isSystemRoleAccount('warehouse_keeper')).toBe(true);
      expect(isSystemRoleAccount('Cung ứng')).toBe(true);
      expect(isSystemRoleAccount('Cung ung')).toBe(true);
      expect(isSystemRoleAccount('Procurement')).toBe(true);
      expect(isSystemRoleAccount('Procurement Lead')).toBe(true);
      expect(isSystemRoleAccount('Procurement Boss')).toBe(true);
      expect(isSystemRoleAccount('Kế toán')).toBe(true);
      expect(isSystemRoleAccount('Admin')).toBe(true);
      expect(isSystemRoleAccount('Administrator')).toBe(true);
      expect(isSystemRoleAccount('Hệ thống')).toBe(true);
      expect(isSystemRoleAccount('System')).toBe(true);
      expect(isSystemRoleAccount('BOD')).toBe(true);
      expect(isSystemRoleAccount('Ban giám đốc')).toBe(true);
      expect(isSystemRoleAccount('khohang@namviet.com')).toBe(true);
      expect(isSystemRoleAccount('admin@namviet.com')).toBe(true);
    });

    it('returns false for actual personal human names', () => {
      expect(isSystemRoleAccount('Nguyễn Văn Khoa')).toBe(false);
      expect(isSystemRoleAccount('Trần Thị Mai An')).toBe(false);
      expect(isSystemRoleAccount('Lê Hoàng Long')).toBe(false);
      expect(isSystemRoleAccount('Phạm Quốc Bảo')).toBe(false);
      expect(isSystemRoleAccount('Bùi Tiến Dũng')).toBe(false);
    });
  });

  describe('formatPmDisplayName', () => {
    it('returns fallback for empty or system role accounts', () => {
      expect(formatPmDisplayName(null)).toBe(EMPTY_PM_FALLBACK);
      expect(formatPmDisplayName('')).toBe(EMPTY_PM_FALLBACK);
      expect(formatPmDisplayName('—')).toBe(EMPTY_PM_FALLBACK);
      expect(formatPmDisplayName('Kho hàng')).toBe(EMPTY_PM_FALLBACK);
      expect(formatPmDisplayName('Cung ứng')).toBe(EMPTY_PM_FALLBACK);
      expect(formatPmDisplayName('Admin')).toBe(EMPTY_PM_FALLBACK);
    });

    it('returns trimmed human name when valid', () => {
      expect(formatPmDisplayName('  Nguyễn Văn Khoa  ')).toBe('Nguyễn Văn Khoa');
      expect(formatPmDisplayName('Trần Thị Mai An')).toBe('Trần Thị Mai An');
    });
  });

  describe('hasValidPm', () => {
    it('returns false when pmName is system role account or invalid guid', () => {
      expect(hasValidPm('Kho hàng', 'c2000000-0000-4000-8000-000000000001')).toBe(false);
      expect(hasValidPm('Nguyễn Văn Khoa', '00000000-0000-0000-0000-000000000000')).toBe(false);
      expect(hasValidPm(null, 'c2000000-0000-4000-8000-000000000001')).toBe(false);
    });

    it('returns true when pmName is human and has valid pmId', () => {
      expect(hasValidPm('Nguyễn Văn Khoa', 'c2000000-0000-4000-8000-000000000001')).toBe(true);
    });
  });
});
