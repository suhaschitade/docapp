#!/bin/bash
# DocApp Backend Startup Script

echo "🏥 Starting DocApp Backend..."
echo ""
echo "🔗 API will be available at:"
echo "  - HTTPS: https://localhost:5001"
echo "  - HTTP:  http://localhost:5000"
echo "  - Swagger: https://localhost:5001/swagger"
echo ""
echo "📊 Database: patient_management_db (localhost:5432)"
echo "👤 Admin Login: admin@clinic.com / Admin@123"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

cd backend && dotnet run --urls="https://localhost:5001;http://localhost:5000"
