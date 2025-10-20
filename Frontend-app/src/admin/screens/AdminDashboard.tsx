// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  ActivityIndicator,
  FAB,
  Chip,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
// import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { adminService, DashboardStats } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';

const { width } = Dimensions.get('window');

// Chart configuration removed - charts temporarily disabled to prevent rendering errors

export default function AdminDashboard({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboardStats();
      console.log('Dashboard data received:', data);
      
      // Ensure we have the correct structure with fallbacks
      const dashboardData: DashboardStats = {
        stats: {
          totalUsers: data?.totalUsers || data?.stats?.totalUsers || 0,
          totalStudents: data?.totalStudents || data?.stats?.totalStudents || 0,
          totalCourses: data?.totalCourses || data?.stats?.totalCourses || 0,
          totalModules: data?.totalModules || data?.stats?.totalModules || 0,
          totalLessons: data?.totalLessons || data?.stats?.totalLessons || 0,
          totalRevenue: data?.totalRevenue || data?.stats?.totalRevenue || 0,
          activeBatches: data?.activeBatches || data?.stats?.activeBatches || 0,
        },
        recentUsers: Array.isArray(data?.recentUsers) ? data.recentUsers : 
                   Array.isArray(data?.recentActivity) ? data.recentActivity.filter((item: any) => item.type === 'user') : [],
        recentCourses: Array.isArray(data?.recentCourses) ? data.recentCourses : 
                     Array.isArray(data?.recentActivity) ? data.recentActivity.filter((item: any) => item.type === 'course') : [],
      };
      
      setStats(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data when API fails
      setStats({
        stats: {
          totalUsers: 0,
          totalStudents: 0,
          totalCourses: 0,
          totalModules: 0,
          totalLessons: 0,
          totalRevenue: 0,
          activeBatches: 0,
        },
        recentUsers: [],
        recentCourses: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const RecentItem = ({ title, subtitle, icon, color }: any) => (
    <View style={styles.recentItem}>
      <Icon name={icon} size={20} color={color} />
      <View style={styles.recentItemContent}>
        <Text style={textStyles.body}>{title}</Text>
        <Text style={textStyles.caption}>{subtitle}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={48} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Charts temporarily disabled to prevent rendering errors

  return (
    <View style={layoutStyles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <UnifiedCard variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={designSystem.colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={textStyles.heading}>Analytics Dashboard</Text>
              <Text style={textStyles.bodySecondary}>
                Here's what's happening with your platform today.
              </Text>
            </View>
            <Icon name="admin-panel-settings" size={48} color={designSystem.colors.primary} />
          </View>
        </UnifiedCard>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={(stats.stats.totalUsers ?? 0).toLocaleString()}
            icon="group"
            color={designSystem.colors.primary}
            subtitle={`${stats.stats.totalStudents ?? 0} students`}
          />
          <StatCard
            title="Total Courses"
            value={(stats.stats.totalCourses ?? 0).toString()}
            icon="school"
            color={designSystem.colors.success}
            subtitle={`${stats.stats.totalModules ?? 0} modules`}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.stats.totalRevenue ?? 0).toLocaleString()}`}
            icon="attach-money"
            color={designSystem.colors.warning}
            subtitle="This month"
          />
          <StatCard
            title="Active Batches"
            value={(stats.stats.activeBatches ?? 0).toString()}
            icon="groups"
            color={designSystem.colors.secondary}
            subtitle="Currently running"
          />
        </View>

        {/* Charts Section */}
        <UnifiedCard variant="outlined" style={styles.chartCard}>
          <Text style={textStyles.subheading}>User Growth</Text>
          <View style={styles.chartContainer}>
            <Text style={textStyles.caption}>Chart will be available when data is available</Text>
          </View>
        </UnifiedCard>

        <UnifiedCard variant="outlined" style={styles.chartCard}>
          <Text style={textStyles.subheading}>Monthly Revenue</Text>
          <View style={styles.chartContainer}>
            <Text style={textStyles.caption}>Chart will be available when data is available</Text>
          </View>
        </UnifiedCard>

        <UnifiedCard variant="outlined" style={styles.chartCard}>
          <Text style={textStyles.subheading}>Course Distribution</Text>
          <View style={styles.chartContainer}>
            <Text style={textStyles.caption}>Chart will be available when data is available</Text>
          </View>
        </UnifiedCard>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <UnifiedCard variant="outlined" style={styles.recentCard}>
            <Text style={textStyles.subheading}>Recent Users</Text>
            {stats.recentUsers && Array.isArray(stats.recentUsers) && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user, index) => (
                <RecentItem
                  key={user.id || index}
                  title={user.name || 'Unknown User'}
                  subtitle={user.email || 'No email'}
                  icon="person-add"
                  color={designSystem.colors.primary}
                />
              ))
            ) : (
              <Text style={textStyles.caption}>No recent users</Text>
            )}
          </UnifiedCard>

          <UnifiedCard variant="outlined" style={styles.recentCard}>
            <Text style={textStyles.subheading}>Recent Courses</Text>
            {stats.recentCourses && Array.isArray(stats.recentCourses) && stats.recentCourses.length > 0 ? (
              stats.recentCourses.map((course, index) => (
                <RecentItem
                  key={course.id || index}
                  title={course.title || 'Unknown Course'}
                  subtitle={course.category || 'No category'}
                  icon="add-circle"
                  color={designSystem.colors.success}
                />
              ))
            ) : (
              <Text style={textStyles.caption}>No recent courses</Text>
            )}
          </UnifiedCard>
        </View>
      </ScrollView>

      {/* Quick Actions FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          // Navigate to create course or show action sheet
          console.log('Quick add pressed');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  loadingText: {
    marginTop: designSystem.spacing.md,
    ...textStyles.body,
    color: designSystem.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: designSystem.colors.error,
    marginTop: designSystem.spacing.md,
    textAlign: 'center',
    ...textStyles.body,
  },
  retryButton: {
    marginTop: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.md,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.sm,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xs,
  },
  backButton: {
    marginRight: designSystem.spacing.sm,
    padding: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.md,
  },
  headerText: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: designSystem.spacing.md,
    gap: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.md,
  },
  chartCard: {
    margin: designSystem.spacing.md,
    marginTop: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  chart: {
    marginVertical: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.lg,
  },
  chartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    borderRadius: designSystem.borderRadius.lg,
    marginVertical: designSystem.spacing.sm,
  },
  recentSection: {
    flexDirection: 'row',
    paddingHorizontal: designSystem.spacing.md,
    gap: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.xl,
  },
  recentCard: {
    flex: 1,
    ...designSystem.shadows.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.borderLight,
  },
  recentItemContent: {
    marginLeft: designSystem.spacing.sm,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: designSystem.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.full,
    ...designSystem.shadows.lg,
  },
  statCard: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.lg,
    alignItems: 'center',
    flex: 1,
    margin: designSystem.spacing.xs,
    minWidth: 140,
    ...designSystem.shadows.md,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: designSystem.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designSystem.spacing.xs,
  },
  statSubtitle: {
    fontSize: 12,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
  },
});
