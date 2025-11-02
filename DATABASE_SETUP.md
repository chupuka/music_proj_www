# Настройка базы данных PostgreSQL

## 🚀 Быстрый старт с Docker (РЕКОМЕНДУЕТСЯ)

**Самый простой способ - используйте Docker!**

### 1. Установка Docker

Если Docker еще не установлен:
- **Windows/Mac**: Скачайте Docker Desktop с https://www.docker.com/products/docker-desktop
- **Linux**: Следуйте инструкциям https://docs.docker.com/engine/install/

### 2. Запуск базы данных

**Windows (PowerShell):**
```powershell
.\start-db.ps1
```

**Linux/Mac:**
```bash
docker-compose up -d
```

База данных создастся автоматически со всеми необходимыми настройками и правами пользователя! ✅

### 3. Проверка работы

```bash
# Проверка статуса контейнера
docker ps | grep music_postgres

# Проверка подключения
docker exec -it music_postgres psql -U username -d music_prilo_db -c "SELECT version();"

# Подключение к БД в интерактивном режиме
docker exec -it music_postgres psql -U username -d music_prilo_db
```

### 4. Остановка базы данных

**Windows:**
```powershell
.\stop-db.ps1
```

**Или вручную:**
```bash
docker-compose down        # Остановка (данные сохраняются в volume)
docker-compose down -v    # Остановка с удалением всех данных
```

### Параметры подключения (для application.properties):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/music_prilo_db
spring.datasource.username=username
spring.datasource.password=durak123
```
**Примечание**: Используется порт 5433, так как 5432 занят локальной установкой PostgreSQL.

### Что происходит автоматически:

1. ✅ Создается база данных `music_prilo_db`
2. ✅ Создается пользователь `username` с паролем `durak123`
3. ✅ Выдаются все необходимые права на базу данных и схему
4. ✅ Настраивается владение схемой `public`
5. ✅ При запуске сервисов Flyway автоматически создаст все таблицы через миграции

---

## Альтернативный способ: Локальная установка PostgreSQL

Если по каким-то причинам Docker недоступен, можно установить PostgreSQL локально:

### 1. Установка PostgreSQL

**Windows:**
- Скачайте установщик с https://www.postgresql.org/download/windows/
- Запустите установщик
- Запомните пароль для пользователя `postgres` (суперпользователь)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Создание базы данных и пользователя

Откройте терминал/командную строку и подключитесь к PostgreSQL:

**Windows:**
```bash
# Путь может отличаться в зависимости от версии
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

**Linux/macOS:**
```bash
sudo -u postgres psql
```

Выполните следующие SQL команды:

```sql
-- 1. Создайте пользователя (если еще не существует)
CREATE USER username WITH PASSWORD 'durak123';

-- 2. Создайте базу данных
CREATE DATABASE music_prilo_db OWNER username;

-- 3. Подключитесь к базе данных
\c music_prilo_db

-- 4. Выдайте все необходимые права
GRANT ALL PRIVILEGES ON DATABASE music_prilo_db TO username;
GRANT ALL PRIVILEGES ON SCHEMA public TO username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO username;
ALTER SCHEMA public OWNER TO username;

-- 5. Выйдите из psql
\q
```

### 3. Автоматическое создание таблиц

При запуске сервисов, Flyway автоматически применит все миграции из папок:
- `user-service/src/main/resources/db/migration/`
- `music-catalog-service/src/main/resources/db/migration/`
- `notification-service/src/main/resources/db/migration/`

**Миграции выполняются в следующем порядке:**

#### User Service:
- `V1__create_user_service_tables.sql` - создает таблицы: `users`, `playlists`, `playlist_tracks`, `favorite_track`
- `V2__add_playlist_image_path.sql` - добавляет поле `image_path` в таблицу `playlists`

#### Music Catalog Service:
- `V1__create_music_catalog_tables.sql` - создает таблицы: `artists`, `albums`, `tracks`
- `V2__insert_default_artist_and_album.sql` - вставляет тестовые данные (опционально)
- `V3__add_artwork_paths.sql` - добавляет поля для хранения путей к обложкам
- `V5__add_track_plays.sql` - создает таблицу `track_plays` для статистики проигрываний

#### Notification Service:
- `V3__create_notification_tables.sql` - создает таблицу `notifications`

### 4. Проверка установки

```bash
# Подключитесь к базе данных
psql -U username -d music_prilo_db

# Проверьте существование таблиц
\dt

# Должны быть видны таблицы:
# - users
# - playlists
# - playlist_tracks
# - favorite_track
# - artists
# - albums
# - tracks
# - track_plays
# - notifications
```

## Резервное копирование

### Создание бэкапа:

**Docker:**
```bash
docker exec music_postgres pg_dump -U username -d music_prilo_db -F c -f /tmp/backup.dump
docker cp music_postgres:/tmp/backup.dump ./backup.dump
```

**Локальная PostgreSQL:**
```bash
pg_dump -U username -d music_prilo_db -F c -f backup.dump
```

### Восстановление из бэкапа:

**Docker:**
```bash
docker cp backup.dump music_postgres:/tmp/backup.dump
docker exec music_postgres pg_restore -U username -d music_prilo_db /tmp/backup.dump
```

**Локальная PostgreSQL:**
```bash
pg_restore -U username -d music_prilo_db backup.dump
```

## Устранение проблем

### Ошибка: "контейнер уже существует"
```bash
# Удалите старый контейнер
docker rm music_postgres
# Запустите снова
docker-compose up -d
```

### Ошибка: "порт 5432 уже занят" (уже исправлено в проекте)
Если порт 5432 уже занят локальной установкой PostgreSQL:
```bash
# Проверьте, что использует порт
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # Linux/Mac

# В данном проекте порт уже изменен на 5433 в docker-compose.yml
# И application.properties всех сервисов обновлены соответственно
```

### Ошибка: "права доступа при миграциях"
Если возникают ошибки с правами доступа, проверьте, что init-скрипт выполнился:
```bash
docker exec -it music_postgres psql -U username -d music_prilo_db
\dn  # Показывает схемы
\du  # Показывает пользователей и их права
```

## Миграция на другой сервер

Если нужно перенести БД на другой компьютер:

1. Создайте бэкап (см. выше)
2. Скопируйте файл `backup.dump` на новый сервер
3. Запустите Docker на новом сервере: `docker-compose up -d`
4. Восстановите из бэкапа (см. выше)

