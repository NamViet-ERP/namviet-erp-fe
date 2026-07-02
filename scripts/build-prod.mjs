#!/usr/bin/env node
/**
 * Production build — forces VITE_USE_MOCK=false (Windows + Unix).
 * Requires VITE_API_BASE_URL via .env.production or shell env.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptsDir, '..');
const env = { ...process.env, VITE_USE_MOCK: 'false' };

function run(scriptName) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, scriptName)], {
    stdio: 'inherit',
    env,
    cwd: projectRoot,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('verify-prod-env.mjs');
run('verify-no-mock-src.mjs');

const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteCli)) {
  console.error('[build-prod] FAIL: vite CLI not found. Run npm ci first.');
  process.exit(1);
}

const build = spawnSync(process.execPath, [viteCli, 'build', '--mode', 'production'], {
  stdio: 'inherit',
  env,
  cwd: projectRoot,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

run('verify-prod-bundle.mjs');
