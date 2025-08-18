/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './libs/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '2rem',
        '2xl': '2rem',
      },
    },
    extend: {
      colors: {
        // Brand palettes used across the codebase
        primary: {
          50:  '#FDEDEA',
          100: '#FAD9D3',
          200: '#F3B4A7',
          300: '#EB8F7B',
          400: '#E26950',
          500: '#D84B34',
          600: '#E05030', // flammen-orange (alias)
          700: '#C04020', // brennholz-rot (alias)
          800: '#A03318',
          900: '#6B1F0F',
        },
        accent: {
          50:  '#FFF9E6',
          100: '#FFF1CC',
          200: '#FFE399',
          300: '#FFD666',
          400: '#FFC833',
          500: '#FFBB0A',
          600: '#D4A520', // gold (alias)
          700: '#B8941C',
          800: '#8F7215',
          900: '#5E4B0E',
        },
        wood: {
          50:  '#FBF8F0',
          100: '#F5F0E0', // pergament (alias)
          200: '#EEE6CF',
          300: '#E6DAC0',
          400: '#D9C6A3',
          500: '#CBB789',
          600: '#A18463',
          700: '#7B624A',
          800: '#5A3A28', // holz-braun (alias)
          900: '#3E281C',
        },
        // legacy explicit color names kept for direct usage
        'brennholz-rot': '#C04020',
        'tiefschwarz': '#1A1A1A',
        'pergament': '#F5F0E0',
        'flammen-orange': '#E05030',
        'holz-braun': '#5A3A28',
        'gold': '#D4A520',
        'tannengruen': '#2C5545',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 10px rgba(0, 0, 0, 0.08)',
        strong: '0 10px 20px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(-2%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out both',
        'slide-up': 'slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
      },
      fontFamily: {
        heading: ['"Bebas Neue Pro"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    // Layout & Spacing
    'container',
    'mx-auto',
    'px-4',
    'min-h-dvh',
    'grid',
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'gap-4',
    'gap-6',
    'gap-8',
    'flex',
    'flex-col',
    'flex-row',
    'items-center',
    'justify-center',
    'justify-between',
    
    // Typography
    'text-tiefschwarz',
    'antialiased',
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    'text-2xl',
    'font-bold',
    'font-medium',
    'font-normal',
    
    // Colors
    'bg-pergament',
    'bg-white',
    'bg-primary-500',
    'bg-primary-600',
    'bg-primary-700',
    'bg-accent-500',
    'bg-accent-600',
    'bg-wood-100',
    'bg-wood-800',
    'text-white',
    'text-primary-700',
    'text-accent-600',
    'text-wood-800',
    
    // Components
    'rounded',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'shadow',
    'shadow-sm',
    'shadow-md',
    'border',
    'border-gray-200',
    
    // Interactive
    'hover:bg-primary-600',
    'hover:bg-primary-700',
    'hover:text-white',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'transition',
    'duration-200'
  ]
};

module.exports = config;