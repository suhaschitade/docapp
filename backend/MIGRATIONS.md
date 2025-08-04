# Entity Framework Core Migrations Guide

## Overview
This project uses Entity Framework Core Migrations to manage database schema changes. The system is configured with PostgreSQL as the database provider and automatically applies migrations on application startup.

## Current Migration Status
- **Initial Migration**: `20250721171304_InitialCreate` (Applied)
  - Contains all core tables for ASP.NET Identity, Patient Management, Appointments, Treatments, etc.
  - Uses integer primary keys with auto-increment (SERIAL in PostgreSQL)

## Migration Commands

### Create a New Migration
```bash
dotnet ef migrations add <MigrationName>
```
Example:
```bash
dotnet ef migrations add AddPatientPhotoField
```

### Apply Migrations
```bash
dotnet ef database update
```

### List All Migrations
```bash
dotnet ef migrations list
```

### Remove Last Migration (if not applied)
```bash
dotnet ef migrations remove
```

### Generate SQL Script
```bash
dotnet ef migrations script
```

### Generate SQL for Specific Migration Range
```bash
dotnet ef migrations script <FromMigration> <ToMigration>
```

## Automatic Migration Application
The application is configured to automatically apply pending migrations on startup via the `context.Database.MigrateAsync()` call in `Program.cs`. This ensures that:

1. Development environments stay in sync
2. Production deployments apply schema changes automatically
3. No manual database update steps are required

## Database Schema Overview

### Core Tables:
- **AspNetUsers**: Extended user model with medical professional details
- **AspNetRoles**: System roles (Admin, Doctor, Nurse, Staff)
- **Patients**: Core patient information and cancer-specific data
- **Appointments**: Appointment scheduling and tracking
- **Treatments**: Treatment plans and monitoring
- **Investigations**: Lab results and medical tests
- **Notifications**: System notifications and alerts
- **AuditLogs**: Audit trail for data changes
- **AnalyticsReports**: Generated reports and analytics

### Key Features:
- Foreign key relationships with cascade deletes where appropriate
- Indexed columns for performance (dates, status fields, patient IDs)
- Audit trail support with created/updated timestamps
- Soft delete capability through status fields

## Best Practices

### When Creating Migrations:
1. Use descriptive names: `AddPatientRiskLevelField`, `UpdateAppointmentStatusEnum`
2. Review the generated migration before applying
3. Test migrations on a copy of production data
4. Keep migrations small and focused on single changes

### Data Migrations:
For data changes, create separate data migration scripts that can be run after schema migrations:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Schema changes first
    migrationBuilder.AddColumn<string>(
        name: "NewField",
        table: "Patients",
        nullable: true);
        
    // Data changes
    migrationBuilder.Sql(@"
        UPDATE ""Patients"" 
        SET ""NewField"" = 'DefaultValue' 
        WHERE ""NewField"" IS NULL");
}
```

### Production Deployment:
1. Always backup the database before applying migrations
2. Test migrations in staging environment first
3. Monitor application logs during deployment
4. Have rollback plan ready

## Connection String Configuration
Migrations use the connection string from `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=PatientManagementDB;Username=postgres;Password=YourPassword"
  }
}
```

## Troubleshooting

### Migration Already Applied Error:
If you see "relation already exists" errors, the migration may have been partially applied. Check the `__EFMigrationsHistory` table to see which migrations are recorded as applied.

### Reset Migration State:
To reset migration state (development only):
```bash
# Remove all migration files
rm -rf Migrations/
# Create fresh initial migration  
dotnet ef migrations add InitialCreate
# Update database
dotnet ef database update
```

### Production Migration Rollback:
```bash
# Rollback to specific migration
dotnet ef database update <PreviousMigrationName>
# Then remove the problematic migration files
dotnet ef migrations remove
```
