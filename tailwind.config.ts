import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6FAF6',
          100: '#B3F0E3',
          200: '#80E6D0',
          300: '#4DDBBD',
          400: '#26D4AF',
          500: '#0ED7B5',
          600: '#0BBFA0',
          700: '#08A688',
          800: '#068D70',
          900: '#036350',
        },
        accent: {
          50: '#E8F1FB',
          100: '#BDD6F4',
          200: '#92BBED',
          300: '#67A0E6',
          400: '#4B8FE0',
          500: '#2E7DD1',
          600: '#2468B5',
          700: '#1A5399',
          800: '#103E7D',
          900: '#0A2D5E',
        },
        navy: {
          800: '#0A1628',
          900: '#060D1B',
          950: '#030812',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0ED7B5, #2E7DD1)',
        'gradient-brand-hover': 'linear-gradient(135deg, #26D4AF, #4B8FE0)',
      },
    },
  },
  plugins: [],
};

export default config;
