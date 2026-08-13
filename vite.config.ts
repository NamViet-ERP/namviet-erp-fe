/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function createApiProxy(proxyTarget: string) {
  return {
    target: proxyTarget,
    changeOrigin: true,
    configure: (proxy: { on: (event: string, fn: (...args: unknown[]) => void) => void }) => {
      proxy.on('proxyRes', (...args: unknown[]) => {
        const proxyRes = args[0] as { headers: Record<string, string | string[] | undefined> };
        const raw = proxyRes.headers['set-cookie'];
        if (!raw) return;
        const list = Array.isArray(raw) ? raw : [raw];
        // Cookie must bind to the Vite origin (5173), not the API host.
        proxyRes.headers['set-cookie'] = list.map(cookie =>
          cookie
            .replace(/;\s*Domain=[^;]*/gi, '')
            .replace(/;\s*Secure/gi, '')
            .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
        );
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxyTarget = (env.VITE_DEV_PROXY_TARGET ?? process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080').trim()
  const apiProxy = createApiProxy(proxyTarget)

  return {
    // Base public path. Override with VITE_BASE_PATH when hosting under a
    // sub-path (e.g. behind a .NET Core / IIS virtual directory).
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    define: {
      // Shell/playwright set VITE_E2E=true; force client replacement (loadEnv alone can miss it).
      'import.meta.env.VITE_E2E': JSON.stringify(
        env.VITE_E2E === 'true' || process.env.VITE_E2E === 'true' ? 'true' : '',
      ),
    },
    // recharts peer-depends on react-is; force Vite to prebundle it so dashboard charts don't break.
    optimizeDeps: {
      include: ['react-is', 'recharts'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
    server: {
      proxy: {
        '/api': apiProxy,
        '/hubs': { ...apiProxy, ws: true },
        '/uploads': apiProxy,
        '/health': apiProxy,
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': apiProxy,
        '/hubs': { ...apiProxy, ws: true },
        '/uploads': apiProxy,
        '/health': apiProxy,
      },
    },
    build: {
      // Production source maps are opt-in to avoid publishing readable source by default.
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
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
  }
})
