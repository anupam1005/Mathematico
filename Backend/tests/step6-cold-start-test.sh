#!/bin/bash

# STEP 6 — Cold Start Validation

echo "STEP 6: Testing Cold Start Behavior"
echo "Wait 10 minutes for cold start, then test:"
echo ""

ENDPOINT="https://your-vercel-domain.vercel.app/api/v1/auth/login"

echo "First request after cold start (should be slower):"
time curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -w "Status: %{http_code}, Time: %{time_total}s\n" \
  -s -o /dev/null

echo ""
echo "Immediate second request (should be faster):"
time curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -w "Status: %{http_code}, Time: %{time_total}s\n" \
  -s -o /dev/null

echo ""
echo "✅ PASS Criteria:"
echo "- First request slower (cold start)"
echo "- Redis status still ready (check logs)"
echo "- Rate limits still enforced"
echo "- Existing Redis keys persist (check Upstash)"

echo ""
echo "❌ If cold start breaks limit → Redis client not stable."

echo ""
echo "Also check logs for:"
echo "=== REDIS RUNTIME CHECK ==="
echo "Redis status: ready"
