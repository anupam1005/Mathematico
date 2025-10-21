@echo off
echo ===== STARTING MATHEMATICO FRONTEND =====
echo.

echo Setting up Node.js path...
set PATH=%PATH%;C:\Program Files\nodejs

cd Frontend-app
echo Running npm dev command...
"C:\Program Files\nodejs\npm.cmd" run dev

pause
