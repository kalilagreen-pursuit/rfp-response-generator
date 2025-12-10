#!/bin/bash

# Test script for Lead Capture API endpoint
# Usage: ./test-lead-capture-api.sh [unique_code]

API_URL="${VITE_API_URL:-http://localhost:3001/api}"
UNIQUE_CODE="${1:-h2MKbXct}"

echo "🧪 Testing Lead Capture API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API URL: $API_URL"
echo "Unique Code: $UNIQUE_CODE"
echo ""

# Test GET endpoint
echo "📥 Testing GET /api/lead-capture/$UNIQUE_CODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/lead-capture/$UNIQUE_CODE")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ GET endpoint working correctly"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ QR code not found - check unique_code: $UNIQUE_CODE"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo "⚠️  QR code is inactive"
else
    echo "❌ Unexpected status: $HTTP_STATUS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 To test with a different code:"
echo "   ./test-lead-capture-api.sh YOUR_UNIQUE_CODE"
echo ""
echo "💡 To test production API:"
echo "   VITE_API_URL=https://rfp-response-generator-h3w2.onrender.com/api ./test-lead-capture-api.sh $UNIQUE_CODE"

