# Script to stop PostgreSQL in Docker (Windows PowerShell)
# UTF-8 without BOM encoding

param(
    [switch]$RemoveVolumes
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Docker - Stop Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to find Docker executable
function Find-Docker {
    # Try Get-Command first
    try {
        $dockerCmd = Get-Command docker -ErrorAction Stop
        if ($dockerCmd) {
            Write-Host "Docker found: $($dockerCmd.Source)" -ForegroundColor Green
            return "docker"
        }
    } catch {
        # Docker not in PATH, search common locations
    }

    # Common Docker installation paths
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "C:\Program Files (x86)\Docker\Docker\resources\bin\docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "$env:ProgramFiles(x86)\Docker\Docker\resources\bin\docker.exe"
    )

    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            $dockerDir = Split-Path -Parent $path
            if ($env:PATH -notlike "*$dockerDir*") {
                $env:PATH = "$dockerDir;$env:PATH"
                Write-Host "Added Docker to PATH: $dockerDir" -ForegroundColor Yellow
            }
            Write-Host "Docker found: $path" -ForegroundColor Green
            return "docker"
        }
    }

    Write-Host "ERROR: Docker not found!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Function to find docker-compose
function Find-DockerCompose {
    # Try docker compose (new version) first
    try {
        docker compose version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return "docker compose"
        }
    } catch {
        # docker compose not available
    }

    # Try docker-compose (old version)
    try {
        docker-compose version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return "docker-compose"
        }
    } catch {
        # docker-compose not available
    }

    # Try to find docker-compose.exe in common locations
    $composePaths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe",
        "C:\Program Files (x86)\Docker\Docker\resources\bin\docker-compose.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker-compose.exe",
        "$env:ProgramFiles(x86)\Docker\Docker\resources\bin\docker-compose.exe"
    )

    foreach ($path in $composePaths) {
        if (Test-Path $path) {
            $composeDir = Split-Path -Parent $path
            if ($env:PATH -notlike "*$composeDir*") {
                $env:PATH = "$composeDir;$env:PATH"
                Write-Host "Added docker-compose to PATH: $composeDir" -ForegroundColor Yellow
            }
            Write-Host "docker-compose found: $path" -ForegroundColor Green
            return "docker-compose"
        }
    }

    Write-Host "WARNING: docker-compose not found. Trying direct docker commands..." -ForegroundColor Yellow
    return $null
}

# Check for Docker
$docker = Find-Docker
if (-not $docker) {
    exit 1
}

# Check if Docker is running
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Cannot connect to Docker!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check for docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "WARNING: docker-compose.yml not found in current directory." -ForegroundColor Yellow
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Attempting to stop container directly..." -ForegroundColor Yellow
} else {
    Write-Host "Found docker-compose.yml" -ForegroundColor Green
}

# Find docker-compose command
$composeCmd = Find-DockerCompose

# Stop the container
Write-Host ""
Write-Host "Stopping PostgreSQL container..." -ForegroundColor Yellow

if ($composeCmd) {
    if ($RemoveVolumes) {
        Write-Host "Stopping and removing volumes..." -ForegroundColor Yellow
        Invoke-Expression "$composeCmd down -v"
    } else {
        Invoke-Expression "$composeCmd down"
    }
} else {
    # Direct docker commands
    $containerName = "music_postgres"
    Write-Host "Using direct docker commands for container: $containerName" -ForegroundColor Yellow
    
    # Check if container exists
    $containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}" 2>&1
    if ($containerExists -eq $containerName) {
        Write-Host "Stopping container: $containerName" -ForegroundColor Yellow
        docker stop $containerName
        
        if ($LASTEXITCODE -eq 0) {
            if ($RemoveVolumes) {
                Write-Host "Removing container: $containerName" -ForegroundColor Yellow
                docker rm $containerName
            }
            Write-Host "Container stopped successfully." -ForegroundColor Green
        } else {
            Write-Host "Error stopping container." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Container $containerName not found." -ForegroundColor Yellow
        Write-Host "Checking for running PostgreSQL containers..." -ForegroundColor Yellow
        docker ps --filter "ancestor=postgres" --format "table {{.Names}}\t{{.Status}}"
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database stopped successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "To start again:" -ForegroundColor Cyan
    Write-Host "  .\start-db.ps1" -ForegroundColor Gray
    Write-Host ""
    if ($RemoveVolumes) {
        Write-Host "NOTE: Volumes were removed. Database will be recreated on next start." -ForegroundColor Yellow
    } else {
        Write-Host "To remove volumes as well:" -ForegroundColor Cyan
        Write-Host "  .\stop-db.ps1 -RemoveVolumes" -ForegroundColor Gray
        Write-Host "  or" -ForegroundColor Gray
        Write-Host "  docker-compose down -v" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "Error stopping database." -ForegroundColor Red
    exit 1
}

Write-Host ""
