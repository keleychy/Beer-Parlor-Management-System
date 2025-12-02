param(
    [switch]$Seed
)

function Run-Command($pnpmCmd, $npmCmd) {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "Running: $pnpmCmd"
        pnpm $pnpmCmd
        return $LASTEXITCODE
    } else {
        Write-Host "pnpm not found, falling back to npm: $npmCmd"
        npm run $npmCmd
        return $LASTEXITCODE
    }
}

if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = Read-Host "Enter DATABASE_URL (postgres://...)"
}

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    $env:NEXT_PUBLIC_SUPABASE_URL = Read-Host "Enter NEXT_PUBLIC_SUPABASE_URL (https://...)"
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    $keyPrompt = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY (leave empty to skip seeding)"
    if ($keyPrompt) { $env:SUPABASE_SERVICE_ROLE_KEY = $keyPrompt }
}

Write-Host "Validating environment..."
$code = Run-Command 'run check-env' 'check-env'
if ($code -ne 0) { Write-Error "Environment validation failed (code $code). Aborting."; exit $code }

Write-Host "Running migrations..."
$code = Run-Command 'run migrate' 'migrate'
if ($code -ne 0) { Write-Error "Migrations failed (code $code). Aborting."; exit $code }

if ($Seed.IsPresent -or $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Running seed script..."
    $code = Run-Command 'run seed' 'seed'
    if ($code -ne 0) { Write-Error "Seeding failed (code $code)."; exit $code }
} else {
    Write-Host "Skipping seed: no service role key provided and -Seed flag not set."
}

Write-Host "Migrations completed successfully. See docs/MIGRATION.md for verification queries."
