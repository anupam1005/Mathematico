// Unified Design System
export const designSystem = {
  colors: {
    // Primary Colors
    primary: '#4F46E5', // Indigo 600 - modern, premium
    primaryDark: '#3730A3',
    primaryLight: '#818CF8',
    
    // Secondary Colors
    secondary: '#EC4899', // Pink 500 for vibrant contrast
    secondaryDark: '#BE185D',
    secondaryLight: '#F472B6',
    
    // Accent Colors
    accent: '#F59E0B',
    accentDark: '#D97706',
    accentLight: '#FBBF24',
    
    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    
    // Neutral Colors
    background: '#F1F5F9', // Slightly deeper background for card contrast
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    
    // Text Colors
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    textInverse: '#ffffff',
    
    // Border Colors
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',
    
    // Level Colors
    foundation: '#10b981',
    intermediate: '#3b82f6',
    advanced: '#8b5cf6',
    expert: '#f59e0b',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  typography: {
    // Headings
    h1: {
      fontSize: 34,
      fontWeight: '800' as const,
      lineHeight: 42,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 30,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    
    // Body Text
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.1,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    
    // Labels
    label: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.1,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  layout: {
    containerPadding: 16,
    cardPadding: 16,
    sectionSpacing: 24,
    itemSpacing: 12,
    minTouchTarget: 44,
    maxContentWidth: 600,
  },
};

// Card Styles
export const cardStyles = {
  base: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginVertical: designSystem.spacing.sm,
    ...designSystem.shadows.md,
    overflow: 'hidden' as const,
  },
  elevated: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginVertical: designSystem.spacing.sm,
    ...designSystem.shadows.lg,
    overflow: 'hidden' as const,
  },
  outlined: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginVertical: designSystem.spacing.sm,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
    overflow: 'hidden' as const,
  },
  compact: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.sm,
    marginVertical: designSystem.spacing.xs,
    ...designSystem.shadows.sm,
    overflow: 'hidden' as const,
  },
};

// Button Styles
export const buttonStyles = {
  primary: {
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...designSystem.shadows.sm,
  },
  secondary: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: designSystem.colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: designSystem.borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: designSystem.colors.borderDark,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: designSystem.colors.surfaceVariant,
  },
};

// Text Styles
export const textStyles = {
  heading: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
  },
  subheading: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
  },
  body: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
  },
  bodySecondary: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  caption: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
  },
  label: {
    ...designSystem.typography.label,
    color: designSystem.colors.textPrimary,
  },
  labelSecondary: {
    ...designSystem.typography.label,
    color: designSystem.colors.textSecondary,
  },
};

// Layout Styles
export const layoutStyles = {
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  content: {
    flex: 1,
    padding: designSystem.layout.containerPadding,
  },
  section: {
    marginBottom: designSystem.layout.sectionSpacing,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  spaceAround: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
};

// Grid Styles
export const gridStyles = {
  container: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  item: {
    width: '48%' as const,
    marginBottom: designSystem.spacing.md,
  },
  itemFull: {
    width: '100%' as const,
    marginBottom: designSystem.spacing.md,
  },
  itemThird: {
    width: '32%' as const,
    marginBottom: designSystem.spacing.md,
  },
};

// List Styles
export const listStyles = {
  container: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.sm,
  },
  item: {
    padding: designSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.borderLight,
  },
  itemLast: {
    padding: designSystem.spacing.md,
    borderBottomWidth: 0,
  },
  itemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  itemText: {
    flex: 1,
    marginLeft: designSystem.spacing.md,
  },
  itemActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
};

// Form Styles
export const formStyles = {
  container: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.lg,
    ...designSystem.shadows.md,
  },
  field: {
    marginBottom: designSystem.spacing.md,
  },
  label: {
    ...designSystem.typography.label,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: designSystem.colors.border,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    backgroundColor: designSystem.colors.surface,
  },
  inputFocused: {
    borderColor: designSystem.colors.primary,
  },
  inputError: {
    borderColor: designSystem.colors.error,
  },
  errorText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.error,
    marginTop: designSystem.spacing.xs,
  },
  button: {
    ...buttonStyles.primary,
    marginTop: designSystem.spacing.md,
  },
  buttonSecondary: {
    ...buttonStyles.secondary,
    marginTop: designSystem.spacing.sm,
  },
};

// Stats Card Styles
export const statsStyles = {
  container: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.lg,
    ...designSystem.shadows.md,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-around' as const,
  },
  item: {
    alignItems: 'center' as const,
    minWidth: 80,
    marginBottom: designSystem.spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designSystem.colors.surfaceVariant,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: designSystem.spacing.sm,
  },
  number: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    fontWeight: 'bold' as const,
  },
  label: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    textAlign: 'center' as const,
  },
};

// Empty State Styles
export const emptyStateStyles = {
  container: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: designSystem.spacing.xl,
  },
  icon: {
    marginBottom: designSystem.spacing.md,
  },
  title: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: designSystem.spacing.sm,
  },
  description: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: designSystem.spacing.lg,
  },
  button: {
    ...buttonStyles.primary,
  },
};
