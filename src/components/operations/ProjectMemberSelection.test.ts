import { describe, it, expect } from 'vitest';

describe('Project Personnel & Member Exclusion Logic', () => {
  it('excludes PIC from selectable member options', () => {
    const personnel = [
      { id: '1', name: 'Nguyễn Văn Khoa' },
      { id: '2', name: 'Trần Thị Mai An' },
      { id: '3', name: 'Admin NamViet' },
    ];

    const pmName = 'Nguyễn Văn Khoa';
    const selectedMembers = ['Trần Thị Mai An'];
    const excludeSet = new Set<string>([
      ...selectedMembers.map(m => m.toLowerCase().trim()),
      pmName.toLowerCase().trim(),
    ]);

    const availableOptions = personnel.filter(
      p => !excludeSet.has(p.name.toLowerCase().trim()),
    );

    expect(availableOptions).toHaveLength(1);
    expect(availableOptions[0].name).toBe('Admin NamViet');
  });

  it('removes member from scMembers when selected as PIC', () => {
    const prevScMembers = ['Nguyễn Văn Khoa', 'Trần Thị Mai An', 'Admin NamViet'];
    const newPmName = 'Nguyễn Văn Khoa';

    const updatedScMembers = prevScMembers.filter(
      m => m.trim().toLowerCase() !== newPmName.trim().toLowerCase(),
    );

    expect(updatedScMembers).toEqual(['Trần Thị Mai An', 'Admin NamViet']);
    expect(updatedScMembers).not.toContain('Nguyễn Văn Khoa');
  });

  it('sanitizes duplicate PIC in scMembers when opening edit form', () => {
    const row = {
      pmName: 'Nguyễn Văn Khoa',
      scMembers: 'Nguyễn Văn Khoa, Trần Thị Mai An',
    };

    const pm = row.pmName.trim();
    const scMembers = row.scMembers
      .split(',')
      .map(s => s.trim())
      .filter(s => Boolean(s) && s.toLowerCase() !== pm.toLowerCase());

    expect(scMembers).toEqual(['Trần Thị Mai An']);
    expect(scMembers).not.toContain('Nguyễn Văn Khoa');
  });
});
