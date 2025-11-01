# Скрипт для остановки PostgreSQL в Docker (Windows PowerShell)

Write-Host "Остановка PostgreSQL контейнера..." -ForegroundColor Yellow

docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "База данных остановлена." -ForegroundColor Green
} else {
    Write-Host "Ошибка при остановке базы данных." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Для полного удаления контейнера и данных:" -ForegroundColor Cyan
Write-Host "  docker-compose down -v" -ForegroundColor Gray
Write-Host ""
Write-Host "Для запуска снова:" -ForegroundColor Cyan
Write-Host "  .\start-db.ps1" -ForegroundColor Gray
Write-Host "  или" -ForegroundColor Gray
Write-Host "  docker-compose up -d" -ForegroundColor Gray

