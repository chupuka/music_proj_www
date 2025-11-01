-- Опционально: дефолтный артист/альбом для загрузок,
-- чтобы можно было сразу регистрировать загруженные треки

INSERT INTO artists (id, name) VALUES (1, 'Uploads')
ON CONFLICT (id) DO NOTHING;

INSERT INTO albums (id, artist_id, title, release_year)
VALUES (1, 1, 'Uploads', NULL)
ON CONFLICT (id) DO NOTHING;

