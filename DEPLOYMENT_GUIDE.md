# DocApp VPS Deployment Guide

This guide walks you through deploying the DocApp Patient Management System to your OVH VPS server.

## Prerequisites

Your VPS server should have:
- ✅ Ubuntu/Debian Linux
- ✅ PostgreSQL installed and running
- ✅ .NET 9.0 runtime installed
- ✅ Nginx installed
- ✅ SSH access with sudo privileges

## Quick Deployment

### 1. Clone and Build Locally

```bash
# From your local machine
cd /Users/suhaschitade/workspace/docapp/docapp

# Make deployment script executable
chmod +x deploy-to-vps.sh

# Run deployment (replace with your server details)
./deploy-to-vps.sh YOUR_SERVER_IP USERNAME
```

Example:
```bash
./deploy-to-vps.sh 192.168.1.100 root
```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. Prepare Local Build

```bash
# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
cd backend
dotnet publish -c Release -o ../publish
cd ..
```

### 2. Upload to Server

```bash
# Upload files to your server
rsync -avz --progress frontend/.next/ username@server-ip:~/docapp-frontend/
rsync -avz --progress frontend/public/ username@server-ip:~/docapp-frontend/public/
rsync -avz --progress publish/ username@server-ip:~/docapp-backend/
rsync -avz --progress deployment/ username@server-ip:~/docapp-config/
```

### 3. Server Setup

SSH into your server and run:

```bash
ssh username@your-server-ip

# Become root
sudo su -

# Create application directories
mkdir -p /var/www/docapp/backend
mkdir -p /var/www/docapp/frontend
mkdir -p /var/www/docapp/backend/logs

# Move files to proper locations
cp -r ~/docapp-backend/* /var/www/docapp/backend/
cp -r ~/docapp-frontend/* /var/www/docapp/frontend/
cp ~/docapp-config/appsettings.Production.json /var/www/docapp/backend/

# Set permissions
chown -R www-data:www-data /var/www/docapp
chmod -R 755 /var/www/docapp
```

### 4. Database Configuration

```bash
# Setup database
sudo -u postgres psql -f ~/docapp-config/setup-database.sql

# Run migrations
cd /var/www/docapp/backend
sudo -u www-data dotnet PatientManagementApi.dll --migrate
```

### 5. Configure Services

```bash
# Install systemd service
cp ~/docapp-config/docapp-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable docapp-api
systemctl start docapp-api

# Configure nginx
cp ~/docapp-config/nginx.conf /etc/nginx/sites-available/docapp
ln -sf /etc/nginx/sites-available/docapp /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## Security Configuration

### 1. Update Database Password

Edit `/var/www/docapp/backend/appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=docapp_db;Username=docapp_user;Password=YOUR_SECURE_PASSWORD"
  }
}
```

### 2. Update JWT Secret

Generate a secure JWT secret:

```bash
openssl rand -base64 64
```

Update the JWT secret in `appsettings.Production.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "YOUR_GENERATED_SECRET_KEY_HERE"
  }
}
```

### 3. Configure HTTPS (Recommended)

Install Certbot for Let's Encrypt SSL:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

## Service Management

### Check Service Status

```bash
# Check API service
sudo systemctl status docapp-api

# Check nginx
sudo systemctl status nginx

# View API logs
sudo journalctl -u docapp-api -f
```

### Restart Services

```bash
# Restart API
sudo systemctl restart docapp-api

# Reload nginx
sudo systemctl reload nginx

# Or use the helper script
sudo /var/www/docapp/start-services.sh
```

### Update Application

To update the application after making changes:

```bash
# From local machine, re-run deployment
./deploy-to-vps.sh YOUR_SERVER_IP USERNAME

# Or manually restart services on server
sudo systemctl restart docapp-api
sudo systemctl reload nginx
```

## Troubleshooting

### Common Issues

1. **API not starting**
   ```bash
   # Check logs
   sudo journalctl -u docapp-api -n 50
   
   # Check .NET runtime
   dotnet --version
   
   # Verify permissions
   ls -la /var/www/docapp/backend/
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   sudo -u postgres psql -d docapp_db -c "SELECT 1;"
   ```

3. **Frontend not loading**
   ```bash
   # Check nginx configuration
   sudo nginx -t
   
   # Check nginx logs
   sudo tail -f /var/log/nginx/error.log
   
   # Verify file permissions
   ls -la /var/www/docapp/frontend/
   ```

### Performance Tuning

1. **Enable gzip compression** in nginx:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Set up log rotation** (automatically configured by setup script):
   ```bash
   # Check log rotation config
   cat /etc/logrotate.d/docapp
   ```

## File Locations

- **Application**: `/var/www/docapp/`
- **Backend API**: `/var/www/docapp/backend/`
- **Frontend**: `/var/www/docapp/frontend/`
- **Config**: `/var/www/docapp/backend/appsettings.Production.json`
- **Nginx Config**: `/etc/nginx/sites-available/docapp`
- **Service File**: `/etc/systemd/system/docapp-api.service`
- **Logs**: `/var/www/docapp/backend/logs/`

## URLs

After successful deployment:

- **Frontend**: `http://YOUR_SERVER_IP/`
- **API**: `http://YOUR_SERVER_IP/api/`
- **Health Check**: `http://YOUR_SERVER_IP/api/health`

## Default Credentials

The application comes with default test credentials:

- **Email**: `admin@docapp.com`
- **Password**: `Admin@123`

⚠️ **Important**: Change these credentials immediately after deployment.

## Backup Strategy

### Database Backup

```bash
# Create daily backup script
sudo crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * sudo -u postgres pg_dump docapp_db > /var/backups/docapp-$(date +\%Y\%m\%d).sql
```

### Application Backup

```bash
# Backup configuration
tar -czf /var/backups/docapp-config-$(date +%Y%m%d).tar.gz /var/www/docapp/backend/appsettings.Production.json

# Full application backup
tar -czf /var/backups/docapp-full-$(date +%Y%m%d).tar.gz /var/www/docapp/
```

## Support

If you encounter issues:

1. Check the logs: `sudo journalctl -u docapp-api -f`
2. Verify all services are running: `sudo systemctl status docapp-api nginx postgresql`
3. Test database connectivity
4. Check file permissions and ownership

Your DocApp should now be successfully deployed and running on your OVH VPS! 🎉
