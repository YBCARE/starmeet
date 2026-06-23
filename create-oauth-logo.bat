@echo off
cd /d "%~dp0"
echo Creating 120x120 Google OAuth logo...
node scripts\generate-oauth-logo.mjs
if errorlevel 1 (
  echo FAILED - run: npm install
  pause
  exit /b 1
)
echo.
echo Done! Upload this file to Google Cloud branding:
echo   public\starmeet-oauth-logo.png
type public\oauth-logo-report.txt
echo.
pause
