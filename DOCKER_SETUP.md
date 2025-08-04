# Docker Setup Guide - Patient Data Management System

## Overview

This guide explains how to set up the PostgreSQL database using Docker for the Patient Data Management System.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (comes with Docker Desktop)
- Minimum 4GB RAM available for Docker

## Quick Start

### 1. Start PostgreSQL Database

```bash
# Navigate to project root
cd D:\Workspace\mac\docapp

# Start PostgreSQL and pgAdmin containers
docker-compose up -d

# View container status
docker-compose ps

# View logs
docker-compose logs postgres
```

### 2. Verify Database Setup

The setup includes:
- ✅ **PostgreSQL 16** running on port `5432`
- ✅ **pgAdmin 4** web interface on port `8081`
- ✅ **Automatic schema creation** from `database/schema.sql`
- ✅ **Sample data insertion** from `database/init-data.sql`
- ✅ **Persistent data storage** with Docker volumes

## Connection Details

### Database Connection
- **Host**: `localhost` (from host) / `docapp_postgres` (from containers)
- **Port**: `5432`
- **Database**: `patient_management_db`
- **Username**: `postgres`
- **Password**: `RamMac@2099`

### pgAdmin Web Interface
- **URL**: http://localhost:8081
- **Email**: `admin@docapp.com`
- **Password**: `admin123`

## Container Management

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# PostgreSQL only
docker-compose logs postgres

# pgAdmin only
docker-compose logs pgadmin

# Follow logs in real-time
docker-compose logs -f postgres
```

### Restart Services
```bash
docker-compose restart
```

## Database Features

### 1. Automatic Initialization
- Database schema is created automatically from `database/schema.sql`
- Sample data is populated from `database/init-data.sql`
- All tables, indexes, and triggers are set up

### 2. Sample Data Included
- **5 Sample Patients** with different cancer types and statuses
- **5 Appointments** including scheduled, completed, and missed
- **4 Treatment Records** covering chemotherapy, surgery, and radiation
- **4 Investigation Records** for blood tests and imaging
- **3 Notifications** for missed appointments and due follow-ups

### 3. Database Schema Highlights
- **Patient Management** - Complete patient records with cancer staging
- **Appointment System** - Scheduling with missed appointment tracking
- **Treatment Records** - Chemotherapy, surgery, radiation tracking
- **Investigation Management** - Lab results and imaging
- **Notification System** - Multi-channel alerts
- **Analytics & Reports** - Periodic reporting capabilities
- **Audit Trail** - Complete change tracking
- **ASP.NET Identity Integration** - User management tables

## Backend Integration

### Update Connection String
The backend is configured to use these connection strings:

**Development (Local)**:
```json
"DefaultConnection": "Host=localhost;Database=patient_management_db;Username=postgres;Password=RamMac@2099"
```

**Docker Environment**:
```json
"DefaultConnection": "Host=docapp_postgres;Database=patient_management_db;Username=postgres;Password=RamMac@2099;Port=5432"
```

### Run Backend with Docker Database
```bash
cd backend
dotnet run
```

The ASP.NET Core application will:
1. Connect to the Docker PostgreSQL instance
2. Create ASP.NET Identity tables automatically
3. Seed default admin user: `admin@clinic.com` / `Admin@123`
4. Be ready for API calls

## pgAdmin Usage

### 1. Access pgAdmin
1. Open http://localhost:8081
2. Login with `admin@docapp.com` / `admin123`

### 2. Add Server Connection
1. Click "Add New Server"
2. **General Tab**:
   - Name: `DocApp Database`
3. **Connection Tab**:
   - Host: `docapp_postgres`
   - Port: `5432`
   - Database: `patient_management_db`
   - Username: `postgres`
   - Password: `RamMac@2099`

### 3. Browse Database
- Navigate to `Servers > DocApp Database > Databases > patient_management_db`
- View tables under `Schemas > public > Tables`
- Run queries in the Query Tool

## Useful SQL Queries

### Check Sample Data
```sql
-- View all patients
SELECT patient_id, first_name, last_name, primary_cancer_site, current_status 
FROM patients;

-- View appointments with patient names
SELECT p.patient_id, p.first_name, p.last_name, 
       a.appointment_date, a.appointment_time, a.status
FROM patients p 
JOIN appointments a ON p.id = a.patient_id
ORDER BY a.appointment_date DESC;

-- View missed appointments
SELECT p.patient_id, p.first_name, p.last_name, 
       a.appointment_date, a.notes
FROM patients p 
JOIN appointments a ON p.id = a.patient_id
WHERE a.status = 'missed';

-- View notifications
SELECT n.notification_type, n.title, n.message, n.priority
FROM notifications n;
```

### Check Database Health
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('patient_management_db'));

-- Check table row counts
SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates
FROM pg_stat_user_tables;

-- Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if container is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection from host
docker exec -it docapp_postgres psql -U postgres -d patient_management_db -c "SELECT version();"
```

### Reset Database
```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove any orphaned containers
docker system prune

# Start fresh
docker-compose up -d
```

### Performance Issues
```bash
# Check container resource usage
docker stats docapp_postgres

# Check PostgreSQL configuration
docker exec -it docapp_postgres psql -U postgres -c "SHOW ALL;"
```

### pgAdmin Issues
```bash
# Reset pgAdmin data
docker-compose down
docker volume rm docapp_pgadmin_data
docker-compose up -d pgadmin
```

## Production Considerations

### Security
- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS connections
- Configure proper firewall rules

### Performance
- Adjust PostgreSQL configuration for production load
- Set up connection pooling
- Configure proper backup strategy
- Monitor database performance

### Backup Strategy
```bash
# Create database backup
docker exec docapp_postgres pg_dump -U postgres patient_management_db > backup.sql

# Restore database backup
docker exec -i docapp_postgres psql -U postgres patient_management_db < backup.sql
```

## Next Steps

1. ✅ **Database is ready** - PostgreSQL 16 with sample data
2. 🔄 **Test backend connection** - Run ASP.NET Core API
3. 🔄 **Develop frontend** - Next.js PWA connecting to API
4. 🔄 **Add more features** - Patient CRUD, appointments, notifications
5. 🔄 **Deploy to production** - Configure production Docker setup

## Support

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Verify containers are running: `docker-compose ps`
3. Test database connectivity using pgAdmin
4. Review this documentation for troubleshooting steps

The Docker PostgreSQL setup is now complete and ready for development! 🚀
