import { e2eEnv } from './helpers/env';

export default async function globalSetup(): Promise<void> {
  const healthUrl = `${e2eEnv.apiBaseUrl}/health`;

  try {
    const res = await fetch(healthUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Backend not ready at ${healthUrl} (${detail}). Start WareHouse_Management_BE before running Playwright.`,
    );
  }
}
