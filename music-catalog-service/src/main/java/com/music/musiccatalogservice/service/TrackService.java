package com.music.musiccatalogservice.service;

import com.music.musiccatalogservice.dto.TrackDTO;
import com.music.musiccatalogservice.entity.Track;
import com.music.musiccatalogservice.repository.TrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrackService {
    
    @Autowired
    private TrackRepository trackRepository;
    
    @Autowired
    private TrackPlayService trackPlayService;
    
    public TrackDTO createTrack(TrackDTO trackDTO) {
        Track track = new Track();
        track.setAlbumId(trackDTO.getAlbumId());
        track.setArtistId(trackDTO.getArtistId());
        track.setTitle(trackDTO.getTitle());
        track.setDurationSeconds(trackDTO.getDurationSeconds());
        track.setFilePath(trackDTO.getFilePath());
        track.setGenre(trackDTO.getGenre());
        track.setArtworkPath(trackDTO.getArtworkPath());
        track.setIsNewRelease(trackDTO.getIsNewRelease());
        
        Track savedTrack = trackRepository.save(track);
        return convertToDTO(savedTrack);
    }
    
    @Transactional(readOnly = true)
    public List<TrackDTO> getAllTracks() {
        return trackRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TrackDTO> getTracksByArtistId(Long artistId) {
        return trackRepository.findByArtistId(artistId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TrackDTO> getTracksByAlbumId(Long albumId) {
        return trackRepository.findByAlbumId(albumId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public TrackDTO getTrackById(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found with id: " + id));
        return convertToDTO(track);
    }
    
    public TrackDTO updateTrack(Long id, TrackDTO trackDTO) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Track not found with id: " + id));
        
        if (trackDTO.getTitle() != null) {
            track.setTitle(trackDTO.getTitle());
        }
        if (trackDTO.getArtistId() != null) {
            track.setArtistId(trackDTO.getArtistId());
        }
        if (trackDTO.getAlbumId() != null) {
            track.setAlbumId(trackDTO.getAlbumId());
        }
        if (trackDTO.getDurationSeconds() != null) {
            track.setDurationSeconds(trackDTO.getDurationSeconds());
        }
        if (trackDTO.getFilePath() != null) {
            track.setFilePath(trackDTO.getFilePath());
        }
        if (trackDTO.getGenre() != null) {
            track.setGenre(trackDTO.getGenre());
        }
        if (trackDTO.getArtworkPath() != null) {
            track.setArtworkPath(trackDTO.getArtworkPath());
        }
        if (trackDTO.getIsNewRelease() != null) {
            track.setIsNewRelease(trackDTO.getIsNewRelease());
        }
        
        Track updatedTrack = trackRepository.save(track);
        return convertToDTO(updatedTrack);
    }
    
    public void deleteTrack(Long id) {
        if (!trackRepository.existsById(id)) {
            throw new RuntimeException("Track not found with id: " + id);
        }
        trackRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<TrackDTO> searchTracks(String query) {
        return trackRepository.findByTitleContainingIgnoreCase(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TrackDTO> getNewReleaseTracks() {
        return trackRepository.findByIsNewReleaseTrueOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private TrackDTO convertToDTO(Track track) {
        TrackDTO dto = new TrackDTO();
        dto.setId(track.getId());
        dto.setAlbumId(track.getAlbumId());
        dto.setArtistId(track.getArtistId());
        dto.setTitle(track.getTitle());
        dto.setDurationSeconds(track.getDurationSeconds());
        dto.setFilePath(track.getFilePath());
        dto.setGenre(track.getGenre());
        dto.setArtworkPath(track.getArtworkPath());
        dto.setCreatedAt(track.getCreatedAt());
        dto.setIsNewRelease(track.getIsNewRelease());
        
        // Get play counts
        Map<String, Long> counts = trackPlayService.getPlayCounts(track.getId());
        dto.setPlayCountDay(counts.get("day"));
        dto.setPlayCountWeek(counts.get("week"));
        dto.setPlayCountMonth(counts.get("month"));
        dto.setPlayCountAll(counts.get("all"));
        
        return dto;
    }
}
