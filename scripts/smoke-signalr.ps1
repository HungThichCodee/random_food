$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

$api = $null
$created = $false
$dbName = 'foodmatch_test_signalr_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$logId = [guid]::NewGuid().ToString('N').Substring(0, 12)
$logPath = Join-Path ([IO.Path]::GetTempPath()) ('foodmatch-signalr-' + $logId + '.log')
$errorPath = Join-Path ([IO.Path]::GetTempPath()) ('foodmatch-signalr-' + $logId + '.err')
$environmentKeys = @('ConnectionStrings__DefaultConnection', 'ASPNETCORE_ENVIRONMENT',
    'ASPNETCORE_URLS', 'FOODMATCH_SMOKE_URL', 'FOODMATCH_SMOKE_JWT_SECRET',
    'FOODMATCH_SMOKE_JWT_ISSUER', 'FOODMATCH_SMOKE_JWT_AUDIENCE',
    'FOODMATCH_SMOKE_DB_NAME', 'FOODMATCH_SMOKE_DB_USER',
    'FOODMATCH_SMOKE_ALLOWED_ORIGIN', 'DOTNET_ROOT', 'PATH')
$originalEnvironment = @{}
foreach ($key in $environmentKeys) {
    $originalEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}

try {
    $lines = Get-Content -LiteralPath (Join-Path $root '.env') -Encoding utf8
    function Get-EnvValue([string]$key) {
        $line = $lines | Where-Object { $_.StartsWith($key + '=') } | Select-Object -First 1
        if (-not $line) { throw "Missing $key in root .env" }
        return $line.Substring($key.Length + 1).Trim().Trim('"', "'")
    }

    $dbUser = Get-EnvValue 'POSTGRES_USER'
    $connection = Get-EnvValue 'ConnectionStrings__DefaultConnection'
    if ($connection -notmatch '(?i)(^|;)Database=[^;]+') {
        throw 'Connection string must contain Database'
    }
    if ($connection -notmatch '(?i)(^|;)Host=(localhost|127\.0\.0\.1)(;|$)') {
        throw 'Smoke test only accepts a local PostgreSQL host'
    }
    if (Get-NetTCPConnection -LocalPort 5099 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 5099 is already in use'
    }
    $env:ConnectionStrings__DefaultConnection = [regex]::Replace(
        $connection, '(?i)Database=[^;]+', 'Database=' + $dbName)
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS = 'http://127.0.0.1:5099'
    $env:FOODMATCH_SMOKE_URL = $env:ASPNETCORE_URLS
    $env:FOODMATCH_SMOKE_JWT_SECRET = Get-EnvValue 'JwtSettings__Secret'
    $env:FOODMATCH_SMOKE_JWT_ISSUER = Get-EnvValue 'JwtSettings__Issuer'
    $env:FOODMATCH_SMOKE_JWT_AUDIENCE = Get-EnvValue 'JwtSettings__Audience'
    $env:FOODMATCH_SMOKE_DB_NAME = $dbName
    $env:FOODMATCH_SMOKE_DB_USER = $dbUser
    $env:FOODMATCH_SMOKE_ALLOWED_ORIGIN = (Get-EnvValue 'Cors__Origins').Split(',')[0].Trim()
    $env:DOTNET_ROOT = (Resolve-Path (Join-Path $root '.dotnet')).Path
    $env:PATH = $env:DOTNET_ROOT + ';' + $env:PATH

    if ($dbName -notmatch '^foodmatch_test_signalr_[0-9a-f]{12}$') {
        throw 'Unsafe temporary database name'
    }
    docker exec foodmatch-postgres createdb -U $dbUser $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not create temporary database' }
    $created = $true

    $apiDll = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Api/bin/Release/net10.0/FoodMatch.Api.dll'
    if (-not (Test-Path -LiteralPath $apiDll)) {
        throw 'Build the backend in Release before running this smoke test'
    }
    $api = Start-Process -FilePath (Join-Path $env:DOTNET_ROOT 'dotnet.exe') `
        -ArgumentList @($apiDll) -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $logPath -RedirectStandardError $errorPath

    $ready = $false
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Milliseconds 600
        try {
            $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5099/api/health' -TimeoutSec 2
            if ($health.status -eq 'Healthy') { $ready = $true; break }
        } catch {}
        if ($api.HasExited) { break }
    }
    if (-not $ready) { throw 'Temporary API did not become healthy' }

    $healthResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:5099/api/health' -UseBasicParsing -TimeoutSec 3
    if ($healthResponse.Headers['Cache-Control'] -notmatch '(^|,)\s*no-store(\s*,|$)') {
        throw 'API responses must include Cache-Control: no-store'
    }

    node (Join-Path $root 'frontend/scripts/smoke-signalr.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'SignalR smoke failed' }

    # SignalR browser WebSockets use access_token in the query string. The API
    # must not write that query parameter to its own stdout/stderr logs.
    foreach ($path in @($logPath, $errorPath)) {
        if (Test-Path -LiteralPath $path) {
            $apiLog = Get-Content -LiteralPath $path -Raw -Encoding utf8
            if ($apiLog -match '(?i)access_token\s*=') {
                throw 'SignalR access_token query was written to API logs'
            }
        }
    }
    Write-Output 'API logs contain no SignalR access_token query.'
} finally {
    if ($api -and -not $api.HasExited) { Stop-Process -Id $api.Id -Force }
    if ($created) {
        docker exec foodmatch-postgres dropdb -U $dbUser --if-exists $dbName
    }
    Remove-Item -LiteralPath $logPath, $errorPath -ErrorAction SilentlyContinue
    foreach ($key in $environmentKeys) {
        [Environment]::SetEnvironmentVariable($key, $originalEnvironment[$key], 'Process')
    }
    Pop-Location
}
