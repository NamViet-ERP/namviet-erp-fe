function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it before running Playwright (see .env.example).`,
    );
  }
  return value;
}

export const e2eEnv = {
  apiBaseUrl: process.env.E2E_API_URL ?? 'http://localhost:8080',
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  username: requiredEnv('E2E_USERNAME'),
  password: requiredEnv('E2E_PASSWORD'),
};
