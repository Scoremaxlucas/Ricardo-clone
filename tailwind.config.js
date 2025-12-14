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
          DEFAULT: '#0d9488',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          DEFAULT: '#fbbf24',
          50: '#fff9e6',
          100: '#ffefb3',
          200: '#ffe580',
          300: '#ffdb4d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          legacy: '#FFD95C',
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
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      lineHeight: {
        'tight': '1.1',
        'snug': '1.25',
        'normal': '1.5',
        'relaxed': '1.6',
        'loose': '1.8',
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.02em',
        'widest': '0.05em',
      },
      /* PHASE 3.2: Spacing-System */
      spacing: {
        '0': '0',
        'px': '1px',
        '0.5': '0.125rem',  /* 2px */
        '1': '0.25rem',     /* 4px */
        '1.5': '0.375rem',  /* 6px */
        '2': '0.5rem',      /* 8px */
        '2.5': '0.625rem',  /* 10px */
        '3': '0.75rem',     /* 12px */
        '3.5': '0.875rem',  /* 14px */
        '4': '1rem',        /* 16px - Base */
        '5': '1.25rem',     /* 20px */
        '6': '1.5rem',      /* 24px */
        '7': '1.75rem',     /* 28px */
        '8': '2rem',        /* 32px */
        '9': '2.25rem',     /* 36px */
        '10': '2.5rem',     /* 40px */
        '11': '2.75rem',    /* 44px - Touch Target */
        '12': '3rem',       /* 48px */
        '14': '3.5rem',     /* 56px */
        '16': '4rem',       /* 64px */
        '20': '5rem',       /* 80px */
        '24': '6rem',       /* 96px */
        '28': '7rem',       /* 112px */
        '32': '8rem',       /* 128px */
        '36': '9rem',       /* 144px */
        '40': '10rem',      /* 160px */
        '44': '11rem',      /* 176px */
        '48': '12rem',      /* 192px */
        '52': '13rem',      /* 208px */
        '56': '14rem',      /* 224px */
        '60': '15rem',      /* 240px */
        '64': '16rem',      /* 256px */
        '72': '18rem',      /* 288px */
        '80': '20rem',      /* 320px */
        '96': '24rem',      /* 384px */
      },
      maxWidth: {
        'xs': '20rem',      /* 320px - Mobile */
        'sm': '24rem',      /* 384px */
        'md': '28rem',      /* 448px */
        'lg': '32rem',      /* 512px */
        'xl': '36rem',      /* 576px */
        '2xl': '42rem',     /* 672px */
        '3xl': '48rem',     /* 768px */
        '4xl': '56rem',     /* 896px */
        '5xl': '64rem',     /* 1024px */
        '6xl': '72rem',     /* 1152px */
        '7xl': '80rem',     /* 1280px */
        'content': '65ch',  /* Optimale Lesebreite */
        'prose': '75ch',    /* Für längere Texte */
        'container': '1400px',
        'wide': '1600px',
        'full': '100%',
        'screen': '100vw',
      },
      gap: {
        'section': '4rem',   /* 64px - Zwischen Sections */
        'card': '1.5rem',    /* 24px - Zwischen Cards */
        'element': '1rem',   /* 16px - Zwischen Elementen */
        'tight': '0.5rem',   /* 8px - Enge Abstände */
      },
      padding: {
        'section': '4rem',      /* 64px */
        'section-sm': '2rem',   /* 32px */
        'container': '1rem',    /* 16px */
        'container-sm': '1.5rem', /* 24px */
        'container-lg': '2rem', /* 32px */
      },
      margin: {
        'section': '4rem',      /* 64px */
        'section-sm': '2rem',   /* 32px */
      },
    },
  },
  plugins: [],
}
