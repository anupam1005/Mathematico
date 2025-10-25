// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,

  Divider,
  ActivityIndicator,
  Chip,
  Surface,
} from 'react-native-paper';
import { Icon } from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';
import { razorpayService } from '../services/razorpayService';
import { CURRENCY_CONFIG } from '../config';

export default function CheckoutScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { type, itemId, itemData } = route.params;
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!itemData) {
      Alert.alert('Error', 'Item data not found');
      navigation.goBack();
    }
  }, [itemData]);

  const handlePayment = async () => {
    if (!itemData) return;

    setLoading(true);
    try {
      // Create Razorpay order
      const orderResponse = await razorpayService.createOrder({
        amount: itemData.price || 0,
        currency: CURRENCY_CONFIG.code,
        receipt: `${type}_${itemId.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          courseId: type === 'course' ? itemId : undefined,
          bookId: type === 'book' ? itemId : undefined,
          userId: user?.id,
          itemType: type,
        },
      });

      if (!orderResponse.success) {
        Alert.alert('Error', orderResponse.message || 'Failed to create payment order');
        return;
      }

      setOrderId(orderResponse.data.id);
      
      // Open Razorpay checkout
      const paymentResponse = await razorpayService.openCheckout({
        order_id: orderResponse.data.id,
        amount: itemData.price || 0,
        currency: CURRENCY_CONFIG.code,
        description: `Payment for ${itemData.title}`,
        name: user?.name || 'User',
        email: user?.email || '',
        contact: user?.phone || '',
      });

      if (paymentResponse.success) {
        // Check if this is demo mode
        if (paymentResponse.message && paymentResponse.message.includes('Demo')) {
          Alert.alert(
            'Demo Payment Successful! 🎉',
            `Demo payment completed for "${itemData.title}". In production, this would be a real payment.\n\nYou can now access your ${getItemType().toLowerCase()}.`,
            [
              {
                text: 'Continue Learning',
                onPress: () => {
                  navigation.navigate('MainTabs');
                }
              }
            ]
          );
          setLoading(false);
          return;
        }
        
        // Verify payment
        await processPayment(orderResponse.data, paymentResponse.data);
      } else {
        if (paymentResponse.error !== 'Payment cancelled by user') {
          Alert.alert('Payment Failed', paymentResponse.message || 'Payment could not be completed');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const processPayment = async (orderData: any, paymentData: any) => {
    setLoading(true);
    try {
      // Verify payment with Razorpay response
      const verificationResponse = await razorpayService.verifyPayment({
        razorpay_order_id: orderData.id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      if (verificationResponse.success) {
        Alert.alert(
          'Payment Successful! 🎉',
          `You have successfully enrolled in "${itemData.title}". You can now access your ${getItemType().toLowerCase()}.`,
          [
            {
              text: 'Continue Learning',
              onPress: () => {
                navigation.navigate('MainTabs');
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', 'Payment verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getItemType = () => {
    switch (type) {
      case 'course':
        return 'Course';
      case 'liveclass':
        return 'Live Class';
      case 'book':
        return 'Book';
      default:
        return 'Item';
    }
  };

  const getItemIcon = () => {
    switch (type) {
      case 'course':
        return 'school';
      case 'liveclass':
        return 'videocam';
      case 'book':
        return 'book';
      default:
        return 'shopping-cart';
    }
  };

  if (!itemData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Item not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <Surface style={styles.headerSurface} elevation={4}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="lock" size={32} color={designSystem.colors.surface} />
          </View>
          <Title style={styles.headerTitle}>Secure Checkout</Title>
          <Paragraph style={styles.headerSubtitle}>
            Complete your {getItemType().toLowerCase()} enrollment
          </Paragraph>
        </View>
      </Surface>

      {/* Item Details Card */}
      <Card style={styles.itemCard} elevation={2}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemIconContainer}>
              <Icon name={getItemIcon()} size={24} color={designSystem.colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Title style={styles.itemTitle}>{itemData.title}</Title>
              <Chip mode="outlined" style={styles.itemTypeChip}>
                {getItemType()}
              </Chip>
            </View>
          </View>
          
          {itemData.description && (
            <Paragraph style={styles.itemDescription} numberOfLines={3}>
              {itemData.description}
            </Paragraph>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceAmount}>₹{itemData.price || 0}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceAmount}>₹{Math.round((itemData.price || 0) * 0.18)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{Math.round((itemData.price || 0) * 1.18)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Method Selection */}
      <Card style={styles.paymentMethodCard} elevation={2}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Payment Method</Title>
          <View style={styles.paymentMethodContainer}>
            <Button
              mode={paymentMethod === 'razorpay' ? 'contained' : 'outlined'}
              onPress={() => setPaymentMethod('razorpay')}
              style={styles.paymentMethodButton}
              icon="credit-card"
            >
              Razorpay
            </Button>
            <Button
              mode={paymentMethod === 'upi' ? 'contained' : 'outlined'}
              onPress={() => setPaymentMethod('upi')}
              style={styles.paymentMethodButton}
              icon="account-balance"
            >
              UPI
            </Button>
          </View>
          
          {paymentMethod === 'razorpay' && (
            <View style={styles.paymentInfo}>
              <Icon name="security" size={16} color={designSystem.colors.success} />
              <Text style={styles.paymentInfoText}>
                Secured by Razorpay • 256-bit SSL encryption
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* User Information */}
      <Card style={styles.userCard} elevation={2}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Billing Information</Title>
          <View style={styles.userInfo}>
            <Icon name="person" size={20} color={designSystem.colors.primary} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Button */}
      <View style={styles.paymentContainer}>
        <Button
          mode="contained"
          onPress={handlePayment}
          style={styles.paymentButton}
          contentStyle={styles.paymentButtonContent}
          disabled={loading}
          icon={loading ? undefined : "credit-card"}
        >
          {loading ? (
            <ActivityIndicator color={designSystem.colors.surface} />
          ) : (
            `Pay ₹${Math.round((itemData.price || 0) * 1.18)}`
          )}
        </Button>
        
        <View style={styles.securityInfo}>
          <Icon name="lock" size={16} color={designSystem.colors.textSecondary} />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  errorText: {
    ...designSystem.typography.h3,
    color: designSystem.colors.error,
    marginVertical: designSystem.spacing.md,
  },
  
  // Header Styles
  headerSurface: {
    backgroundColor: designSystem.colors.primary,
    margin: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  headerContent: {
    padding: designSystem.spacing.lg,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  headerTitle: {
    color: designSystem.colors.surface,
    ...designSystem.typography.h2,
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.xs,
  },
  headerSubtitle: {
    color: designSystem.colors.surface,
    ...designSystem.typography.body,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Item Card Styles
  itemCard: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    borderRadius: designSystem.borderRadius.lg,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.md,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designSystem.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designSystem.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
  },
  itemTypeChip: {
    alignSelf: 'flex-start',
  },
  itemDescription: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    marginVertical: designSystem.spacing.md,
  },
  
  // Price Section
  priceSection: {
    marginTop: designSystem.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  priceLabel: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  priceAmount: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    fontWeight: '500',
  },
  totalLabel: {
    ...designSystem.typography.h4,
    color: designSystem.colors.textPrimary,
    fontWeight: 'bold',
  },
  totalAmount: {
    ...designSystem.typography.h3,
    color: designSystem.colors.primary,
    fontWeight: 'bold',
  },
  
  // Payment Method Card
  paymentMethodCard: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    borderRadius: designSystem.borderRadius.lg,
  },
  sectionTitle: {
    ...designSystem.typography.h4,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
    fontWeight: '600',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designSystem.spacing.md,
  },
  paymentMethodButton: {
    flex: 1,
    marginHorizontal: designSystem.spacing.xs,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.success + '10',
    padding: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.sm,
  },
  paymentInfoText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.success,
    marginLeft: designSystem.spacing.xs,
    fontWeight: '500',
  },
  
  // User Card
  userCard: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    borderRadius: designSystem.borderRadius.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: designSystem.spacing.md,
    flex: 1,
  },
  userName: {
    ...designSystem.typography.h4,
    color: designSystem.colors.textPrimary,
    fontWeight: '600',
    marginBottom: designSystem.spacing.xs,
  },
  userEmail: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  
  // Payment Button
  paymentContainer: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    marginBottom: designSystem.spacing.xl,
  },
  paymentButton: {
    backgroundColor: designSystem.colors.success,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.lg,
  },
  paymentButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.md,
  },
  securityText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginLeft: designSystem.spacing.xs,
  },
});
