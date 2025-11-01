package com.music.musiccatalogservice.dto;

import java.time.LocalDateTime;

public class TrackDTO {
    private Long id;
    private Long albumId;
    private Long artistId;
    private String title;
    private Integer durationSeconds;
    private String filePath;
    private String genre;
    private String artworkPath;
    private LocalDateTime createdAt;
    private Long playCountDay;
    private Long playCountWeek;
    private Long playCountMonth;
    private Long playCountAll;
    
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
    
    public Long getPlayCountDay() {
        return playCountDay;
    }
    
    public void setPlayCountDay(Long playCountDay) {
        this.playCountDay = playCountDay;
    }
    
    public Long getPlayCountWeek() {
        return playCountWeek;
    }
    
    public void setPlayCountWeek(Long playCountWeek) {
        this.playCountWeek = playCountWeek;
    }
    
    public Long getPlayCountMonth() {
        return playCountMonth;
    }
    
    public void setPlayCountMonth(Long playCountMonth) {
        this.playCountMonth = playCountMonth;
    }
    
    public Long getPlayCountAll() {
        return playCountAll;
    }
    
    public void setPlayCountAll(Long playCountAll) {
        this.playCountAll = playCountAll;
    }
}

