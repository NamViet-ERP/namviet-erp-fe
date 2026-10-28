/**
 * Fail if src/types/generated/openapi.ts is out of sync with openapi/swagger.json.
 * Does not need a running BE — uses the committed swagger snapshot.
 *
 * Generates to a temp file only (never overwrites openapi.ts during check),
 * avoiding Windows UNKNOWN / errno -4094 when the IDE holds the file open.
 *
 * Usage: node scripts/check-openapi-generated.mjs
 */
import { readFileSync, existsSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = resolve(root, 'src/types/generated/openapi.ts');
const swaggerFile = resolve(root, 'openapi/swagger.json');
const cli = resolve(root, 'node_modules/openapi-typescript/bin/cli.js');

if (!existsSync(cli)) {
  console.error('openapi-typescript not found. Run: npm ci');
  process.exit(1);
}

if (!existsSync(outFile)) {
  console.error(`Missing generated types: ${outFile}\nRun: npm run api:gen`);
  process.exit(1);
}

if (!existsSync(swaggerFile)) {
  console.error(`Missing swagger snapshot: ${swaggerFile}\nRun: npm run api:fetch`);
  process.exit(1);
}

const before = readFileSync(outFile, 'utf8');
if (process.argv.includes('--live')) {
  const base = (process.env.SWAGGER_URL || process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080').replace(/\/$/, '');
  const response = await fetch(`${base}/swagger/v1/swagger.json`);
  if (!response.ok) throw new Error(`Live OpenAPI request failed: HTTP ${response.status}`);
  const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  const live = canonical(await response.json());
  const snapshot = canonical(JSON.parse(readFileSync(swaggerFile, 'utf8')));
  if (JSON.stringify(live) !== JSON.stringify(snapshot)) {
    console.error('Live API differs from openapi/swagger.json. Run npm run api:sync against this API.');
    process.exit(1);
  }
  console.log('OK: live API matches the OpenAPI snapshot.');
}
const tempDir = mkdtempSync(join(tmpdir(), 'nv-openapi-check-'));
const tempOut = join(tempDir, 'openapi.ts');

const result = spawnSync(
  process.execPath,
  [cli, swaggerFile, '-o', tempOut],
  { cwd: root, stdio: 'inherit' },
);

if (result.status !== 0) {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  process.exit(result.status ?? 1);
}

const after = readFileSync(tempOut, 'utf8');
try {
  rmSync(tempDir, { recursive: true, force: true });
} catch {
  try {
    unlinkSync(tempOut);
  } catch {
    /* ignore */
  }
}

if (before !== after) {
  console.error(
    [
      '',
      'OpenAPI generated types are out of sync with openapi/swagger.json.',
      'Fix:',
      '  1) If BE changed: start API, then npm run api:sync',
      '  2) If only types drifted: npm run api:gen',
      '  3) Commit openapi/swagger.json + src/types/generated/openapi.ts together',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`OK: ${outFile} matches ${swaggerFile}`);
