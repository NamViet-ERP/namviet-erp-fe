/**
 * Fail if src/types/generated/openapi.ts is out of sync with openapi/swagger.json.
 * Does not need a running BE — uses the committed swagger snapshot.
 *
 * Usage: node scripts/check-openapi-generated.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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

const before = readFileSync(outFile, 'utf8');

const result = spawnSync(
  process.execPath,
  [cli, 'openapi/swagger.json', '-o', 'src/types/generated/openapi.ts'],
  { cwd: root, stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const after = readFileSync(outFile, 'utf8');
if (before !== after) {
  // Restore committed file so the working tree stays clean on CI/local check failure.
  writeFileSync(outFile, before, 'utf8');
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
