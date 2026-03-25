import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A237E',
          light: '#1565C0',
          lighter: '#1976D2',
          pale: '#E8EAF6',
          hover: '#1565C0'
        },
        secondary: {
          DEFAULT: '#E8EAF6',
          hover: '#C5CAE9'
        },
        accent: {
          DEFAULT: '#E53935',
          light: '#FFEBEE'
        },
        success: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9'
        },
        warning: {
          DEFAULT: '#E65100',
          light: '#FFF3E0'
        },
        background: '#F5F7FA',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#EEF2FF'
        },
        border: '#E0E7EF',
        text: {
          primary: '#0D1B2A',
          secondary: '#546E7A',
          muted: '#94A3B8'
        },
        brand: {
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          hover: '#EEF2FF',
          border: '#E0E7EF',
          text: '#0D1B2A',
          muted: '#546E7A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.07)',
        hover: '0 4px 16px rgba(0,0,0,0.10)',
        modal: '0 8px 32px rgba(0,0,0,0.18)'
      },
      height: {
        topbar: '64px'
      }
    },
  },
  plugins: [],
} satisfies Config;
