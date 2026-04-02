import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A237E',
          light: '#283593',
          lighter: '#3949AB',
          dark: '#0D1657',
          hover: '#283593',
        },
        secondary: {
          DEFAULT: '#E8EAF6',
          hover: '#C5CAE9'
        },
        accent: {
          DEFAULT: '#00C853',
          dark: '#00A846',
          light: '#E8F5E9',
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
          dark: '#F5F7FA',
          card: '#FFFFFF',
          hover: '#EEF2FF'
        },
        border: '#E0E7EF',
        text: {
          primary: '#1A1A2E',
          secondary: '#546E7A',
          muted: '#90A4AE',
          inverse: '#FFFFFF',
        },
        brand: {
          bg: '#F5F7FA',
          surface: '#FFFFFF',
          hover: '#EEF2FF',
          border: '#E0E7EF',
          text: '#1A1A2E',
          muted: '#546E7A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'sans-serif']
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
