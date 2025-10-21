@echo off
echo ===== STARTING MATHEMATICO PLATFORM =====
echo.

echo Setting up Node.js path...
set PATH=%PATH%;C:\Program Files\nodejs

echo Starting Backend Server...
start cmd /k "cd Backend && C:\Program Files\nodejs\npm.cmd run dev"

echo Waiting for Backend to initialize...
timeout /t 5 /nobreak > nul

echo Starting Frontend App...
start cmd /k "cd Frontend-app && C:\Program Files\nodejs\npm.cmd run dev"

echo.
echo ===== MATHEMATICO PLATFORM STARTED =====
echo.
echo Backend: http://localhost:5000
echo API Docs: http://localhost:5000/api-docs
echo Frontend: http://localhost:8081 (or scan QR code with Expo Go app)
echo.
echo Press any key to exit this window...
pause > nul
