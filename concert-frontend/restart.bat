@echo off
cd /d "%~dp0"
echo Stopping any running node processes...
taskkill /F /IM node.exe 2>nul
echo.
echo Cleaning node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo Installing dependencies with SWC plugin...
npm install --legacy-peer-deps
echo.
echo Starting development server...
npm run dev
pause
