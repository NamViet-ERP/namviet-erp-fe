#!/usr/bin/env node
/**
 * Pre-build check for production artifacts.
 * Fails when mock mode is on or API base URL is missing.
 * Reads `.env.production` when vars are not set in the shell (CI + local build).
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(name) {
  const file = path.join(root, name);
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadEnvFile('.env.production');

const mock = (process.env.VITE_USE_MOCK ?? fileEnv.VITE_USE_MOCK ?? '')
  .trim()
  .toLowerCase();
if (mock === 'true' || mock === '1' || mock === 'yes') {
  console.error(
    '[verify-prod-env] FAIL: VITE_USE_MOCK must be false or unset for production builds.',
  );
  process.exit(1);
}

const apiBase = (process.env.VITE_API_BASE_URL ?? fileEnv.VITE_API_BASE_URL ?? '').trim();
// Empty = same-origin (reverse proxy). Absolute URL also allowed.
if (apiBase && !/^https?:\/\//i.test(apiBase) && !apiBase.startsWith('/')) {
  console.error(
    '[verify-prod-env] FAIL: VITE_API_BASE_URL must be empty (same-origin), an absolute http(s) URL, or a path.',
  );
  process.exit(1);
}

console.log(
  apiBase
    ? `[verify-prod-env] OK — mock disabled, API base URL set (${apiBase}).`
    : '[verify-prod-env] OK — mock disabled, same-origin API (empty VITE_API_BASE_URL).',
);
