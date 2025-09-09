#!/bin/bash

# DocApp VPS Server Setup Script
# This script sets up the server environment and deploys the application

set -e

echo "🚀 Setting up DocApp on VPS server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo"
    exit 1
fi

print_status "Creating application directories..."

# Create application directories
mkdir -p /var/www/docapp/backend
mkdir -p /var/www/docapp/frontend
mkdir -p /var/www/docapp/backend/logs

print_status "Setting up file permissions..."

# Set ownership
chown -R www-data:www-data /var/www/docapp
chmod -R 755 /var/www/docapp

print_status "Installing Node.js dependencies (if needed)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

print_status "Copying application files..."

# Copy backend files
cp -r backend/* /var/www/docapp/backend/

# Copy frontend files  
cp -r frontend/* /var/www/docapp/frontend/

# Copy configuration files
cp config/appsettings.Production.json /var/www/docapp/backend/

print_status "Installing frontend dependencies..."

# Install frontend dependencies on server
cd /var/www/docapp/frontend
npm ci --production

print_status "Setting up database..."

# Check if database setup is needed
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw docapp_db; then
    print_status "Setting up PostgreSQL database..."
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Update the SQL file with generated password
    sed -i "s/your_secure_password_here/$DB_PASSWORD/g" config/setup-database.sql
    
    # Run database setup
    sudo -u postgres psql -f ../setup-database.sql
    
    # Update appsettings with the generated password
    sed -i "s/your_secure_password_here/$DB_PASSWORD/g" /var/www/docapp/backend/appsettings.Production.json
    
    print_status "Database password generated and configured"
else
    print_status "Database already exists"
fi

print_status "Running database migrations..."

# Run EF Core migrations
cd /var/www/docapp/backend
sudo -u www-data dotnet PatientManagementApi.dll --migrate

print_status "Setting up systemd service..."

# Copy and enable systemd service
cp config/docapp-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable docapp-api

print_status "Configuring nginx..."

# Backup existing nginx config if it exists
if [ -f /etc/nginx/sites-available/default ]; then
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Copy nginx configuration
cp config/nginx.conf /etc/nginx/sites-available/docapp
ln -sf /etc/nginx/sites-available/docapp /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

print_status "Starting services..."

# Start the API service
systemctl start docapp-api

# Restart nginx
systemctl restart nginx

print_status "Enabling services to start on boot..."

systemctl enable docapp-api
systemctl enable nginx

print_status "Setting up log rotation..."

# Create logrotate configuration
cat > /etc/logrotate.d/docapp << EOF
/var/www/docapp/backend/logs/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload docapp-api > /dev/null 2>&1 || true
    endscript
}
EOF

print_status "✅ Server setup completed successfully!"

echo ""
echo "📋 Next steps:"
echo "  1. Update your DNS to point to this server"
echo "  2. Set up SSL certificate:"
echo "     sudo apt install certbot python3-certbot-nginx"
echo "     sudo certbot --nginx -d yourdomain.com"
echo "  3. Check service status:"
echo "     sudo systemctl status docapp-api"
echo "     sudo systemctl status nginx"
echo ""

print_status "Service URLs:"
echo "  Frontend: http://$(curl -s ifconfig.me)"
echo "  API: http://$(curl -s ifconfig.me)/api/"

print_status "Useful commands:"
echo "  View API logs: sudo journalctl -u docapp-api -f"
echo "  Restart API: sudo systemctl restart docapp-api"
echo "  Check nginx: sudo nginx -t && sudo systemctl reload nginx"
