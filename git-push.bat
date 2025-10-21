@echo off
echo ===== PUSHING CODE TO GITHUB =====
echo.

set GIT_PATH=C:\Program Files\Git\bin\git.exe

echo Checking Git status...
"%GIT_PATH%" status

echo.
echo Adding all files...
"%GIT_PATH%" add .

echo.
set /p COMMIT_MSG="Enter commit message: "

echo.
echo Committing changes...
"%GIT_PATH%" commit -m "%COMMIT_MSG%"

echo.
echo Pushing to GitHub...
"%GIT_PATH%" push origin main

echo.
echo ===== PUSH COMPLETE =====
pause
