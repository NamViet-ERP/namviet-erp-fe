import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../..');

const PRIMITIVE_FILES = [
  'src/components/ui/PageShell.tsx',
  'src/components/ui/PageHeader.tsx',
  'src/components/ui/FilterToolbar.tsx',
  'src/components/ui/TableShell.tsx',
  'src/components/ui/KpiCard.tsx',
  'src/components/ui/MetricsStrip.tsx',
  'src/components/ui/StatusBadge.tsx',
  'src/components/ui/SectionCard.tsx',
  'src/components/ui/FormSection.tsx',
];

const GOLDEN_SURFACE_FILES = [
  ...PRIMITIVE_FILES,
  'src/pages/warehouse/WarehouseReportsPage.tsx',
];

const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const TAILWIND_PALETTE_RE =
  /\b(?:bg|text|border|ring|divide|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/;
const DARK_PREFIX_RE = /\bdark:/;
const ARBITRARY_FONT_PX_RE = /\btext-\[\d+px\]/;
const RGBA_RE = /\brgba\(/i;
const INLINE_FONT_SIZE_RE = /\bfontSize\s*:/;
const PRIMARY_OPACITY_MODIFIER_RE =
  /\b(?:bg|text|border|ring|divide|from|to|via)-primary(?:-[0-9]+)?\/[0-9]+/;

type RgbTuple = [number, number, number];

function parseHexColor(value: string): RgbTuple | null {
  const trimmed = value.trim();
  const full = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(trimmed);
  if (full) {
    return [parseInt(full[1], 16), parseInt(full[2], 16), parseInt(full[3], 16)];
  }
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(trimmed);
  if (short) {
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ];
  }
  return null;
}

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(input.slice(start).trim());
  return parts;
}

function parseRootTokens(css: string): Map<string, string> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rootMatch = /:root\s*\{([\s\S]*?)\}/.exec(stripped);
  const block = rootMatch ? rootMatch[1] : stripped;
  const map = new Map<string, string>();
  const declRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = declRe.exec(block)) !== null) {
    map.set(match[1], match[2].trim());
  }
  return map;
}

function resolveColorToken(expr: string, tokens: Map<string, string>, depth = 0): RgbTuple {
  if (depth > 16) {
    throw new Error(`Exceeded CSS variable recursion depth resolving "${expr}"`);
  }
  const trimmed = expr.trim();
  const hex = parseHexColor(trimmed);
  if (hex) return hex;

  const varMatch = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)$/.exec(trimmed);
  if (varMatch) {
    const target = tokens.get(varMatch[1]) ?? varMatch[2];
    if (!target) {
      throw new Error(`Missing CSS token "${varMatch[1]}"`);
    }
    return resolveColorToken(target, tokens, depth + 1);
  }

  const mixMatch = /^color-mix\(([\s\S]+)\)$/.exec(trimmed);
  if (mixMatch) {
    const args = splitTopLevelCommas(mixMatch[1]);
    if (args.length !== 3 || !args[0].toLowerCase().startsWith('in srgb')) {
      throw new Error(`Unsupported color-mix syntax: "${trimmed}"`);
    }
    const pctMatch = /^([\s\S]+?)\s+(\d+(?:\.\d+)?)%$/.exec(args[1]);
    if (!pctMatch) {
      throw new Error(`Expected percentage in color-mix first color: "${args[1]}"`);
    }
    const p1 = Number(pctMatch[2]) / 100;
    const p2 = 1 - p1;
    const c1 = resolveColorToken(pctMatch[1], tokens, depth + 1);
    const c2 = resolveColorToken(args[2], tokens, depth + 1);
    return [
      c1[0] * p1 + c2[0] * p2,
      c1[1] * p1 + c2[1] * p2,
      c1[2] * p1 + c2[2] * p2,
    ];
  }

  throw new Error(`Cannot resolve color expression "${trimmed}"`);
}

