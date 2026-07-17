#!/usr/bin/env node
/**
 * Phase 1 guard — fail if mock layer or resolveMock remains in application source.
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
  { name: 'purchasingMock outside DEV graph', re: /\bpurchasingMock\b/, devOnlyAllowed: true },
  { name: 'suppliersMock outside DEV graph', re: /\bsuppliersMock\b/, devOnlyAllowed: true },
  { name: 'seed factory outside DEV graph', re: /\bcreate[A-Za-z0-9]*Seed\b/, devOnlyAllowed: true },
];

const DEV_ONLY_PREFIXES = [
  'src/components/purchasing/',
  'src/data/purchasingMock.ts',
  'src/data/suppliersMock.ts',
  'src/lib/purchasing/',
  'src/pages/purchasing/',
  'src/pages/suppliers/',
  'src/routes/DevOnlyRoutes.tsx',
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
  console.error('[verify-no-mock-src] FAIL: src/mocks/ still exists — remove mock layer (Phase 1).');
  process.exit(1);
}

const files = await walk(srcDir);
const violations = [];

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const content = await readFile(file, 'utf8');
  const isDevOnly = DEV_ONLY_PREFIXES.some(prefix => rel.startsWith(prefix));
  for (const { name, re, devOnlyAllowed } of FORBIDDEN_PATTERNS) {
    if (devOnlyAllowed && isDevOnly) continue;
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
