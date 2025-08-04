# Patient Management System - Start All Services
# This script starts Docker PostgreSQL, Backend API, and Frontend PWA

Write-Host "Starting Patient Management System..." -ForegroundColor Green

# Start PostgreSQL and pgAdmin with Docker
Write-Host "Starting PostgreSQL Database..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if database is healthy
$dbStatus = docker-compose ps --format json | ConvertFrom-Json | Where-Object { $_.Service -eq "postgres" }
if ($dbStatus.Health -eq "healthy" -or $dbStatus.State -eq "running") {
    Write-Host "Database is ready!" -ForegroundColor Green
} else {
    Write-Host "Database failed to start. Check docker-compose logs postgres" -ForegroundColor Red
    exit 1
}

# Start Backend API in new window
Write-Host "Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'D:\Workspace\mac\docapp\backend'; Write-Host 'Backend API Starting...' -ForegroundColor Cyan; dotnet run --urls='http://localhost:5000'"
)

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test backend connectivity
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend API is ready!" -ForegroundColor Green
} catch {
    Write-Host "Backend may still be starting..." -ForegroundColor Yellow
}

# Start Frontend PWA in new window
Write-Host "Starting Frontend PWA..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", 
    "-Command", 
    "cd 'D:\Workspace\mac\docapp\frontend'; Write-Host 'Frontend PWA Starting...' -ForegroundColor Magenta; npm run dev"
)

# Wait for frontend to start
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Test frontend connectivity
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Frontend PWA is ready!" -ForegroundColor Green
} catch {
    Write-Host "Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Patient Management System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend (Login):     http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:          http://localhost:5000" -ForegroundColor White
Write-Host "   pgAdmin (Database):   http://localhost:8081" -ForegroundColor White
Write-Host "   Swagger API Docs:     http://localhost:5000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email:    admin@clinic.com" -ForegroundColor White
Write-Host "   Password: Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "Database Connection:" -ForegroundColor Cyan
Write-Host "   Host:     localhost:5432" -ForegroundColor White
Write-Host "   Database: patient_management_db" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: RamMac@2099" -ForegroundColor White
Write-Host ""
Write-Host "Features Available:" -ForegroundColor Cyan
Write-Host "   User Authentication & Authorization" -ForegroundColor White
Write-Host "   PostgreSQL Database with Sample Data" -ForegroundColor White
Write-Host "   Patient Management Dashboard" -ForegroundColor White
Write-Host "   Responsive PWA Interface" -ForegroundColor White
Write-Host "   Database Admin Interface" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "   Close the terminal windows and run: docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to open the application in your browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open application in browser
Start-Process "http://localhost:3000"

Write-Host "Happy coding! The Patient Management System is now running." -ForegroundColor Green
