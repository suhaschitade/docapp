# DocApp Database Exploration Guide

## Connect to Database
```bash
# Set PATH (add this to your ~/.zshrc for permanent access)
export PATH="/Applications/Postgres.app/Contents/Versions/16/bin:$PATH"

# Connect to database
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db
```

## Essential PostgreSQL Commands (inside psql)

### Database Information
```sql
\l                          -- List all databases
\c patient_management_db    -- Connect to specific database
\dt                         -- List all tables
\dv                         -- List all views
\d table_name               -- Describe specific table structure
\di                         -- List all indexes
\df                         -- List all functions
```

### Table Exploration
```sql
-- See table structure
\d Patients
\d AspNetUsers
\d appointments

-- Count records in tables
SELECT COUNT(*) FROM Patients;
SELECT COUNT(*) FROM AspNetUsers;
SELECT COUNT(*) FROM appointments;

-- View sample data
SELECT * FROM Patients LIMIT 5;
SELECT * FROM AspNetUsers;
SELECT * FROM appointments LIMIT 3;
```

### Useful Queries for DocApp
```sql
-- View all patients
SELECT "PatientId", "FirstName", "LastName", "PrimaryCancerSite", "CurrentStatus" 
FROM "Patients" LIMIT 10;

-- View appointments with patient info
SELECT a.appointment_date, a.appointment_time, a.status, 
       p.first_name, p.last_name, p.mobile_number
FROM appointments a 
JOIN patients p ON a.patient_id = p.id
ORDER BY a.appointment_date DESC;

-- View admin user
SELECT "Email", "FirstName", "LastName", "CreatedAt" 
FROM "AspNetUsers";

-- View user roles
SELECT u."Email", r."Name" as Role
FROM "AspNetUsers" u
JOIN "AspNetUserRoles" ur ON u."Id" = ur."UserId" 
JOIN "AspNetRoles" r ON ur."RoleId" = r."Id";

-- View notifications
SELECT notification_type, title, message, priority, created_at
FROM notifications
ORDER BY created_at DESC;
```

### Exit Commands
```sql
\q                          -- Quit psql
exit                        -- Also quits psql
```

## Method 2: One-line Commands (from terminal)
```bash
# List all tables
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db -c "\dt"

# View specific table data
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db -c "SELECT * FROM \"AspNetUsers\";"

# View patient count
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db -c "SELECT COUNT(*) as patient_count FROM patients;"
```

## Method 3: GUI Tools

### Option A: pgAdmin (Web-based)
- Install pgAdmin 4 from https://www.pgadmin.org/
- Connection details:
  - Host: localhost
  - Port: 5432
  - Database: patient_management_db
  - Username: postgres
  - Password: RamMac@2099

### Option B: TablePlus (Mac App Store - Recommended)
- Beautiful, fast GUI for PostgreSQL
- Connection details same as above

### Option C: DBeaver (Free, Cross-platform)
- Download from https://dbeaver.io/
- Full-featured database management tool

## Method 4: VS Code Extension
If you use VS Code, install the "PostgreSQL" extension:
- Connection: postgres://postgres:RamMac@2099@localhost:5432/patient_management_db

## Quick Database Summary
Your DocApp database contains:

### Original Tables (from schema.sql):
- patients (5 sample records)
- appointments (5 sample records)  
- treatments (4 sample records)
- investigations (4 sample records)
- notifications (3 sample records)
- user_profiles
- analytics_reports
- audit_logs

### ASP.NET Identity Tables (from migrations):
- AspNetUsers (1 admin user)
- AspNetRoles (Admin, Doctor, Nurse, Staff)
- AspNetUserRoles
- AspNetUserClaims
- AspNetRoleClaims
- AspNetUserLogins
- AspNetUserTokens

### Views:
- active_patients_view
- missed_appointments_view
