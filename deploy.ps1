# Unified Monorepo - Vercel Deployment Script (v3 - Local Build + Prebuilt Deploy)
# Usage: .\deploy.ps1 [--prod] [--only <app1,app2,...>] [--skip-env] [--skip-build]
# Example: .\deploy.ps1 --prod
# Example: .\deploy.ps1 --prod --only gateway,web
# Example: .\deploy.ps1 --prod --skip-env            (skip pushing env vars)
# Example: .\deploy.ps1 --prod --skip-build --only web (just redeploy web with fresh Vercel build)

param(
  [switch]$Prod,
  [string]$Only = "",
  [switch]$SkipEnv,
  [switch]$SkipBuild
)

$ROOT = $PSScriptRoot
$PROD_FLAG = if ($Prod) { "--prod" } else { "" }

# ── Stable Vercel URLs (update after first run) ──────────────────────────────
$AUTH_URL         = "https://auth-service-delta-beryl.vercel.app"
$USER_URL         = "https://user-service-omega.vercel.app"
$PRODUCTIVITY_URL = "https://productivity-service.vercel.app"
$MESSAGING_URL    = "https://messaging-service-theta.vercel.app"
$FILE_URL         = "https://file-service-alpha.vercel.app"
$GATEWAY_URL      = "https://gateway-dun-chi.vercel.app"
$WEB_URL          = "https://web-c8yjx8in4-bittu-the-coders-projects.vercel.app"

# ── Secrets ───────────────────────────────────────────────────────────────────
$MONGO_BASE   = ""
$MONGO_OPTS   = ""
$JWT_ACCESS   = ""
$JWT_REFRESH  = ""

# ── App list (deploy order matters: backends → gateway → web) ─────────────────
$APPS = [ordered]@{
  "auth-service"         = "apps/auth-service"
  "user-service"         = "apps/user-service"
  "productivity-service" = "apps/productivity-service"
  "messaging-service"    = "apps/messaging-service"
  "file-service"         = "apps/file-service"
  "gateway"              = "apps/gateway"
  "web"                  = "apps/web"
}

# ── Env vars per service ──────────────────────────────────────────────────────
$ENV_VARS = @{
  "auth-service" = @{
    NODE_ENV           = "production"
    MONGODB_URI        = "$MONGO_BASE/unified_auth$MONGO_OPTS"
    CLIENT_ORIGIN      = $WEB_URL
    JWT_ACCESS_SECRET  = $JWT_ACCESS
    JWT_REFRESH_SECRET = $JWT_REFRESH
  }
  "user-service" = @{
    NODE_ENV           = "production"
    MONGODB_URI        = "$MONGO_BASE/unified_users$MONGO_OPTS"
    CLIENT_ORIGIN      = $WEB_URL
    JWT_ACCESS_SECRET  = $JWT_ACCESS
    JWT_REFRESH_SECRET = $JWT_REFRESH
  }
  "productivity-service" = @{
    NODE_ENV           = "production"
    MONGODB_URI        = "$MONGO_BASE/unified_productivity$MONGO_OPTS"
    CLIENT_ORIGIN      = $WEB_URL
    JWT_ACCESS_SECRET  = $JWT_ACCESS
    JWT_REFRESH_SECRET = $JWT_REFRESH
  }
  "messaging-service" = @{
    NODE_ENV           = "production"
    MONGODB_URI        = "$MONGO_BASE/unified_messaging$MONGO_OPTS"
    CLIENT_ORIGIN      = $WEB_URL
    JWT_ACCESS_SECRET  = $JWT_ACCESS
    JWT_REFRESH_SECRET = $JWT_REFRESH
  }
  "file-service" = @{
    NODE_ENV                 = "production"
    MONGODB_URI              = "$MONGO_BASE/unified_files$MONGO_OPTS"
    CLIENT_ORIGIN            = $WEB_URL
    JWT_ACCESS_SECRET        = $JWT_ACCESS
    JWT_REFRESH_SECRET       = $JWT_REFRESH
    FREE_STORAGE_BYTES       = "262144000"
    DEFAULT_STORAGE_PROVIDER = "imagekit"
    IMAGEKIT_PUBLIC_KEY      = "public_kdXJBYK/T1ZbSwBHO2wbiulbdFo="
    IMAGEKIT_PRIVATE_KEY     = "private_xI3j/p7ssXsGNHIdMH02Ls2LSWg="
    IMAGEKIT_URL_ENDPOINT    = "https://ik.imagekit.io/gdimgkit"
    CLOUDINARY_CLOUD_NAME    = "dnuqihsz3"
    CLOUDINARY_API_KEY       = "418147991296926"
    CLOUDINARY_API_SECRET    = "l2jlwNJ2JVrXvp2tDEduKXKLm1Y"
  }
  "gateway" = @{
    NODE_ENV                 = "production"
    CLIENT_ORIGIN            = $WEB_URL
    AUTH_SERVICE_URL         = $AUTH_URL
    USER_SERVICE_URL         = $USER_URL
    PRODUCTIVITY_SERVICE_URL = $PRODUCTIVITY_URL
    MESSAGING_SERVICE_URL    = $MESSAGING_URL
    FILE_SERVICE_URL         = $FILE_URL
  }
  "web" = @{
    NEXT_PUBLIC_API_BASE = $GATEWAY_URL
  }
}

