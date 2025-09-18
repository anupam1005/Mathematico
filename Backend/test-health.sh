#!/usr/bin/env bash
set -e

echo "🔍 Testing Mathematico Backend API Health..."
echo "=============================================="

# Test local server (if running)
echo "📱 Testing local server on port ${PORT:-5000}..."
if curl -f -sS "http://localhost:${PORT:-5000}/api/v1/health" > /dev/null 2>&1; then
    echo "✅ Local backend /api/v1/health OK"
    curl -sS "http://localhost:${PORT:-5000}/api/v1/health" | jq '.' || echo "Response received but not JSON"
else
    echo "⚠️ Local health check failed (server may not be running)"
fi

echo ""
echo "🌐 Testing production URL..."
if curl -sS -f "https://mathematico-backend-new.vercel.app/api/v1/health" > /dev/null 2>&1; then
    echo "✅ Production backend /api/v1/health OK"
    curl -sS "https://mathematico-backend-new.vercel.app/api/v1/health" | jq '.' || echo "Response received but not JSON"
else
    echo "❌ Production health check failed"
    echo "Response:"
    curl -sS "https://mathematico-backend-new.vercel.app/api/v1/health" || echo "No response"
fi

echo ""
echo "🔗 Testing root API endpoint..."
if curl -sS -f "https://mathematico-backend-new.vercel.app/api/v1" > /dev/null 2>&1; then
    echo "✅ Production backend /api/v1 OK"
    curl -sS "https://mathematico-backend-new.vercel.app/api/v1" | jq '.' || echo "Response received but not JSON"
else
    echo "❌ Production /api/v1 check failed"
fi

echo ""
echo "📊 Testing mobile-specific endpoints..."
echo "Testing courses endpoint..."
curl -sS "https://mathematico-backend-new.vercel.app/api/v1/courses" | jq '.success' || echo "Courses endpoint failed"

echo "Testing books endpoint..."
curl -sS "https://mathematico-backend-new.vercel.app/api/v1/books" | jq '.success' || echo "Books endpoint failed"

echo "Testing live classes endpoint..."
curl -sS "https://mathematico-backend-new.vercel.app/api/v1/live-classes" | jq '.success' || echo "Live classes endpoint failed"

echo ""
echo "✅ Health check completed!"
echo "=============================================="
