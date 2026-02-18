# STEP 5 — Confirm Distributed Safety

## Test with Two Different IPs:

### Method 1: Home WiFi + Mobile Hotspot

1. **From Home WiFi:**
```bash
ENDPOINT="https://your-vercel-domain.vercel.app/api/v1/auth/login"

for i in {1..3}; do
  echo "WiFi Attempt $i"
  curl -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "Status: %{http_code}\n" \
    -s -o /dev/null
  sleep 1
done
```

2. **From Mobile Hotspot/VPN:**
```bash
# Connect to mobile hotspot or VPN, then run:
for i in {1..3}; do
  echo "Mobile/VPN Attempt $i"
  curl -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "Status: %{http_code}\n" \
    -s -o /dev/null
  sleep 1
done
```

### ✅ PASS Criteria:
- Each IP has separate Redis key
- Rate limits are independent per IP
- No cross-contamination between networks

### In Upstash Console, verify:
```bash
# Should show keys for both IPs
KEYS prod:login:*

# Each IP should have its own counter
GET prod:login:IP_ADDRESS_1
GET prod:login:IP_ADDRESS_2
```

### ❌ If limits reset between networks → store is not Redis-backed.

## Expected Results:
- IP 1: 3 attempts counted
- IP 2: 3 attempts counted separately
- No shared state between IPs
