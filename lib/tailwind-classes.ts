// BRENNHOLZ SHOP - VOLLSTÄNDIGE TAILWIND KLASSEN KONFIGURATION
// Diese Datei stellt sicher, dass alle Tailwind-Klassen beim Build erkannt werden

export const TAILWIND_CLASSES = {
  // ===== BRENNHOLZ THEME FARBEN =====
  colors: {
    primary: {
      bg: 'bg-[#C04020]',
      bgHover: 'bg-[#A03318]',
      text: 'text-[#C04020]',
      border: 'border-[#C04020]'
    },
    wood: {
      bg: 'bg-[#F5F0E0]',
      text: 'text-[#8B4513]'
    },
    backgrounds: [
      'bg-transparent', 'bg-white', 'bg-black',
      'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400',
      'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
      'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500'
    ],
    textColors: [
      'text-white', 'text-black', 'text-gray-100', 'text-gray-300', 'text-gray-500',
      'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900'
    ]
  },

  // ===== LAYOUT SYSTEM =====
  layout: {
    container: [
      'container', 'mx-auto', 'px-4',
      'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl',
      'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-full'
    ],
    display: [
      'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'hidden'
    ],
    position: [
      'static', 'fixed', 'absolute', 'relative', 'sticky',
      'top-0', 'right-0', 'bottom-0', 'left-0',
      'z-50', 'z-40', 'z-30', 'z-20', 'z-10'
    ]
  },

  // ===== FLEXBOX SYSTEM =====
  flexbox: {
    direction: ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'],
    wrap: ['flex-wrap', 'flex-wrap-reverse', 'flex-nowrap'],
    justify: ['justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly'],
    align: ['items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch']
  },

  // ===== GRID SYSTEM =====
  grid: {
    columns: [
      'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 
      'grid-cols-5', 'grid-cols-6', 'grid-cols-12'
    ],
    gaps: ['gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12']
  },

  // ===== SPACING SYSTEM =====
  spacing: {
    padding: [
      'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12', 'p-16', 'p-20', 'p-24',
      'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'px-12',
      'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'py-12',
      'pt-0', 'pt-4', 'pt-8', 'pr-0', 'pr-4', 'pr-8', 'pb-0', 'pb-4', 'pb-8', 'pl-0', 'pl-4', 'pl-8'
    ],
    margin: [
      'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8', 'm-12',
      'mx-auto', 'my-4', 'my-8',
      'mt-0', 'mt-4', 'mt-8', 'mb-4', 'mb-8', 'ml-4', 'mr-4'
    ]
  },

  // ===== GRÖSSEN SYSTEM =====
  sizing: {
    width: [
      'w-0', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-64',
      'w-full', 'w-auto', 'w-screen',
      'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4'
    ],
    height: [
      'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-48', 'h-64',
      'h-full', 'h-screen', 'h-auto',
      'min-h-screen', 'min-h-full'
    ]
  },

  // ===== TYPOGRAFIE =====
  typography: {
    fontFamily: ['font-sans', 'font-serif', 'font-mono', 'font-[\'Pacifico\']'],
    fontSize: [
      'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 
      'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'
    ],
    fontWeight: [
      'font-thin', 'font-light', 'font-normal', 'font-medium', 
      'font-semibold', 'font-bold', 'font-extrabold', 'font-black'
    ],
    textAlign: ['text-left', 'text-center', 'text-right'],
    textTransform: ['uppercase', 'lowercase', 'capitalize'],
    textDecoration: ['underline', 'no-underline']
  },

  // ===== BORDERS & EFFECTS =====
  borders: {
    width: ['border', 'border-0', 'border-2', 'border-4'],
    colors: ['border-gray-100', 'border-gray-200', 'border-gray-300'],
    radius: [
      'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full', 'rounded-none'
    ]
  },

  effects: {
    shadow: ['shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none'],
    opacity: ['opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100'],
    blur: ['blur-sm', 'backdrop-blur-sm']
  },

  // ===== RESPONSIVE BREAKPOINTS =====
  responsive: {
    sm: [
      'sm:block', 'sm:flex', 'sm:grid', 'sm:hidden',
      'sm:grid-cols-2', 'sm:grid-cols-3',
      'sm:text-lg', 'sm:px-6'
    ],
    md: [
      'md:block', 'md:flex', 'md:grid', 'md:hidden',
      'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
      'md:text-xl', 'md:h-20', 'md:px-8'
    ],
    lg: [
      'lg:block', 'lg:flex', 'lg:grid', 'lg:hidden',
      'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5',
      'lg:text-2xl', 'lg:px-12'
    ],
    xl: [
      'xl:grid-cols-6', 'xl:text-3xl'
    ]
  },

  // ===== INTERACTIVE STATES =====
  interactive: {
    hover: [
      'hover:bg-gray-100', 'hover:bg-[#A03318]', 'hover:text-white',
      'hover:shadow-lg', 'hover:scale-105'
    ],
    focus: [
      'focus:outline-none', 'focus:ring-2', 'focus:ring-[#C04020]'
    ],
    active: [
      'active:bg-[#A03318]', 'active:scale-95'
    ]
  },

  // ===== TRANSITIONS & TRANSFORMS =====
  animations: {
    transition: ['transition', 'transition-all', 'duration-200', 'duration-300', 'ease-in-out'],
    transform: ['scale-95', 'scale-100', 'scale-105', 'rotate-0', 'rotate-45', 'rotate-90']
  },

  // ===== UTILITY KLASSEN =====
  utilities: {
    cursor: ['cursor-pointer', 'cursor-default'],
    overflow: ['overflow-hidden', 'overflow-auto', 'overflow-x-auto'],
    whitespace: ['whitespace-nowrap', 'whitespace-pre-wrap'],
    objectFit: ['object-cover', 'object-contain', 'object-top']
  }
};

