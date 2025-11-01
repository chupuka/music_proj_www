package com.music.musiccatalogservice.controller;

import com.music.musiccatalogservice.dto.AlbumDTO;
import com.music.musiccatalogservice.service.AlbumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
@Tag(name = "Album Controller", description = "API for managing albums")
public class AlbumController {
    
    @Autowired
    private AlbumService albumService;
    
    @PostMapping
    @Operation(summary = "Create a new album")
    public ResponseEntity<AlbumDTO> createAlbum(@Valid @RequestBody AlbumDTO albumDTO) {
        AlbumDTO createdAlbum = albumService.createAlbum(albumDTO);
        return new ResponseEntity<>(createdAlbum, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all albums")
    public ResponseEntity<List<AlbumDTO>> getAllAlbums() {
        List<AlbumDTO> albums = albumService.getAllAlbums();
        return ResponseEntity.ok(albums);
    }
    
    @GetMapping("/artist/{artistId}")
    @Operation(summary = "Get albums by artist ID")
    public ResponseEntity<List<AlbumDTO>> getAlbumsByArtistId(@PathVariable Long artistId) {
        List<AlbumDTO> albums = albumService.getAlbumsByArtistId(artistId);
        return ResponseEntity.ok(albums);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get album by ID")
    public ResponseEntity<AlbumDTO> getAlbumById(@PathVariable Long id) {
        AlbumDTO album = albumService.getAlbumById(id);
        return ResponseEntity.ok(album);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update album")
    public ResponseEntity<AlbumDTO> updateAlbum(@PathVariable Long id, 
                                                @Valid @RequestBody AlbumDTO albumDTO) {
        AlbumDTO updatedAlbum = albumService.updateAlbum(id, albumDTO);
        return ResponseEntity.ok(updatedAlbum);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete album")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Long id) {
        albumService.deleteAlbum(id);
        return ResponseEntity.noContent().build();
    }
}