function linearizeChannel(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: RgbTuple): number {
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

function contrastRatio(fg: RgbTuple, bg: RgbTuple): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('Living Invariant: Design System Tokens, CSS Order & Token-Only Primitives', () => {
  it('tailwind.config.js aligns colors, fontFamily, borderRadius, and boxShadow to CSS tokens with zero hex', async () => {
    const configPath = path.join(repoRoot, 'tailwind.config.js');
    expect(fs.existsSync(configPath)).toBe(true);

    const configSrc = fs.readFileSync(configPath, 'utf-8');
    expect(configSrc).not.toMatch(RAW_HEX_RE);

    const mod = (await import(/* @vite-ignore */ pathToFileURL(configPath).href)) as {
      default: {
        theme: {
          extend: {
            colors: {
              primary: Record<string, string>;
            };
            fontFamily: Record<string, string[]>;
            borderRadius: Record<string, string>;
            boxShadow: Record<string, string>;
          };
        };
      };
    };

    const { colors, fontFamily, borderRadius, boxShadow } = mod.default.theme.extend;
    expect(fontFamily.sans).toEqual(['var(--font-sans)']);
    expect(fontFamily.roboto).toEqual(['var(--font-sans)']);
    expect(fontFamily.mono).toEqual(['var(--font-mono)']);
    expect(colors.primary.DEFAULT).toBe('var(--nv-action)');
    for (const shade of ['50', '100', '300', '400', '500', '600', '700', '950']) {
      expect(colors.primary[shade]).toContain('<alpha-value>');
    }

    expect(borderRadius.md).toBe('var(--radius-xs)');
    expect(borderRadius.lg).toBe('var(--radius-sm)');
    expect(borderRadius.xl).toBe('var(--radius-md)');
    expect(borderRadius['2xl']).toBe('var(--radius-lg)');

    expect(boxShadow['md-1']).toBe('var(--md-shadow-1)');
    expect(boxShadow['md-2']).toBe('var(--md-shadow-2)');
    expect(boxShadow['md-3']).toBe('var(--md-shadow-3)');
    expect(boxShadow['md-4']).toBe('var(--md-shadow-4)');
    for (const key of ['md-1', 'md-2', 'md-3', 'md-4']) {
      expect(boxShadow[key]).not.toBe('none');
    }
  });

  it('src/styles/tokens.css loads upgraded fonts, derives scrim/shadows via color-mix, and passes WCAG warning contrast', () => {
    const tokensPath = path.join(repoRoot, 'src/styles/tokens.css');
    const tokensCss = fs.readFileSync(tokensPath, 'utf-8');

    const requiredTokens = [
      '--md-surface-container-highest:',
      '--md-surface-variant05:',
      '--color-border:',
      '--color-text-muted:',
      '--color-surface:',
      '--color-surface-hover:',
      '--space-page-gap:',
    ];

    for (const token of requiredTokens) {
      expect(tokensCss).toContain(token);
    }

    expect(tokensCss).toContain('Plus+Jakarta+Sans');
    expect(tokensCss).toContain('JetBrains+Mono');
    expect(tokensCss).toMatch(/--font-sans:\s*'Plus Jakarta Sans'/);
    expect(tokensCss).toMatch(/--font-mono:\s*'JetBrains Mono'/);

    expect(tokensCss).toMatch(/--md-scrim:\s*color-mix\(/);
    for (const key of ['--md-shadow-1', '--md-shadow-2', '--md-shadow-3', '--md-shadow-4']) {
      expect(tokensCss).toMatch(new RegExp(`${key}:[^;]*color-mix\\(`));
    }
    expect(tokensCss).not.toMatch(/rgba\(\s*14,\s*48,\s*99/i);

    expect(tokensCss).not.toMatch(/#C47A00/i);
    expect(tokensCss).not.toMatch(/#B56F08/i);

    const tokenMap = parseRootTokens(tokensCss);
    const whiteBg = resolveColorToken('#FFFFFF', tokenMap);
    const pageBg = resolveColorToken('var(--nv-epc-bg)', tokenMap);
    const warningContainerBg = resolveColorToken('var(--md-warning-container)', tokenMap);

    for (const token of [
      '--md-warning',
      '--status-warning',
      '--nv-amber-dark',
      '--md-on-warning-container',
    ]) {
      const fg = resolveColorToken(`var(${token})`, tokenMap);
      expect(contrastRatio(fg, whiteBg), `${token} vs #FFFFFF must pass WCAG AA`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(fg, pageBg), `${token} vs --nv-epc-bg must pass WCAG AA`).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(fg, warningContainerBg),
        `${token} vs --md-warning-container (#FEF3C7) must pass WCAG AA`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    const primaryContainerBg = resolveColorToken('var(--md-primary-container)', tokenMap);
    const onPrimaryContainerFg = resolveColorToken('var(--md-on-primary-container)', tokenMap);
    expect(
      contrastRatio(onPrimaryContainerFg, primaryContainerBg),
      '--md-on-primary-container vs --md-primary-container must pass WCAG AA',
    ).toBeGreaterThanOrEqual(4.5);

    const secondaryContainerBg = resolveColorToken('var(--md-secondary-container)', tokenMap);
    const onSecondaryContainerFg = resolveColorToken('var(--md-on-secondary-container)', tokenMap);
    expect(
      contrastRatio(onSecondaryContainerFg, secondaryContainerBg),
      '--md-on-secondary-container vs --md-secondary-container must pass WCAG AA',
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('src/index.css imports shared-kit.css after components.css and before modules/index.css', () => {
    const indexPath = path.join(repoRoot, 'src/index.css');
    const indexCss = fs.readFileSync(indexPath, 'utf-8');

    const componentsIdx = indexCss.indexOf("@import './styles/components.css';");
    const sharedKitIdx = indexCss.indexOf("@import './styles/shared-kit.css';");
    const modulesIdx = indexCss.indexOf("@import './styles/modules/index.css';");

    expect(componentsIdx).toBeGreaterThanOrEqual(0);
    expect(sharedKitIdx).toBeGreaterThan(componentsIdx);
    expect(modulesIdx).toBeGreaterThan(sharedKitIdx);
  });

  it('src/styles/shared-kit.css maintains scroll safety, accessible contrasts, and 0 raw hex colors', () => {
    const sharedKitPath = path.join(repoRoot, 'src/styles/shared-kit.css');
    expect(fs.existsSync(sharedKitPath)).toBe(true);
    const sharedCss = fs.readFileSync(sharedKitPath, 'utf-8');

    expect(sharedCss).toMatch(/\.erp-table-shell__scroll\s*\{[^}]*overflow-x:\s*auto;/s);
    expect(sharedCss).not.toMatch(/\.hrm-empty-cell\s*\{[^}]*var\(--md-outline\)/s);
    expect(sharedCss).toMatch(/\.hrm-empty-cell\s*\{[^}]*var\(--md-on-surface-variant\)/s);
    expect(sharedCss).toMatch(
      /\.hrm-back-btn:hover,\s*\.hrm-header-btn:hover\s*\{[^}]*color:\s*var\(--md-on-primary-container\);/s,
    );
    expect(sharedCss).toMatch(
      /\.page-header__back:hover\s*\{[^}]*color:\s*var\(--md-on-primary-container\);/s,
    );
    expect(sharedCss).not.toMatch(RAW_HEX_RE);
  });

  it('no source file uses unsupported /opacity modifiers on CSS-var primary classes', () => {
    const files = collectSourceFiles(path.join(repoRoot, 'src'));
    for (const fullPath of files) {
      const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      if (relPath === 'src/tests/invariants/designSystem.invariant.test.ts') continue;
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(
        source,
        `${relPath} must not use /opacity modifiers on CSS-var primary classes`,
      ).not.toMatch(PRIMARY_OPACITY_MODIFIER_RE);
    }
  });

  it('components.css: .kpi-card--accent-blue maps to --nv-action and .kpi-card--accent-success maps to --md-success independently', () => {
    const componentsCssPath = path.join(repoRoot, 'src/styles/components.css');
    expect(fs.existsSync(componentsCssPath)).toBe(true);
    const componentsCss = fs.readFileSync(componentsCssPath, 'utf-8');

    // accent-blue must resolve to --nv-action (không phải --md-success)
    expect(componentsCss).toMatch(
      /\.kpi-card\.card-md\.kpi-card--accent-blue\s*\{[^}]*--kpi-accent:\s*var\(--nv-action\);/s,
    );
    // accent-success must resolve to --md-success (không phải --nv-action)
    expect(componentsCss).toMatch(
      /\.kpi-card\.card-md\.kpi-card--accent-success\s*\{[^}]*--kpi-accent:\s*var\(--md-success\);/s,
    );
    // Cấm gộp hai accent vào cùng rule với --md-success
    expect(componentsCss).not.toMatch(
      /\.kpi-card\.card-md\.kpi-card--accent-blue,\s*\n?\s*\.kpi-card\.card-md\.kpi-card--accent-success\s*\{[^}]*--kpi-accent:\s*var\(--md-success\);/s,
    );
  });

  it('shared-kit.css: 375px mobile viewport does not overflow voucher-date-filter (max-width 639px grid fix)', () => {
    const sharedKitPath = path.join(repoRoot, 'src/styles/shared-kit.css');
    const sharedCss = fs.readFileSync(sharedKitPath, 'utf-8');
    // Extract balanced @media (max-width: 639px) blocks so nested } inside .voucher-date-filter doesn't truncate
    const mediaBlocks: string[] = [];
    const mediaRe = /@media\s*\(max-width:\s*639px\)\s*\{/g;
    let match: RegExpExecArray | null;
    while ((match = mediaRe.exec(sharedCss)) !== null) {
      let depth = 1;
      let cursor = match.index + match[0].length;
      while (cursor < sharedCss.length && depth > 0) {
        if (sharedCss[cursor] === '{') depth += 1;
        else if (sharedCss[cursor] === '}') depth -= 1;
        cursor += 1;
      }
      mediaBlocks.push(sharedCss.slice(match.index, cursor));
    }
    expect(mediaBlocks.length).toBeGreaterThan(0);

    const voucherMediaBlock = mediaBlocks.find(block => block.includes('.voucher-date-filter'));
    expect(voucherMediaBlock).toBeDefined();
    expect(voucherMediaBlock).toMatch(/\.voucher-date-filter\s*\{[^}]*display:\s*grid;/s);
    expect(voucherMediaBlock).toMatch(/\.voucher-date-filter__field\s*\{[^}]*min-width:\s*0;/s);
  });

  it('components.css: .kpi-card__value allows wrapping and tight line-height for long values on 375px grid', () => {
    const componentsCssPath = path.join(repoRoot, 'src/styles/components.css');
    const componentsCss = fs.readFileSync(componentsCssPath, 'utf-8');
    const idx = componentsCss.indexOf('.kpi-card__value {');
    expect(idx).toBeGreaterThan(-1);
    const rule = componentsCss.slice(idx, componentsCss.indexOf('}', idx) + 1);
    expect(rule).toMatch(/min-width:\s*0;/);
    expect(rule).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(rule).toMatch(/line-height:\s*var\(--lh-tight\);/);
  });

  it('components.css: .app-shell--wms keeps detail header subtitle and eyebrow visible', () => {
    const componentsCssPath = path.join(repoRoot, 'src/styles/components.css');
    const componentsCss = fs.readFileSync(componentsCssPath, 'utf-8');
    expect(componentsCss).toMatch(
      /\.app-shell--wms\s+\.page-header:not\(\.page-header--detail\)\s+\.page-header__subtitle/,
    );
    expect(componentsCss).not.toMatch(
      /\.app-shell--wms\s+\.page-header__subtitle\s*[,{]/,
    );
  });

  it('components.css: .app-shell--wms .hrm-header-btn:hover uses --md-on-primary-container not --md-secondary', () => {
    const componentsCssPath = path.join(repoRoot, 'src/styles/components.css');
    const componentsCss = fs.readFileSync(componentsCssPath, 'utf-8');
    // color phải là --md-on-primary-container
    expect(componentsCss).toMatch(
      /\.app-shell--wms\s+\.hrm-header-btn:hover\s*\{[^}]*color:\s*var\(--md-on-primary-container\);/s,
    );
    // Cấm dùng --md-secondary trong rule này
    const wmsHoverIdx = componentsCss.indexOf('.app-shell--wms .hrm-header-btn:hover');
    const ruleSnippet = componentsCss.slice(wmsHoverIdx, componentsCss.indexOf('}', wmsHoverIdx) + 1);
    expect(ruleSnippet).not.toContain('var(--md-secondary)');
  });

  it('canonical UI primitives and Golden Reference page contain zero raw hex, palette classes, dark:, text-[Npx], rgba(, or inline fontSize', () => {
    for (const relPath of GOLDEN_SURFACE_FILES) {
      const fullPath = path.join(repoRoot, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, 'utf-8');

      expect(source, `${relPath} must not contain raw hex colors`).not.toMatch(RAW_HEX_RE);
      expect(source, `${relPath} must not contain Tailwind palette classes`).not.toMatch(TAILWIND_PALETTE_RE);
      expect(source, `${relPath} must not contain dark: utilities`).not.toMatch(DARK_PREFIX_RE);
      expect(source, `${relPath} must not contain text-[Npx] arbitrary sizes`).not.toMatch(ARBITRARY_FONT_PX_RE);
      expect(source, `${relPath} must not contain rgba( literals`).not.toMatch(RGBA_RE);
      expect(source, `${relPath} must not contain inline fontSize`).not.toMatch(INLINE_FONT_SIZE_RE);
    }
  });
});
