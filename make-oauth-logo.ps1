# Creates Google OAuth logo: exactly 120x120 PNG, under 1 MB
$ErrorActionPreference = 'Stop'
$size = 120
$outDir = Join-Path $PSScriptRoot 'public'
$out = Join-Path $outDir 'starmeet-oauth-logo.png'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-OAuthLogo {
  param([int]$S)
  $bmp = New-Object System.Drawing.Bitmap $S, $S
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 20))

  # Star (blue)
  $star = @{
    X = @(0.5, 0.62, 0.98, 0.68, 0.78, 0.5, 0.22, 0.32, 0.02, 0.38)
    Y = @(0.06, 0.38, 0.38, 0.58, 0.92, 0.72, 0.92, 0.58, 0.38, 0.38)
  }
  $pts = 0..4 | ForEach-Object {
    [System.Drawing.PointF]::new($star.X[$_] * $S, $star.Y[$_] * $S)
  }
  $brushStar = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 149, 246))
  $g.FillPolygon($brushStar, $pts)
  $brushStar.Dispose()

  # Chat bubble (purple)
  $bubbleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 139, 92, 246))
  $bw = [int]($S * 0.36)
  $bh = [int]($S * 0.28)
  $bx = [int]($S * 0.52)
  $by = [int]($S * 0.54)
  $g.FillEllipse($bubbleBrush, $bx, $by, $bw, $bh)
  $tail = @(
    [System.Drawing.Point]::new($bx + [int]($bw * 0.35), $by + $bh - 2),
    [System.Drawing.Point]::new($bx + [int]($bw * 0.15), $by + $bh + [int]($S * 0.12)),
    [System.Drawing.Point]::new($bx + [int]($bw * 0.55), $by + $bh - 2)
  )
  $g.FillPolygon($bubbleBrush, $tail)
  $bubbleBrush.Dispose()

  # Three dots
  $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 10, 20))
  $dr = [int]($S * 0.028)
  $cy = $by + [int]($bh / 2)
  foreach ($dx in @(-0.12, 0, 0.12)) {
    $cx = $bx + [int]($bw / 2) + [int]($dx * $bw)
    $g.FillEllipse($dotBrush, $cx - $dr, $cy - $dr, $dr * 2, $dr * 2)
  }
  $dotBrush.Dispose()
  $g.Dispose()
  return $bmp
}

$bmp = New-OAuthLogo -S $size
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$info = Get-Item $out
$report = @"
path=$out
bytes=$($info.Length)
width=$size
height=$size
kb=$([math]::Round($info.Length / 1KB, 2))
"@
$report | Set-Content (Join-Path $outDir 'oauth-logo-report.txt') -Encoding UTF8
Write-Output $report
