$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

$dbName = 'foodmatch_test_visual_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$browserDir = Join-Path $root ('.tmp_visual_' + [guid]::NewGuid().ToString('N'))
$screenshot = Join-Path $root 'random-mobile-preview.png'
$resultScreenshot = Join-Path $root 'random-mobile-result-preview.png'
$meetingScreenshot = Join-Path $root 'meeting-mobile-preview.png'
$mapScreenshot = Join-Path $root 'map-mobile-preview.png'
$routeScreenshot = Join-Path $root 'route-mobile-preview.png'
$apiLog = Join-Path $root 'visual-smoke-api.log'
$apiError = Join-Path $root 'visual-smoke-api.err'
$viteLog = Join-Path $root 'visual-smoke-vite.log'
$viteError = Join-Path $root 'visual-smoke-vite.err'
$edgeLog = Join-Path $root 'visual-smoke-edge.log'
$edgeError = Join-Path $root 'visual-smoke-edge.err'
$api = $null
$vite = $null
$edge = $null
$created = $false
$visualPort = if ($env:FOODMATCH_VISUAL_PORT -eq '5173') { 5173 } else { 5174 }
$visualOrigin = "http://localhost:$visualPort"

try {
    $lines = Get-Content -LiteralPath (Join-Path $root '.env') -Encoding utf8
    function Get-EnvValue([string]$key) {
        $line = $lines | Where-Object { $_.StartsWith($key + '=') } | Select-Object -First 1
        if (-not $line) { throw "Missing $key in root .env" }
        return $line.Substring($key.Length + 1).Trim().Trim('"', "'")
    }

    $dbUser = Get-EnvValue 'POSTGRES_USER'
    $connection = Get-EnvValue 'ConnectionStrings__DefaultConnection'
    if ($dbUser -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
        throw 'Invalid local PostgreSQL user'
    }
    if ($connection -notmatch '(?i)(^|;)Host=(localhost|127\.0\.0\.1)(;|$)') {
        throw 'Visual smoke only accepts local PostgreSQL'
    }
    if ($dbName -notmatch '^foodmatch_test_visual_[0-9a-f]{12}$') {
        throw 'Unsafe temporary database name'
    }
    foreach ($port in @(5099, $visualPort, 9222)) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
            throw "Port $port is already in use"
        }
    }

    $env:ConnectionStrings__DefaultConnection = [regex]::Replace(
        $connection, '(?i)Database=[^;]+', 'Database=' + $dbName)
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS = 'http://127.0.0.1:5099'
    $env:Cors__Origins = $visualOrigin
    $env:VITE_API_URL = 'http://127.0.0.1:5099'
    $env:VITE_SIGNALR_URL = 'http://127.0.0.1:5099'
    $env:DOTNET_ROOT = (Resolve-Path (Join-Path $root '.dotnet')).Path
    $env:PATH = $env:DOTNET_ROOT + ';' + $env:PATH

    docker exec foodmatch-postgres createdb -U $dbUser $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not create temporary database' }
    $created = $true

    $apiDll = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Api/bin/Release/net10.0/FoodMatch.Api.dll'
    if (-not (Test-Path -LiteralPath $apiDll)) { throw 'Build backend Release first' }
    $api = Start-Process -FilePath (Join-Path $env:DOTNET_ROOT 'dotnet.exe') `
        -ArgumentList @($apiDll) -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $apiLog -RedirectStandardError $apiError
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

    $vitePath = Join-Path $root 'frontend/node_modules/vite/bin/vite.js'
    $vite = Start-Process -FilePath (Get-Command node.exe).Source `
        -ArgumentList @($vitePath, '--host', 'localhost', '--port', "$visualPort", '--strictPort') `
        -WorkingDirectory (Join-Path $root 'frontend') -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $viteLog -RedirectStandardError $viteError
    $ready = $false
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Milliseconds 400
        try {
            $page = Invoke-WebRequest -Uri "$visualOrigin/random" -UseBasicParsing -TimeoutSec 2
            if ($page.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
        if ($vite.HasExited) { break }
    }
    if (-not $ready) { throw 'Temporary Vite server did not become ready' }

    $edgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if (-not (Test-Path -LiteralPath $edgePath)) { throw 'Edge is not installed at the expected path' }
    if ((Test-Path -LiteralPath $screenshot) -or
        (Test-Path -LiteralPath $resultScreenshot) -or
        (Test-Path -LiteralPath $meetingScreenshot) -or
        (Test-Path -LiteralPath $mapScreenshot) -or
        (Test-Path -LiteralPath $routeScreenshot)) {
        throw 'Screenshot target already exists'
    }
    $edge = Start-Process -FilePath $edgePath -ArgumentList @(
        '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
        '--remote-debugging-port=9222', "--user-data-dir=$browserDir", 'about:blank'
    ) -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput $edgeLog -RedirectStandardError $edgeError
    $ready = $false
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Milliseconds 400
        try {
            $targets = Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json' -TimeoutSec 2
            if ($targets) { $ready = $true; break }
        } catch {}
        if ($edge.HasExited) { break }
    }
    if (-not $ready) { throw 'Edge DevTools did not become ready' }

    $env:FOODMATCH_VISUAL_SCREENSHOT = $screenshot
    $env:FOODMATCH_VISUAL_RESULT_SCREENSHOT = $resultScreenshot
    $env:FOODMATCH_VISUAL_MEETING_SCREENSHOT = $meetingScreenshot
    $env:FOODMATCH_VISUAL_MAP_SCREENSHOT = $mapScreenshot
    $env:FOODMATCH_VISUAL_ROUTE_SCREENSHOT = $routeScreenshot
    $env:FOODMATCH_VISUAL_DB_NAME = $dbName
    $env:FOODMATCH_VISUAL_DB_USER = $dbUser
    $env:FOODMATCH_VISUAL_ORIGIN = $visualOrigin
    $embedKeyLine = $lines | Where-Object { $_.StartsWith('GoogleMaps__EmbedApiKey=') } | Select-Object -First 1
    $env:FOODMATCH_VISUAL_EXPECT_OFFICIAL_EMBED = if ($embedKeyLine -and
        $embedKeyLine.Substring('GoogleMaps__EmbedApiKey='.Length).Trim()) { '1' } else { '0' }
    node (Join-Path $root 'frontend/scripts/capture-mobile.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Mobile browser checks failed' }
    if (-not (Test-Path -LiteralPath $screenshot) -or
        -not (Test-Path -LiteralPath $resultScreenshot) -or
        -not (Test-Path -LiteralPath $meetingScreenshot) -or
        -not (Test-Path -LiteralPath $mapScreenshot) -or
        -not (Test-Path -LiteralPath $routeScreenshot) -or
        (Get-Item -LiteralPath $screenshot).Length -lt 10000 -or
        (Get-Item -LiteralPath $resultScreenshot).Length -lt 10000 -or
        (Get-Item -LiteralPath $meetingScreenshot).Length -lt 10000 -or
        (Get-Item -LiteralPath $mapScreenshot).Length -lt 10000 -or
        (Get-Item -LiteralPath $routeScreenshot).Length -lt 10000) {
        throw 'Edge did not produce usable screenshots'
    }
    Write-Output "Mobile screenshots: $screenshot; $resultScreenshot; $meetingScreenshot; $mapScreenshot; $routeScreenshot"
} finally {
    if ($edge -and -not $edge.HasExited) { Stop-Process -Id $edge.Id -Force }
    if ($vite -and -not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
    if ($api -and -not $api.HasExited) { Stop-Process -Id $api.Id -Force }
    if ($created) { docker exec foodmatch-postgres dropdb -U $dbUser --if-exists $dbName }
    $resolvedRoot = [IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
    $resolvedBrowser = [IO.Path]::GetFullPath($browserDir)
    if ($resolvedBrowser.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedBrowser) -match '^\.tmp_visual_[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $resolvedBrowser)) {
        Remove-Item -LiteralPath $resolvedBrowser -Recurse -Force
    }
    Remove-Item -LiteralPath $apiLog,$apiError,$viteLog,$viteError,$edgeLog,$edgeError `
        -ErrorAction SilentlyContinue
    Pop-Location
}
