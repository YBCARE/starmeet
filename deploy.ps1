# Starmeet production deploy
# Run:  cd C:\Users\USER\starmeet
#       powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n=== Building ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)" }

Write-Host "`n=== Staging changes ===" -ForegroundColor Cyan
git add -A
git reset HEAD -- .env 2>$null
git reset HEAD -- .env.* 2>$null

$status = git status --porcelain
if (-not $status.Trim()) {
    Write-Host "Nothing to commit — working tree clean." -ForegroundColor Yellow
} else {
    Write-Host "`n=== Committing ===" -ForegroundColor Cyan
    git commit -m "Premium UI redesign for landing, auth, feed, and messages"
}

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { throw "Push failed — check GitHub auth" }

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Vercel will auto-deploy from main."
Write-Host "Live site: https://starmeet.online"
Write-Host "Commit: $(git rev-parse --short HEAD)`n"
