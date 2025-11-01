package com.music.userservice.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "playlist_tracks")
@IdClass(PlaylistTrack.PlaylistTrackId.class)
public class PlaylistTrack {
    
    @Id
    @Column(name = "playlist_id")
    private Long playlistId;
    
    @Id
    @Column(name = "track_id")
    private Long trackId;
    
    // Getters and Setters
    public Long getPlaylistId() {
        return playlistId;
    }
    
    public void setPlaylistId(Long playlistId) {
        this.playlistId = playlistId;
    }
    
    public Long getTrackId() {
        return trackId;
    }
    
    public void setTrackId(Long trackId) {
        this.trackId = trackId;
    }
    
    // Composite Key Class
    public static class PlaylistTrackId implements Serializable {
        private Long playlistId;
        private Long trackId;
        
        public PlaylistTrackId() {}
        
        public PlaylistTrackId(Long playlistId, Long trackId) {
            this.playlistId = playlistId;
            this.trackId = trackId;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PlaylistTrackId that = (PlaylistTrackId) o;
            return Objects.equals(playlistId, that.playlistId) &&
                   Objects.equals(trackId, that.trackId);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(playlistId, trackId);
        }
    }
}

