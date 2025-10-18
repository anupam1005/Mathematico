# 🔒 Security Implementation Guide

## JWT Authentication System

### Overview
This application implements a secure JWT-based authentication system with the following features:
- **Access Tokens**: Short-lived (15 minutes) for API authentication
- **Refresh Tokens**: Long-lived (30 days) stored securely
- **HttpOnly Cookies**: Refresh tokens stored in secure, HttpOnly cookies
- **Token Hashing**: Refresh tokens hashed with SHA-256 before database storage
- **Token Rotation**: New refresh token generated on each refresh

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client    │────────>│   Backend    │────────>│   Database   │
│             │         │              │         │              │
│ - Access    │         │ - Validates  │         │ - Hashed     │
│   Token     │         │   tokens     │         │   Refresh    │
│ - Refresh   │         │ - Manages    │         │   Tokens     │
│   Cookie    │         │   cookies    │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
```

## Security Features Implemented

### 1. Separate Secrets for Access & Refresh Tokens
- **JWT_SECRET**: Used for signing access tokens
- **JWT_REFRESH_SECRET**: Used for signing refresh tokens
- Both must be:
  - At least 64 characters long
  - Cryptographically random
  - Different from each other
  - Never logged or exposed

### 2. Secure Refresh Token Storage
```javascript
// ❌ WRONG: Storing plain refresh tokens
user.refreshToken = refreshToken;

// ✅ CORRECT: Storing hashed refresh tokens
const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
user.refreshTokens.push({ tokenHash, expiresAt });
```

### 3. HttpOnly Secure Cookies
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/v1/auth/refresh' // Specific path only
});
```

### 4. Token Rotation
- On each refresh, old token is invalidated
- New token pair is generated
- Old refresh token removed from database
- Prevents token replay attacks

### 5. Multi-Device Support
- Users can have up to 5 active refresh tokens
- Each device gets its own refresh token
- Device info (user-agent, IP) tracked
- Logout from all devices supported

## API Endpoints

### Authentication Flow

#### 1. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

**Sets Cookie:**
```
Set-Cookie: refreshToken=abc123...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh
```

#### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** Same as register

#### 3. Refresh Access Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=abc123...
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

#### 4. Logout
```http
POST /api/v1/auth/logout
Cookie: refreshToken=abc123...
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Clears Cookie:**
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

## Database Schema

### User Model - Refresh Tokens
```javascript
refreshTokens: [{
  tokenHash: String,      // SHA-256 hash of refresh token
  expiresAt: Date,        // Token expiration date
  createdAt: Date,        // When token was created
  deviceInfo: {
    userAgent: String,    // Browser/device info
    ip: String            // IP address
  }
}]
```

## Security Best Practices

### 1. Environment Variables
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

### 2. HTTPS Only
- Always use HTTPS in production
- Cookies with `Secure` flag only work over HTTPS
- Never send tokens over HTTP

### 3. Cookie Configuration
```javascript
// Production
{
  httpOnly: true,
  secure: true,          // HTTPS only
  sameSite: 'strict',
  maxAge: 2592000000     // 30 days
}

// Development (localhost)
{
  httpOnly: true,
  secure: false,         // Allow HTTP for localhost
  sameSite: 'strict',
  maxAge: 2592000000
}
```

### 4. Token Expiration
- **Access Token**: 15 minutes (short-lived)
- **Refresh Token**: 30 days (long-lived)
- Adjust based on your security requirements

### 5. Secret Rotation
- Rotate JWT secrets every 3-6 months
- Use a secret manager in production:
  - AWS Secrets Manager
  - Google Secret Manager
  - Azure Key Vault
  - HashiCorp Vault

### 6. Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Current: 100 requests per 15 minutes

### 7. Password Security
- Minimum 8 characters
- Use bcrypt with cost factor 12
- Never store plain passwords
- Implement password strength requirements

## Client-Side Implementation

### React/React Native Example
```javascript
// Store access token in memory (not localStorage!)
let accessToken = null;

// Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: Send cookies
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  accessToken = data.data.accessToken;
  return data;
};

// API Request with auto-refresh
const apiRequest = async (url, options = {}) => {
  // Try with current access token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include'
  });
  
  // If 401, try to refresh
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.data.accessToken;
      
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
      });
    }
  }
  
  return response;
};

// Logout
const logout = async () => {
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  accessToken = null;
};
```

## Testing

### Manual Testing with cURL

#### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt
```

#### Refresh Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -b cookies.txt
```

## Common Security Mistakes to Avoid

### ❌ DON'T
1. Store refresh tokens in localStorage
2. Use the same secret for access and refresh tokens
3. Send tokens in URL parameters
4. Log tokens in console or files
5. Use weak or short secrets
6. Store plain refresh tokens in database
7. Allow unlimited refresh token lifetime
8. Skip HTTPS in production

### ✅ DO
1. Store refresh tokens in HttpOnly cookies
2. Use separate, strong secrets
3. Send tokens in Authorization header or cookies
4. Never log sensitive data
5. Use 64+ character random secrets
6. Hash refresh tokens before storage
7. Implement token expiration
8. Always use HTTPS in production

## Monitoring & Logging

### What to Log
- Login attempts (success/failure)
- Token refresh attempts
- Logout events
- Failed authentication attempts
- Suspicious activity (multiple failed logins)

### What NOT to Log
- Passwords
- Access tokens
- Refresh tokens
- JWT secrets
- User's personal data (without consent)

## Incident Response

### If Secrets are Compromised
1. Immediately rotate JWT secrets
2. Invalidate all refresh tokens
3. Force all users to re-login
4. Investigate how breach occurred
5. Update security measures

### If User Account is Compromised
1. Invalidate all user's refresh tokens
2. Force password reset
3. Notify user
4. Review account activity
5. Implement additional security measures

## Compliance

### GDPR Considerations
- Store minimal user data
- Implement data deletion
- Provide data export
- Get consent for tracking
- Document data processing

### OWASP Top 10
- ✅ A01: Broken Access Control - Implemented JWT
- ✅ A02: Cryptographic Failures - Using bcrypt, SHA-256
- ✅ A03: Injection - Using Mongoose (prevents NoSQL injection)
- ✅ A05: Security Misconfiguration - Environment validation
- ✅ A07: Identification and Authentication Failures - Secure auth system

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Support

For security issues, please email: security@mathematico.com
Do not create public issues for security vulnerabilities.
