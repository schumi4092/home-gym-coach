$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectRoot "release"
$portableRoot = Join-Path $releaseRoot "my-workout-portable"

Write-Host "Building project..."
npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Build failed."
}

if (Test-Path $portableRoot) {
  Get-ChildItem -LiteralPath $portableRoot -Recurse -Force |
    Where-Object { $_.FullName -ne $portableRoot -and $_.Name -notin @("open-workout.bat") } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
  New-Item -ItemType Directory -Path $portableRoot | Out-Null
}

if (-not (Test-Path (Join-Path $portableRoot "assets"))) {
  New-Item -ItemType Directory -Path (Join-Path $portableRoot "assets") | Out-Null
}

Copy-Item -Path (Join-Path $projectRoot "dist\*") -Destination $portableRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "serve-workout.ps1") -Destination $portableRoot -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "create-desktop-shortcut.bat") -Destination $portableRoot -Force

$launcher = @'
@echo off
setlocal
set "APP_ROOT=%~dp0."
powershell -NoProfile -ExecutionPolicy Bypass -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'serve-workout\.ps1' }; foreach ($p in $procs) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch {} }"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-workout.ps1" -Root "%APP_ROOT%" -StartPort 8765 -EndPort 8765
'@

Set-Content -LiteralPath (Join-Path $portableRoot "open-workout.bat") -Value $launcher -Encoding ASCII

Write-Host ""
Write-Host "Portable package created:"
Write-Host $portableRoot
Write-Host ""
Write-Host "Send this folder to your friend."
