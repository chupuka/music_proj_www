# Скрипт для запуска PostgreSQL в Docker (Windows PowerShell)
# Кодировка: UTF-8 без BOM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Запуск PostgreSQL в Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Поиск Docker в системе
$dockerPath = $null
$dockerExePaths = @(
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    "C:\Program Files (x86)\Docker\Docker\resources\bin\docker.exe",
    "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
    "$env:ProgramFiles(x86)\Docker\Docker\resources\bin\docker.exe"
)

# Сначала пробуем найти через Get-Command (если Docker в PATH)
try {
    $dockerCmd = Get-Command docker -ErrorAction Stop
    $dockerPath = $dockerCmd.Source
} catch {
    # Если не найден в PATH, ищем в стандартных местах
    foreach ($path in $dockerExePaths) {
        if (Test-Path $path) {
            $dockerPath = $path
            # Добавляем путь к Docker в PATH текущей сессии
            $dockerDir = Split-Path $path -Parent
            if ($env:PATH -notlike "*$dockerDir*") {
                $env:PATH = "$dockerDir;$env:PATH"
            }
            break
        }
    }
}

# Если Docker не найден
if (-not $dockerPath) {
    Write-Host "ОШИБКА: Docker не найден в системе!" -ForegroundColor Red
    Write-Host "Установите Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "После установки перезапустите PowerShell или перезагрузите компьютер." -ForegroundColor Yellow
    exit 1
}

# Проверка наличия Docker
$dockerVersion = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: Docker найден, но не может быть запущен!" -ForegroundColor Red
    Write-Host "Убедитесь, что Docker Desktop установлен и запущен." -ForegroundColor Yellow
    Write-Host "Запустите Docker Desktop и попробуйте снова." -ForegroundColor Yellow
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

# Проверка наличия docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "ОШИБКА: Файл docker-compose.yml не найден!" -ForegroundColor Red
    Write-Host "Убедитесь, что вы запускаете скрипт из корневой директории проекта." -ForegroundColor Yellow
    exit 1
}

# Проверка наличия docker/init-db.sql
if (-not (Test-Path "docker/init-db.sql")) {
    Write-Host "ПРЕДУПРЕЖДЕНИЕ: Файл docker/init-db.sql не найден!" -ForegroundColor Yellow
    Write-Host "Создаю базовый файл..." -ForegroundColor Yellow
    $null = New-Item -ItemType Directory -Force -Path "docker"
    @"
-- Автоматическая настройка прав пользователя при первом запуске PostgreSQL в Docker
GRANT ALL PRIVILEGES ON DATABASE music_prilo_db TO username;
"@ | Out-File -FilePath "docker/init-db.sql" -Encoding UTF8
    Write-Host "Файл создан." -ForegroundColor Green
}

# Проверка и загрузка Docker образа PostgreSQL
Write-Host "Проверка Docker образа PostgreSQL..." -ForegroundColor Yellow
$imageExists = docker images postgres:15 --format "{{.Repository}}:{{.Tag}}"
if (-not $imageExists) {
    Write-Host "Образ postgres:15 не найден. Загружаю..." -ForegroundColor Yellow
    docker pull postgres:15
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ОШИБКА: Не удалось загрузить образ PostgreSQL!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Образ успешно загружен!" -ForegroundColor Green
} else {
    Write-Host "Образ postgres:15 уже загружен." -ForegroundColor Green
}
Write-Host ""

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
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ОШИБКА: Не удалось запустить контейнер!" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "Создаю и запускаю новый контейнер PostgreSQL..." -ForegroundColor Yellow
    # Пытаемся использовать docker compose (новая версия)
    $useNewCompose = $false
    $composeCheck = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $useNewCompose = $true
        Write-Host "Используется: docker compose" -ForegroundColor Gray
        docker compose up -d
    } else {
        # Если не работает, пробуем docker-compose (старая версия)
        $composeCheck = docker-compose version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Используется: docker-compose" -ForegroundColor Gray
            docker-compose up -d
        } else {
            Write-Host "ОШИБКА: Docker Compose не найден!" -ForegroundColor Red
            Write-Host "Установите Docker Desktop, который включает Docker Compose." -ForegroundColor Yellow
            exit 1
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ОШИБКА: Не удалось создать контейнер!" -ForegroundColor Red
        Write-Host "Проверьте docker-compose.yml и убедитесь, что Docker запущен." -ForegroundColor Yellow
        if ($useNewCompose) {
            Write-Host "Попробуйте выполнить вручную: docker compose up -d" -ForegroundColor Yellow
        } else {
            Write-Host "Попробуйте выполнить вручную: docker-compose up -d" -ForegroundColor Yellow
        }
        exit 1
    }
}

# Ожидание готовности БД
Write-Host "Ожидание готовности базы данных..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$dbReady = $false

while ($attempt -lt $maxAttempts -and -not $dbReady) {
    Start-Sleep -Seconds 2
    
    # Проверяем, что контейнер существует и работает
    $containerStatus = docker ps --filter "name=music_postgres" --format "{{.Status}}" 2>&1
    if ($LASTEXITCODE -ne 0 -or -not $containerStatus) {
        $attempt++
        Write-Host "." -NoNewline -ForegroundColor Gray
        continue
    }
    
    # Проверяем готовность базы данных
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
    Write-Host ""
} else {
    Write-Host "ОШИБКА: База данных не запустилась за $($maxAttempts * 2) секунд" -ForegroundColor Red
    Write-Host "Проверьте логи: docker logs music_postgres" -ForegroundColor Yellow
    exit 1
}

