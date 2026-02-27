const crypto = require('crypto');
const https = require('https');

// Test data (same as in test script)
const testPayment = {
  id: 'pay_test_' + Date.now(),
  order_id: 'order_test_' + Date.now(),
  amount: 50000,
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

// Generate signature exactly like the test script
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Make request with proper headers
function makeWebhookRequest() {
  return new Promise((resolve, reject) => {
    const secret = 'test_webhook_secret_at_least_32_chars';
    const payloadString = JSON.stringify(testWebhookPayload);
    const signature = generateSignature(testWebhookPayload, secret);
    
    console.log('Payload string:', payloadString);
    console.log('Payload length:', payloadString.length);
    console.log('Generated signature:', signature);
    
    const options = {
      hostname: 'mathematico-backend-new.vercel.app',
      path: '/api/v1/webhook/razorpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString, 'utf8'),
        'x-razorpay-signature': signature
      },
      timeout: 10000
    };
    
    console.log('Request headers:', options.headers);
    
    const req = https.request(options, (res) => {
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
    
    req.write(payloadString);
    req.end();
  });
}

// Test the webhook
makeWebhookRequest()
  .then(response => {
    console.log('Status:', response.statusCode);
    console.log('Response:', response.body);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
