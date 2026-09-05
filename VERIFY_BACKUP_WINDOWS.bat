@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if not exist ".env" (
 echo ERROR: .env not found. Start ERP first.
 pause
 exit /b 1
)
for /f "delims=" %%F in ('dir /b /o-d "backups\*.dump" 2^>nul') do if not defined LATEST set "LATEST=%%F"
if not defined LATEST (
 echo No PostgreSQL dump found in backups folder.
 pause
 exit /b 1
)
set "TMP=/tmp/erp_verify_backup.dump"
echo Checking backup: backups\%LATEST%
docker compose --env-file ".env" cp "backups\%LATEST%" db:%TMP%
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db pg_restore -l %TMP% >nul 2>nul
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
echo Backup catalog is readable. Verification OK.
pause
exit /b 0
:fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
echo Backup verification FAILED.
pause
exit /b 1
