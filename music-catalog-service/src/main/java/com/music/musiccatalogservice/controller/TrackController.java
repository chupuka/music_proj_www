package com.music.musiccatalogservice.controller;

import com.music.musiccatalogservice.dto.TrackDTO;
import com.music.musiccatalogservice.service.TrackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracks")
@Tag(name = "Track Controller", description = "API for managing tracks")
public class TrackController {
    
    @Autowired
    private TrackService trackService;
    
    @Autowired
    private com.music.musiccatalogservice.service.TrackPlayService trackPlayService;
    
    @PostMapping
    @Operation(summary = "Create a new track")
    public ResponseEntity<TrackDTO> createTrack(@Valid @RequestBody TrackDTO trackDTO) {
        TrackDTO createdTrack = trackService.createTrack(trackDTO);
        return new ResponseEntity<>(createdTrack, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all tracks")
    public ResponseEntity<List<TrackDTO>> getAllTracks() {
        List<TrackDTO> tracks = trackService.getAllTracks();
        return ResponseEntity.ok(tracks);
    }
    
    @GetMapping("/artist/{artistId}")
    @Operation(summary = "Get tracks by artist ID")
    public ResponseEntity<List<TrackDTO>> getTracksByArtistId(@PathVariable Long artistId) {
        List<TrackDTO> tracks = trackService.getTracksByArtistId(artistId);
        return ResponseEntity.ok(tracks);
    }
    
    @GetMapping("/album/{albumId}")
    @Operation(summary = "Get tracks by album ID")
    public ResponseEntity<List<TrackDTO>> getTracksByAlbumId(@PathVariable Long albumId) {
        List<TrackDTO> tracks = trackService.getTracksByAlbumId(albumId);
        return ResponseEntity.ok(tracks);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get track by ID")
    public ResponseEntity<TrackDTO> getTrackById(@PathVariable Long id) {
        TrackDTO track = trackService.getTrackById(id);
        return ResponseEntity.ok(track);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update track")
    public ResponseEntity<TrackDTO> updateTrack(@PathVariable Long id, 
                                                @Valid @RequestBody TrackDTO trackDTO) {
        TrackDTO updatedTrack = trackService.updateTrack(id, trackDTO);
        return ResponseEntity.ok(updatedTrack);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete track")
    public ResponseEntity<Void> deleteTrack(@PathVariable Long id) {
        trackService.deleteTrack(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/play")
    @Operation(summary = "Record a track play")
    public ResponseEntity<Void> recordPlay(@PathVariable Long id) {
        trackPlayService.recordPlay(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search tracks by title")
    public ResponseEntity<List<TrackDTO>> searchTracks(@RequestParam String query) {
        List<TrackDTO> tracks = trackService.searchTracks(query);
        return ResponseEntity.ok(tracks);
    }
}