$TARGET_APPS = if ($Only -ne "") {
  $Only.Split(",") | ForEach-Object { $_.Trim() }
} else { $APPS.Keys }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Unified Vercel Deployment Script v3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mode:      $(if ($Prod) { 'PRODUCTION' } else { 'PREVIEW' })" -ForegroundColor Yellow
Write-Host "Deploying: $($TARGET_APPS -join ', ')" -ForegroundColor Yellow
Write-Host ""

# ── Step 1: Install ───────────────────────────────────────────────────────────
if (-not $SkipBuild) {
  Write-Host "[Step 1] Installing dependencies..." -ForegroundColor Magenta
  Set-Location $ROOT
  pnpm -w install --no-frozen-lockfile
  if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: install failed" -ForegroundColor Red; exit 1 }
  Write-Host "Done.`n" -ForegroundColor Green

  Write-Host "[Step 2] Building @unified/shared..." -ForegroundColor Magenta
  pnpm -w --filter "@unified/shared" build
  if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: shared build failed" -ForegroundColor Red; exit 1 }
  Write-Host "Done.`n" -ForegroundColor Green
}

$DEPLOYED_URLS = @{}
$FAILED_APPS   = @()

foreach ($appName in $APPS.Keys) {
  if ($TARGET_APPS -notcontains $appName) { continue }

  $appPath = Join-Path $ROOT $APPS[$appName]
  Write-Host "----------------------------------------" -ForegroundColor DarkGray
  Write-Host "[Deploying] $appName" -ForegroundColor Cyan
  Set-Location $appPath

  # ── Push env vars via vercel env add ────────────────────────────────────
  if (-not $SkipEnv -and $ENV_VARS.ContainsKey($appName)) {
    Write-Host "  Pushing env vars..." -ForegroundColor DarkYellow
    foreach ($kv in $ENV_VARS[$appName].GetEnumerator()) {
      # Write value to temp file to avoid shell quoting issues
      $tmpFile = Join-Path $env:TEMP "vercel_env_val.txt"
      Set-Content -Path $tmpFile -Value $kv.Value -NoNewline
      Get-Content $tmpFile | vercel env add $kv.Key production --yes 2>&1 | Out-Null
      Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  Env vars set." -ForegroundColor Green
  }

  # ── Build and Deploy ─────────────────────────────────────────────────────
  if ($appName -eq "web") {
    Write-Host "  Deploying web (Next.js)..." -ForegroundColor DarkYellow
  } else {
    Write-Host "  Deploying service (remote build)..." -ForegroundColor DarkYellow
  }
  # Deploy from source so Vercel has full monorepo context (apps/* + packages/shared).
  if ($Prod) { $output = vercel deploy --prod --yes 2>&1 }
  else       { $output = vercel deploy --yes 2>&1 }
  $exitCode = $LASTEXITCODE

  Write-Host $output

  if ($exitCode -ne 0) {
    Write-Host "  FAILED: $appName!" -ForegroundColor Red
    $FAILED_APPS += $appName; Set-Location $ROOT; continue
  }

  $url = ($output | Select-String -Pattern "https://[a-zA-Z0-9\-\.]+\.vercel\.app" | Select-Object -Last 1).Matches.Value
  if ($url) { $DEPLOYED_URLS[$appName] = $url; Write-Host "  Deployed: $url" -ForegroundColor Green }

  Set-Location $ROOT
  Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($DEPLOYED_URLS.Count -gt 0) {
  Write-Host "SUCCESSFUL:" -ForegroundColor Green
  foreach ($app in $DEPLOYED_URLS.Keys) { Write-Host "  $app -> $($DEPLOYED_URLS[$app])" -ForegroundColor Green }
}
if ($FAILED_APPS.Count -gt 0) {
  Write-Host "FAILED:" -ForegroundColor Red
  foreach ($app in $FAILED_APPS) { Write-Host "  $app" -ForegroundColor Red }
  exit 1
}
Write-Host "All services deployed successfully!" -ForegroundColor Green
exit 0
