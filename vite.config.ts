import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Base public path. Override with VITE_BASE_PATH when hosting under a
    // sub-path (e.g. behind a .NET Core / IIS virtual directory).
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
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
