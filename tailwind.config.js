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
           Material Design 3 — Purple/Violet Seed (#6750A4)
           Generated tonal palette following MD3 specifications
           ══════════════════════════════════════════════════════ */
        md: {
          /* Primary */
          primary:                '#6750A4',
          'on-primary':           '#FFFFFF',
          'primary-container':    '#EADDFF',
          'on-primary-container': '#21005D',

          /* Secondary */
          secondary:                '#625B71',
          'on-secondary':           '#FFFFFF',
          'secondary-container':    '#E8DEF8',
          'on-secondary-container': '#1D192B',

          /* Tertiary */
          tertiary:                '#7D5260',
          'on-tertiary':           '#FFFFFF',
          'tertiary-container':    '#FFD8E4',
          'on-tertiary-container': '#31111D',

          /* Surface system */
          surface:                '#FFFBFE',
          'on-surface':           '#1C1B1F',
          'surface-variant':      '#E7E0EC',
          'on-surface-variant':   '#49454F',
          'surface-container':    '#F3EDF7',
          'surface-container-low': '#E7E0EC',
          'surface-container-high': '#ECE6F0',
          'inverse-surface':      '#313033',
          'inverse-on-surface':   '#F4EFF4',

          /* Outline */
          outline:         '#79747E',
          'outline-variant': '#CAC4D0',

          /* Error */
          error:              '#B3261E',
          'on-error':         '#FFFFFF',
          'error-container':  '#F9DEDC',
          'on-error-container': '#410E0B',

          /* Status tonal */
          success:              '#386A20',
          'on-success':         '#FFFFFF',
          'success-container':  '#C4EFA4',
          'on-success-container': '#072100',

          warning:              '#7A5100',
          'on-warning':         '#FFFFFF',
          'warning-container':  '#FFDEA1',
          'on-warning-container': '#261900',

          info:              '#005DB6',
          'on-info':         '#FFFFFF',
          'info-container':  '#D5E3FF',
          'on-info-container': '#001B3D',

          /* Dark mode surface system */
          'dark-surface':                '#1C1B1F',
          'dark-on-surface':             '#E6E1E5',
          'dark-surface-variant':        '#49454F',
          'dark-on-surface-variant':     '#CAC4D0',
          'dark-surface-container':      '#211F26',
          'dark-surface-container-low':  '#1D1B20',
          'dark-surface-container-high': '#2B2930',
          'dark-primary':                '#D0BCFF',
          'dark-on-primary':             '#381E72',
          'dark-primary-container':      '#4F378B',
          'dark-on-primary-container':   '#EADDFF',
          'dark-secondary':              '#CCC2DC',
          'dark-on-secondary':           '#332D41',
          'dark-secondary-container':    '#4A4458',
          'dark-on-secondary-container': '#E8DEF8',
          'dark-outline':                '#938F99',
          'dark-outline-variant':        '#49454F',
          'dark-inverse-surface':        '#E6E1E5',
          'dark-inverse-on-surface':     '#313033',
        },
      },

      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        sans:   ['Roboto', 'sans-serif'],
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

      animation: {
        'md-fade-in':  'mdFadeIn 300ms cubic-bezier(0.2,0,0,1) forwards',
        'md-scale-in': 'mdScaleIn 300ms cubic-bezier(0.2,0,0,1) forwards',
        'md-slide-up': 'mdSlideUp 300ms cubic-bezier(0.2,0,0,1) forwards',
        'md-slide-in': 'mdSlideIn 300ms cubic-bezier(0.2,0,0,1) forwards',
      },

      keyframes: {
        mdFadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        mdScaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        mdSlideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        mdSlideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
