@echo off
setlocal EnableExtensions
cd /d "%~dp0"
for /f "delims=" %%V in ('powershell.exe -NoProfile -Command "(Get-Content 'package.json' -Raw | ConvertFrom-Json).version"') do set "ERP_VERSION=%%V"

echo ================================================
echo ERP Professional Suite v%ERP_VERSION% COMMERCIAL
echo TypeScript + PostgreSQL
echo ================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker CLI was not found.
  echo Start Docker Desktop, then run this file again.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is installed but is not running yet.
  echo Open Docker Desktop and wait until it says Engine running.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\init-env.ps1"
if errorlevel 1 (
  echo ERROR: Could not create or repair the .env file.
  pause
  exit /b 1
)

echo.
echo Starting PostgreSQL and ERP server...
echo When startup completes, open: http://localhost:8080
echo.

docker compose --env-file ".env" up --build
set "ERP_RC=%ERRORLEVEL%"

if not "%ERP_RC%"=="0" (
  echo.
  echo ERROR: ERP stopped with exit code %ERP_RC%.
)
pause
exit /b %ERP_RC%
