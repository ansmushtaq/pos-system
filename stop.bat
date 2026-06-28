@echo off
echo Stopping POS System...
taskkill /f /im node.exe 2>nul
echo Done.
timeout /t 2 /nobreak >nul
