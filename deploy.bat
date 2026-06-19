@echo off
cd /d "%~dp0"
echo.
echo === Building ===
call npm run build
if errorlevel 1 (
  echo BUILD FAILED - see errors above
  pause
  exit /b 1
)

echo.
echo === Git add ===
git add -A
git reset HEAD -- .env 2>nul
git reset HEAD -- .env.* 2>nul

echo.
echo === Git commit ===
git commit -m "Premium UI redesign for landing, auth, feed, and messages"
if errorlevel 1 echo Nothing new to commit, or commit failed.

echo.
echo === Git push ===
git push origin main
if errorlevel 1 (
  echo PUSH FAILED - check GitHub login / token
  pause
  exit /b 1
)

echo.
echo DONE - Vercel will auto-deploy from main
echo Live: https://starmeet.online
git rev-parse --short HEAD
pause
