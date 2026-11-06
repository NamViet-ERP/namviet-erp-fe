import { describe, it, expect } from 'vitest';
import { isSystemRoleAccount, formatPersonnelLabel } from '../../lib/projectPersonnel';

describe('Living Invariant 1: Project Personnel Role Account Sanitization', () => {
  const systemRoles = [
    'Kho hàng',
    'Kho tổng',
    'Cung ứng',
    'Admin',
    'Kế toán kho',
    'Ban giám đốc',
  ];

  it('marks all system role accounts as true for isSystemRoleAccount', () => {
    systemRoles.forEach(role => {
      expect(isSystemRoleAccount(role)).toBe(true);
    });
  });

  it('marks genuine human personnel names as false', () => {
    const realPersonnel = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'];
    realPersonnel.forEach(name => {
      expect(isSystemRoleAccount(name)).toBe(false);
    });
  });

  it('returns standard fallback for null, undefined, or system role accounts', () => {
    expect(formatPersonnelLabel(null)).toBe('Chưa phân công PM');
    expect(formatPersonnelLabel(undefined)).toBe('Chưa phân công PM');
    expect(formatPersonnelLabel('Kho hàng')).toBe('Chưa phân công PM');
    expect(formatPersonnelLabel('Kho tổng')).toBe('Chưa phân công PM');
    expect(formatPersonnelLabel('Admin')).toBe('Chưa phân công PM');
  });

  it('preserves genuine personnel names when formatting label', () => {
    expect(formatPersonnelLabel('Nguyễn Văn A')).toBe('Nguyễn Văn A');
  });
});
