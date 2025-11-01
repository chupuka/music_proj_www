-- Таблица для записи проигрываний треков
CREATE TABLE IF NOT EXISTS track_plays (
    id         BIGSERIAL PRIMARY KEY,
    track_id   BIGINT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_plays_track ON track_plays(track_id);
CREATE INDEX IF NOT EXISTS idx_track_plays_date ON track_plays(played_at);

