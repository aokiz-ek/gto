// GTO Wizard Inspired Theme - Professional dark mode poker training UI

export const theme = {
  colors: {
    // Base colors - darker, more professional
    background: '#0d0d0d',
    backgroundAlt: '#000000',
    surface: '#1a1a1a',
    surfaceHover: '#242424',
    surfaceLight: '#2a2a2a',
    surfaceBorder: '#333333',

    // Text hierarchy
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textMuted: '#666666',
    textDisabled: '#4d4d4d',

    // Primary - Teal/Cyan accent (cleaner, less neon)
    primary: '#22d3bf',
    primaryHover: '#14b8a6',
    primaryDark: '#0d9488',
    primaryMuted: 'rgba(34, 211, 191, 0.15)',
    primaryGlow: 'rgba(34, 211, 191, 0.25)',

    // Secondary - Blue
    secondary: '#3b82f6',
    secondaryHover: '#2563eb',
    secondaryDark: '#1d4ed8',
    secondaryMuted: 'rgba(59, 130, 246, 0.15)',

    // Accent - Purple/Violet
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    accentDark: '#6d28d9',
    accentMuted: 'rgba(139, 92, 246, 0.15)',

    // Action colors - poker specific
    raise: '#ef4444',
    raiseHover: '#dc2626',
    raiseMuted: 'rgba(239, 68, 68, 0.15)',
    call: '#22c55e',
    callHover: '#16a34a',
    callMuted: 'rgba(34, 197, 94, 0.15)',
    fold: '#6b7280',
    foldHover: '#4b5563',
    foldMuted: 'rgba(107, 114, 128, 0.15)',
    check: '#3b82f6',
    checkMuted: 'rgba(59, 130, 246, 0.15)',
    allIn: '#f59e0b',
    allInHover: '#d97706',
    allInMuted: 'rgba(245, 158, 11, 0.15)',
    bet: '#a855f7',
    betMuted: 'rgba(168, 85, 247, 0.15)',

    // Status
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.15)',
    info: '#3b82f6',
    infoMuted: 'rgba(59, 130, 246, 0.15)',

    // Suits - standard poker colors
    hearts: '#ef4444',
    diamonds: '#3b82f6',
    clubs: '#22c55e',
    spades: '#ffffff',

    // Range matrix colors
    rangeHigh: '#22c55e',
    rangeMedium: '#eab308',
    rangeLow: '#ef4444',
    rangeEmpty: '#1a1a1a',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #22d3bf 0%, #3b82f6 100%)',
    secondary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    surface: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
    dark: 'linear-gradient(180deg, #242424 0%, #1a1a1a 100%)',
    gold: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(34, 211, 191, 0.2)',
    glowStrong: '0 0 30px rgba(34, 211, 191, 0.3)',
  },

  borders: {
    radius: {
      none: '0',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      xxl: '16px',
      full: '9999px',
    },
  },

  spacing: {
    px: '1px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyMono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '30px',
      '5xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  transitions: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof theme;
