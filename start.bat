@echo off
cd /d %~dp0
title POS System

echo.
echo   ====================================
echo      POS System - Starting...
echo   ====================================
echo.
echo     Backend  : http://localhost:5000
echo     Frontend : http://localhost:5173
echo.

:: Start backend server minimized
start /MIN "POS-Backend" cmd /c "cd /d %~dp0backend && npm run dev"

:: Start frontend dev server minimized
start /MIN "POS-Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

:: Wait for servers to be ready
echo     Starting servers...
timeout /t 6 /nobreak >nul

set APP_URL=http://localhost:5173

:: Launch as frameless app window
echo     Opening app...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
    goto :done
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
    goto :done
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
    goto :done
)
:: Fallback
start "" %APP_URL%

:done
echo.
echo     App is running!
echo     Run stop.bat to shut down.
echo.
pause >nul
