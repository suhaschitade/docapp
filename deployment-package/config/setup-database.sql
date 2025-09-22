-- DocApp Database Setup Script
-- Run this as postgres user: sudo -u postgres psql -f setup-database.sql

-- Create database user for the application
CREATE USER docapp_user WITH PASSWORD 'your_secure_password_here';

-- Create the database
CREATE DATABASE docapp_db WITH OWNER docapp_user;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE docapp_db TO docapp_user;

-- Connect to the database
\c docapp_db;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO docapp_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO docapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO docapp_user;

-- Create the AspNet Identity tables (these will be created by EF migrations)
-- But we ensure the user has permissions

GRANT CREATE ON SCHEMA public TO docapp_user;
