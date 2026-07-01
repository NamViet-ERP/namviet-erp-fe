#!/usr/bin/env node
/**
 * Pre-build check for production artifacts.
 * Fails when mock mode is on or API base URL is missing.
 */

const mock = (process.env.VITE_USE_MOCK ?? '').trim().toLowerCase();
if (mock === 'true' || mock === '1' || mock === 'yes') {
  console.error(
    '[verify-prod-env] FAIL: VITE_USE_MOCK must be false or unset for production builds.',
  );
  process.exit(1);
}

const apiBase = (process.env.VITE_API_BASE_URL ?? '').trim();
if (!apiBase) {
  console.error(
    '[verify-prod-env] FAIL: VITE_API_BASE_URL is required for production builds.',
  );
  process.exit(1);
}

console.log('[verify-prod-env] OK — mock disabled, API base URL set.');
