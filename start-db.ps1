# Скрипт для запуска PostgreSQL в Docker (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Запуск PostgreSQL в Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Docker
$dockerVersion = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: Docker не установлен!" -ForegroundColor Red
    Write-Host "Установите Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker найден: $dockerVersion" -ForegroundColor Green
Write-Host ""

# Проверка, запущен ли Docker
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: Docker не запущен!" -ForegroundColor Red
    Write-Host "Запустите Docker Desktop и попробуйте снова." -ForegroundColor Yellow
    exit 1
}

# Проверка, существует ли контейнер
$containerExists = docker ps -a --filter "name=music_postgres" --format "{{.Names}}"
if ($containerExists -eq "music_postgres") {
    Write-Host "Контейнер уже существует. Проверяю статус..." -ForegroundColor Yellow
    $containerRunning = docker ps --filter "name=music_postgres" --format "{{.Names}}"
    if ($containerRunning -eq "music_postgres") {
        Write-Host "База данных уже запущена!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Подключение:" -ForegroundColor Cyan
        Write-Host "  Host: localhost" -ForegroundColor White
        Write-Host "  Port: 5432" -ForegroundColor White
        Write-Host "  Database: music_prilo_db" -ForegroundColor White
        Write-Host "  Username: username" -ForegroundColor White
        Write-Host "  Password: durak123" -ForegroundColor White
        Write-Host ""
        exit 0
    } else {
        Write-Host "Запускаю существующий контейнер..." -ForegroundColor Yellow
        docker start music_postgres
    }
} else {
    Write-Host "Создаю и запускаю новый контейнер PostgreSQL..." -ForegroundColor Yellow
    docker-compose up -d
}

# Ожидание готовности БД
Write-Host "Ожидание готовности базы данных..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$dbReady = $false

while ($attempt -lt $maxAttempts -and -not $dbReady) {
    Start-Sleep -Seconds 2
    $healthCheck = docker exec music_postgres pg_isready -U username 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dbReady = $true
        break
    }
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

if ($dbReady) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "База данных готова к работе!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Подключение:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "  Database: music_prilo_db" -ForegroundColor White
    Write-Host "  Username: username" -ForegroundColor White
    Write-Host "  Password: durak123" -ForegroundColor White
    Write-Host ""
    Write-Host "Проверка подключения:" -ForegroundColor Cyan
    Write-Host "  docker exec -it music_postgres psql -U username -d music_prilo_db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Остановка БД:" -ForegroundColor Cyan
    Write-Host "  docker-compose down" -ForegroundColor Gray
    Write-Host "  или" -ForegroundColor Gray
    Write-Host "  .\stop-db.ps1" -ForegroundColor Gray
} else {
    Write-Host "ОШИБКА: База данных не запустилась за $($maxAttempts * 2) секунд" -ForegroundColor Red
    Write-Host "Проверьте логи: docker logs music_postgres" -ForegroundColor Yellow
    exit 1
}

