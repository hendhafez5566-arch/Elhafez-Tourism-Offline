@echo off
setlocal EnableExtensions
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 22+ is required.& pause & exit /b 1)
where npm >nul 2>nul || (echo npm is required.& pause & exit /b 1)
for /f "delims=" %%V in ('node -p "require('./package.json').version"') do set "ERP_VERSION=%%V"
if not defined ERP_VERSION (echo Could not read package version.& pause & exit /b 1)
if "%ELHAFEZ_TECHNOLOGY_URL%"=="" (
  echo ELHAFEZ_TECHNOLOGY_URL is required.
  echo Example: set ELHAFEZ_TECHNOLOGY_URL=https://your-owner-center.up.railway.app
  pause
  exit /b 1
)
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not defined ANDROID_SDK_ROOT if defined ANDROID_HOME set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined ANDROID_HOME echo Android SDK was not detected. Install Android Studio first.
call npm ci || goto :fail
call npm run mobile:apk || goto :fail
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" goto :fail
set "APK_NAME=Elhafez_Tourism_Customer_v%ERP_VERSION%_DEBUG.apk"
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "%APK_NAME%" >nul
echo.
echo APK READY:
echo %CD%\%APK_NAME%
pause
exit /b 0
:fail
echo.
echo Android build failed. Check ELHAFEZ_TECHNOLOGY_URL, Android SDK, Java, and signing settings.
pause
exit /b 1
