import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { StackScreenProps } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { designSystem } from '../styles/designSystem';
import type { RazorpayWebCheckoutPayload } from '../services/razorpayService';

type RootStackParamList = {
  RazorpayCheckout: {
    webOptions: RazorpayWebCheckoutPayload;
    itemContext: {
      itemId: string;
      itemData: { title?: string };
      type: 'book' | 'course' | 'liveClass';
    };
  };
};

type Props = StackScreenProps<RootStackParamList, 'RazorpayCheckout'>;

/**
 * Loads Razorpay Checkout.js in a WebView (no native SDK).
 * Success/failure is delivered via window.ReactNativeWebView.postMessage.
 */
const CHECKOUT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>body{margin:0;background:#fff;}</style>
</head>
<body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function () {
  function send(payload) {
    try {
      var s = typeof payload === 'string' ? payload : JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(s);
      }
    } catch (e) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(e && e.message ? e.message : e) }));
      } catch (_) {}
    }
  }

  window.beginRazorpayCheckout = function (rawOpts) {
    try {
      var opts = typeof rawOpts === 'string' ? JSON.parse(rawOpts) : rawOpts;
      if (!opts || typeof opts !== 'object') {
        send({ type: 'error', message: 'Invalid checkout options' });
        return;
      }
      if (typeof Razorpay === 'undefined') {
        send({ type: 'error', message: 'Razorpay Checkout.js not loaded' });
        return;
      }

      opts.handler = function (response) {
        send({
          type: 'success',
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });
      };

      opts.modal = opts.modal || {};
      var prevDismiss = opts.modal.ondismiss;
      opts.modal.ondismiss = function () {
        if (typeof prevDismiss === 'function') {
          try { prevDismiss(); } catch (e) {}
        }
        send({ type: 'dismiss' });
      };

      var rzp = new Razorpay(opts);
      rzp.on('payment.failed', function (response) {
        send({
          type: 'failed',
          error: response && response.error ? response.error : { description: 'Payment failed' }
        });
      });
      rzp.open();
    } catch (err) {
      send({ type: 'error', message: String(err && err.message ? err.message : err) });
    }
  };
})();
</script>
</body>
</html>`;

export default function RazorpayCheckoutScreen({ navigation, route }: Props) {
  const { webOptions, itemContext } = route.params;
  const webViewRef = useRef<WebView>(null);
  const injectedRef = useRef(false);
  const [busy, setBusy] = useState(true);

  const runCheckout = useCallback(() => {
    if (injectedRef.current) return;
    injectedRef.current = true;
    const optsJson = JSON.stringify(webOptions);
    const js = `(function(){try{var opts=${optsJson};window.beginRazorpayCheckout(opts);}catch(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:String(e&&e.message?e.message:e)}));}})();true;`;

    webViewRef.current?.injectJavaScript(js);
    setBusy(false);
  }, [webOptions]);

  const onLoadEnd = useCallback(() => {
    setTimeout(runCheckout, Platform.OS === 'android' ? 150 : 50);
  }, [runCheckout]);

  const handleMessage = async (event: WebViewMessageEvent) => {
    let parsed: {
      type: string;
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
      error?: unknown;
      message?: string;
    };
    try {
      parsed = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (parsed.type === 'dismiss') {
      navigation.goBack();
      return;
    }

    if (parsed.type === 'failed') {
      const desc =
        parsed.error &&
        typeof parsed.error === 'object' &&
        parsed.error !== null &&
        'description' in parsed.error
          ? String((parsed.error as { description?: string }).description)
          : 'Payment failed';
      Alert.alert('Payment failed', desc);
      navigation.goBack();
      return;
    }

    if (parsed.type === 'error') {
      Alert.alert('Payment error', parsed.message || 'Could not start checkout');
      navigation.goBack();
      return;
    }

    if (parsed.type !== 'success' || !parsed.razorpay_payment_id || !parsed.razorpay_order_id || !parsed.razorpay_signature) {
      Alert.alert('Payment error', 'Unexpected response from checkout');
      navigation.goBack();
      return;
    }

    setBusy(true);
    try {
      const { razorpayService } = require('../services/razorpayService');
      const verification = await razorpayService.verifyPayment({
        razorpay_order_id: parsed.razorpay_order_id,
        razorpay_payment_id: parsed.razorpay_payment_id,
        razorpay_signature: parsed.razorpay_signature,
      });

      if (verification.success) {
        const { type, itemId } = itemContext;
        if (type === 'course') {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'MainTabs' },
                { name: 'CourseDetail', params: { courseId: itemId } },
              ],
            })
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            })
          );
        }
        Alert.alert('Payment successful!', 'You have been enrolled successfully.');
      } else {
        Alert.alert(
          'Payment verification failed',
          'Payment may have succeeded but enrollment could not be confirmed. Please contact support.',
          [
            {
              text: 'Contact support',
              onPress: () => navigation.dispatch(CommonActions.navigate({ name: 'MainTabs' })),
            },
            { text: 'OK', style: 'cancel', onPress: () => navigation.goBack() },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not verify payment. Please contact support if you were charged.');
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={designSystem.colors.primary} />
        </View>
      ) : null}
      <WebView
        ref={webViewRef}
        source={{ html: CHECKOUT_HTML, baseUrl: 'https://mathematico.com' }}
        onLoadEnd={onLoadEnd}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        onError={() => {
          Alert.alert('Load error', 'Could not load payment page. Check your connection.');
          navigation.goBack();
        }}
        // Security: no arbitrary URL loading in this flow; Checkout.js only
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 2,
  },
});
