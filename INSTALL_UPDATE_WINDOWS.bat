@echo off
setlocal EnableExtensions
title ERP Professional Suite - One Click Update
pushd "%~dp0" 2>nul
if errorlevel 1 (
  echo ERROR: Cannot open the update folder.
  echo Use Extract All on the ZIP file, then run this file again.
  pause
  exit /b 1
)
if not exist "scripts\install-update.ps1" (
  echo ERROR: The update files are incomplete.
  echo Use Extract All on the ZIP file before running this file.
  popd
  pause
  exit /b 1
)
echo ==================================================
echo ERP Professional Suite - One Click Server Update
echo ==================================================
echo This process keeps .env, Company ID, license and database volumes.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\install-update.ps1"
set "ERP_RC=%ERRORLEVEL%"
echo.
if not "%ERP_RC%"=="0" (
  echo UPDATE FAILED. The database and .env were not deleted.
) else (
  echo UPDATE COMPLETED SUCCESSFULLY.
)
popd
pause
exit /b %ERP_RC%
