# Скрипт для запуска всех микросервисов (Windows PowerShell)
# Кодировка: UTF-8 без BOM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Music Streaming Platform - Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Определяем корневую директорию скрипта
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptRoot) {
    $scriptRoot = Get-Location
}

# Поиск Java в системе
$javaPath = $null
try {
    $javaCmd = Get-Command java -ErrorAction Stop
    $javaPath = $javaCmd.Source
} catch {
    $javaPaths = @(
        "$env:ProgramFiles\Java\*\bin\java.exe",
        "$env:ProgramFiles(x86)\Java\*\bin\java.exe",
        "$env:JAVA_HOME\bin\java.exe"
    )
    foreach ($pathPattern in $javaPaths) {
        $found = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $javaPath = $found.FullName
            $javaDir = Split-Path $found.DirectoryName -Parent
            if ($env:PATH -notlike "*$javaDir\bin*") {
                $env:PATH = "$javaDir\bin;$env:PATH"
            }
            break
        }
    }
}

if (-not $javaPath) {
    Write-Host "ERROR: Java not found!" -ForegroundColor Red
    Write-Host "Install JDK 17 or higher:" -ForegroundColor Yellow
    Write-Host "  https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Cyan
    Write-Host "  or" -ForegroundColor Gray
    Write-Host "  https://adoptium.net/" -ForegroundColor Cyan
    exit 1
}

$javaVersion = java -version 2>&1 | Select-String -Pattern "version"
if (-not $javaVersion) {
    Write-Host "ERROR: Cannot check Java version!" -ForegroundColor Red
    exit 1
}
Write-Host "Java found: $javaVersion" -ForegroundColor Green

# Поиск Maven в системе
$mvnPath = $null
try {
    $mvnCmd = Get-Command mvn -ErrorAction Stop
    $mvnPath = $mvnCmd.Source
} catch {
    $mavenPaths = @(
        "C:\apache-maven-3.9.11\bin\mvn.cmd",
        "C:\apache-maven-*\bin\mvn.cmd",
        "$env:ProgramFiles\Apache\maven\*\bin\mvn.cmd",
        "$env:ProgramFiles(x86)\Apache\maven\*\bin\mvn.cmd",
        "$env:M2_HOME\bin\mvn.cmd",
        "$env:MAVEN_HOME\bin\mvn.cmd"
    )
    foreach ($pathPattern in $mavenPaths) {
        # Сначала проверяем точный путь
        if (Test-Path $pathPattern) {
            $mvnPath = $pathPattern
            $mvnDir = Split-Path $pathPattern -Parent | Split-Path -Parent
            if ($env:PATH -notlike "*$mvnDir\bin*") {
                $env:PATH = "$mvnDir\bin;$env:PATH"
            }
            break
        }
        # Если путь с wildcard, используем Get-ChildItem
        if ($pathPattern -like "*\*") {
            $found = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $mvnPath = $found.FullName
                $mvnDir = Split-Path $found.DirectoryName -Parent
                if ($env:PATH -notlike "*$mvnDir\bin*") {
                    $env:PATH = "$mvnDir\bin;$env:PATH"
                }
                break
            }
        }
    }
}

if (-not $mvnPath) {
    Write-Host "ERROR: Maven not found!" -ForegroundColor Red
    Write-Host "Install Maven 3.6 or higher:" -ForegroundColor Yellow
    Write-Host "  https://maven.apache.org/download.cgi" -ForegroundColor Cyan
    exit 1
}

$mvnVersion = mvn -version 2>&1 | Select-String -Pattern "Apache Maven"
if (-not $mvnVersion) {
    Write-Host "ERROR: Cannot check Maven version!" -ForegroundColor Red
    exit 1
}
Write-Host "Maven found: $($mvnVersion.ToString())" -ForegroundColor Green
Write-Host ""

