import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  ActivityIndicator,
  Searchbar,
  Chip,
  FAB,
  Title,
  Paragraph,
  Button,
} from 'react-native-paper';
import { Icon, type IconName } from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';
import { EmptyState } from '../../components/EmptyState';
import { safeCatch } from '../../utils/safeCatch';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentFilters {
  status: string;
  search: string;
}

export default function AdminPayments({ navigation }: { navigation: any }) {
  const {} = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all',
    search: '',
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, filters]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      // Load payments from API
      setPayments([]);
    } catch (error) {
      safeCatch('AdminPayments.loadPayments', () => {
        Alert.alert('Error', 'Failed to load payments. Please try again.');
      })(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search?.toLowerCase() ?? '';
      filtered = filtered.filter(payment =>
        (payment.userName && payment.userName?.toLowerCase()?.includes(searchTerm)) ||
        (payment.userEmail && payment.userEmail?.toLowerCase()?.includes(searchTerm)) ||
        (payment.courseTitle && payment.courseTitle?.toLowerCase()?.includes(searchTerm)) ||
        (payment.transactionId && payment.transactionId?.toLowerCase()?.includes(searchTerm))
      );
    }

    setFilteredPayments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return designSystem.colors.success;
      case 'pending':
        return designSystem.colors.warning;
      case 'failed':
        return designSystem.colors.error;
      case 'refunded':
        return designSystem.colors.secondary;
      default:
        return designSystem.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): IconName => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'calendar-clock';
      case 'failed':
        return 'alert-circle';
      case 'refunded':
        return 'undo';
      default:
        return 'help-circle';
    }
  };

  const handlePaymentAction = (_payment: Payment, action: string) => {
    Alert.alert(
      `${action} Payment`,
      `Are you sure you want to ${action ? action?.toLowerCase() ?? 'process' : 'process'} this payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            // Implement payment action logic here
            Alert.alert('Success', `Payment ${action ? action?.toLowerCase() ?? 'processed' : 'processed'}d successfully.`);
          },
        },
      ]
    );
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <UnifiedCard variant="outlined" style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Title style={textStyles.subheading}>{item.userName}</Title>
          <Paragraph style={textStyles.caption}>{item.userEmail}</Paragraph>
        </View>
        <Chip
          icon={() => (
            <Icon
              name={getStatusIcon(item.status)}
              size={16}
              color="white"
            />
          )}
          style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          textStyle={styles.statusChipText}
        >
          {item.status.toUpperCase()}
        </Chip>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={textStyles.caption}>Course:</Text>
          <Text style={textStyles.body}>{item.courseTitle}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={textStyles.caption}>Amount:</Text>
          <Text style={[textStyles.body, styles.amountText]}>
            {item.currency} {item.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={textStyles.caption}>Method:</Text>
          <Text style={textStyles.body}>{item.paymentMethod}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={textStyles.caption}>Transaction ID:</Text>
          <Text style={textStyles.body}>{item.transactionId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={textStyles.caption}>Date:</Text>
          <Text style={textStyles.body}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handlePaymentAction(item, 'Approve')}
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            onPress={() => handlePaymentAction(item, 'Reject')}
            style={[styles.actionButton, styles.rejectButton]}
            labelStyle={[styles.actionButtonText, styles.rejectButtonText]}
          >
            Reject
          </Button>
        </View>
      )}

      {item.status === 'completed' && (
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handlePaymentAction(item, 'Refund')}
            style={[styles.actionButton, styles.refundButton]}
            labelStyle={[styles.actionButtonText, styles.refundButtonText]}
          >
            Refund
          </Button>
        </View>
      )}
    </UnifiedCard>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="credit-card"
      title="No Payments Found"
      description="No payments match your current filters."
      actionText="Clear Filters"
      onAction={() => setFilters({ status: 'all', search: '' })}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <UnifiedCard variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={designSystem.colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={textStyles.heading}>Payment Management</Text>
            <Text style={textStyles.bodySecondary}>
              Manage and monitor all payment transactions
            </Text>
          </View>
          <Icon name="credit-card" size={48} color={designSystem.colors.primary} />
        </View>
      </UnifiedCard>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search payments..."
          value={filters.search}
          onChangeText={(text) => setFilters({ ...filters, search: text })}
          style={styles.searchBar}
        />
        
        <View style={styles.statusFilters}>
          {['all', 'completed', 'pending', 'failed', 'refunded'].map((status) => (
            <Chip
              key={status}
              selected={filters.status === status}
              onPress={() => setFilters({ ...filters, status })}
              style={[
                styles.statusFilter,
                filters.status === status && styles.selectedStatusFilter,
              ]}
              textStyle={[
                styles.statusFilterText,
                filters.status === status && styles.selectedStatusFilterText,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Actions FAB */}
      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={onRefresh}
        label="Refresh"
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
  headerCard: {
    margin: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
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
  filtersContainer: {
    paddingHorizontal: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    margin: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  searchBar: {
    marginBottom: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.xs,
    marginTop: designSystem.spacing.sm,
  },
  statusFilter: {
    marginRight: designSystem.spacing.xs,
    marginBottom: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.md,
  },
  selectedStatusFilter: {
    backgroundColor: designSystem.colors.primary,
  },
  statusFilterText: {
    color: designSystem.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedStatusFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.xl,
    flex: 1,
  },
  paymentCard: {
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  statusChip: {
    marginLeft: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.md,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.xs,
    paddingVertical: designSystem.spacing.xs,
  },
  amountText: {
    fontWeight: '600',
    color: designSystem.colors.success,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: designSystem.spacing.sm,
    marginTop: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.borderLight,
  },
  actionButton: {
    minWidth: 80,
    borderRadius: designSystem.borderRadius.md,
    minHeight: 36,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rejectButton: {
    borderColor: designSystem.colors.error,
  },
  rejectButtonText: {
    color: designSystem.colors.error,
  },
  refundButton: {
    borderColor: designSystem.colors.warning,
  },
  refundButtonText: {
    color: designSystem.colors.warning,
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
});
