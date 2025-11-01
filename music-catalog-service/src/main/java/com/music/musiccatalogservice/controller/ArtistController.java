package com.music.musiccatalogservice.controller;

import com.music.musiccatalogservice.dto.ArtistDTO;
import com.music.musiccatalogservice.service.ArtistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/artists")
@Tag(name = "Artist Controller", description = "API for managing artists")
public class ArtistController {
    
    @Autowired
    private ArtistService artistService;
    
    @PostMapping
    @Operation(summary = "Create a new artist")
    public ResponseEntity<ArtistDTO> createArtist(@Valid @RequestBody ArtistDTO artistDTO) {
        ArtistDTO createdArtist = artistService.createArtist(artistDTO);
        return new ResponseEntity<>(createdArtist, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all artists")
    public ResponseEntity<List<ArtistDTO>> getAllArtists() {
        List<ArtistDTO> artists = artistService.getAllArtists();
        return ResponseEntity.ok(artists);
    }
    
    @GetMapping("/page")
    @Operation(summary = "Get all artists with pagination")
    public ResponseEntity<Page<ArtistDTO>> getAllArtists(Pageable pageable) {
        Page<ArtistDTO> artists = artistService.getAllArtists(pageable);
        return ResponseEntity.ok(artists);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get artist by ID")
    public ResponseEntity<ArtistDTO> getArtistById(@PathVariable Long id) {
        ArtistDTO artist = artistService.getArtistById(id);
        return ResponseEntity.ok(artist);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update artist")
    public ResponseEntity<ArtistDTO> updateArtist(@PathVariable Long id, 
                                                  @Valid @RequestBody ArtistDTO artistDTO) {
        ArtistDTO updatedArtist = artistService.updateArtist(id, artistDTO);
        return ResponseEntity.ok(updatedArtist);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete artist")
    public ResponseEntity<Void> deleteArtist(@PathVariable Long id) {
        artistService.deleteArtist(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search artists by name")
    public ResponseEntity<List<ArtistDTO>> searchArtists(@RequestParam String query) {
        List<ArtistDTO> artists = artistService.searchArtists(query);
        return ResponseEntity.ok(artists);
    }
}

