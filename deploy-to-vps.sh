#!/bin/bash

# DocApp VPS Deployment Script
# Usage: ./deploy-to-vps.sh [server-ip] [username]

set -e  # Exit on any error

SERVER_IP=${1:-"your-server-ip"}
USERNAME=${2:-"root"}
APP_NAME="docapp"
APP_PATH="/var/www/docapp"
SERVICE_NAME="docapp-api"

echo "🚀 Deploying DocApp to VPS server: $SERVER_IP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if server details are provided
if [ "$SERVER_IP" = "your-server-ip" ]; then
    print_error "Please provide server IP address"
    echo "Usage: ./deploy-to-vps.sh [server-ip] [username]"
    exit 1
fi

print_status "Building the application locally..."

# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
cd backend
dotnet restore
dotnet publish -c Release -o ../publish
cd ..

print_status "Creating deployment package..."

# Create deployment directory
mkdir -p deployment-package/backend
mkdir -p deployment-package/frontend
mkdir -p deployment-package/scripts
mkdir -p deployment-package/config

# Copy backend build
cp -r publish/* deployment-package/backend/

# Copy frontend build
cp -r frontend/.next deployment-package/frontend/
cp -r frontend/public deployment-package/frontend/
cp frontend/package.json deployment-package/frontend/
cp frontend/package-lock.json deployment-package/frontend/

# Copy configuration files
cp deployment/nginx.conf deployment-package/config/
cp deployment/docapp-api.service deployment-package/config/
cp deployment/appsettings.Production.json deployment-package/config/
cp deployment/setup-database.sql deployment-package/config/
cp deployment/setup-server.sh deployment-package/scripts/
cp deployment/start-services.sh deployment-package/scripts/

print_status "Uploading to server..."

# Upload deployment package
rsync -avz --progress deployment-package/ $USERNAME@$SERVER_IP:~/docapp-deployment/

print_status "Running deployment on server..."

# Run deployment script on server
ssh $USERNAME@$SERVER_IP << 'EOF'
cd ~/docapp-deployment
chmod +x scripts/*.sh
sudo ./scripts/setup-server.sh
EOF

print_status "✅ Deployment completed successfully!"
print_status "Your application should be available at: http://$SERVER_IP"
print_warning "Don't forget to:"
echo "  1. Configure your domain DNS to point to $SERVER_IP"
echo "  2. Set up SSL certificate (Let's Encrypt recommended)"
echo "  3. Update environment variables in /var/www/docapp/backend/appsettings.Production.json"

# Cleanup
rm -rf deployment-package
rm -rf publish
