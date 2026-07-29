/**
 * Phase 7 release gates: no-mock + OpenAPI check + typecheck.
 * Usage: node scripts/verify-release-gates.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`FAIL: ${label} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

run('verify:no-mock', 'npm', ['run', 'verify:no-mock']);
run('api:check', 'npm', ['run', 'api:check']);
run('tsc --noEmit', 'npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']);

console.log('\nOK: release gates passed (no-mock + api:check + tsc).');
