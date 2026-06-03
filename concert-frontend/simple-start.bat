@echo off
cd /d "%~dp0"
echo Installing dependencies (this may take a few minutes)...
call npm install --legacy-peer-deps 2>&1
echo.
echo Starting development server...
call npm run dev 2>&1
pause
