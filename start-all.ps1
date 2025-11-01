# Скрипт для запуска всех микросервисов (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Music Streaming Platform - Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Java
$javaVersion = java -version 2>&1 | Select-String -Pattern "version"
if (-not $javaVersion) {
    Write-Host "ОШИБКА: Java не найдена. Установите JDK 17+" -ForegroundColor Red
    exit 1
}
Write-Host "Java найдена: $javaVersion" -ForegroundColor Green

# Проверка наличия Maven
$mvnVersion = mvn -version 2>&1 | Select-String -Pattern "Apache Maven"
if (-not $mvnVersion) {
    Write-Host "ОШИБКА: Maven не найден. Установите Maven 3.6+" -ForegroundColor Red
    exit 1
}
Write-Host "Maven найден" -ForegroundColor Green
Write-Host ""

# Функция для запуска сервиса
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Directory,
        [int]$Port,
        [int]$WaitSeconds = 10
    )
    
    Write-Host "Запуск $ServiceName на порту $Port..." -ForegroundColor Yellow
    
    $scriptBlock = @"
        cd '$PSScriptRoot\$Directory'
        Write-Host "[$ServiceName] Запуск..." -ForegroundColor Cyan
        mvn spring-boot:run
        Write-Host "[$ServiceName] Остановлен" -ForegroundColor Red
        pause
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    
    if ($WaitSeconds -gt 0) {
        Write-Host "Ожидание $WaitSeconds секунд..." -ForegroundColor Gray
        Start-Sleep -Seconds $WaitSeconds
    }
}

Write-Host "Начало запуска сервисов..." -ForegroundColor Green
Write-Host ""

# 1. Config Server (порт 8888)
Start-Service -ServiceName "Config Server" -Directory "config-server" -Port 8888 -WaitSeconds 15

# 2. Eureka Server (порт 8761)
Start-Service -ServiceName "Eureka Server" -Directory "eureka-server" -Port 8761 -WaitSeconds 15

# 3. User Service (порт 8081)
Start-Service -ServiceName "User Service" -Directory "user-service" -Port 8081 -WaitSeconds 5

# 4. Music Catalog Service (порт 8082)
Start-Service -ServiceName "Music Catalog Service" -Directory "music-catalog-service" -Port 8082 -WaitSeconds 5

# 5. Notification Service (порт 8083)
Start-Service -ServiceName "Notification Service" -Directory "notification-service" -Port 8083 -WaitSeconds 5

# 6. API Gateway (порт 8080)
Start-Service -ServiceName "API Gateway" -Directory "api-gateway" -Port 8080 -WaitSeconds 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Все сервисы запущены!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Проверьте статус сервисов:" -ForegroundColor Yellow
Write-Host "  - Eureka Dashboard: http://localhost:8761" -ForegroundColor Cyan
Write-Host "  - API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для запуска frontend выполните:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  python -m http.server 3000" -ForegroundColor White
Write-Host ""
Write-Host "Все окна сервисов открыты. Закройте их для остановки." -ForegroundColor Gray
Write-Host ""

