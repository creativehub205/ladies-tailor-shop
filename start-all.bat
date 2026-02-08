@echo off
echo Starting Tailor Shop Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && node index.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "npm start"

echo.
echo Both Backend and Frontend are starting...
echo Backend will run on: http://localhost:3000
echo Frontend will run on: http://localhost:19006
echo.
pause
