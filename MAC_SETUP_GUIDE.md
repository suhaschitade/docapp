# DocApp Setup Guide for Mac 🍎

## ✅ Setup Status

### Database Setup - COMPLETED ✅
- PostgreSQL 16 is running locally on port 5432
- Database `patient_management_db` created successfully  
- Schema initialized with all tables, indexes, and triggers
- Sample data populated (5 patients, 5 appointments, 4 treatments, etc.)
- Connection credentials configured: postgres/RamMac@2099

### Backend Setup - COMPLETED ✅  
- .NET 9.0 SDK installed and verified
- NuGet packages restored successfully
- HTTPS development certificate trusted
- Connection string configured for local PostgreSQL
- Build completed successfully (with minor warnings)

### Frontend Setup - NEEDS ATTENTION 🔧
- Frontend directory exists but is empty
- Next.js 15 PWA needs to be created

## 🚀 Quick Start

### 1. Start the Backend API

```bash
# Navigate to project root
cd /Users/suhaschitade/workspace/docapp/docapp

# Start backend (will run on https://localhost:5001 and http://localhost:5000)
cd backend && dotnet run
```

### 2. Database Connection (If Needed)

```bash
# Add PostgreSQL to PATH
export PATH="/Applications/Postgres.app/Contents/Versions/16/bin:$PATH"

# Connect to database
PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db

# Or run the environment setup script
source setup-env.sh
```

### 3. Test API Endpoints

Once the backend is running, you can test these endpoints:

- **Swagger UI**: https://localhost:5001/swagger
- **Health Check**: https://localhost:5001/health
- **Authentication**: 
  - POST https://localhost:5001/api/auth/login
  - POST https://localhost:5001/api/auth/register

### Default Admin Credentials:
- **Email**: admin@clinic.com  
- **Password**: Admin@123
- **Role**: Admin

## 📊 Database Sample Data

Your database now contains:
- **5 Sample Patients** - Various cancer types and stages
- **5 Appointments** - Including missed appointments for testing
- **4 Treatment Records** - Chemotherapy, surgery, radiation
- **4 Investigation Records** - Blood tests, imaging results
- **3 Notifications** - Missed appointment alerts

## 🔧 Frontend Development (Next Steps)

The frontend needs to be created. Based on the architecture, it should be:
- **Next.js 15** with TypeScript
- **PWA** (Progressive Web App) capabilities  
- **Tailwind CSS** for styling
- **Push Notifications** support

## 📝 Configuration Files

### appsettings.json (Already Configured)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=patient_management_db;Username=postgres;Password=RamMac@2099"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration123456789",
    "Issuer": "PatientManagementApi", 
    "Audience": "PatientManagementApp",
    "ExpiryInMinutes": 60
  }
}
```

## 🛡️ Security Notes

- HTTPS development certificate is trusted
- JWT tokens expire after 60 minutes
- Database password is set as configured in original setup
- API runs on both HTTP (5000) and HTTPS (5001)

## 🔍 Verification Commands

```bash
# Check .NET version
dotnet --version  # Should show 9.0.108

# Check PostgreSQL status  
ps aux | grep postgres | grep -v grep

# Build backend
cd backend && dotnet build

# Restore packages (if needed)
cd backend && dotnet restore
```

## 📂 Project Structure

```
docapp/
├── backend/                    # ✅ ASP.NET Core 9.0 API (Ready)
├── frontend/                   # 🔧 Next.js 15 PWA (Empty - Needs Setup)  
├── database/                   # ✅ PostgreSQL scripts (Applied)
├── setup-env.sh               # 🆕 Environment setup script
├── MAC_SETUP_GUIDE.md          # 🆕 This guide
├── DOCKER_SETUP.md             # Original Docker setup (Not needed)
├── docker-compose.yml          # Not used (local PostgreSQL)
└── README.md                   # Project overview
```

## 🚨 Troubleshooting

### If PostgreSQL won't connect:
```bash
# Check if Postgres.app is running
ps aux | grep postgres

# Restart Postgres.app from Applications folder if needed
```

### If .NET build fails:
```bash
# Clear and restore packages
cd backend
dotnet clean
dotnet restore
dotnet build
```

### If ports are busy:
```bash
# Check what's using port 5001
lsof -ti:5001

# Kill process if needed (replace PID)
kill -9 <PID>
```

## ✨ Ready to Use!

Your DocApp backend is now fully set up and ready to run on your Mac! 

**To start developing:**
1. Run `cd backend && dotnet run` to start the API
2. Visit https://localhost:5001/swagger to explore the API
3. Create the Next.js frontend in the `frontend/` directory

The database is populated with sample data, so you can immediately start testing patient management, appointments, and notifications!
