/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--nv-action)',
          50:  'color-mix(in srgb, var(--nv-action) 8%, var(--md-surface-container))',
          100: 'var(--md-primary-container)',
          300: 'color-mix(in srgb, var(--nv-action) 55%, var(--md-surface-container))',
          400: 'color-mix(in srgb, var(--nv-action) 80%, var(--md-surface-container))',
          500: 'var(--nv-action)',
          600: 'var(--nv-action)',
          700: 'var(--nv-action-hover)',
          950: 'var(--md-on-primary-container)',
        },
        /* Status accent tokens defined in src/styles/tokens.css */
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          info:    'var(--status-info)',
          error:   'var(--status-error)',
        },
      },

      fontFamily: {
        sans:   ['var(--font-sans)'],
        roboto: ['var(--font-sans)'],
        mono:   ['var(--font-mono)'],
      },

      /* Radii & elevation tokens live in src/styles/tokens.css */
      borderRadius: {
        md: 'var(--radius-xs)',    // 6px  (inputs, chips, badges)
        lg: 'var(--radius-sm)',    // 8px  (buttons, segmented controls)
        xl: 'var(--radius-md)',    // 12px (cards, panels, table wrappers)
        '2xl': 'var(--radius-lg)', // 16px (modals, sheets)
      },

      boxShadow: {
        'md-1': 'var(--md-shadow-1)',
        'md-2': 'var(--md-shadow-2)',
        'md-3': 'var(--md-shadow-3)',
        'md-4': 'var(--md-shadow-4)',
      },

      transitionTimingFunction: {
        'md': 'cubic-bezier(0.2, 0, 0, 1)',
        'md-accel': 'cubic-bezier(0.3, 0, 1, 1)',
        'md-decel': 'cubic-bezier(0, 0, 0, 1)',
      },

      transitionDuration: {
        'md-fast': '150ms',
        'md':      '200ms',
        'md-slow': '300ms',
      },

      /* Keyframes + animations live in a single source: src/styles/utilities.css
         (the app uses the .animate-fade-in / .animate-scale-in / .animate-slide-up
         utilities defined there). Don't redeclare them here. */
    },
  },
  plugins: [],
}
