package com.music.userservice.controller;

import com.music.userservice.entity.FavoriteTrack;
import com.music.userservice.repository.FavoriteTrackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorite-tracks")
public class FavoriteTrackController {
    
    @Autowired
    private FavoriteTrackRepository favoriteTrackRepository;
    
    @PostMapping
    public ResponseEntity<FavoriteTrack> addFavoriteTrack(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long trackId = request.get("trackId");
        
        FavoriteTrack favoriteTrack = new FavoriteTrack();
        favoriteTrack.setUserId(userId);
        favoriteTrack.setTrackId(trackId);
        
        FavoriteTrack saved = favoriteTrackRepository.save(favoriteTrack);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Long>> getFavoriteTrackIdsByUserId(@PathVariable Long userId) {
        List<Long> trackIds = favoriteTrackRepository.findTrackIdsByUserId(userId);
        return ResponseEntity.ok(trackIds);
    }
    
    @GetMapping("/user/{userId}/track/{trackId}")
    public ResponseEntity<Boolean> isFavorite(@PathVariable Long userId, @PathVariable Long trackId) {
        boolean exists = favoriteTrackRepository.existsByUserIdAndTrackId(userId, trackId);
        return ResponseEntity.ok(exists);
    }
    
    @DeleteMapping("/user/{userId}/track/{trackId}")
    @Transactional
    public ResponseEntity<Void> removeFavoriteTrack(@PathVariable Long userId, 
                                                    @PathVariable Long trackId) {
        favoriteTrackRepository.deleteByUserIdAndTrackId(userId, trackId);
        return ResponseEntity.noContent().build();
    }
}

