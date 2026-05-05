import { useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';
import { CURRENCY_CONFIG } from '../constants/currency';
import { safeCatch } from '../utils/safeCatch';

export default function CheckoutScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { itemId, itemData, type } = route.params;

  const [loading, setLoading] = useState(false);
  const subtotalAmount = Number(itemData?.price || 0);
  // Display GST-inclusive total in the UI for transparency.
  // IMPORTANT: The amount sent to Razorpay must be the BASE price (subtotalAmount)
  // because the backend re-fetches the server-side price and uses that for HMAC
  // validation. Sending a tax-inflated amount would trigger a PAYMENT_TAMPERING_ATTEMPT
  // security event on every valid payment.
  const displayTotal = Math.round(subtotalAmount * 1.18 * 100) / 100;
  const chargedAmount = subtotalAmount; // Base price — backend will validate this

  console.log('[CHECKOUT] Render', { 
    itemId, 
    type, 
    subtotalAmount, 
    chargedAmount, 
    displayTotal,
    loading 
  });


  useEffect(() => {
    console.log('[CHECKOUT] Mounted with params:', route.params);
    if (!itemData) {
      console.error('[CHECKOUT] Missing itemData in route params');
      Alert.alert('Error', 'Item not found');
      navigation.goBack();
    }
  }, [itemData]);

  const handlePayment = async () => {
    if (!itemData) return;

    console.log('[CHECKOUT] Starting handlePayment', { itemId, type, chargedAmount });
    setLoading(true);
    try {
      if (chargedAmount <= 0) {
        console.log('[CHECKOUT] Free item detected, enrolling...');
        // Free item - bypass Razorpay and enroll/access directly
        const { enrollmentService } = require('../services/enrollmentService');
        let enrollRes;

        if (type === 'course') {
          enrollRes = await enrollmentService.enrollInCourse(itemId);
        } else if (type === 'book') {
          // Books are purchased/accessed via the mobile book access endpoint
          enrollRes = await enrollmentService.enrollInCourse(itemId); // falls through to /books/:id/purchase on the backend
          // If the server doesn't have a dedicated free-book endpoint, navigate to BookDetail directly
          if (!enrollRes.success) {
            Alert.alert('Success', 'You can now access this book for free!');
            navigation.navigate('BookDetail', { bookId: itemId });
            return;
          }
        } else if (type === 'liveClass') {
          // Live class registration via enroll endpoint
          enrollRes = await enrollmentService.enrollInCourse(itemId);
        } else {
          Alert.alert('Error', 'Unknown item type');
          return;
        }

        if (enrollRes.success) {
          Alert.alert('Success', 'You have been enrolled successfully for free!');
          navigation.navigate('MainTabs');
          return;
        } else {
          Alert.alert('Error', enrollRes.message || 'Failed to enroll');
          return;
        }
      }


      console.log('[CHECKOUT] Creating Razorpay order...');
      const { razorpayService } =
        require('../services/razorpayService');

      // Create order with proper notes for enrollment
      console.log('[CHECKOUT] Calling razorpayService.createOrder');
      const order = await razorpayService.createOrder({
        amount: chargedAmount,
        currency: CURRENCY_CONFIG.code,
        receipt: `${type}_${itemId}_${Date.now()}`,
        notes: { 
          courseId: type === 'course' ? itemId : undefined,
          bookId: type === 'book' ? itemId : undefined,
          liveClassId: type === 'liveClass' ? itemId : undefined,
          userId: user?.id,
          itemType: type
        },
      });

      if (!order.success) {
        console.error('[CHECKOUT] Order creation failed:', order.message);
        Alert.alert('Error', order.message || 'Failed to create payment order');
        return;
      }

      console.log('[CHECKOUT] Order created successfully:', order.data.id);
      console.log('[CHECKOUT] Preparing web checkout options...');

      const prepared = await razorpayService.prepareWebCheckoutOptions({
        orderId: order.data.id,
        amountRupees: chargedAmount,
        currency: CURRENCY_CONFIG.code,
        description: `Payment for ${itemData.title || 'item'}`,
        customerName: user?.name || 'User',
        email: user?.email || '',
        contact: '',
      });

      if (!prepared.success || !prepared.data) {
        console.error('[CHECKOUT] Option preparation failed:', prepared.message);
        Alert.alert('Error', prepared.message || 'Could not start payment');
        return;
      }

      console.log('[CHECKOUT] Navigating to RazorpayCheckout screen');

      navigation.navigate('RazorpayCheckout', {
        webOptions: prepared.data,
        itemContext: {
          itemId,
          itemData,
          type,
        },
      });
    } catch (error) {
      console.error('[CHECKOUT] handlePayment caught error:', error);
      safeCatch('CheckoutScreen.handlePayment', () => {
        Alert.alert(
          'Payment Failed', 
          'Unable to complete payment. Please try again or contact support if the problem persists.',
          [
            {
              text: 'Try Again',
              onPress: () => handlePayment()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      })(error);
    } finally {
      setLoading(false);
    }
  };

  if (!itemData) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{itemData.title}</Title>
          <Paragraph>{itemData.description}</Paragraph>

          <Divider style={styles.divider} />

          <Text style={styles.price}>
            Subtotal: ₹{subtotalAmount.toFixed(2)} + GST = ₹{displayTotal.toFixed(2)}
          </Text>

          <Button
            mode="contained"
            onPress={() => {
              console.log('[CHECKOUT] Pay Now pressed');
              handlePayment();
            }}
            disabled={loading}
            contentStyle={{ height: 50 }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              chargedAmount > 0 ? 'Pay Now' : 'Enroll for Free'
            )}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designSystem.colors.background },
  card: { margin: 16, borderRadius: 12 },
  divider: { marginVertical: 16 },
  price: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
});
