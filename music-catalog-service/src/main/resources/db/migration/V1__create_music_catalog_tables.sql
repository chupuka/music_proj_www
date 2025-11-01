-- ===== music-catalog-service =====

CREATE TABLE IF NOT EXISTS artists (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albums (
    id         BIGSERIAL PRIMARY KEY,
    artist_id  BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    release_year INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
    id         BIGSERIAL PRIMARY KEY,
    album_id   BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    artist_id  BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    duration_seconds INT,
    file_path  VARCHAR(1024),
    genre      VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album  ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title  ON tracks(title);

