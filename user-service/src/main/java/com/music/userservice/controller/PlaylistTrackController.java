package com.music.userservice.controller;

import com.music.userservice.entity.PlaylistTrack;
import com.music.userservice.repository.PlaylistTrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlist-tracks")
public class PlaylistTrackController {
    
    @Autowired
    private PlaylistTrackRepository playlistTrackRepository;
    
    @PostMapping
    public ResponseEntity<PlaylistTrack> addTrackToPlaylist(@RequestBody Map<String, Long> request) {
        Long playlistId = request.get("playlistId");
        Long trackId = request.get("trackId");
        
        PlaylistTrack playlistTrack = new PlaylistTrack();
        playlistTrack.setPlaylistId(playlistId);
        playlistTrack.setTrackId(trackId);
        
        PlaylistTrack saved = playlistTrackRepository.save(playlistTrack);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
    
    @GetMapping("/playlist/{playlistId}")
    public ResponseEntity<List<Long>> getTrackIdsByPlaylistId(@PathVariable Long playlistId) {
        List<Long> trackIds = playlistTrackRepository.findTrackIdsByPlaylistId(playlistId);
        return ResponseEntity.ok(trackIds);
    }
    
    @DeleteMapping("/playlist/{playlistId}/track/{trackId}")
    public ResponseEntity<Void> removeTrackFromPlaylist(@PathVariable Long playlistId, 
                                                        @PathVariable Long trackId) {
        PlaylistTrack.PlaylistTrackId id = new PlaylistTrack.PlaylistTrackId(playlistId, trackId);
        playlistTrackRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/playlist/{playlistId}")
    public ResponseEntity<Void> deleteAllTracksFromPlaylist(@PathVariable Long playlistId) {
        playlistTrackRepository.deleteByPlaylistId(playlistId);
        return ResponseEntity.noContent().build();
    }
}

