@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist ".env" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\init-env.ps1"
if not exist "backups" mkdir backups
for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%I"
if not defined STAMP (echo Backup timestamp failed.& pause& exit /b 1)
set "OUT=backups\manual_%STAMP%.dump"
set "TMP=/tmp/erp_manual_backup.dump"
echo Creating PostgreSQL backup: %OUT%
docker compose --env-file ".env" exec -T db pg_dump -U tourism_erp -d tourism_erp -Fc -f %TMP%
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db pg_restore -l %TMP% >nul 2>nul
if errorlevel 1 goto :fail
docker compose --env-file ".env" cp db:%TMP% "%OUT%"
if errorlevel 1 goto :fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
echo Backup completed and verified.
pause
exit /b 0
:fail
docker compose --env-file ".env" exec -T db sh -c "rm -f %TMP%" >nul 2>nul
if exist "%OUT%" del /q "%OUT%" >nul 2>nul
echo Backup failed or verification failed.
pause
exit /b 1
