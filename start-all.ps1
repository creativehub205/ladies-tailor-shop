Write-Host "Starting Tailor Shop Application..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "backend"
    node index.js
}

Write-Host "Waiting for backend to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Starting Frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    npm start
}

Write-Host ""
Write-Host "✅ Backend and Frontend are starting..." -ForegroundColor Green
Write-Host "📍 Backend: http://localhost:3000" -ForegroundColor Blue
Write-Host "📍 Frontend: http://localhost:19006" -ForegroundColor Blue
Write-Host ""

Write-Host "Press any key to stop all services..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Stopping services..." -ForegroundColor Red
Stop-Job $backendJob -Force
Stop-Job $frontendJob -Force
Remove-Job $backendJob -Force
Remove-Job $frontendJob -Force
Write-Host "✅ All services stopped" -ForegroundColor Green
