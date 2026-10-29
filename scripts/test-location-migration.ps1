$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dbName = 'foodmatch_test_location_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$created = $false
$environmentKeys = @('ConnectionStrings__DefaultConnection', 'FOODMATCH_TEST_CONNECTION',
    'ASPNETCORE_ENVIRONMENT', 'DOTNET_ROOT', 'PATH')
$originalEnvironment = @{}
foreach ($key in $environmentKeys) {
    $originalEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}

Push-Location $root
try {
    if ($dbName -notmatch '^foodmatch_test_location_[0-9a-f]{12}$') {
        throw 'Unsafe temporary database name'
    }
    $lines = Get-Content -LiteralPath (Join-Path $root '.env') -Encoding utf8
    function Get-EnvValue([string]$key) {
        $line = $lines | Where-Object { $_.StartsWith($key + '=') } | Select-Object -First 1
        if (-not $line) { throw "Missing $key in root .env" }
        return $line.Substring($key.Length + 1).Trim().Trim('"', "'")
    }
    $dbUser = Get-EnvValue 'POSTGRES_USER'
    $connection = Get-EnvValue 'ConnectionStrings__DefaultConnection'
    if ($dbUser -notmatch '^[A-Za-z_][A-Za-z0-9_]*$' -or
        $connection -notmatch '(?i)(^|;)Host=(localhost|127\.0\.0\.1)(;|$)' -or
        $connection -notmatch '(?i)(^|;)Database=[^;]+') {
        throw 'Migration test only accepts a local PostgreSQL connection'
    }

    docker exec foodmatch-postgres createdb -U $dbUser $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not create temporary database' }
    $created = $true

    $env:ConnectionStrings__DefaultConnection = [regex]::Replace(
        $connection, '(?i)Database=[^;]+', 'Database=' + $dbName)
    $env:FOODMATCH_TEST_CONNECTION = $env:ConnectionStrings__DefaultConnection
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:DOTNET_ROOT = (Resolve-Path -LiteralPath (Join-Path $root '.dotnet')).Path
    $env:PATH = $env:DOTNET_ROOT + ';' + $env:PATH
    $dotnet = Join-Path $env:DOTNET_ROOT 'dotnet.exe'
    $efToolDir = Join-Path ([IO.Path]::GetTempPath()) 'foodmatch-dotnet-tools'
    $efTool = Join-Path $efToolDir 'dotnet-ef.exe'
    if (-not (Test-Path -LiteralPath $efTool)) {
        & $dotnet tool install dotnet-ef --version 10.0.0 --tool-path $efToolDir
        if ($LASTEXITCODE -ne 0) { throw 'Could not install dotnet-ef 10.0.0 for the migration test' }
    }
    $efVersion = & $efTool --version
    if ($LASTEXITCODE -ne 0 -or ($efVersion -join ' ') -notmatch '\b10\.0\.0\b') {
        throw 'Migration test requires dotnet-ef 10.0.0 in the temporary tool directory'
    }
    $project = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Infrastructure'
    $startup = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Api'

    & $efTool database update 20261020093729_AddGoogleMeetingPlaceLink `
        --project $project --startup-project $startup --configuration Release
    if ($LASTEXITCODE -ne 0) { throw 'Could not migrate to the previous schema' }

    $seedSql = @'
INSERT INTO "temp_users" ("Id", "SessionToken", "DisplayName", "CurrentLat", "CurrentLng", "LocationVisible", "Status", "CreatedAt", "ExpiresAt")
VALUES
('00000000-0000-4000-8000-0000000000a1', 'migration-a', 'Migration A', 10.123456789, 106.987654321, TRUE, 'Available', now(), now() + interval '2 hours'),
('00000000-0000-4000-8000-0000000000b2', 'migration-b', 'Migration B', 11.123456789, 107.987654321, TRUE, 'Available', now(), now() + interval '2 hours');
INSERT INTO "match_requests" ("Id", "FromTempUserId", "ToTempUserId", "Status", "CreatedAt", "FromUserSharedLocation", "ToUserSharedLocation", "LocationSharedAt")
VALUES
(9001, '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2', 'Accepted', now(), TRUE, TRUE, now() - interval '10 minutes'),
(9002, '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2', 'Accepted', now(), TRUE, FALSE, NULL),
(9003, '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b2', 'Accepted', now(), FALSE, TRUE, now() - interval '10 minutes');
'@
    $seedSql | docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not seed the previous schema' }

    & $efTool database update --project $project --startup-project $startup `
        --configuration Release
    if ($LASTEXITCODE -ne 0) { throw 'Could not apply pending migrations' }

    $verifySql = @'
SELECT CASE WHEN
    (SELECT "FromUserSharedAt" = "LocationSharedAt"
        AND "ToUserSharedAt" = "LocationSharedAt"
        AND "FromUserSharedLocation" AND "ToUserSharedLocation"
        FROM "match_requests" WHERE "Id" = 9001)
    AND
    (SELECT NOT "FromUserSharedLocation" AND NOT "ToUserSharedLocation"
        AND "FromUserSharedAt" IS NULL AND "ToUserSharedAt" IS NULL
        AND "LocationSharedAt" IS NULL
        FROM "match_requests" WHERE "Id" = 9002)
    AND
    (SELECT NOT "FromUserSharedLocation" AND NOT "ToUserSharedLocation"
        AND "FromUserSharedAt" IS NULL AND "ToUserSharedAt" IS NULL
        AND "LocationSharedAt" IS NULL
        FROM "match_requests" WHERE "Id" = 9003)
    THEN 'PASS' ELSE 'FAIL' END;
'@
    $migrationCheck = $verifySql | docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 `
        -U $dbUser -d $dbName -At
    if ($LASTEXITCODE -ne 0 -or $migrationCheck.Trim() -ne 'PASS') {
        throw 'Consent backfill did not preserve or reset legacy rows correctly'
    }

    & $dotnet test (Join-Path $root 'backend/FoodMatch/FoodMatch.sln') `
        -c Release --no-restore
    if ($LASTEXITCODE -ne 0) { throw 'Full PostgreSQL test suite failed' }
    Write-Output 'Migration upgrade and full PostgreSQL suite passed.'
} finally {
    if ($created -and $dbName -match '^foodmatch_test_location_[0-9a-f]{12}$') {
        docker exec foodmatch-postgres dropdb -U $dbUser --if-exists $dbName
    }
    foreach ($key in $environmentKeys) {
        [Environment]::SetEnvironmentVariable($key, $originalEnvironment[$key], 'Process')
    }
    Pop-Location
}