# Функция для остановки процесса на порту
function Stop-ProcessOnPort {
    param([int]$Port)
    
    $stopped = $false
    $processIds = @()
    
    try {
        # Используем netstat для поиска процессов на порту
        $output = netstat -ano | Select-String ":$Port "
        if ($output) {
            foreach ($line in $output) {
                if ($line -match '\s+(\d+)$') {
                    $processId = [int]$Matches[1]
                    if ($processId -gt 0 -and $processId -notin $processIds) {
                        $processIds += $processId
                    }
                }
            }
            
            # Останавливаем найденные процессы
            foreach ($processId in $processIds) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        $processName = $process.ProcessName.ToLower()
                        # Останавливаем только Java процессы (Maven/Spring Boot)
                        if ($processName -eq 'java') {
                            Write-Host "  Stopping Java process on port $Port (PID: $processId, Name: $($process.ProcessName))..." -ForegroundColor Yellow
                            try {
                                Stop-Process -Id $processId -Force -ErrorAction Stop
                                $stopped = $true
                                Start-Sleep -Milliseconds 500
                            } catch {
                                Write-Host "    Warning: Could not stop process $processId, trying taskkill..." -ForegroundColor Yellow
                                try {
                                    & taskkill /PID $processId /F 2>&1 | Out-Null
                                    $stopped = $true
                                    Start-Sleep -Milliseconds 500
                                } catch {
                                    Write-Host "    Error: Could not kill process $processId" -ForegroundColor Red
                                }
                            }
                        }
                    }
                } catch {
                    # Игнорируем ошибки при получении процесса (уже завершен)
                }
            }
        }
    } catch {
        # Игнорируем ошибки
    }
    
    return $stopped
}

# Проверка и освобождение портов
Write-Host "Checking and freeing ports..." -ForegroundColor Yellow
Write-Host ""

$ports = @(8761, 8888, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8080)
$portsFreed = 0

foreach ($port in $ports) {
    $wasInUse = Stop-ProcessOnPort -Port $port
    if ($wasInUse) {
        $portsFreed++
        Write-Host "  Port $port freed" -ForegroundColor Green
    }
}

if ($portsFreed -gt 0) {
    Write-Host "  Stopped $portsFreed process(es) on ports" -ForegroundColor Green
    Write-Host "  Waiting 5 seconds for ports to be released..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "  All ports are free" -ForegroundColor Green
}

# Дополнительная проверка: попробуем остановить все Java процессы на портах еще раз
Write-Host "  Final check and cleanup..." -ForegroundColor Yellow
$portsCheck = @(8761, 8888, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087)
foreach ($portCheck in $portsCheck) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $portCheck -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                if ($processId) {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($proc -and $proc.ProcessName -eq "java") {
                        Write-Host "    Force stopping process on port $portCheck (PID: $processId)..." -ForegroundColor Yellow
                        try {
                            taskkill /PID $processId /F 2>&1 | Out-Null
                            Start-Sleep -Milliseconds 300
                        } catch {
                            # Игнорируем ошибки
                        }
                    }
                }
            }
        }
    } catch {
        # Игнорируем ошибки
    }
}

Write-Host "  Cleanup complete" -ForegroundColor Green

Write-Host ""

# Проверка базы данных
Write-Host "Checking database..." -ForegroundColor Yellow
$dbRunning = $false

try {
    $dockerCmd = Get-Command docker -ErrorAction Stop
} catch {
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"
    )
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            $dockerDir = Split-Path $path -Parent
            if ($env:PATH -notlike "*$dockerDir*") {
                $env:PATH = "$dockerDir;$env:PATH"
            }
            break
        }
    }
}

