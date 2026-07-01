#!/usr/bin/env node
/**
 * Production build — forces VITE_USE_MOCK=false (Windows + Unix).
 * Requires VITE_API_BASE_URL via .env.production or shell env.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = { ...process.env, VITE_USE_MOCK: 'false' };

const verify = spawnSync('node', [path.join(root, 'verify-prod-env.mjs')], {
  stdio: 'inherit',
  env,
});

if (verify.status !== 0) {
  process.exit(verify.status ?? 1);
}

const build = spawnSync('npx', ['vite', 'build', '--mode', 'production'], {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(build.status ?? 0);
