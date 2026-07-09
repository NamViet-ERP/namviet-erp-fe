export const e2eEnv = {
  apiBaseUrl: process.env.E2E_API_URL ?? 'http://localhost:8080',
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  username: process.env.E2E_USERNAME ?? 'admin@namviet.vn',
  password: process.env.E2E_PASSWORD ?? 'Test@123',
};
