#!/bin/bash

# STEP 2 — Confirm Rate Limiting Actually Works
# Replace YOUR_VERCEL_DOMAIN with your actual domain

echo "STEP 2: Testing Rate Limiting"
echo "Replace YOUR_VERCEL_DOMAIN below"
echo ""

ENDPOINT="https://YOUR_VERCEL_DOMAIN.vercel.app/api/v1/auth/login"

echo "Running 6 login attempts..."
echo "Expected: Attempts 1-5 → 401, Attempt 6 → 429"
echo ""

for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" \
    -s -o /dev/null
  sleep 1
done

echo ""
echo "✅ PASS Criteria:"
echo "Attempts 1–5 → 401"
echo "Attempt 6 → 429"
echo ""
echo "❌ If 6th attempt is NOT 429 → rate limiting not active."
