#!/bin/bash

echo "🧪 DocApp PWA Testing Script"
echo "=============================="
echo "Date: $(date)"
echo "Platform: $(uname -s)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Check if app is running
echo "🔍 Testing app availability..."
if curl -s http://localhost:3000 > /dev/null; then
    test_result 0 "App is running on localhost:3000"
else
    test_result 1 "App is not running. Please start with 'npm run start'"
    exit 1
fi

# Test manifest
echo ""
echo "🔍 Testing Web App Manifest..."
manifest_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.json)
if [ "$manifest_status" = "200" ]; then
    test_result 0 "Manifest is accessible"
    
    # Test manifest content
    manifest_content=$(curl -s http://localhost:3000/manifest.json)
    
    if echo "$manifest_content" | jq -e '.name' > /dev/null 2>&1; then
        test_result 0 "Manifest has valid JSON structure"
        
        app_name=$(echo "$manifest_content" | jq -r '.name')
        if [ "$app_name" = "DocApp - Patient Management System" ]; then
            test_result 0 "App name is correct: $app_name"
        else
            test_result 1 "App name mismatch: $app_name"
        fi
        
        display_mode=$(echo "$manifest_content" | jq -r '.display')
        if [ "$display_mode" = "standalone" ]; then
            test_result 0 "Display mode is standalone"
        else
            test_result 1 "Display mode is not standalone: $display_mode"
        fi
        
        icons_count=$(echo "$manifest_content" | jq '.icons | length')
        if [ "$icons_count" -ge 8 ]; then
            test_result 0 "Has $icons_count icons (8+ required)"
        else
            test_result 1 "Only $icons_count icons found (8+ required)"
        fi
        
        shortcuts_count=$(echo "$manifest_content" | jq '.shortcuts | length')
        if [ "$shortcuts_count" -ge 3 ]; then
            test_result 0 "Has $shortcuts_count app shortcuts"
        else
            test_result 1 "Only $shortcuts_count shortcuts found"
        fi
    else
        test_result 1 "Manifest has invalid JSON structure"
    fi
else
    test_result 1 "Manifest is not accessible (HTTP $manifest_status)"
fi

# Test service worker
echo ""
echo "🔍 Testing Service Worker..."
sw_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sw.js)
if [ "$sw_status" = "200" ]; then
    test_result 0 "Service worker is accessible"
    
    # Check service worker content
    sw_content=$(curl -s http://localhost:3000/sw.js | head -20)
    if echo "$sw_content" | grep -q "precache\|cache\|fetch"; then
        test_result 0 "Service worker contains caching logic"
    else
        test_result 1 "Service worker may not contain proper caching logic"
    fi
else
    test_result 1 "Service worker is not accessible (HTTP $sw_status)"
fi

# Test PWA icons
echo ""
echo "🔍 Testing PWA Icons..."
for size in 72 96 128 144 152 192 384 512; do
    icon_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/icons/icon-${size}x${size}.png")
    if [ "$icon_status" = "200" ]; then
        test_result 0 "Icon ${size}x${size}.png exists"
    else
        test_result 1 "Icon ${size}x${size}.png is missing"
    fi
done

# Test shortcut icons
echo ""
echo "🔍 Testing Shortcut Icons..."
for icon in appointment-icon patient-icon dashboard-icon; do
    icon_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/icons/${icon}.png")
    if [ "$icon_status" = "200" ]; then
        test_result 0 "Shortcut icon ${icon}.png exists"
    else
        test_result 1 "Shortcut icon ${icon}.png is missing"
    fi
done

# Test key pages
echo ""
echo "🔍 Testing Core Pages..."
pages=("/" "/dashboard" "/appointments" "/manage-patients" "/treatments" "/investigations")
for page in "${pages[@]}"; do
    page_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${page}")
    if [ "$page_status" = "200" ]; then
        test_result 0 "Page '$page' is accessible"
    else
        test_result 1 "Page '$page' returns HTTP $page_status"
    fi
done

# Test offline page
echo ""
echo "🔍 Testing Offline Support..."
offline_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/offline")
if [ "$offline_status" = "200" ]; then
    test_result 0 "Offline page exists"
else
    test_result 1 "Offline page is missing"
fi

# Test Next.js PWA configuration
echo ""
echo "🔍 Testing Next.js Configuration..."
if [ -f "frontend/next.config.js" ]; then
    if grep -q "withPWA\|next-pwa" "frontend/next.config.js"; then
        test_result 0 "Next.js PWA configuration found"
    else
        test_result 1 "Next.js PWA configuration not found"
    fi
else
    test_result 1 "next.config.js not found"
fi

# Test package.json PWA dependencies
echo ""
echo "🔍 Testing PWA Dependencies..."
cd frontend
if npm list next-pwa > /dev/null 2>&1; then
    test_result 0 "next-pwa dependency is installed"
else
    test_result 1 "next-pwa dependency is missing"
fi

if npm list workbox-webpack-plugin > /dev/null 2>&1; then
    test_result 0 "workbox-webpack-plugin is available"
else
    test_result 1 "workbox-webpack-plugin is not installed"
fi
cd ..

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✅ Tests Passed: $PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED${NC}"
echo "=============================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All PWA tests passed! Your app is PWA-ready.${NC}"
    echo ""
    echo "📱 Next Steps for Manual Testing:"
    echo "1. Open Chrome DevTools → Application → Manifest"
    echo "2. Run Lighthouse audit (should score 90+ for PWA)"
    echo "3. Test installation on desktop (install icon in address bar)"
    echo "4. Test offline functionality (Network tab → Offline)"
    echo "5. Test on mobile device for 'Add to Home Screen'"
    echo ""
    echo "🚀 Your PWA is ready for production!"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "- Ensure app is running: npm run start"
    echo "- Generate missing icons: node scripts/svg-to-png.js"
    echo "- Check service worker registration"
    echo "- Verify manifest.json syntax"
fi

echo ""
echo "📚 For detailed testing guide, see: PWA_TESTING_GUIDE.md"
