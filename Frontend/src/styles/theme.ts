// Base theme colors
const colors = {
  // Primary colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary colors
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#10b981',
    700: '#047857',
  },
  
  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    700: '#b45309',
  },
  
  // Error
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    700: '#b91c1c',
  },
  
  // Info
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    700: '#1d4ed8',
  },
};

// Base theme configuration
const baseTheme = {
  colors,
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  radii: {
    none: '0',
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    '2xl': '1rem',  // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem', // 2px
    1: '0.25rem',   // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',    // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',   // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem',    // 256px
  },
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
  },
  transitions: {
    default: 'all 0.2s ease-in-out',
    colors: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',
    transform: 'transform 0.2s ease-in-out',
  },
};

// Light theme
const lightTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    'card-foreground': '#111827',
    popover: '#ffffff',
    'popover-foreground': '#111827',
    primary: baseTheme.colors.primary[600],
    'primary-foreground': '#ffffff',
    secondary: baseTheme.colors.secondary[600],
    'secondary-foreground': '#ffffff',
    muted: baseTheme.colors.gray[100],
    'muted-foreground': baseTheme.colors.gray[600],
    accent: baseTheme.colors.gray[100],
    'accent-foreground': baseTheme.colors.gray[900],
    destructive: baseTheme.colors.error[500],
    'destructive-foreground': '#ffffff',
    border: baseTheme.colors.gray[200],
    input: baseTheme.colors.gray[200],
    ring: baseTheme.colors.primary[500],
  },
};

// Dark theme
const darkTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    'card-foreground': '#f8fafc',
    popover: '#1e293b',
    'popover-foreground': '#f8fafc',
    primary: baseTheme.colors.primary[500],
    'primary-foreground': '#ffffff',
    secondary: baseTheme.colors.secondary[400],
    'secondary-foreground': '#ffffff',
    muted: baseTheme.colors.gray[800],
    'muted-foreground': baseTheme.colors.gray[400],
    accent: baseTheme.colors.gray[800],
    'accent-foreground': baseTheme.colors.gray[100],
    destructive: baseTheme.colors.error[700],
    'destructive-foreground': '#ffffff',
    border: baseTheme.colors.gray[700],
    input: baseTheme.colors.gray[700],
    ring: baseTheme.colors.primary[500],
  },
};

export { lightTheme, darkTheme };
