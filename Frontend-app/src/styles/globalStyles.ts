import { StyleSheet } from 'react-native';
import { designSystem } from './designSystem';

/**
 * Global Styles - Common reusable styles across the app
 * These styles fix common CSS issues like text overlap, spacing, and alignment
 */

export const globalStyles = StyleSheet.create({
  // Container Styles
  screenContainer: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.xxl,
  },
  
  // Card Styles with proper spacing
  card: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  cardTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
    flexShrink: 1,
  },
  cardDescription: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 22,
    marginBottom: designSystem.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: designSystem.spacing.md,
    flexWrap: 'wrap',
    gap: designSystem.spacing.sm,
  },
  
  // Text Styles with proper line heights
  heading: {
    ...designSystem.typography.h1,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
  },
  subheading: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.sm,
  },
  sectionTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
    marginTop: designSystem.spacing.lg,
  },
  bodyText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    lineHeight: 24,
    marginBottom: designSystem.spacing.sm,
  },
  captionText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    lineHeight: 18,
  },
  
  // Button Styles with proper touch targets
  button: {
    ...designSystem.shadows.sm,
    borderRadius: designSystem.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: designSystem.spacing.xs,
  },
  buttonPrimary: {
    backgroundColor: designSystem.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: designSystem.colors.surface,
    borderWidth: 1,
    borderColor: designSystem.colors.primary,
  },
  buttonText: {
    ...designSystem.typography.label,
    color: designSystem.colors.surface,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    ...designSystem.typography.label,
    color: designSystem.colors.primary,
    fontWeight: '600',
  },
  
  // Row and Column Layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  column: {
    flexDirection: 'column',
    gap: designSystem.spacing.sm,
  },
  
  // Chip/Badge Styles
  chip: {
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.full,
    alignSelf: 'flex-start',
    marginRight: designSystem.spacing.xs,
    marginBottom: designSystem.spacing.xs,
  },
  chipText: {
    ...designSystem.typography.caption,
    fontWeight: '500',
  },
  
  // Image Styles
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surfaceVariant,
  },
  thumbnailSmall: {
    width: 80,
    height: 80,
    borderRadius: designSystem.borderRadius.md,
    marginRight: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surfaceVariant,
  },
  
  // List Item Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
    minHeight: 72,
  },
  listItemContent: {
    flex: 1,
    marginLeft: designSystem.spacing.md,
    marginRight: designSystem.spacing.md,
  },
  listItemTitle: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    fontWeight: '600',
    marginBottom: designSystem.spacing.xs,
  },
  listItemSubtitle: {
    ...designSystem.typography.bodySmall,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.xs,
  },
  
  // Form Styles
  formField: {
    marginBottom: designSystem.spacing.md,
  },
  formLabel: {
    ...designSystem.typography.label,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: designSystem.colors.border,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    backgroundColor: designSystem.colors.surface,
    minHeight: 48,
  },
  formError: {
    ...designSystem.typography.caption,
    color: designSystem.colors.error,
    marginTop: designSystem.spacing.xs,
  },
  
  // Price Styles
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  price: {
    ...designSystem.typography.h3,
    color: designSystem.colors.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  
  // Loading and Empty States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xl,
  },
  emptyStateText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: designSystem.spacing.md,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: designSystem.colors.border,
    marginVertical: designSystem.spacing.md,
  },
  
  // Icon Container
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designSystem.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.lg,
    alignItems: 'center',
    minWidth: 100,
    ...designSystem.shadows.md,
  },
  statsValue: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    fontWeight: 'bold',
    marginTop: designSystem.spacing.sm,
  },
  statsLabel: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginTop: designSystem.spacing.xs,
    textAlign: 'center',
  },
  
  // Search Bar
  searchBar: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.md,
    elevation: 2,
  },
  
  // Filter Chips Container
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: designSystem.spacing.md,
    gap: designSystem.spacing.xs,
  },
});

export default globalStyles;
