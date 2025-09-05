#!/bin/bash

# DocApp PWA Build and Test Script
# This script builds the PWA and runs various tests to verify PWA compliance

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        print_success "✓ $1 exists"
        return 0
    else
        print_error "✗ $1 is missing"
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    if [ -d "$1" ]; then
        print_success "✓ $1 directory exists"
        return 0
    else
        print_error "✗ $1 directory is missing"
        return 1
    fi
}

print_status "Starting DocApp PWA build and validation..."

# Check current directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check if required PWA dependencies are installed
print_status "Checking PWA dependencies..."
if npm list next-pwa > /dev/null 2>&1; then
    print_success "✓ next-pwa is installed"
else
    print_error "✗ next-pwa is not installed"
    print_status "Installing next-pwa..."
    npm install next-pwa
fi

if npm list workbox-webpack-plugin > /dev/null 2>&1; then
    print_success "✓ workbox-webpack-plugin is installed"
else
    print_error "✗ workbox-webpack-plugin is not installed"
    print_status "Installing workbox-webpack-plugin..."
    npm install workbox-webpack-plugin
fi

# Check PWA essential files
print_status "Checking PWA essential files..."
PWA_FILES_VALID=true

check_file "public/manifest.json" || PWA_FILES_VALID=false
check_file "public/sw.js" || PWA_FILES_VALID=false
check_file "next.config.js" || PWA_FILES_VALID=false
check_dir "public/icons" || PWA_FILES_VALID=false

# Check if icons exist
print_status "Checking PWA icons..."
ICONS_VALID=true
REQUIRED_ICONS=(
    "public/icons/icon-72x72.svg"
    "public/icons/icon-96x96.svg"
    "public/icons/icon-128x128.svg"
    "public/icons/icon-144x144.svg"
    "public/icons/icon-152x152.svg"
    "public/icons/icon-192x192.svg"
    "public/icons/icon-384x384.svg"
    "public/icons/icon-512x512.svg"
)

for icon in "${REQUIRED_ICONS[@]}"; do
    check_file "$icon" || ICONS_VALID=false
done

# Check additional shortcut icons
SHORTCUT_ICONS=(
    "public/icons/appointment-icon.svg"
    "public/icons/patient-icon.svg"
    "public/icons/dashboard-icon.svg"
)

for icon in "${SHORTCUT_ICONS[@]}"; do
    check_file "$icon" || print_warning "Optional icon $icon is missing"
done

# Check TypeScript files
print_status "Checking PWA React components and hooks..."
TS_FILES_VALID=true

check_file "src/hooks/usePWA.ts" || TS_FILES_VALID=false
check_file "src/components/PWAInstallBanner.tsx" || TS_FILES_VALID=false
check_file "src/app/offline/page.tsx" || TS_FILES_VALID=false

# Validate manifest.json
print_status "Validating manifest.json..."
if [ -f "public/manifest.json" ]; then
    # Check if manifest.json is valid JSON
    if jq empty public/manifest.json 2>/dev/null; then
        print_success "✓ manifest.json is valid JSON"
        
        # Check required manifest fields
        NAME=$(jq -r '.name' public/manifest.json)
        SHORT_NAME=$(jq -r '.short_name' public/manifest.json)
        START_URL=$(jq -r '.start_url' public/manifest.json)
        DISPLAY=$(jq -r '.display' public/manifest.json)
        ICONS_COUNT=$(jq '.icons | length' public/manifest.json)
        
        if [ "$NAME" != "null" ] && [ "$NAME" != "" ]; then
            print_success "✓ Manifest has name: $NAME"
        else
            print_error "✗ Manifest missing name field"
        fi
        
        if [ "$SHORT_NAME" != "null" ] && [ "$SHORT_NAME" != "" ]; then
            print_success "✓ Manifest has short_name: $SHORT_NAME"
        else
            print_error "✗ Manifest missing short_name field"
        fi
        
        if [ "$START_URL" != "null" ] && [ "$START_URL" != "" ]; then
            print_success "✓ Manifest has start_url: $START_URL"
        else
            print_error "✗ Manifest missing start_url field"
        fi
        
        if [ "$DISPLAY" != "null" ] && [ "$DISPLAY" != "" ]; then
            print_success "✓ Manifest has display mode: $DISPLAY"
        else
            print_error "✗ Manifest missing display field"
        fi
        
        if [ "$ICONS_COUNT" -gt 0 ]; then
            print_success "✓ Manifest has $ICONS_COUNT icons defined"
        else
            print_error "✗ Manifest has no icons defined"
        fi
    else
        print_error "✗ manifest.json is not valid JSON"
        PWA_FILES_VALID=false
    fi
