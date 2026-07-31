# Build production artifacts for VPS deploy (Windows dev machine)
# Usage: .\scripts\build-production.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$ApiProject = Join-Path $Root "backend\HoltelCentrel.Api\HoltelCentrel.Api.csproj"
$FeDir = Join-Path $Root "frontend"
$ReleaseDir = Join-Path $Root "release"
$ApiOut = Join-Path $ReleaseDir "api"
$WebOut = Join-Path $ReleaseDir "web"

Write-Host "==> Sao Dem Holtel - production build"

if (Test-Path $ReleaseDir) {
    Remove-Item $ReleaseDir -Recurse -Force
}
New-Item -ItemType Directory -Path $ApiOut -Force | Out-Null
New-Item -ItemType Directory -Path $WebOut -Force | Out-Null

Write-Host "==> Backend (dotnet publish)..."
dotnet publish $ApiProject -c Release -o $ApiOut
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Frontend (npm run build)..."
Push-Location $FeDir
if (-not (Test-Path "node_modules")) {
    npm install
}
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Copy-Item -Path "dist\*" -Destination $WebOut -Recurse -Force
Pop-Location

$apiZip = Join-Path $ReleaseDir "saodem-api.zip"
$webZip = Join-Path $ReleaseDir "saodem-web.zip"
if (Test-Path $apiZip) { Remove-Item $apiZip -Force }
if (Test-Path $webZip) { Remove-Item $webZip -Force }

Compress-Archive -Path (Join-Path $ApiOut "*") -DestinationPath $apiZip
Compress-Archive -Path (Join-Path $WebOut "*") -DestinationPath $webZip

Write-Host ""
Write-Host "Done."
Write-Host "  API folder : $ApiOut"
Write-Host "  Web folder : $WebOut"
Write-Host "  API zip    : $apiZip"
Write-Host "  Web zip    : $webZip"
Write-Host ""
Write-Host "Next: upload to VPS - see deploy\DEPLOY-PRODUCTION.md"
