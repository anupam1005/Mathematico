import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { designSystem } from '../styles/designSystem';
import { CURRENCY_CONFIG } from '../config';
import { safeCatch } from '../utils/safeCatch';

export default function CheckoutScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { itemId, itemData, type } = route.params;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemData) {
      Alert.alert('Error', 'Item not found');
      navigation.goBack();
    }
  }, [itemData]);

  const handlePayment = async () => {
    if (!itemData) return;

    setLoading(true);
    try {
      const { razorpayService } =
        require('../services/razorpayService');

      const order = await razorpayService.createOrder({
        amount: itemData.price || 0,
        currency: CURRENCY_CONFIG.code,
        receipt: `${type}_${Date.now()}`,
        notes: { itemId, userId: user?.id },
      });

      if (!order.success) {
        Alert.alert('Error', order.message || 'Order failed');
        return;
      }

      const payment = await razorpayService.openCheckout({
        order_id: order.data.id,
        amount: itemData.price,
        currency: CURRENCY_CONFIG.code,
        name: user?.name || 'User',
        email: user?.email || '',
      });

      if (payment.success) {
        Alert.alert('Success', 'Payment completed');
        navigation.navigate('MainTabs');
      } else {
        Alert.alert('Payment Cancelled');
      }
    } catch (error) {
      safeCatch('CheckoutScreen.handlePayment', () => {
        Alert.alert('Error', 'Payment failed');
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
            Total: ₹{Math.round((itemData.price || 0) * 1.18)}
          </Text>

          <Button
            mode="contained"
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              'Pay Now'
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