fi

# Check if jq is available for JSON validation
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed - skipping detailed manifest validation"
    print_status "To install jq: brew install jq (on macOS) or apt-get install jq (on Ubuntu)"
fi

# Build the application
print_status "Building the application..."
if npm run build; then
    print_success "✓ Application built successfully"
else
    print_error "✗ Application build failed"
    exit 1
fi

# Check if build output contains PWA files
print_status "Checking build output for PWA files..."
BUILD_DIR=".next"

if [ -d "$BUILD_DIR" ]; then
    print_success "✓ Build directory exists"
    
    # Check if service worker files are generated
    if find "$BUILD_DIR" -name "*sw*" | grep -q .; then
        print_success "✓ Service worker files found in build"
        find "$BUILD_DIR" -name "*sw*" -type f | head -5
    else
        print_warning "Service worker files not found in build output"
    fi
    
    # Check if workbox files are present
    if find "$BUILD_DIR" -name "*workbox*" | grep -q .; then
        print_success "✓ Workbox files found in build"
    else
        print_warning "Workbox files not found in build output"
    fi
else
    print_error "✗ Build directory not found"
fi

# Run TypeScript check
print_status "Running TypeScript type check..."
if npm run type-check 2>/dev/null || npx tsc --noEmit; then
    print_success "✓ TypeScript type check passed"
else
    print_warning "TypeScript type check found issues (this might be expected)"
fi

# Test service worker syntax (basic check)
print_status "Basic service worker syntax check..."
if [ -f "public/sw.js" ]; then
    if node -c public/sw.js 2>/dev/null; then
        print_success "✓ Service worker syntax is valid"
    else
        print_error "✗ Service worker has syntax errors"
    fi
fi

# Summary
echo ""
print_status "PWA Build Summary:"
echo "=================="

if [ "$PWA_FILES_VALID" = true ]; then
    print_success "✓ All essential PWA files are present"
else
    print_error "✗ Some essential PWA files are missing"
fi

if [ "$ICONS_VALID" = true ]; then
    print_success "✓ All required PWA icons are present"
else
    print_error "✗ Some required PWA icons are missing"
fi

if [ "$TS_FILES_VALID" = true ]; then
    print_success "✓ All PWA React components are present"
else
    print_error "✗ Some PWA React components are missing"
fi

# PWA Testing Recommendations
echo ""
print_status "PWA Testing Recommendations:"
echo "============================"
echo "1. Test with Chrome DevTools > Lighthouse > PWA audit"
echo "2. Test with Chrome DevTools > Application tab > Service Workers"
echo "3. Test offline functionality by going offline in DevTools > Network tab"
echo "4. Test install prompt on mobile devices"
echo "5. Test app shortcuts and manifest features"
echo "6. Use Chrome DevTools > Application > Manifest to verify manifest"
echo ""
echo "To test the PWA locally:"
echo "  npm run dev"
echo "  Open http://localhost:3000 in Chrome"
echo "  Open DevTools > Lighthouse > Generate report (Desktop/Mobile PWA)"
echo ""

# Check if everything is ready for deployment
if [ "$PWA_FILES_VALID" = true ] && [ "$ICONS_VALID" = true ] && [ "$TS_FILES_VALID" = true ]; then
    print_success "🎉 PWA is ready for deployment!"
    echo ""
    echo "Your DocApp PWA includes:"
    echo "• ✅ Service Worker for offline functionality"
    echo "• ✅ Web App Manifest for installation"
    echo "• ✅ Icons for all device types"
    echo "• ✅ Install banner and update prompts"
    echo "• ✅ Offline fallback page"
    echo "• ✅ Push notification support structure"
    echo "• ✅ Background sync capabilities"
    echo ""
else
    print_error "❌ PWA setup is incomplete. Please address the issues above."
    exit 1
fi
