# STEP 7 — Hard Failure Test

## Test Redis Unavailability:

### 1. Remove REDIS_URL in Vercel:
- Go to Vercel dashboard → Project → Settings → Environment Variables
- Remove or comment out REDIS_URL
- Redeploy the application

### 2. Test Expected Behavior:

```bash
ENDPOINT="https://your-vercel-domain.vercel.app/api/v1/auth/login"

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -v
```

### ✅ Expected Behavior:
- App should FAIL startup with Redis error OR
- Return 500 on auth routes with Redis error
- Should NOT silently work with rate limiting

### Expected Error Messages:
- "Redis not available - rate limiting requires Redis in production"
- "Security middleware validation failed"
- "REDIS_URL environment variable is required in production"

### 3. Restore REDIS_URL:
- Re-add REDIS_URL in Vercel dashboard
- Redeploy
- Verify system works again

### ❌ If it silently works → fallback exists → not enterprise hardened.

## Final Classification Logic:

### ❌ NOT REDIS BACKED IF:
- No Redis keys created
- 6th request does not return 429
- Redis status not ready
- App runs without REDIS_URL

### ⚠ PARTIALLY REDIS BACKED IF:
- Redis connected
- But rate limit headers missing
- Or fallback exists
- Or resetTime incorrect type

### ✅ FULLY DISTRIBUTED SAFE IF:
- Redis status ready
- 429 triggers correctly
- Keys written in Upstash
- TTL correct
- Independent per-IP limits
- Cold start does not break
- No fallback path exists

### ✅ ENTERPRISE HARDENED IF:
- Fully Distributed Safe +
- Account lockout works
- Enumeration protection confirmed
- Dummy bcrypt timing consistent
- System fails hard without Redis
- Proper rate-limit headers returned
