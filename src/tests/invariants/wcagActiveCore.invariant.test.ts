import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../..');

const EXCLUDED_PAGE_PREFIXES = [
  'src/pages/cskh/',
  'src/pages/recruitment/',
  'src/pages/members/',
];

const EXCLUDED_SUBSTRINGS = [
  'CandidateForm',
  'EmployeeOnboardForm',
  'CandidateApplyPage',
  'EmployeeOnboardPage',
];

function collectActiveTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectActiveTsxFiles(fullPath, out);
    } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
      const rel = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      if (EXCLUDED_PAGE_PREFIXES.some(prefix => rel.startsWith(prefix))) continue;
      if (EXCLUDED_SUBSTRINGS.some(part => rel.includes(part))) continue;
      out.push(rel);
    }
  }
  return out.sort();
}

function stripJsDocComments(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\//g, '');
}

interface JsxTagMatch {
  openTag: string;
  index: number;
  line: number;
}

function findJsxOpeningTags(source: string, tagName: string): JsxTagMatch[] {
  const cleaned = stripJsDocComments(source);
  const results: JsxTagMatch[] = [];
  const re = new RegExp(`<${tagName}(?=[\\s>/])`, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(cleaned)) !== null) {
    let cursor = match.index + match[0].length;
    let braceDepth = 0;
    let quote: string | null = null;

    while (cursor < cleaned.length) {
      const ch = cleaned[cursor];
      if (quote) {
        if (ch === '\\') {
          cursor += 2;
          continue;
        }
        if (ch === quote) quote = null;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          quote = ch;
        } else if (ch === '{') {
          braceDepth += 1;
        } else if (ch === '}') {
          braceDepth = Math.max(0, braceDepth - 1);
        } else if (ch === '>' && braceDepth === 0) {
          const line = cleaned.slice(0, match.index).split('\n').length;
          results.push({ openTag: cleaned.slice(match.index, cursor + 1), index: match.index, line });
          break;
        }
      }
      cursor += 1;
    }
  }

  return results;
}

function isWrappedInLabel(source: string, tagIndex: number): boolean {
  const cleaned = stripJsDocComments(source);
  const before = cleaned.slice(Math.max(0, tagIndex - 400), tagIndex);
  return before.lastIndexOf('<label') > before.lastIndexOf('</label>');
}

describe('Living Invariant: WCAG 2.1 AA Accessibility on Active Core', () => {
  const activeFiles = [
    ...collectActiveTsxFiles(path.join(repoRoot, 'src/components')),
    ...collectActiveTsxFiles(path.join(repoRoot, 'src/pages')),
  ];

  it('every clickable <tr> in Active Core includes keyboard activation (onKeyDown/getInteractiveRowProps) and preserves native row semantics', () => {
    expect(activeFiles.length).toBeGreaterThan(0);

    const missingKeyboardViolations: string[] = [];
    const roleButtonViolations: string[] = [];

    for (const relPath of activeFiles) {
      const source = fs.readFileSync(path.join(repoRoot, relPath), 'utf-8');
      for (const tr of findJsxOpeningTags(source, 'tr')) {
        if (!/\bonClick\b/.test(tr.openTag)) continue;
        if (!/\bonKeyDown\b|\bgetInteractiveRowProps\b/.test(tr.openTag)) {
          missingKeyboardViolations.push(`${relPath}:${tr.line}`);
        }
        if (/\brole=["']button["']/.test(tr.openTag)) {
          roleButtonViolations.push(`${relPath}:${tr.line}`);
        }
      }
    }

    expect(missingKeyboardViolations, 'Clickable <tr> tags must wire onKeyDown or getInteractiveRowProps').toEqual([]);
    expect(roleButtonViolations, 'Clickable <tr> tags must not override native row semantics with role="button"').toEqual([]);
  });

  it('SearchBar, Sidebar, PriceBookTables, and ExcelImportModalShell preserve required aria-label and keyboard dropzone attributes', () => {
    const searchBar = fs.readFileSync(path.join(repoRoot, 'src/components/ui/SearchBar.tsx'), 'utf-8');
    expect(searchBar).toContain('aria-label="Làm mới"');
    expect(searchBar).toContain('<RefreshCw size={18} aria-hidden="true" />');

    const sidebar = fs.readFileSync(path.join(repoRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    expect(sidebar).toContain('aria-label="Mở rộng thanh điều hướng"');
    expect(sidebar).toContain('aria-label="Thu gọn thanh điều hướng"');

    const priceBookTables = fs.readFileSync(
      path.join(repoRoot, 'src/pages/purchasing/priceBook/PriceBookTables.tsx'),
      'utf-8',
    );
    expect(priceBookTables).toContain('aria-label="Phần trăm markup (%)"');
    expect(priceBookTables).toContain('aria-label="Lưu đơn giá"');
    expect(priceBookTables).toContain('aria-label="Hủy chỉnh sửa"');
    expect(priceBookTables).toContain('getInteractiveRowProps');

    const excelShell = fs.readFileSync(
      path.join(repoRoot, 'src/components/shared/ExcelImportModalShell.tsx'),
      'utf-8',
    );
    expect(excelShell).toContain('role="button"');
    expect(excelShell).toContain('tabIndex={0}');
    expect(excelShell).toContain('aria-label={dropzoneTitle}');
    expect(excelShell).toContain('onKeyDown={e => {');
    expect(excelShell).toContain('aria-label={searchPlaceholder}');
    expect(excelShell).toContain('aria-label="Xóa từ khóa tìm kiếm"');
    expect(excelShell).toContain('aria-label="Chọn Sheet cần xem / nhập"');
    expect(excelShell).not.toMatch(/\[var\(--md-(?:primary|error|on-surface-variant)\)\]\/\d+/);
  });

  it('Active Core <select> controls and switch toggles carry programmatic accessible names', () => {
    const unlabeledSelects: string[] = [];

    for (const relPath of activeFiles) {
      if (relPath.startsWith('src/components/recruitment/')) continue;
      const source = fs.readFileSync(path.join(repoRoot, relPath), 'utf-8');
      for (const sel of findJsxOpeningTags(source, 'select')) {
        if (/\baria-label\b|\baria-labelledby\b|\bid=/.test(sel.openTag)) continue;
        if (isWrappedInLabel(source, sel.index)) continue;
        unlabeledSelects.push(`${relPath}:${sel.line}`);
      }
    }

    expect(unlabeledSelects, 'Active Core <select> elements must have aria-label, aria-labelledby, id, or wrapping <label>').toEqual([]);

    const iosSwitch = fs.readFileSync(path.join(repoRoot, 'src/components/ui/IOSSwitch.tsx'), 'utf-8');
    expect(iosSwitch).toContain('aria-label={label}');

    const switchFiles = [
      'src/pages/admin/AdminSettingsPage.tsx',
      'src/pages/warehouse/MaterialUnitsSettingsPanel.tsx',
      'src/pages/warehouse/origins/BrandsTabPanel.tsx',
      'src/pages/warehouse/origins/CountriesTabPanel.tsx',
      'src/pages/warehouse/origins/RegionsTabPanel.tsx',
    ];
    for (const relPath of switchFiles) {
      const src = fs.readFileSync(path.join(repoRoot, relPath), 'utf-8');
      expect(src, `${relPath} switch button must include aria-label`).toMatch(/role="switch"[\s\S]*?aria-label=/);
    }

    const sharedKitCss = fs.readFileSync(path.join(repoRoot, 'src/styles/shared-kit.css'), 'utf-8');
    expect(sharedKitCss).toMatch(/tr\[tabindex='0'\]:focus-visible/);
  });
});
