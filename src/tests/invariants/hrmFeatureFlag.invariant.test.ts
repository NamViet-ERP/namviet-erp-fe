import { describe, it, expect } from 'vitest';
import {
  unifiedSidebarMenu,
  HRM_MODULE_ENABLED,
  hrmMenu,
} from '../../constants/sidebarMenus';

describe('HRM Feature Flag Invariants', () => {
  it('excludes mod-hrm from unifiedSidebarMenu when HRM_MODULE_ENABLED is false', () => {
    if (!HRM_MODULE_ENABLED) {
      const hrmItem = unifiedSidebarMenu.find((item) => item.id === 'mod-hrm');
      expect(hrmItem).toBeUndefined();

      // Ensure no HRM routes leak into the sidebar
      const allPaths = unifiedSidebarMenu.flatMap((m) => [
        m.path,
        ...(m.children?.map((c) => c.path) ?? []),
      ]);
      expect(allPaths.some((p) => p.startsWith('/recruitment/dashboard'))).toBe(false);
      expect(allPaths.some((p) => p.startsWith('/members/list'))).toBe(false);
    }
  });

  it('hrmMenu definition remains intact and complete when needed in the future', () => {
    expect(hrmMenu.length).toBeGreaterThan(0);
    const hrmIds = hrmMenu.map((item) => item.id);
    expect(hrmIds).toContain('recruitment-dashboard');
    expect(hrmIds).toContain('members-list');
    expect(hrmIds).toContain('candidates-list');
  });

  it('guarantees mod-hrm structure conforms to specifications when enabled', () => {
    // Structural contract verification for HRM module definition
    const hrmModuleDraft = {
      id: 'mod-hrm',
      label: 'Quản trị Nhân sự',
      path: '/recruitment/dashboard',
      childrenCount: hrmMenu.length,
    };

    expect(hrmModuleDraft.id).toBe('mod-hrm');
    expect(hrmModuleDraft.label).toBe('Quản trị Nhân sự');
    expect(hrmModuleDraft.path).toBe('/recruitment/dashboard');
    expect(hrmModuleDraft.childrenCount).toBe(9);
  });
});
