#!/usr/bin/env node
/**
 * Fail if mock layer, purchasing seed store, or resolveMock remains in application source.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const mocksDir = path.join(srcDir, 'mocks');

const FORBIDDEN_PATTERNS = [
  { name: 'mocks import', re: /from\s+['"][^'"]*\/mocks(?:\/|['"])/ },
  { name: 'resolveMock', re: /\bresolveMock\b/ },
  { name: 'USE_MOCK import', re: /import\s*\{[^}]*\bUSE_MOCK\b[^}]*\}\s*from/ },
  { name: 'mockNotifications', re: /\bmockNotifications\b/ },
  { name: 'Chức năng giả lập', re: /Chức năng giả lập/ },
  { name: 'purchasingMock', re: /\bpurchasingMock\b/ },
  { name: 'purchasingStore', re: /\bpurchasingStore\b/ },
  { name: 'usePurchasingStore', re: /\busePurchasingStore\b/ },
  { name: 'createPurchasingSeed', re: /\bcreatePurchasingSeed\b/ },
  { name: 'buildMockPdfBlob', re: /\bbuildMockPdfBlob\b/ },
  { name: 'suppliersMock', re: /\bsuppliersMock\b/ },
  { name: 'create*Seed factory', re: /\bcreate[A-Za-z0-9]*Seed\b/ },
  { name: 'runtime default seed', re: /\bDEFAULT_SEED\b/ },
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

if (await exists(mocksDir)) {
  console.error('[verify-no-mock-src] FAIL: src/mocks/ still exists — remove mock layer.');
  process.exit(1);
}

if (await exists(path.join(srcDir, 'data', 'purchasingMock.ts'))) {
  console.error('[verify-no-mock-src] FAIL: src/data/purchasingMock.ts still exists.');
  process.exit(1);
}

if (await exists(path.join(srcDir, 'lib', 'purchasing', 'purchasingStore.ts'))) {
  console.error('[verify-no-mock-src] FAIL: src/lib/purchasing/purchasingStore.ts still exists.');
  process.exit(1);
}

const files = await walk(srcDir);
const violations = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  // Test fixtures are excluded; production modules must never import or restore them.
  if (/\.(test|spec)\.[tj]sx?$/.test(file)) continue;
  const content = await readFile(file, 'utf8');
  for (const { name, re } of FORBIDDEN_PATTERNS) {
    if (re.test(content)) {
      violations.push(`${rel}: ${name}`);
    }
  }
}

if (violations.length > 0) {
  console.error('[verify-no-mock-src] FAIL: mock references found in src/:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('[verify-no-mock-src] OK — no mock imports in application source.');
