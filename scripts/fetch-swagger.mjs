/**
 * Pull OpenAPI spec from local BE (Development Swagger).
 * Requires API running, e.g. http://localhost:8080
 *
 * Usage: node scripts/fetch-swagger.mjs
 * Env:   VITE_DEV_PROXY_TARGET or SWAGGER_URL
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outFile = resolve(root, 'openapi/swagger.json');

const base =
  process.env.SWAGGER_URL?.replace(/\/$/, '') ||
  process.env.VITE_DEV_PROXY_TARGET?.replace(/\/$/, '') ||
  'http://localhost:8080';

const url = `${base}/swagger/v1/swagger.json`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`Failed to fetch ${url}: HTTP ${res.status}`);
  process.exit(1);
}

const text = await res.text();
JSON.parse(text); // validate JSON
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, text, 'utf8');
console.log(`Wrote ${outFile} (${text.length} bytes) from ${url}`);
