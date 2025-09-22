#!/bin/bash

echo "🧪 DocApp Production PWA Testing Script"
echo "========================================"
echo "Testing PWA functionality on: https://oncomanage.com"
echo ""

DOMAIN="https://oncomanage.com"
PASS_COUNT=0
FAIL_COUNT=0

# Function to test endpoints
test_endpoint() {
    local url=$1
    local description=$2
    
    if curl -k --connect-timeout 10 -s "$url" > /dev/null 2>&1; then
        echo "✅ $description"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ $description"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Function to test JSON endpoints
test_json_endpoint() {
    local url=$1
    local description=$2
    
    if curl -k --connect-timeout 10 -s "$url" | python3 -m json.tool > /dev/null 2>&1; then
        echo "✅ $description"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ $description"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "🔍 Testing PWA Core Files..."
echo "─────────────────────────────"

# Test main site
test_endpoint "$DOMAIN/" "Main application loads"

# Test PWA manifest
test_json_endpoint "$DOMAIN/manifest.json" "PWA Manifest (JSON valid)"

# Test service worker
test_endpoint "$DOMAIN/sw.js" "Service Worker available"

echo ""
echo "🔍 Testing PWA Icons..."
echo "─────────────────────────"

# Test all required PWA icons
for size in 72 96 128 144 152 192 384 512; do
    test_endpoint "$DOMAIN/icons/icon-${size}x${size}.png" "Icon ${size}x${size}.png"
done

echo ""
echo "🔍 Testing Shortcut Icons..."
echo "──────────────────────────────"

# Test shortcut icons
test_endpoint "$DOMAIN/icons/appointment-icon.png" "Appointment shortcut icon"
test_endpoint "$DOMAIN/icons/patient-icon.png" "Patient shortcut icon"
test_endpoint "$DOMAIN/icons/dashboard-icon.png" "Dashboard shortcut icon"

echo ""
echo "🔍 Testing PWA Routes..."
echo "─────────────────────────"

# Test PWA routes
test_endpoint "$DOMAIN/dashboard" "Dashboard route"
test_endpoint "$DOMAIN/manage-patients" "Patients route"
test_endpoint "$DOMAIN/appointments" "Appointments route"
test_endpoint "$DOMAIN/treatments" "Treatments route"
test_endpoint "$DOMAIN/notifications" "Notifications route"
test_endpoint "$DOMAIN/profile" "Profile route"
test_endpoint "$DOMAIN/offline" "Offline fallback page"

echo ""
echo "🔍 Testing HTTPS and Security..."
echo "─────────────────────────────────"

# Check HTTPS redirect
if curl -I --connect-timeout 10 "http://oncomanage.com" 2>/dev/null | grep -q "301\|302"; then
    echo "✅ HTTP to HTTPS redirect working"
    ((PASS_COUNT++))
else
    echo "❌ HTTP to HTTPS redirect not working"
    ((FAIL_COUNT++))
fi

# Test HTTPS
if curl -k -I --connect-timeout 10 "$DOMAIN/" 2>/dev/null | grep -q "200 OK"; then
    echo "✅ HTTPS connection successful"
    ((PASS_COUNT++))
else
    echo "❌ HTTPS connection failed"
    ((FAIL_COUNT++))
fi

echo ""
echo "📊 Testing Results Summary"
echo "════════════════════════════"
echo "✅ Passed: $PASS_COUNT tests"
echo "❌ Failed: $FAIL_COUNT tests"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All PWA tests PASSED! Your PWA is working correctly on production."
    echo ""
    echo "📱 Manual Testing Steps:"
    echo "1. Open https://oncomanage.com in Chrome/Edge"
    echo "2. Check for install prompt (⊕ icon in address bar)"
    echo "3. Open DevTools → Lighthouse → Run PWA audit"
    echo "4. Test offline functionality (DevTools → Network → Offline)"
    echo "5. Test on mobile device for 'Add to Home Screen'"
else
    echo "⚠️  Some PWA tests failed. Check the failed items above."
    echo "💡 Common issues:"
    echo "   - Network connectivity problems"
    echo "   - Missing files on server"
    echo "   - Server configuration issues"
fi

echo ""
echo "🚀 Quick Manual Validation:"
echo "──────────────────────────"
echo "1. Visit: https://oncomanage.com"
echo "2. Press F12 → Application tab"
echo "3. Check 'Manifest' section"
echo "4. Check 'Service Workers' section"
echo "5. Run Lighthouse PWA audit"

exit $FAIL_COUNT