$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectRoot "release"
$portableRoot = Join-Path $releaseRoot "my-workout-portable"
$installerStageRoot = Join-Path $releaseRoot "my-workout-installer-stage"
$targetExe = Join-Path $releaseRoot "home-gym-coach-setup.exe"
$sedPath = Join-Path $releaseRoot "home-gym-coach-setup.sed"

Write-Host "Preparing portable files..."
& (Join-Path $projectRoot "package-portable.ps1")

if (Test-Path $installerStageRoot) {
  Remove-Item -LiteralPath $installerStageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $installerStageRoot | Out-Null
Copy-Item -Path (Join-Path $portableRoot "*") -Destination $installerStageRoot -Recurse -Force

if (Test-Path $targetExe) {
  try {
    Remove-Item -LiteralPath $targetExe -Force
  } catch {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $targetExe = Join-Path $releaseRoot "home-gym-coach-setup-$timestamp.exe"
    Write-Host "Existing installer is in use, writing a new file instead:"
    Write-Host $targetExe
  }
}

$installScript = @'
@echo off
setlocal

set "SRC=%~dp0"
set "DEST=%LOCALAPPDATA%\MyWorkoutPortable"
set "SHORTCUT=%USERPROFILE%\Desktop\Home Gym Coach.lnk"

if not exist "%DEST%" mkdir "%DEST%"
xcopy "%SRC%*" "%DEST%\" /E /I /Y >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:SHORTCUT); $s.TargetPath=Join-Path $env:DEST 'open-workout.bat'; $s.WorkingDirectory=$env:DEST; $s.IconLocation=($env:SystemRoot + '\System32\imageres.dll,15'); $s.Save()"

start "" "%DEST%\open-workout.bat"
exit /b 0
'@

Set-Content -LiteralPath (Join-Path $installerStageRoot "install-app.bat") -Value $installScript -Encoding ASCII

$packagedFiles = Get-ChildItem -LiteralPath $installerStageRoot -Recurse -File |
  Sort-Object FullName |
  ForEach-Object { $_.FullName.Substring($installerStageRoot.Length + 1) }

$escapedInstallerStageRoot = $installerStageRoot.Replace("\", "\\")
$stringLines = @(
  "InstallPrompt=",
  "DisplayLicense=",
  "FinishMessage=Installation complete.",
  "TargetName=$targetExe",
  "FriendlyName=Home Gym Coach",
  "AppLaunched=cmd /c install-app.bat",
  "PostInstallCmd=<None>",
  "AdminQuietInstCmd=cmd /c install-app.bat",
  "UserQuietInstCmd=cmd /c install-app.bat",
  "FILECOUNT=$($packagedFiles.Count)",
  "FILE0=$escapedInstallerStageRoot\\"
)

$fileLines = for ($index = 0; $index -lt $packagedFiles.Count; $index += 1) {
  $escaped = $packagedFiles[$index].Replace("\", "\\")
  "FILE$($index + 1)=`"$escaped`""
}

$sourceLines = for ($index = 1; $index -le $packagedFiles.Count; $index += 1) {
  "%FILE$index%="
}

$sedContent = @(
  "[Version]",
  "Class=IEXPRESS",
  "SEDVersion=3",
  "[Options]",
  "PackagePurpose=InstallApp",
  "ShowInstallProgramWindow=0",
  "HideExtractAnimation=0",
  "UseLongFileName=1",
  "InsideCompressed=0",
  "CAB_FixedSize=0",
  "CAB_ResvCodeSigning=0",
  "RebootMode=N",
  "InstallPrompt=%InstallPrompt%",
  "DisplayLicense=%DisplayLicense%",
  "FinishMessage=%FinishMessage%",
  "TargetName=%TargetName%",
  "FriendlyName=%FriendlyName%",
  "AppLaunched=%AppLaunched%",
  "PostInstallCmd=%PostInstallCmd%",
  "AdminQuietInstCmd=%AdminQuietInstCmd%",
  "UserQuietInstCmd=%UserQuietInstCmd%",
  "SourceFiles=SourceFiles",
  "[Strings]"
) + $stringLines + $fileLines + @(
  "[SourceFiles]",
  "SourceFiles0=%FILE0%",
  "[SourceFiles0]"
) + $sourceLines

Set-Content -LiteralPath $sedPath -Value $sedContent -Encoding ASCII

Write-Host "Building EXE package..."
& "$env:SystemRoot\System32\iexpress.exe" /N $sedPath

for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
  if (Test-Path $targetExe) {
    break
  }

  Start-Sleep -Milliseconds 250
}

if (-not (Test-Path $targetExe)) {
  throw "EXE package was not created."
}

Write-Host ""
Write-Host "EXE package created:"
Write-Host $targetExe
