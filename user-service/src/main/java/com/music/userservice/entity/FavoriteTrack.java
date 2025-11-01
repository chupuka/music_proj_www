package com.music.userservice.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "favorite_track")
@IdClass(FavoriteTrack.FavoriteTrackId.class)
public class FavoriteTrack {
    
    @Id
    @Column(name = "user_id")
    private Long userId;
    
    @Id
    @Column(name = "track_id")
    private Long trackId;
    
    // Getters and Setters
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getTrackId() {
        return trackId;
    }
    
    public void setTrackId(Long trackId) {
        this.trackId = trackId;
    }
    
    // Composite Key Class
    public static class FavoriteTrackId implements Serializable {
        private Long userId;
        private Long trackId;
        
        public FavoriteTrackId() {}
        
        public FavoriteTrackId(Long userId, Long trackId) {
            this.userId = userId;
            this.trackId = trackId;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            FavoriteTrackId that = (FavoriteTrackId) o;
            return Objects.equals(userId, that.userId) &&
                   Objects.equals(trackId, that.trackId);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(userId, trackId);
        }
    }
}

