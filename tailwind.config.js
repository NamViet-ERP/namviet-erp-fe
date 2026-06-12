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
        /* ══════════════════════════════════════════════════════
           Material Design 3 — Navy Blue Seed (#0E3063)
           Each token references the CSS custom property defined in
           src/index.css, so Tailwind utilities (bg-md-primary) and
           arbitrary values (bg-[var(--md-primary)]) behave identically
           AND both adapt automatically to dark mode.
           ══════════════════════════════════════════════════════ */
        md: {
          /* Primary */
          primary:                'var(--md-primary)',
          'on-primary':           'var(--md-on-primary)',
          'primary-container':    'var(--md-primary-container)',
          'on-primary-container': 'var(--md-on-primary-container)',

          /* Secondary */
          secondary:                'var(--md-secondary)',
          'on-secondary':           'var(--md-on-secondary)',
          'secondary-container':    'var(--md-secondary-container)',
          'on-secondary-container': 'var(--md-on-secondary-container)',

          /* Tertiary */
          tertiary:                'var(--md-tertiary)',
          'on-tertiary':           'var(--md-on-tertiary)',
          'tertiary-container':    'var(--md-tertiary-container)',
          'on-tertiary-container': 'var(--md-on-tertiary-container)',

          /* Surface system */
          surface:                  'var(--md-surface)',
          'on-surface':             'var(--md-on-surface)',
          'surface-variant':        'var(--md-surface-variant)',
          'on-surface-variant':     'var(--md-on-surface-variant)',
          'surface-container':      'var(--md-surface-container)',
          'surface-container-low':  'var(--md-surface-container-low)',
          'surface-container-high': 'var(--md-surface-container-high)',
          'inverse-surface':        'var(--md-inverse-surface)',
          'inverse-on-surface':     'var(--md-inverse-on-surface)',

          /* Outline */
          outline:           'var(--md-outline)',
          'outline-variant': 'var(--md-outline-variant)',

          /* Error */
          error:                'var(--md-error)',
          'on-error':           'var(--md-on-error)',
          'error-container':    'var(--md-error-container)',
          'on-error-container': 'var(--md-on-error-container)',

          /* Status tonal (containers) */
          success:                'var(--md-success)',
          'success-container':    'var(--md-success-container)',
          'on-success-container': 'var(--md-on-success-container)',

          warning:                'var(--md-warning)',
          'warning-container':    'var(--md-warning-container)',
          'on-warning-container': 'var(--md-on-warning-container)',

          info:                'var(--md-info)',
          'info-container':    'var(--md-info-container)',
          'on-info-container': 'var(--md-on-info-container)',
        },

        /* Status accent tokens for icons / charts / dots — adapt to dark mode */
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          info:    'var(--status-info)',
          error:   'var(--status-error)',
        },
      },

      fontFamily: {
        roboto: ['Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        sans:   ['Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },

      fontSize: {
        /* MD3 Type Scale */
        'md-display-lg':  ['3.5rem',   { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '400' }],
        'md-headline-lg': ['3rem',     { lineHeight: '1.2',  letterSpacing: '-0.01em',  fontWeight: '500' }],
        'md-headline-md': ['2rem',     { lineHeight: '1.25', letterSpacing: '0',        fontWeight: '500' }],
        'md-title-lg':    ['1.5rem',   { lineHeight: '1.3',  letterSpacing: '0',        fontWeight: '500' }],
        'md-title-md':    ['1.25rem',  { lineHeight: '1.4',  letterSpacing: '0.005em',  fontWeight: '500' }],
        'md-title-sm':    ['0.875rem', { lineHeight: '1.4',  letterSpacing: '0.01em',   fontWeight: '500' }],
        'md-body-lg':     ['1rem',     { lineHeight: '1.5',  letterSpacing: '0.015em',  fontWeight: '400' }],
        'md-body-md':     ['0.875rem', { lineHeight: '1.5',  letterSpacing: '0.01em',   fontWeight: '400' }],
        'md-label-lg':    ['0.875rem', { lineHeight: '1.4',  letterSpacing: '0.01em',   fontWeight: '500' }],
        'md-label-md':    ['0.75rem',  { lineHeight: '1.4',  letterSpacing: '0.04em',   fontWeight: '500' }],
        'md-label-sm':    ['0.6875rem',{ lineHeight: '1.3',  letterSpacing: '0.04em',   fontWeight: '500' }],
      },

      borderRadius: {
        'md-xs':  '8px',
        'md-sm':  '12px',
        'md':     '16px',
        'md-lg':  '24px',
        'md-xl':  '28px',
        'md-2xl': '32px',
        'md-3xl': '48px',
      },

      boxShadow: {
        /* MD3 Elevation levels */
        'md-1': '0 1px 2px 0 rgba(0,0,0,0.08), 0 1px 3px 1px rgba(0,0,0,0.06)',
        'md-2': '0 1px 2px 0 rgba(0,0,0,0.1),  0 2px 6px 2px rgba(0,0,0,0.08)',
        'md-3': '0 4px 8px 3px rgba(0,0,0,0.1), 0 1px 3px 0 rgba(0,0,0,0.1)',
        'md-4': '0 6px 10px 4px rgba(0,0,0,0.1),0 2px 3px 0 rgba(0,0,0,0.1)',
        'md-5': '0 8px 12px 6px rgba(0,0,0,0.1),0 4px 4px 0 rgba(0,0,0,0.1)',
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

      /* Keyframes + animations live in a single source: src/index.css
         (the app uses the .animate-fade-in / .animate-scale-in / .animate-slide-up
         utilities defined there). Don't redeclare them here. */
    },
  },
  plugins: [],
}
