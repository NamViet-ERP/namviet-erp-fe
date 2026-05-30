/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* OKLCH-derived navy scale — perceptually uniform slate-blue */
        navy: {
          50:  '#f4f6fa',  /* oklch(0.972 0.008 264) */
          100: '#e4e8f1',  /* oklch(0.935 0.014 264) */
          200: '#c8d0e2',  /* oklch(0.860 0.024 264) */
          300: '#9aa7c2',  /* oklch(0.720 0.034 264) */
          400: '#6d7d9e',  /* oklch(0.575 0.038 264) */
          500: '#506488',  /* oklch(0.475 0.042 264) */
          600: '#3e506f',  /* oklch(0.395 0.038 264) */
          700: '#313f59',  /* oklch(0.325 0.033 264) */
          800: '#26334c',  /* oklch(0.270 0.030 264) */
          900: '#1c2640',  /* oklch(0.225 0.032 264) */
          950: '#121a30',  /* oklch(0.165 0.028 264) */
        },
        brand: {
          orange: '#c67a2e',      /* oklch(0.625 0.142 58) — warmer, less saturated */
          'orange-light': '#dba05c', /* oklch(0.735 0.115 60) */
        },
        accent: {
          DEFAULT: '#c67a2e',     /* oklch(0.625 0.142 58) */
          subtle: '#f5ede2',      /* oklch(0.950 0.025 60) */
          hover: '#a8642a',       /* oklch(0.545 0.130 55) */
        },
        status: {
          approved: '#2a9d68',    /* oklch(0.620 0.135 160) */
          'approved-bg': '#e8f5ee', /* oklch(0.955 0.025 160) */
          pending: '#b8892a',     /* oklch(0.630 0.125 80) */
          'pending-bg': '#faf3e2', /* oklch(0.960 0.025 80) */
          exported: '#2a8aad',    /* oklch(0.590 0.095 220) */
          'exported-bg': '#e5f3f8', /* oklch(0.955 0.020 220) */
          new: '#c0453a',         /* oklch(0.545 0.155 25) */
          'new-bg': '#fbe8e6',    /* oklch(0.950 0.025 25) */
          draft: '#697585',       /* oklch(0.535 0.018 260) */
          'draft-bg': '#f0f1f4',  /* oklch(0.955 0.006 260) */
        },
        action: {
          blue: '#2a8aad',        /* oklch(0.590 0.095 220) */
          'blue-hover': '#237a9a', /* oklch(0.540 0.090 220) */
        },
        /* Semantic surface tokens */
        surface: {
          page: '#f4f6fa',
          card: '#ffffff',
          muted: '#f8f9fc',
          subtle: '#eef1f6',
        },
        ink: {
          primary: '#1c2640',
          secondary: '#506488',
          tertiary: '#8893a8',
          muted: '#a4adbf',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '12px',
        'xl': '10px',
        'lg': '8px',
        'md': '6px',
      },
      boxShadow: {
        'card': '0 1px 3px oklch(0.20 0.01 264 / 0.06), 0 1px 2px oklch(0.20 0.01 264 / 0.04)',
        'card-hover': '0 4px 12px oklch(0.20 0.01 264 / 0.08), 0 2px 4px oklch(0.20 0.01 264 / 0.04)',
        'sidebar': '1px 0 0 oklch(0.90 0.006 264)',
        'dropdown': '0 4px 24px oklch(0.15 0.02 264 / 0.12), 0 1px 3px oklch(0.15 0.02 264 / 0.08)',
        'header': '0 1px 0 oklch(0.30 0.02 264)',
        'inset': 'inset 0 1px 2px oklch(0.20 0.01 264 / 0.06)',
        'ring': '0 0 0 2px oklch(0.625 0.142 58 / 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
