package com.music.musiccatalogservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "tracks")
public class Track {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "album_id")
    private Long albumId;
    
    @Column(name = "artist_id", nullable = false)
    private Long artistId;
    
    @NotBlank
    @Column(nullable = false)
    private String title;
    
    @Column(name = "duration_seconds")
    private Integer durationSeconds;
    
    @Column(name = "file_path", length = 1024)
    private String filePath;
    
    @Column(length = 120)
    private String genre;
    
    @Column(name = "artwork_path", length = 1024)
    private String artworkPath;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "is_new_release", nullable = false)
    private Boolean isNewRelease = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isNewRelease == null) {
            isNewRelease = false;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getAlbumId() {
        return albumId;
    }
    
    public void setAlbumId(Long albumId) {
        this.albumId = albumId;
    }
    
    public Long getArtistId() {
        return artistId;
    }
    
    public void setArtistId(Long artistId) {
        this.artistId = artistId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public Integer getDurationSeconds() {
        return durationSeconds;
    }
    
    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public String getGenre() {
        return genre;
    }
    
    public void setGenre(String genre) {
        this.genre = genre;
    }
    
    public String getArtworkPath() {
        return artworkPath;
    }
    
    public void setArtworkPath(String artworkPath) {
        this.artworkPath = artworkPath;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getIsNewRelease() {
        return isNewRelease != null ? isNewRelease : false;
    }
    
    public void setIsNewRelease(Boolean isNewRelease) {
        this.isNewRelease = isNewRelease != null ? isNewRelease : false;
    }
}
