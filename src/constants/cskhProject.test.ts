import { describe, expect, it } from 'vitest';
import {
  cskhProjectCodeFromPath,
  cskhProjectPath,
  isCskhProjectTab,
  normalizeCskhProjectTab,
} from './cskhProject';

describe('cskh project urls', () => {
  it('stays under /cskh/projects and never warehouse', () => {
    expect(cskhProjectPath('DA-2026-001')).toBe('/cskh/projects/DA-2026-001/dashboard');
    expect(cskhProjectPath('DA-2026-001', 'gantt')).toBe('/cskh/projects/DA-2026-001/gantt');
    expect(cskhProjectPath('DA-2026-001', 'docs')).toBe('/cskh/projects/DA-2026-001/docs');
    expect(cskhProjectPath('DA-2026-001', 'docs-draft')).toBe('/cskh/projects/DA-2026-001/docs');
  });

  it('reads the project code from a CSKH detail path', () => {
    expect(cskhProjectCodeFromPath('/cskh/projects/DA-2026-001/dashboard')).toBe('DA-2026-001');
    expect(cskhProjectCodeFromPath('/cskh/settings/phases')).toBeNull();
    expect(cskhProjectCodeFromPath('/warehouse/projects/DA-01')).toBeNull();
  });

  it('accepts known workspace tabs and normalizes legacy ones', () => {
    expect(isCskhProjectTab('dashboard')).toBe(true);
    expect(isCskhProjectTab('docs')).toBe(true);
    expect(isCskhProjectTab('docs-archive')).toBe(true);
    expect(isCskhProjectTab('bottlenecks')).toBe(true);
    expect(isCskhProjectTab('gantt')).toBe(true);
    expect(isCskhProjectTab('requests')).toBe(true);
    expect(isCskhProjectTab('meetings')).toBe(true);
    expect(isCskhProjectTab('docs-draft')).toBe(true);
    expect(normalizeCskhProjectTab('docs-draft')).toBe('docs');
    expect(isCskhProjectTab('stock')).toBe(false);
  });
});
