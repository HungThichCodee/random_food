param([string]$Image = 'foodmatch-api:preflight')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dbName = 'foodmatch_test_docker_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$containerName = 'foodmatch-api-test-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$created = $false
$started = $false
$environmentKeys = @('ConnectionStrings__DefaultConnection', 'JwtSettings__Secret',
    'JwtSettings__Issuer', 'JwtSettings__Audience', 'Cors__Origins',
    'ASPNETCORE_ENVIRONMENT', 'ASPNETCORE_URLS')
$originalEnvironment = @{}
foreach ($key in $environmentKeys) {
    $originalEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}

Push-Location $root
try {
    if ($dbName -notmatch '^foodmatch_test_docker_[0-9a-f]{12}$' -or
        $containerName -notmatch '^foodmatch-api-test-[0-9a-f]{12}$') {
        throw 'Unsafe temporary resource name'
    }
    if (Get-NetTCPConnection -LocalPort 5098 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 5098 is already in use'
    }
    docker image inspect $Image --format '{{.Id}}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker image $Image is unavailable" }

    $lines = Get-Content -LiteralPath (Join-Path $root '.env') -Encoding utf8
    function Get-EnvValue([string]$key) {
        $line = $lines | Where-Object { $_.StartsWith($key + '=') } | Select-Object -First 1
        if (-not $line) { throw "Missing $key in root .env" }
        return $line.Substring($key.Length + 1).Trim().Trim('"', "'")
    }
    $dbUser = Get-EnvValue 'POSTGRES_USER'
    $connection = Get-EnvValue 'ConnectionStrings__DefaultConnection'
    if ($connection -notmatch '(?i)(^|;)Host=(localhost|127\.0\.0\.1)(;|$)' -or
        $connection -notmatch '(?i)(^|;)Database=[^;]+') {
        throw 'Docker smoke only accepts a local PostgreSQL connection with a database name'
    }

    docker exec foodmatch-postgres createdb -U $dbUser $dbName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not create temporary database' }
    $created = $true

    $env:ConnectionStrings__DefaultConnection = [regex]::Replace(
        [regex]::Replace($connection, '(?i)Host=(localhost|127\.0\.0\.1)',
            'Host=host.docker.internal'), '(?i)Database=[^;]+', 'Database=' + $dbName)
    $secretBytes = New-Object byte[] 48
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($secretBytes) }
    finally { $random.Dispose() }
    $env:JwtSettings__Secret = [Convert]::ToBase64String($secretBytes)
    $env:JwtSettings__Issuer = 'FoodMatchApi'
    $env:JwtSettings__Audience = 'FoodMatchClient'
    $env:Cors__Origins = 'http://localhost:5173'
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS = 'http://0.0.0.0:8080'

    docker run -d --rm --name $containerName -p '127.0.0.1:5098:8080' `
        -e ConnectionStrings__DefaultConnection -e JwtSettings__Secret `
        -e JwtSettings__Issuer -e JwtSettings__Audience -e Cors__Origins `
        -e ASPNETCORE_ENVIRONMENT -e ASPNETCORE_URLS $Image | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not start temporary API container' }
    $started = $true

    $healthy = $false
    for ($i = 0; $i -lt 50; $i++) {
        Start-Sleep -Milliseconds 600
        try {
            $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5098/api/health' -TimeoutSec 2
            if ($health.status -eq 'Healthy') { $healthy = $true; break }
        } catch {}
    }
    if (-not $healthy) {
        docker logs $containerName --tail 20
        throw 'Docker API did not become healthy'
    }
    Write-Output 'Docker API health passed with a fresh temporary PostgreSQL database.'
} finally {
    if ($started) { docker rm -f $containerName | Out-Null }
    if ($created) { docker exec foodmatch-postgres dropdb -U $dbUser --if-exists $dbName | Out-Null }
    foreach ($key in $environmentKeys) {
        [Environment]::SetEnvironmentVariable($key, $originalEnvironment[$key], 'Process')
    }
    Pop-Location
}
