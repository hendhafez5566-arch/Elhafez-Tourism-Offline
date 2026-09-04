@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo WARNING: This restores a full PostgreSQL backup and replaces current company data.
set /p FILE=Enter dump path, e.g. backups\manual_....dump: 
if not exist "%FILE%" (echo File not found.& pause& exit /b 1)
set "TMP=/tmp/erp_restore_input.dump"
echo Verifying restore file first...
docker compose --env-file ".env" cp "%FILE%" db:%TMP%
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db pg_restore -l %TMP% >nul 2>nul
if errorlevel 1 goto :fail
call BACKUP_ERP_WINDOWS.bat
if errorlevel 1 goto :fail
echo Restoring %FILE% ...
docker compose --env-file ".env" exec -T db pg_restore -U tourism_erp -d tourism_erp --clean --if-exists --no-owner %TMP%
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
echo Restore completed. Restart ERP.
pause
exit /b 0
:fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
echo Restore failed or the selected dump is invalid.
pause
exit /b 1
