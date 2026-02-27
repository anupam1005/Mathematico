const crypto = require('crypto');

// Test data (same as in test script)
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

// Generate signature exactly like the test script
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Test signature verification
const secret = 'test_webhook_secret_at_least_32_chars';
const payloadString = JSON.stringify(testWebhookPayload);
const signature = generateSignature(testWebhookPayload, secret);

console.log('Payload string:', payloadString);
console.log('Payload length:', payloadString.length);
console.log('Generated signature:', signature);

// Now test verification with Buffer (like webhook controller)
const payloadBuffer = Buffer.from(payloadString, 'utf8');
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payloadBuffer)
  .digest('hex');

console.log('Expected signature (Buffer):', expectedSignature);
console.log('Signatures match:', signature === expectedSignature);

// Test direct string vs Buffer
const directStringSignature = crypto
  .createHmac('sha256', secret)
  .update(payloadString)
  .digest('hex');

console.log('Direct string signature:', directStringSignature);
console.log('String vs Buffer match:', directStringSignature === expectedSignature);
