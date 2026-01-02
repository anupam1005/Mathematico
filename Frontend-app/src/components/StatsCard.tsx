import React from 'react';
import { View, Text } from 'react-native';
<<<<<<< HEAD
import { Icon } from './Icon';
=======
import { LucideIcon, icons } from 'lucide-react-native';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import { UnifiedCard } from './UnifiedCard';
import { statsStyles, textStyles, designSystem } from '../styles/designSystem';

interface StatItem {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

interface StatsCardProps {
  title?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  columns = 4,
}) => {
  const getItemWidth = () => {
    switch (columns) {
      case 2:
        return '48%';
      case 3:
        return '32%';
      case 4:
        return '23%';
      default:
        return '23%';
    }
  };

  return (
    <UnifiedCard variant="elevated">
      {title && (
        <Text style={[textStyles.heading, { marginBottom: designSystem.spacing.md }]}>
          {title}
        </Text>
      )}
      <View style={statsStyles.grid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[
              statsStyles.item,
              { width: getItemWidth() }
            ]}
          >
            <View style={[
              statsStyles.icon,
              { backgroundColor: stat.color || designSystem.colors.surfaceVariant }
            ]}>
<<<<<<< HEAD
              <Icon 
                name={stat.icon} 
                size={20} 
                color={stat.color || designSystem.colors.primary} 
              />
=======
              {(() => {
                const Key = (stat.icon as keyof typeof icons) || 'Circle';
                const IconCmp: LucideIcon = (icons as any)[Key] || icons.Circle;
                return <IconCmp size={20} color={stat.color || designSystem.colors.primary} />;
              })()}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
            </View>
            <Text style={statsStyles.number}>
              {stat.value}
            </Text>
            <Text style={statsStyles.label}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </UnifiedCard>
  );
};
