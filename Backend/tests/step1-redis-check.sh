#!/bin/bash

# STEP 1 — Confirm Redis Is Actually Connected
# Deploy this code first, then run:

echo "STEP 1: Testing Redis Connection"
echo "Deploy the updated authControllerValidated.js first"
echo "Then hit: POST /api/v1/auth/login"
echo ""
echo "Expected logs:"
echo "=== REDIS RUNTIME CHECK ==="
echo "NODE_ENV: production"
echo "REDIS_URL exists: true"
echo "Redis status: ready"
echo "==========================="
echo ""
echo "If status !== ready, stop. Fix Redis first."
echo ""
echo "Test command:"
echo "curl -X POST 'https://your-vercel-domain.vercel.app/api/v1/auth/login' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"wrong\"}'"
