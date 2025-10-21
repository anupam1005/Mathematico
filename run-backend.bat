@echo off
echo ===== STARTING MATHEMATICO BACKEND =====
echo.

echo Setting up Node.js path...
set PATH=%PATH%;C:\Program Files\nodejs

cd Backend
echo Running npm dev command...
"C:\Program Files\nodejs\npm.cmd" run dev

pause
