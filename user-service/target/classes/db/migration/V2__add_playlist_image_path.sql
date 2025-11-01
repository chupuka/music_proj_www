-- Добавляем поле image_path для плейлистов
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        AND column_name = 'image_path'
    ) THEN
        ALTER TABLE playlists ADD COLUMN image_path VARCHAR(1024);
    END IF;
END $$;

