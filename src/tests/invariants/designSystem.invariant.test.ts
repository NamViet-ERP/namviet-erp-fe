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

const RAW_HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const TAILWIND_PALETTE_RE =
  /\b(?:bg|text|border|ring|divide|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/;
const DARK_PREFIX_RE = /\bdark:/;
const ARBITRARY_FONT_PX_RE = /\btext-\[\d+px\]/;

describe('Living Invariant: Design System Tokens, CSS Order & Token-Only Primitives', () => {
  it('tailwind.config.js aligns borderRadius and boxShadow to CSS custom properties', async () => {
    const configPath = path.join(repoRoot, 'tailwind.config.js');
    expect(fs.existsSync(configPath)).toBe(true);

    const mod = (await import(/* @vite-ignore */ pathToFileURL(configPath).href)) as {
      default: {
        theme: {
          extend: {
            borderRadius: Record<string, string>;
            boxShadow: Record<string, string>;
          };
        };
      };
    };

    const { borderRadius, boxShadow } = mod.default.theme.extend;
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

  it('src/styles/tokens.css defines required surface, semantic alias, and layout rhythm tokens', () => {
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

  it('src/styles/shared-kit.css defines .erp-table-shell__scroll with overflow-x: auto and has 0 raw hex colors', () => {
    const sharedKitPath = path.join(repoRoot, 'src/styles/shared-kit.css');
    expect(fs.existsSync(sharedKitPath)).toBe(true);
    const sharedCss = fs.readFileSync(sharedKitPath, 'utf-8');

    expect(sharedCss).toMatch(/\.erp-table-shell__scroll\s*\{[^}]*overflow-x:\s*auto;/s);
    expect(sharedCss).not.toMatch(RAW_HEX_RE);
  });

  it('canonical UI primitives contain zero raw hex, zero Tailwind palette classes, zero dark:, and zero text-[Npx]', () => {
    for (const relPath of PRIMITIVE_FILES) {
      const fullPath = path.join(repoRoot, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, 'utf-8');

      expect(source, `${relPath} must not contain raw hex colors`).not.toMatch(RAW_HEX_RE);
      expect(source, `${relPath} must not contain Tailwind palette classes`).not.toMatch(TAILWIND_PALETTE_RE);
      expect(source, `${relPath} must not contain dark: utilities`).not.toMatch(DARK_PREFIX_RE);
      expect(source, `${relPath} must not contain text-[Npx] arbitrary sizes`).not.toMatch(ARBITRARY_FONT_PX_RE);
    }
  });
});
