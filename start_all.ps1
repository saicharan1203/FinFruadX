param (
    [switch]$ForceReinstall
)

$ErrorActionPreference = 'Stop'

function Resolve-CommandPath {
    param (
        [Parameter(Mandatory=$true)][string]$CommandName
    )
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "Unable to find '$CommandName' on PATH. Please ensure it is installed."
    }
    return $cmd.Source
}

function Invoke-WithLocation {
    param (
        [string]$Path,
        [scriptblock]$Script,
        [object[]]$Arguments
    )
    Push-Location $Path
    try {
        if ($Arguments) {
            & $Script @Arguments
        } else {
            & $Script
        }
    }
    finally {
        Pop-Location
    }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Starting FinFraudX Application..." -ForegroundColor Green

$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'
$backendVenvPath = Join-Path $backendPath '.venv'
$backendPython = Join-Path $backendVenvPath 'Scripts\\python.exe'
$npmExecutable = Resolve-CommandPath 'npm.cmd'

# Ensure backend virtual environment exists
if ($ForceReinstall -and (Test-Path $backendVenvPath)) {
    Write-Host "Removing existing backend virtual environment..." -ForegroundColor DarkYellow
    Remove-Item -Recurse -Force $backendVenvPath
}

if (-not (Test-Path $backendVenvPath)) {
    Write-Host "Creating backend virtual environment..." -ForegroundColor Yellow
    python -m venv $backendVenvPath
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
& $backendPython -m pip install --upgrade pip > $null
& $backendPython -m pip install -r (Join-Path $backendPath 'requirements.txt') > $null

# Ensure frontend dependencies exist
$nodeModulesPath = Join-Path $frontendPath 'node_modules'
if ($ForceReinstall -and (Test-Path $nodeModulesPath)) {
    Write-Host "Removing existing frontend node_modules..." -ForegroundColor DarkYellow
    Remove-Item -Recurse -Force $nodeModulesPath
}

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing frontend dependencies (this may take a moment)..." -ForegroundColor Yellow
    Invoke-WithLocation -Path $frontendPath -Script { param($npmPath) & $npmPath install } -Arguments @($npmExecutable)
}

# Start Backend Server
Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath $backendPython -WorkingDirectory $backendPath -ArgumentList 'backend_app.py'

Start-Sleep -Seconds 5

# Start Frontend Server
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath $npmExecutable -WorkingDirectory $frontendPath -ArgumentList 'start'

Write-Host ""; Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit (servers will keep running)..." -ForegroundColor Gray
$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')