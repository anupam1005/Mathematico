import * as LucideIcons from 'lucide-react-native';

/**
 * IMPORTANT:
 * - DO NOT create icon maps
 * - DO NOT assign icons to objects
 * - ONLY do direct read-only lookup
 */
export const getLucideIcon = (name?: string) => {
  if (!name) return null;

  // Direct immutable lookup (SAFE)
  return (LucideIcons as Record<string, any>)[name] ?? null;
};
