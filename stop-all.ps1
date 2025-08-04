# Patient Management System - Stop All Services
# This script stops all running services

Write-Host "🛑 Stopping Patient Management System..." -ForegroundColor Red

# Stop Docker containers
Write-Host "📊 Stopping PostgreSQL Database..." -ForegroundColor Yellow
docker-compose down

# Kill processes on specific ports
Write-Host "🔧 Stopping Backend API (port 5000)..." -ForegroundColor Yellow
$backendProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backendProcess) {
    $processId = $backendProcess.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Backend API stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No backend process found on port 5000" -ForegroundColor Gray
}

Write-Host "🎨 Stopping Frontend PWA (port 3000)..." -ForegroundColor Yellow
$frontendProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendProcess) {
    $processId = $frontendProcess.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend PWA stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No frontend process found on port 3000" -ForegroundColor Gray
}

# Clean up any remaining Node.js or dotnet processes
Write-Host "🧹 Cleaning up remaining processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*PatientManagementApi*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ All services stopped successfully!" -ForegroundColor Green
Write-Host "💡 To start again, run: .\start-all.ps1" -ForegroundColor Cyan
