# Patient Data Management System

A comprehensive healthcare management system for cancer patient tracking, follow-ups, and treatment monitoring.

## Features

### Core Functionality
- 🏥 **Patient Database Management** - Structured patient data with cancer type categorization
- 📞 **Contact Management** - Mobile and email tracking for communication
- ⚠️ **Missed Appointment Alerts** - Real-time notifications for defaulters
- 📊 **Periodic Analytics** - Weekly/monthly/yearly reports
- 🎯 **Risk Assessment** - High-risk patient flagging
- 🔔 **Automated Reminders** - Follow-up and investigation alerts
- 📱 **PWA Support** - Progressive Web App with push notifications

### Technology Stack
- **Backend**: ASP.NET Core 9.0
- **Frontend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL 16
- **Authentication**: JWT with role-based access
- **Notifications**: Web Push API + SignalR
- **Deployment**: Docker containers

## PWA vs Mobile App Decision
✅ **PWA is perfect for your needs because:**
- Full push notification support for missed appointments
- Cross-platform compatibility (iOS, Android, Desktop)
- Offline functionality for critical patient data
- Lower development/maintenance costs
- Instant updates without app store delays
- Easy installation from browser

## Quick Start

```bash
# Verify .NET 9.0 is installed
dotnet --version

# Setup backend
cd backend
dotnet restore
dotnet run

# Setup frontend PWA
cd frontend
npm install
npm run dev
```

## Project Structure
```
patient-management-system/
├── backend/                 # ASP.NET Core 9.0 API
├── frontend/               # Next.js 15 PWA
├── database/              # PostgreSQL 16 scripts
├── docker/               # Container configurations
└── docs/                # Documentation
```

## Database Schema
Enhanced schema based on your site-wise data collection with:
- Patient demographics and cancer staging
- Appointment scheduling and tracking
- Treatment pathways (curative vs palliative)
- Follow-up management
- Analytics and reporting
