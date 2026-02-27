#!/usr/bin/env node

/**
 * Razorpay Webhook Testing Script
 * 
 * This script tests the webhook implementation with various scenarios:
 * 1. Valid webhook processing
 * 2. Idempotency (duplicate handling)
 * 3. Signature verification
 * 4. Rate limiting
 * 5. Error scenarios
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.WEBHOOK_TEST_URL || 'https://mathematico-backend-new.vercel.app',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_at_least_32_chars',
  timeout: 10000
};

// Test data
const testPayment = {
  id: 'pay_test_' + Date.now(),
  order_id: 'order_test_' + Date.now(),
  amount: 50000, // 500.00 INR in paise
  currency: 'INR',
  notes: {
    courseId: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    itemType: 'course'
  }
};

const testWebhookPayload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: testPayment
    }
  }
};

/**
 * Generate HMAC signature for webhook
 */
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Make HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.url.startsWith('https') ? https : http;
    
    const req = protocol.request(options.url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: config.timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Test 1: Webhook Health Check
 */
async function testWebhookHealth() {
  console.log('\n🔍 Test 1: Webhook Health Check');
  
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay/health`,
      method: 'GET'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    if (response.statusCode === 200) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

/**
 * Test 2: Valid Webhook Processing
 */
async function testValidWebhook() {
  console.log('\n🔍 Test 2: Valid Webhook Processing');
  
  try {
    const payload = JSON.stringify(testWebhookPayload);
    const signature = generateSignature(testWebhookPayload, config.webhookSecret);

    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    const result = JSON.parse(response.body);
    if (response.statusCode === 200 && result.success) {
      console.log('✅ Valid webhook processed successfully');
      return { success: true, paymentId: testPayment.id };
    } else {
      console.log('❌ Valid webhook processing failed');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Valid webhook error:', error.message);
    return { success: false };
  }
}

/**
 * Test 3: Idempotency (Duplicate Handling)
 */
async function testIdempotency() {
  console.log('\n🔍 Test 3: Idempotency (Duplicate Handling)');
  
  try {
    const payload = JSON.stringify(testWebhookPayload);
    const signature = generateSignature(testWebhookPayload, config.webhookSecret);

    // Send first request
    const response1 = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });

    // Send duplicate request
    const response2 = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });

    console.log(`First request status: ${response1.statusCode}`);
    console.log(`Second request status: ${response2.statusCode}`);

    const result1 = JSON.parse(response1.body);
    const result2 = JSON.parse(response2.body);

    if (response1.statusCode === 200 && response2.statusCode === 200 &&
        result1.success && result2.success &&
        result1.alreadyProcessed === false && result2.alreadyProcessed === true) {
      console.log('✅ Idempotency test passed');
      return true;
    } else {
      console.log('❌ Idempotency test failed');
      console.log('First response:', result1);
      console.log('Second response:', result2);
      return false;
    }
  } catch (error) {
    console.error('❌ Idempotency test error:', error.message);
    return false;
  }
}

/**
 * Test 4: Invalid Signature
 */
async function testInvalidSignature() {
  console.log('\n🔍 Test 4: Invalid Signature');
  
  try {
    const payload = JSON.stringify(testWebhookPayload);

    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature'
      },
      body: payload
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    if (response.statusCode === 400) {
      console.log('✅ Invalid signature rejected correctly');
      return true;
    } else {
      console.log('❌ Invalid signature not rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Invalid signature test error:', error.message);
    return false;
  }
}

/**
 * Test 5: Missing Signature
 */
async function testMissingSignature() {
  console.log('\n🔍 Test 5: Missing Signature');
  
  try {
    const payload = JSON.stringify(testWebhookPayload);

    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No x-razorpay-signature header
      },
      body: payload
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    if (response.statusCode === 400) {
      console.log('✅ Missing signature rejected correctly');
      return true;
    } else {
      console.log('❌ Missing signature not rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Missing signature test error:', error.message);
    return false;
  }
}

/**
 * Test 6: Invalid Payload
 */
async function testInvalidPayload() {
  console.log('\n🔍 Test 6: Invalid Payload');
  
  try {
    const invalidPayload = { invalid: 'payload' };
    const payload = JSON.stringify(invalidPayload);
    const signature = generateSignature(invalidPayload, config.webhookSecret);

    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    // Should return 200 but log the unknown event
    if (response.statusCode === 200) {
      console.log('✅ Invalid payload handled gracefully');
      return true;
    } else {
      console.log('❌ Invalid payload not handled correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Invalid payload test error:', error.message);
    return false;
  }
}

/**
 * Test 7: Payment Failed Event
 */
async function testPaymentFailed() {
  console.log('\n🔍 Test 7: Payment Failed Event');
  
  try {
    const failedPayload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            ...testPayment,
            id: 'pay_failed_' + Date.now(),
            order_id: 'order_failed_' + Date.now(),
            status: 'failed',
            errorCode: 'BAD_REQUEST_ERROR',
            errorDescription: 'Payment failed',
            source: 'api'
          }
        }
      }
    };

    const payload = JSON.stringify(failedPayload);
    const signature = generateSignature(failedPayload, config.webhookSecret);

    const response = await makeRequest({
      url: `${config.baseUrl}/api/v1/webhook/razorpay`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });

    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);

    if (response.statusCode === 200) {
      console.log('✅ Payment failed event processed successfully');
      return true;
    } else {
      console.log('❌ Payment failed event processing failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Payment failed test error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Razorpay Webhook Tests');
  console.log('=====================================');
  console.log(`Target URL: ${config.baseUrl}`);
  console.log(`Webhook Secret: ${config.webhookSecret.substring(0, 8)}...`);

  const results = [];

  // Run tests
  results.push(await testWebhookHealth());
  results.push(await testValidWebhook());
  results.push(await testIdempotency());
  results.push(await testInvalidSignature());
  results.push(await testMissingSignature());
  results.push(await testInvalidPayload());
  results.push(await testPaymentFailed());

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`Tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Razorpay Webhook Testing Script

Usage:
  node test-webhook.js [options]

Options:
  --help, -h          Show this help message
  --url <url>         Set webhook base URL (default: http://localhost:3000)
  --secret <secret>   Set webhook secret (default: test_webhook_secret_at_least_32_chars)

Environment Variables:
  WEBHOOK_TEST_URL    Base URL for webhook testing
  RAZORPAY_WEBHOOK_SECRET  Webhook secret for signature generation

Examples:
  node test-webhook.js
  node test-webhook.js --url https://your-domain.com
  node test-webhook.js --secret your_actual_webhook_secret
  WEBHOOK_TEST_URL=https://your-domain.com node test-webhook.js
`);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  config.baseUrl = process.argv[urlIndex + 1];
}

const secretIndex = process.argv.indexOf('--secret');
if (secretIndex !== -1 && process.argv[secretIndex + 1]) {
  config.webhookSecret = process.argv[secretIndex + 1];
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
