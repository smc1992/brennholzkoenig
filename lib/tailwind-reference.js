// Tailwind CSS Klassen Referenz für Brennholzkönig

export const tailwindClasses = {
  // Layout Container
  container: [
    'container mx-auto px-4',
    'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'w-full max-w-screen-xl mx-auto',
  ],

  // Grid Systeme
  grid: {
    basic: 'grid gap-4',
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  },

  // Flex Layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    column: 'flex flex-col',
    wrap: 'flex flex-wrap gap-4',
  },

  // Buttons
  buttons: {
    primary: 'bg-primary-700 hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer',
    secondary: 'bg-white hover:bg-gray-50 text-primary-700 border-2 border-primary-700 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer',
    ghost: 'hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
  },

  // Cards
  cards: {
    basic: 'bg-white rounded-lg shadow-soft p-6',
    elevated: 'bg-white rounded-xl shadow-medium p-6 hover:shadow-strong transition-shadow',
    gradient: 'bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white',
    stats: 'bg-white rounded-lg shadow-soft p-6 border-l-4 border-primary-600',
  },

  // Navigation
  navigation: {
    header: 'sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100',
    nav: 'flex items-center justify-between h-16 px-4',
    links: 'text-gray-700 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
  },

  // Typography
  typography: {
    h1: 'text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight',
    h2: 'text-2xl md:text-3xl font-bold text-gray-900 leading-tight',
    h3: 'text-xl md:text-2xl font-semibold text-gray-900',
    h4: 'text-lg md:text-xl font-semibold text-gray-900',
    body: 'text-gray-600 leading-relaxed',
    lead: 'text-lg text-gray-600 leading-relaxed',
  },

  // Spacing
  spacing: {
    section: 'py-16 md:py-24',
    container: 'px-4 sm:px-6 lg:px-8',
    stack: 'space-y-4',
    inline: 'space-x-4',
  },

  // Forms
  forms: {
    input: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm',
    textarea: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none',
    select: 'w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none',
    label: 'block text-sm font-medium text-gray-700 mb-2',
    error: 'text-sm text-red-600 mt-1',
  },

  // States & Effects
  states: {
    loading: 'animate-pulse',
    disabled: 'opacity-50 cursor-not-allowed',
    active: 'bg-primary-50 text-primary-700 border-primary-700',
    hover: 'hover:shadow-lg transition-shadow',
  },

  // Responsive Breakpoints
  responsive: {
    sm: 'sm:', // >= 640px
    md: 'md:', // >= 768px
    lg: 'lg:', // >= 1024px
    xl: 'xl:', // >= 1280px
    '2xl': '2xl:', // >= 1536px
  },

  // Brand Colors (Ihre Custom Farben)
  colors: {
    primary: {
      bg: 'bg-primary-700',
      text: 'text-primary-700',
      border: 'border-primary-700',
      hover: 'hover:bg-primary-800',
    },
    wood: {
      bg: 'bg-wood-100',
      text: 'text-wood-800',
      border: 'border-wood-300',
    },
    accent: {
      bg: 'bg-accent-600',
      text: 'text-accent-600',
      border: 'border-accent-600',
    }
  },

  // Icons (Remix Icons)
  icons: {
    wrapper: 'w-6 h-6 flex items-center justify-center',
    small: 'w-4 h-4 flex items-center justify-center',
    large: 'w-8 h-8 flex items-center justify-center',
  },

  // Animations
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    bounce: 'animate-bounce-gentle',
  }
};

// Utility Funktionen
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getButtonClass = (variant = 'primary', size = 'md') => {
  const baseClasses = 'font-medium transition-colors whitespace-nowrap cursor-pointer';
  const variants = {
    primary: 'bg-primary-700 hover:bg-primary-800 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-primary-700 border-2 border-primary-700',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-sm rounded-lg',
    lg: 'px-8 py-4 text-base rounded-xl',
  };
  
  return combineClasses(baseClasses, variants[variant], sizes[size]);
};

export const getCardClass = (variant = 'basic') => {
  const variants = {
    basic: 'bg-white rounded-lg shadow-soft p-6',
    elevated: 'bg-white rounded-xl shadow-medium p-6 hover:shadow-strong transition-shadow',
    gradient: 'bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white',
    stats: 'bg-white rounded-lg shadow-soft p-6 border-l-4 border-primary-600',
  };
  
  return variants[variant];
};