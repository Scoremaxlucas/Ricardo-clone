/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d9488', /* Dunkleres Teal für bessere Lesbarkeit (WCAG AA) */
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488', /* Für CTAs und wichtige Elemente */
          700: '#0f766e', /* Für maximale Kontraste */
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          DEFAULT: '#fbbf24', /* Dunkleres Gelb für besseren Kontrast (WCAG AA) */
          50: '#fff9e6',
          100: '#ffefb3',
          200: '#ffe580',
          300: '#ffdb4d',
          400: '#fbbf24', /* Neuer Standard für besseren Kontrast */
          500: '#f59e0b', /* Dunkleres Gelb */
          600: '#d97706', /* Noch dunkler */
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          /* Legacy: Behalte alte Werte für Rückwärtskompatibilität */
          legacy: '#FFD95C', /* Altes helles Gelb - nur für spezielle Fälle */
        },
        orange: {
          DEFAULT: '#f97316',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        neutral: {
          white: '#FFFFFF',
          gray: {
            light: '#F4F4F4',
            medium: '#C6C6C6',
            dark: '#3A3A3A',
          },
        },
        // Legacy support
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
