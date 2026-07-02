#!/usr/bin/env node
/**
 * Post-build check — production dist must not ship lazy mock chunks.
 */

import { readdir, stat } from 'node:fs/promises';
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
  (name) => /\.mock[\w.-]*\.js$/i.test(name) || /Mock(?:Store|Seed)/i.test(name),
);

if (mockChunks.length > 0) {
  console.error('[verify-prod-bundle] FAIL: mock chunks in dist/assets/:');
  for (const name of mockChunks) console.error(`  - ${name}`);
  process.exit(1);
}

console.log(`[verify-prod-bundle] OK — ${assetFiles.length} asset files, no mock chunks.`);
