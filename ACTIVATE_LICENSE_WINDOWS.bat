@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
for /f "delims=" %%V in ('powershell.exe -NoProfile -Command "(Get-Content 'package.json' -Raw | ConvertFrom-Json).version"') do set "ERP_VERSION=%%V"
if not exist ".env" (
  echo ERROR: Run START_ERP_WINDOWS.bat once first to create .env and Company ID.
  pause
  exit /b 1
)
echo ==================================================
echo ERP v%ERP_VERSION% - License Activation
echo ==================================================
for /f "tokens=1,* delims==" %%A in (.env) do if /I "%%A"=="ERP_COMPANY_ID" set "CID=%%B"
echo Company ID: %CID%
echo.
set /p "TOKEN=Paste the signed license token: "
if "%TOKEN%"=="" (
  echo No token entered.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p='.env'; $ls=Get-Content $p; $found=$false; $out=@(); foreach($l in $ls){ if($l -match '^ERP_LICENSE_TOKEN='){ $out += 'ERP_LICENSE_TOKEN=%TOKEN%'; $found=$true } else { $out += $l } }; if(-not $found){$out += 'ERP_LICENSE_TOKEN=%TOKEN%'}; [IO.File]::WriteAllLines($p,$out,[Text.Encoding]::ASCII)"
if errorlevel 1 (
  echo ERROR: Could not update .env.
  pause
  exit /b 1
)
echo License saved. Restarting ERP...
docker compose --env-file ".env" up -d --build app
echo Done. Open http://localhost:8080 and check Support Center.
pause
