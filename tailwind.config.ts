import type { Config } from 'tailwindcss';

/**
 * Tailwind mirrors `--svj-*` from app/globals.css. CSS is the source of truth;
 * this file only exposes utilities. See DESIGN.md "App mapping".
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        svj: {
          blue: {
            500: 'var(--svj-blue-500)',
            600: 'var(--svj-blue-600)',
            700: 'var(--svj-blue-700)',
            800: 'var(--svj-blue-800)',
          },
          navy: {
            600: 'var(--svj-navy-600)',
            700: 'var(--svj-navy-700)',
            800: 'var(--svj-navy-800)',
            900: 'var(--svj-navy-900)',
          },
          white: 'var(--svj-white)',
          paper: 'var(--svj-paper)',
          gray: {
            100: 'var(--svj-gray-100)',
            200: 'var(--svj-gray-200)',
            400: 'var(--svj-gray-400)',
            600: 'var(--svj-gray-600)',
            800: 'var(--svj-gray-800)',
          },
          black: 'var(--svj-black)',
          tatami: {
            red: 'var(--svj-tatami-red)',
            green: 'var(--svj-tatami-green)',
            gray: 'var(--svj-tatami-gray)',
          },
          danger: 'var(--svj-danger)',
        },
        brand: {
          blue: 'var(--svj-blue-600)',
          'blue-hover': 'var(--svj-blue-700)',
        },
      },
      fontFamily: {
        logo: ['var(--font-logo)', 'Eurostile', 'Arial Black', 'sans-serif'],
        heading: ['var(--font-heading)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['var(--font-body)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'svj-display': 'var(--svj-fs-display)',
        'svj-h1': 'var(--svj-fs-h1)',
        'svj-h2': 'var(--svj-fs-h2)',
        'svj-h3': 'var(--svj-fs-h3)',
        'svj-h4': 'var(--svj-fs-h4)',
        'svj-body-lg': 'var(--svj-fs-body-lg)',
        'svj-body': 'var(--svj-fs-body)',
        'svj-body-sm': 'var(--svj-fs-body-sm)',
        'svj-caption': 'var(--svj-fs-caption)',
        'svj-eyebrow': 'var(--svj-fs-eyebrow)',
      },
      boxShadow: {
        neo: 'var(--svj-shadow-neo)',
        'neo-hover': 'var(--svj-shadow-neo-hover)',
        'svj-card': 'var(--svj-shadow-card)',
        'svj-raised': 'var(--svj-shadow-raised)',
      },
      borderRadius: {
        'svj-control': 'var(--svj-radius-control)',
        'svj-input': 'var(--svj-radius-input)',
        'svj-card': 'var(--svj-radius-card)',
        'svj-pill': 'var(--svj-radius-pill)',
      },
      spacing: {
        'svj-1': 'var(--svj-space-1)',
        'svj-2': 'var(--svj-space-2)',
        'svj-3': 'var(--svj-space-3)',
        'svj-4': 'var(--svj-space-4)',
        'svj-5': 'var(--svj-space-5)',
        'svj-6': 'var(--svj-space-6)',
        'svj-7': 'var(--svj-space-7)',
        'svj-8': 'var(--svj-space-8)',
        'svj-9': 'var(--svj-space-9)',
        'svj-10': 'var(--svj-space-10)',
      },
    },
  },
  plugins: [],
};
export default config;
