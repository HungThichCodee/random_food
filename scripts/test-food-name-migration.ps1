$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dbName = 'foodmatch_test_food_name_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
$created = $false

Push-Location $root
try {
    if ($dbName -notmatch '^foodmatch_test_food_name_[0-9a-f]{12}$') {
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
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:DOTNET_ROOT = (Resolve-Path -LiteralPath (Join-Path $root '.dotnet')).Path
    $env:PATH = $env:DOTNET_ROOT + ';' + $env:PATH
    $dotnet = Join-Path $env:DOTNET_ROOT 'dotnet.exe'
    $project = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Infrastructure'
    $startup = Join-Path $root 'backend/FoodMatch/src/FoodMatch.Api'
    $previous = '20261021070306_IndependentLocationConsent'
    $oldSql = "U&'G\00E0 N\01B0\1EDBng M\1ED1i'"
    $newSql = "U&'G\00E0 N\01B0\1EDBng Mu\1ED1i \1EDAt'"

    & $dotnet ef database update $previous --project $project --startup-project $startup `
        --configuration Release --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Could not prepare previous schema' }

    ('INSERT INTO foods ("Name", "IsActive") VALUES ({0}, TRUE);' -f $oldSql) |
        docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not insert legacy dish' }

    & $dotnet ef database update --project $project --startup-project $startup `
        --configuration Release --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Could not apply food-name migration' }
    $upQuery = 'SELECT CASE WHEN (SELECT count(*) FROM foods WHERE "Name" = {0}) = 1 AND (SELECT count(*) FROM foods WHERE "Name" = {1}) = 0 THEN ''PASS'' ELSE ''FAIL'' END;' -f $newSql, $oldSql
    $up = $upQuery |
        docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName -At
    if ($LASTEXITCODE -ne 0 -or $up.Trim() -ne 'PASS') { throw 'Food-name upgrade did not preserve the dish' }

    & $dotnet ef database update $previous --project $project --startup-project $startup `
        --configuration Release --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Could not roll back food-name migration' }
    $downQuery = 'SELECT CASE WHEN (SELECT count(*) FROM foods WHERE "Name" = {0}) = 1 AND (SELECT count(*) FROM foods WHERE "Name" = {1}) = 0 THEN ''PASS'' ELSE ''FAIL'' END;' -f $oldSql, $newSql
    $down = $downQuery |
        docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName -At
    if ($LASTEXITCODE -ne 0 -or $down.Trim() -ne 'PASS') { throw 'Food-name rollback did not restore the legacy dish' }

    'TRUNCATE TABLE foods CASCADE;' |
        docker exec -i foodmatch-postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not clear migration fixture from disposable database' }
    & $dotnet ef database update --project $project --startup-project $startup `
        --configuration Release --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Could not restore latest schema for backend tests' }
    $env:FOODMATCH_TEST_CONNECTION = $env:ConnectionStrings__DefaultConnection
    & $dotnet test (Join-Path $root 'backend/FoodMatch/FoodMatch.sln') `
        --configuration Release --no-build --no-restore --verbosity minimal
    if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed on migrated PostgreSQL' }
    Remove-Item Env:\FOODMATCH_TEST_CONNECTION
    Write-Output 'Food-name migration upgrade and rollback passed.'
} finally {
    if ($created -and $dbName -match '^foodmatch_test_food_name_[0-9a-f]{12}$') {
        docker exec foodmatch-postgres dropdb -U $dbUser --if-exists $dbName
    }
    Pop-Location
}
