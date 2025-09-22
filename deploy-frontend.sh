#!/bin/bash

# DocApp Frontend-Only Deployment Script
# Usage: ./deploy-frontend.sh [server-ip] [username]

set -e  # Exit on any error

SERVER_IP=${1:-"oncomanage.com"}
USERNAME=${2:-"root"}
APP_NAME="docapp"
FRONTEND_PATH="/var/www/docapp/frontend"

echo "🚀 Deploying DocApp Frontend to server: $SERVER_IP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
    echo "=================================================="
}

# Check if server details are provided
if [ "$SERVER_IP" = "your-server-ip" ]; then
    print_error "Please provide server IP address"
    echo "Usage: ./deploy-frontend.sh [server-ip] [username]"
    exit 1
fi

print_section "Building Frontend"

# Navigate to frontend directory
cd frontend

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Build the application
print_status "Building Next.js application..."
npm run build

# Go back to root
cd ..

print_section "Preparing Deployment Package"

# Create deployment directory
print_status "Creating deployment package..."
mkdir -p frontend-deployment/build
mkdir -p frontend-deployment/public
mkdir -p frontend-deployment/config

# Copy built frontend
cp -r frontend/.next frontend-deployment/build/
cp -r frontend/public/* frontend-deployment/public/
cp frontend/package.json frontend-deployment/
cp frontend/package-lock.json frontend-deployment/

print_section "Uploading to Server"

print_status "Uploading frontend files to $SERVER_IP..."

# Upload to server
rsync -avz --progress --delete \
    frontend-deployment/ \
    $USERNAME@$SERVER_IP:~/docapp-frontend-new/

print_section "Deploying on Server"

print_status "Running deployment commands on server..."

# Deploy on server
ssh $USERNAME@$SERVER_IP << 'EOF'
set -e

echo "🔧 Setting up frontend on server..."

# Create backup of current frontend if it exists
if [ -d "/var/www/docapp/frontend" ]; then
    echo "📦 Creating backup of current frontend..."
    sudo cp -r /var/www/docapp/frontend /var/www/docapp/frontend-backup-$(date +%Y%m%d_%H%M%S)
fi

# Create directory structure
sudo mkdir -p /var/www/docapp/frontend
sudo mkdir -p /var/www/docapp/frontend/logs

# Move new build to production location
echo "🚚 Moving new frontend build to production..."
sudo rm -rf /var/www/docapp/frontend/.next
sudo rm -rf /var/www/docapp/frontend/public
sudo cp -r ~/docapp-frontend-new/build/.next /var/www/docapp/frontend/
sudo cp -r ~/docapp-frontend-new/public /var/www/docapp/frontend/
sudo cp ~/docapp-frontend-new/package*.json /var/www/docapp/frontend/

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/docapp/frontend
sudo chmod -R 755 /var/www/docapp/frontend

# Install production dependencies (if needed)
cd /var/www/docapp/frontend
if command -v npm &> /dev/null; then
    echo "📦 Installing production dependencies..."
    sudo -u www-data npm ci --only=production
fi

# Restart nginx to serve new static files
echo "🔄 Restarting nginx..."
sudo systemctl reload nginx

echo "✅ Frontend deployment completed!"
EOF

print_section "Deployment Complete"

print_status "✅ Frontend deployment completed successfully!"
print_status "Your application should be available at: https://$SERVER_IP"

# Test the deployment
print_status "🧪 Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" "https://$SERVER_IP" | grep -q "200\|301\|302"; then
    print_status "✅ Website is responding correctly!"
else
    print_warning "⚠️  Website might not be fully ready yet. Please check manually."
fi

print_warning "📝 Post-deployment checklist:"
echo "  1. ✅ Frontend files deployed"
echo "  2. ✅ Nginx reloaded"
echo "  3. 🔍 Check website: https://$SERVER_IP"
echo "  4. 🔍 Check favicon appears correctly in Safari"
echo "  5. 🔍 Test PWA installation on mobile"

# Cleanup
print_status "🧹 Cleaning up local deployment files..."
rm -rf frontend-deployment

print_status "🎉 Deployment process completed!"