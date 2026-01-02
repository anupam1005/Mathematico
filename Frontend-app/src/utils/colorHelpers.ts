import { designSystem } from '../styles/designSystem';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'published':
    case 'live':
      return designSystem.colors.success;
    case 'draft':
    case 'upcoming':
      return designSystem.colors.warning;
    case 'archived':
    case 'completed':
      return designSystem.colors.textSecondary;
    case 'cancelled':
<<<<<<< HEAD
    case 'postponed':
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return designSystem.colors.error;
    case 'scheduled':
      return designSystem.colors.info;
    default:
      return designSystem.colors.textSecondary;
  }
};

export const getLevelColor = (level?: string): string => {
  switch (level) {
    case 'Foundation':
      return designSystem.colors.foundation;
    case 'Intermediate':
      return designSystem.colors.intermediate;
    case 'Advanced':
      return designSystem.colors.advanced;
    case 'Expert':
      return designSystem.colors.expert;
    default:
      return designSystem.colors.textSecondary;
  }
};

export const getCategoryColor = (category?: string): string => {
  // You can add specific colors for different categories
  switch (category) {
    case 'Mathematics':
      return designSystem.colors.primary;
    case 'Physics':
      return designSystem.colors.secondary;
    case 'Chemistry':
      return designSystem.colors.accent;
    default:
      return designSystem.colors.textSecondary;
  }
};
