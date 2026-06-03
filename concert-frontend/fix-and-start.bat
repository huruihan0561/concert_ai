@echo off
cd /d "%~dp0"
echo Cleaning up...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo Installing dependencies...
npm install
echo.
echo Starting development server...
npm run dev
pause
