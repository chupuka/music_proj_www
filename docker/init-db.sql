-- Автоматическая настройка прав пользователя при первом запуске PostgreSQL в Docker
-- Этот скрипт выполняется автоматически при создании контейнера
-- Важно: скрипт выполняется от имени суперпользователя postgres

-- Выдаем все необходимые права пользователю username на базе данных
GRANT ALL PRIVILEGES ON DATABASE music_prilo_db TO username;

-- Подключаемся к базе данных music_prilo_db
\c music_prilo_db

-- Выдаем права на схему public
GRANT ALL PRIVILEGES ON SCHEMA public TO username;

-- Настраиваем права по умолчанию для будущих таблиц и последовательностей
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO username;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO username;

-- Делаем пользователя владельцем схемы public (опционально, но рекомендуется)
ALTER SCHEMA public OWNER TO username;

