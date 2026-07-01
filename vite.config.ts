/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isVitest =
    mode === 'test' ||
    process.env.VITEST != null ||
    process.env.VITEST_WORKER_ID != null ||
    process.argv.some((arg) => /vitest/i.test(arg))
  const useMock =
    env.VITE_USE_MOCK === 'true' || process.env.VITE_USE_MOCK === 'true'
  const apiBaseUrl = (env.VITE_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? '').trim()

  if (mode === 'production' && !isVitest) {
    if (useMock) {
      throw new Error(
        'Production build blocked: VITE_USE_MOCK=true. Use `npm run build:prod` (mock is forced off).',
      )
    }

    if (!apiBaseUrl) {
      throw new Error(
        'Production build blocked: set VITE_API_BASE_URL in .env.production or the shell before building.',
      )
    }
  }

  return {
    // Base public path. Override with VITE_BASE_PATH when hosting under a
    // sub-path (e.g. behind a .NET Core / IIS virtual directory).
    base: env.VITE_BASE_PATH || '/',
    define: {
      __USE_MOCK__: JSON.stringify(isVitest || useMock),
    },
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
    },
    build: {
      // Source maps help diagnose production issues without shipping readable code.
      sourcemap: true,
      // Avoid one giant bundle: split heavy vendors so the app shell loads fast.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-router') || /node_modules[/\\]react[/\\]/.test(id) || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('recharts')) return 'chart-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('/zod/')) {
              return 'form-vendor';
            }
          },
        },
      },
    },
    preview: {
      port: 4173,
    },
  }
})
