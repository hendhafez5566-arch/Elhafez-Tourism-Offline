@echo off
setlocal EnableExtensions
cd /d "%~dp0"
for /f "delims=" %%V in ('powershell.exe -NoProfile -Command "(Get-Content 'package.json' -Raw | ConvertFrom-Json).version"') do set "ERP_VERSION=%%V"

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker CLI was not found.
  pause
  exit /b 1
)

echo Stopping ERP Professional Suite v%ERP_VERSION%...
docker compose --env-file ".env" down
pause
