/**
 * Centralized theme configuration file
 * Manages all colors, spacing, and design tokens for the application
 */

export const theme = {
  colors: {
    // Primary gradient (header background)
    primary: {
      900: '#1a0533',
      800: '#3b1a6e',
      700: '#5a2d9e',
    },
    // Accent colors
    accent: {
      orange: '#ff9800',
      amber: '#fbbf24',
      emerald: '#10b981',
      red: '#ef4444',
    },
    // Neutral grayscale
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      150: '#f0f0f0',
      200: '#e5e7eb',
      400: '#9ca3af',
      500: '#6b7280',
      white: '#ffffff',
      black: '#000000',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  
  borderRadius: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '14px',
  },
  
  shadows: {
    sm: '0 1px 4px rgba(0, 0, 0, 0.08)',
    md: '0 2px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  
  // Color purpose mappings for semantic usage
  semantic: {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#000000',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    border: '#e5e7eb',
    divider: '#f0f0f0',
  },
};

/**
 * Get a color from the theme
 * @example
 * getThemeColor('primary.900') // returns '#1a0533'
 * getThemeColor('accent.orange') // returns '#ff9800'
 */
export const getThemeColor = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme.colors);
};

/**
 * Get spacing value
 * @example
 * getSpacing('lg') // returns '16px'
 */
export const getSpacing = (size) => theme.spacing[size];

/**
 * Color palette for quick reference in components
 */
export const palette = {
  purple: {
    very_dark: '#1a0533',
    dark: '#3b1a6e',
    main: '#5a2d9e',
  },
  orange: '#ff9800',
  green: '#10b981',
  red: '#ef4444',
  white: '#ffffff',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    150: '#f0f0f0',
    200: '#e5e7eb',
    400: '#9ca3af',
    600: '#6b7280',
  },
};
