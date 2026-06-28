@echo off

cd /d "%~dp0"

echo.

echo === Building ===

call npm run build

if errorlevel 1 (

  echo BUILD FAILED - commit was skipped. Fix errors above first.

  pause

  exit /b 1

)



echo.

echo === Git status (before) ===

git status --short

if errorlevel 1 (

  echo GIT FAILED - is git installed?

  pause

  exit /b 1

)



echo.

echo === Git add ===

git add -A

git reset HEAD -- .env 2>nul

git reset HEAD -- .env.* 2>nul



git diff --cached --quiet

if %errorlevel%==0 (

  echo.

  echo NOTHING TO COMMIT - no file changes since last commit.

  echo If you expected changes, save all files in Cursor first ^(Ctrl+K S^).

  echo Will still try to push existing commits to GitHub...

) else (

  echo.

  echo === Git commit ===

  git commit -m "Starmeet update %date% %time%"

  if errorlevel 1 (

    echo COMMIT FAILED

    pause

    exit /b 1

  )

  echo Commit created: 

  git log -1 --oneline

)



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

echo Current commit:

git rev-parse --short HEAD

pause