// ===== BRENNHOLZ SPEZIFISCHE KOMPONENTEN =====
export const BRENNHOLZ_COMPONENTS = {
  // Primary Button
  primaryButton: [
    'bg-[#C04020]', 'text-white', 'px-6', 'py-4', 'rounded-xl', 'font-bold',
    'hover:bg-[#A03318]', 'transition-all', 'duration-200', 'cursor-pointer', 'whitespace-nowrap'
  ],

  // Secondary Button
  secondaryButton: [
    'bg-white', 'text-[#C04020]', 'border-2', 'border-[#C04020]', 'px-6', 'py-4', 'rounded-xl',
    'hover:bg-[#C04020]', 'hover:text-white', 'transition-all', 'duration-200', 'cursor-pointer', 'whitespace-nowrap'
  ],

  // Standard Card
  card: [
    'bg-white', 'rounded-lg', 'shadow-sm', 'p-6', 'border', 'border-gray-100'
  ],

  // Hero Card
  heroCard: [
    'bg-gradient-to-r', 'from-[#F5F0E0]', 'to-white', 'rounded-xl', 'p-8', 'shadow-lg'
  ],

  // Input Field
  input: [
    'w-full', 'px-4', 'py-3', 'border', 'border-gray-300', 'rounded-lg',
    'focus:ring-2', 'focus:ring-[#C04020]', 'focus:outline-none', 'text-sm'
  ],

  // Header Layout
  header: [
    'sticky', 'top-0', 'z-50', 'bg-white/95', 'backdrop-blur-sm', 'border-b', 'border-gray-100'
  ],

  // Header Container
  headerContainer: [
    'container', 'mx-auto', 'px-4', 'flex', 'justify-between', 'items-center', 'h-16', 'md:h-20'
  ],

  // Logo Style
  logo: [
    'font-[\'Pacifico\']', 'text-2xl', 'text-[#C04020]', 'font-bold'
  ],

  // Icon Wrapper
  iconWrapper: [
    'w-6', 'h-6', 'flex', 'items-center', 'justify-center'
  ],

  // Dashboard Layout
  dashboardContainer: [
    'min-h-screen', 'bg-gray-50'
  ],

  // Stats Grid
  statsGrid: [
    'grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-6'
  ],

  // Product Grid
  productGrid: [
    'grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'gap-6'
  ]
};

// ===== GRADIENT KOMBINATIONEN =====
export const GRADIENTS = {
  hero: 'bg-gradient-to-r from-[#F5F0E0] to-white',
  button: 'bg-gradient-to-r from-[#C04020] to-[#A03318]',
  card: 'bg-gradient-to-t from-gray-50 to-white',
  warm: 'bg-gradient-to-br from-orange-50 to-amber-50'
};

// ===== ALLE KLASSEN FÜR BUILD OPTIMIZATION =====
export const ALL_TAILWIND_CLASSES = [
  // Flatten all class arrays
  ...Object.values(TAILWIND_CLASSES).flatMap(category => 
    typeof category === 'object' && !Array.isArray(category) 
      ? Object.values(category).flat() 
      : Array.isArray(category) ? category : []
  ),
  ...Object.values(BRENNHOLZ_COMPONENTS).flat(),
  // Custom Brennholz Klassen
  'bg-[#C04020]', 'bg-[#A03318]', 'bg-[#F5F0E0]', 'bg-[#1A1A1A]',
  'text-[#C04020]', 'text-[#A03318]', 'text-[#1A1A1A]',
  'border-[#C04020]', 'border-[#A03318]',
  'ring-[#C04020]', 'focus:ring-[#C04020]'
];

// Export für Verwendung in Komponenten
export default TAILWIND_CLASSES;