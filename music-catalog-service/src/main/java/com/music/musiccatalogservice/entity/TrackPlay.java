package com.music.musiccatalogservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "track_plays")
public class TrackPlay {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "track_id", nullable = false)
    private Long trackId;
    
    @Column(name = "played_at", nullable = false, updatable = false)
    private LocalDateTime playedAt;
    
    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getTrackId() {
        return trackId;
    }
    
    public void setTrackId(Long trackId) {
        this.trackId = trackId;
    }
    
    public LocalDateTime getPlayedAt() {
        return playedAt;
    }
    
    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }
}

