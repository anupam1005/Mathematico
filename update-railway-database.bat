@echo off
echo.
echo ========================================
echo   Mathematico Railway Database Update
echo ========================================
echo.
echo This will add the user_settings table
echo to your Railway database.
echo.
echo Press any key to continue...
pause > nul

cd Backend
echo.
echo Running migration...
echo.
node migrations/add-user-settings-table.js

echo.
echo.
echo Press any key to exit...
pause > nul

