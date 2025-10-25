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
import { Icon } from '../../components/Icon';
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await adminService.getDashboardStats();
      
      // Check if response is successful
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
      
      // Extract data from the response structure
      const data = response?.data || response;
      
      // Map backend data to frontend structure
      const dashboardData: DashboardStats = {
        stats: {
          totalUsers: data?.totalUsers || 0,
          totalStudents: data?.totalUsers || 0, // Use totalUsers as students for now
          totalCourses: data?.totalCourses || 0,
          totalModules: data?.courseStats?.total || data?.totalCourses || 0,
          totalLessons: 0, // Not available in backend yet
          totalRevenue: data?.totalRevenue || 0,
          activeBatches: data?.liveClassStats?.upcoming || 0,
        },
        recentUsers: Array.isArray(data?.recentUsers) ? data.recentUsers : [],
        recentCourses: Array.isArray(data?.recentCourses) ? data.recentCourses : [],
      };
      
      setStats(dashboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      
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

  // Add focus listener to refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

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
                {refreshing ? 'Updating data...' : 'Here\'s what\'s happening with your platform today.'}
              </Text>
              {lastUpdated && (
                <Text style={[textStyles.caption, { color: designSystem.colors.textSecondary, marginTop: 4 }]}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
                onPress={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={designSystem.colors.primary} />
                ) : (
                  <Icon 
                    name="refresh" 
                    size={24} 
                    color={designSystem.colors.primary}
                  />
                )}
              </TouchableOpacity>
              <Icon name="admin-panel-settings" size={48} color={designSystem.colors.primary} />
            </View>
          </View>
        </UnifiedCard>

        {/* Error Display */}
        {error && (
          <UnifiedCard variant="outlined" style={[styles.errorCard, { borderColor: designSystem.colors.error }]}>
            <View style={styles.errorContent}>
              <Icon name="error" size={24} color={designSystem.colors.error} />
              <View style={styles.errorText}>
                <Text style={[textStyles.body, { color: designSystem.colors.error }]}>
                  {error}
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadDashboardData}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </UnifiedCard>
        )}

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  refreshButton: {
    padding: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.background,
    ...designSystem.shadows.sm,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  errorCard: {
    margin: designSystem.spacing.md,
    marginTop: designSystem.spacing.sm,
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  errorButton: {
    marginTop: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.error,
    borderRadius: designSystem.borderRadius.md,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
