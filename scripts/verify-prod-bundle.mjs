#!/usr/bin/env node
/**
 * Post-build check — production dist must not ship mock/seed artifacts.
 * Real purchasing/supplier page chunks are allowed; scan file names and
 * bundle text for mock identifiers instead of denylisting page names.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'dist', 'assets');

try {
  await stat(path.join(root, 'dist', 'index.html'));
} catch {
  console.error('[verify-prod-bundle] FAIL: dist/ not found — run build:prod first.');
  process.exit(1);
}

let assetFiles = [];
try {
  assetFiles = await readdir(assetsDir);
} catch {
  console.error('[verify-prod-bundle] FAIL: dist/assets/ not found.');
  process.exit(1);
}

const mockChunks = assetFiles.filter(
  (name) =>
    /\.mock[\w.-]*\.js$/i.test(name)
    || /(?:^|[-.])DevOnlyRoutes(?:[-.]|$)/i.test(name)
    || /Mock(?:Store|Seed)/i.test(name),
);

if (mockChunks.length > 0) {
  console.error('[verify-prod-bundle] FAIL: mock chunks in dist/assets/:');
  for (const name of mockChunks) console.error(`  - ${name}`);
  process.exit(1);
}

const forbiddenBundlePatterns = [
  { name: 'purchasingMock', re: /\bpurchasingMock\b/ },
  { name: 'purchasingStore', re: /\bpurchasingStore\b/ },
  { name: 'usePurchasingStore', re: /\busePurchasingStore\b/ },
  { name: 'createPurchasingSeed', re: /\bcreatePurchasingSeed\b/ },
  { name: 'buildMockPdfBlob', re: /\bbuildMockPdfBlob\b/ },
  { name: 'suppliersMock', re: /\bsuppliersMock\b/ },
  { name: 'seed factory', re: /\bcreate[A-Za-z0-9]*Seed\b/ },
];
const bundleViolations = [];

for (const name of assetFiles.filter(file => /\.(?:js|css|map)$/i.test(file))) {
  const content = await readFile(path.join(assetsDir, name), 'utf8');
  for (const pattern of forbiddenBundlePatterns) {
    if (pattern.re.test(content)) bundleViolations.push(`${name}: ${pattern.name}`);
  }
}

if (bundleViolations.length > 0) {
  console.error('[verify-prod-bundle] FAIL: DEV seed/mock code found in production assets:');
  for (const violation of bundleViolations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(`[verify-prod-bundle] OK — ${assetFiles.length} asset files, no DEV seed/mock code.`);
