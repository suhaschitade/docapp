# Patient Management System - User Credentials

## Overview
After executing the SQL script (`create_users.sql`), your system will have the following users with role-based access:

## User Accounts

### 1. Admin Users
- **Email:** admin@clinic.com
- **Password:** Admin@123
- **Role:** Admin
- **Status:** ✅ Already created (default seeded user)

### 2. Doctor Users
- **Email:** doctor1@clinic.com
- **Password:** Password@123
- **Role:** Doctor
- **Name:** Dr. Sarah Johnson
- **Phone:** +91-9876543201

- **Email:** doctor2@clinic.com  
- **Password:** Password@123
- **Role:** Doctor
- **Name:** Dr. Michael Chen
- **Phone:** +91-9876543202

### 3. Nurse Users
- **Email:** nurse1@clinic.com
- **Password:** Password@123
- **Role:** Nurse
- **Name:** Emily Rodriguez
- **Phone:** +91-9876543203

- **Email:** nurse2@clinic.com
- **Password:** Password@123
- **Role:** Nurse
- **Name:** Maria Santos
- **Phone:** +91-9876543204

### 4. Staff Users
- **Email:** staff1@clinic.com
- **Password:** Password@123
- **Role:** Staff
- **Name:** James Wilson
- **Phone:** +91-9876543205

- **Email:** staff2@clinic.com
- **Password:** Password@123
- **Role:** Staff  
- **Name:** Lisa Brown
- **Phone:** +91-9876543206

## Role Permissions
Based on the authorization policies in the application:

### Admin Policy
- **Access:** Admin role only
- **Permissions:** Full system access

### Doctor Policy  
- **Access:** Doctor and Admin roles
- **Permissions:** Patient management, appointments, treatments

### Staff Policy
- **Access:** Staff, Nurse, Doctor, and Admin roles
- **Permissions:** Basic patient information, appointment scheduling

## How to Execute the SQL Script

```bash
# Execute the user creation script
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db -f create_users.sql
```

## Database Information
- **Database:** patient_management_db
- **PostgreSQL Version:** 17.6
- **Host:** localhost
- **Port:** 5432
- **Username:** postgres

## API Testing

Once the script is executed and the application is running, you can test login with:

### Sample Login Request
```json
POST https://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "doctor1@clinic.com", 
  "password": "Password@123"
}
```

### Expected Response
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "email": "doctor1@clinic.com",
    "firstName": "Dr. Sarah",
    "lastName": "Johnson",
    "roles": ["Doctor"]
  }
}
```

## Notes
- All users have `EmailConfirmed = true` so they can login immediately
- All users are `IsActive = true`
- Password hash is compatible with ASP.NET Core Identity 
- SecurityStamp and ConcurrencyStamp are properly set for each user
- Role assignments are properly linked through AspNetUserRoles table

## Next Steps
1. Execute the SQL script
2. Start the .NET application (`dotnet run`)
3. Test login endpoints with different user roles
4. Verify role-based authorization is working correctly
