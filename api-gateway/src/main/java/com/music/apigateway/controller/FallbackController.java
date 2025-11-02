package com.music.apigateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {
    
    @RequestMapping(value = "/user-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> userServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "User Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/playlist-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> playlistServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Playlist Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/artist-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> artistServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Artist Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/album-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> albumServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Album Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/track-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> trackServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Track Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/notification-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> notificationServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/favorite-tracks", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> favoriteTracksFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Favorite Tracks Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/favorite-artists", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> favoriteArtistsFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Favorite Artists Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/files-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> filesServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Files Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/analytics-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> analyticsServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Analytics Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/recommendation-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> recommendationServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Recommendation Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/search-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> searchServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Search Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
    
    @RequestMapping(value = "/social-service", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Map<String, String>> socialServiceFallback() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Social Service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
}
