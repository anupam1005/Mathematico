# STEP 3 — Confirm Redis Keys Are Created

## In Upstash Console:

After running the 6 login attempts from Step 2, run these commands:

```bash
# Check for rate limit keys
KEYS prod:login:*
KEYS prod:auth:*
KEYS prod:brute:*
```

### ✅ PASS Criteria:
Keys appear immediately after login attempts.

## Then check specific keys:

```bash
# Replace YOUR_IP_ADDRESS with your actual IP
GET prod:login:YOUR_IP_ADDRESS
TTL prod:login:YOUR_IP_ADDRESS

GET prod:auth:YOUR_IP_ADDRESS
TTL prod:auth:YOUR_IP_ADDRESS

GET prod:brute:YOUR_IP_ADDRESS
TTL prod:brute:YOUR_IP_ADDRESS
```

### Expected Results:
- Value increments (login should show "5" or "6")
- TTL close to 60 for login/auth, 300 for brute

### ❌ If no keys → you are not using Redis store.

## Example Expected Output:
```
KEYS prod:login:*
1) "prod:login:203.0.113.42"

GET prod:login:203.0.113.42
"5"

TTL prod:login:203.0.113.42
(integer) 58
```