try {
    $containerStatus = docker ps --filter "name=music_postgres" --format "{{.Status}}" 2>&1
    if ($LASTEXITCODE -eq 0 -and $containerStatus) {
        $dbRunning = $true
        Write-Host "Database is running!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Database is not running!" -ForegroundColor Yellow
        Write-Host "Start database before starting services:" -ForegroundColor Yellow
        Write-Host "  .\start-db.ps1" -ForegroundColor Cyan
        Write-Host ""
        $response = Read-Host "Continue without database? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "Startup cancelled." -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "WARNING: Cannot check database status!" -ForegroundColor Yellow
    Write-Host "Make sure Docker is running and database is working." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""

# Функция для запуска сервиса
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Directory,
        [int]$Port,
        [int]$WaitSeconds = 10
    )
    
    $servicePath = Join-Path $scriptRoot $Directory
    
    if (-not (Test-Path $servicePath)) {
        Write-Host "ERROR: Directory $ServiceName not found: $servicePath" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path (Join-Path $servicePath "pom.xml"))) {
        Write-Host "ERROR: File pom.xml not found in $servicePath" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    $scriptBlock = @"
        `$ErrorActionPreference = 'Continue'
        cd '$servicePath'
        Write-Host "[$ServiceName] Starting in: " -ForegroundColor Cyan -NoNewline
        Write-Host (Get-Location) -ForegroundColor Cyan
        Write-Host "[$ServiceName] Starting service..." -ForegroundColor Cyan
        mvn spring-boot:run
        Write-Host "[$ServiceName] Service stopped" -ForegroundColor Red
        pause
"@
    
    try {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
        Write-Host "  Window $ServiceName opened" -ForegroundColor Green
        
        if ($WaitSeconds -gt 0) {
            Write-Host "  Waiting $WaitSeconds seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $WaitSeconds
        }
        return $true
    } catch {
        Write-Host "  Error starting $ServiceName : $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

$servicesStarted = 0

# 1. Config Server (port 8888)
if (Start-Service -ServiceName "Config Server" -Directory "config-server" -Port 8888 -WaitSeconds 15) {
    $servicesStarted++
}

# 2. Eureka Server (port 8761)
if (Start-Service -ServiceName "Eureka Server" -Directory "eureka-server" -Port 8761 -WaitSeconds 15) {
    $servicesStarted++
}

# 3. User Service (port 8081)
if (Start-Service -ServiceName "User Service" -Directory "user-service" -Port 8081 -WaitSeconds 5) {
    $servicesStarted++
}

# 4. Music Catalog Service (port 8082)
if (Start-Service -ServiceName "Music Catalog Service" -Directory "music-catalog-service" -Port 8082 -WaitSeconds 5) {
    $servicesStarted++
}

# 5. Notification Service (port 8083)
if (Start-Service -ServiceName "Notification Service" -Directory "notification-service" -Port 8083 -WaitSeconds 5) {
    $servicesStarted++
}

# 6. Analytics Service (port 8084)
if (Start-Service -ServiceName "Analytics Service" -Directory "analytics-service" -Port 8084 -WaitSeconds 5) {
    $servicesStarted++
}

# 7. Recommendation Service (port 8085)
if (Start-Service -ServiceName "Recommendation Service" -Directory "recommendation-service" -Port 8085 -WaitSeconds 5) {
    $servicesStarted++
}

# 8. Search Service (port 8086)
if (Start-Service -ServiceName "Search Service" -Directory "search-service" -Port 8086 -WaitSeconds 5) {
    $servicesStarted++
}

# 9. Social Service (port 8087)
if (Start-Service -ServiceName "Social Service" -Directory "social-service" -Port 8087 -WaitSeconds 5) {
    $servicesStarted++
}

# 10. API Gateway (port 8080)
if (Start-Service -ServiceName "API Gateway" -Directory "api-gateway" -Port 8080 -WaitSeconds 0) {
    $servicesStarted++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Services started: $servicesStarted of 10" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($servicesStarted -eq 10) {
    Write-Host "All services started successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Not all services started. Check opened windows." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Check service status:" -ForegroundColor Yellow
Write-Host "  - Eureka Dashboard: http://localhost:8761" -ForegroundColor Cyan
Write-Host "  - API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  - Config Server: http://localhost:8888" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start frontend, run in new PowerShell window:" -ForegroundColor Yellow
Write-Host "  .\start-frontend.ps1" -ForegroundColor White
Write-Host "  or" -ForegroundColor Gray
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  python -m http.server 3000" -ForegroundColor White
Write-Host ""
Write-Host "All service windows are opened. Close them to stop services." -ForegroundColor Gray
Write-Host "To stop database: .\stop-db.ps1" -ForegroundColor Gray
Write-Host ""