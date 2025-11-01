-- Добавление полей для хранения путей к обложкам

-- Добавить поле для обложки альбома (если еще нет)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'albums' 
        AND column_name = 'artwork_path'
    ) THEN
        ALTER TABLE albums ADD COLUMN artwork_path VARCHAR(1024);
    END IF;
END $$;

-- Добавить поле для изображения артиста (если еще нет)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'artists' 
        AND column_name = 'image_path'
    ) THEN
        ALTER TABLE artists ADD COLUMN image_path VARCHAR(1024);
    END IF;
END $$;

-- Добавить поле для обложки трека (если еще нет)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'artwork_path'
    ) THEN
        ALTER TABLE tracks ADD COLUMN artwork_path VARCHAR(1024);
    END IF;
END $$;

