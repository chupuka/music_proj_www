-- Automatic user rights configuration on first PostgreSQL startup in Docker
-- This script runs automatically when the container is created
-- Important: script runs as superuser (POSTGRES_USER from environment variables)

-- Ensure the password is set for user username
-- This guarantees the password is set correctly even if environment variables don't work
ALTER USER username WITH PASSWORD 'durak123' LOGIN SUPERUSER CREATEDB CREATEROLE;

-- Grant all necessary privileges to user username on the database
GRANT ALL PRIVILEGES ON DATABASE music_prilo_db TO username;
