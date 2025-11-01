package com.music.musiccatalogservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.music.musiccatalogservice.entity.Track;
import com.music.musiccatalogservice.entity.Album;
import com.music.musiccatalogservice.entity.Artist;
import com.music.musiccatalogservice.repository.TrackRepository;
import com.music.musiccatalogservice.repository.AlbumRepository;
import com.music.musiccatalogservice.repository.ArtistRepository;
import com.music.musiccatalogservice.service.AudioDurationService;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;
    
    @Value("${file.upload.tracks.dir:uploads/tracks}")
    private String tracksDir;
    
    @Value("${file.upload.artwork.dir:uploads/artwork}")
    private String artworkDir;
    
    @Autowired
    private TrackRepository trackRepository;
    
    @Autowired
    private AlbumRepository albumRepository;
    
    @Autowired
    private ArtistRepository artistRepository;
    
    @Autowired
    private AudioDurationService audioDurationService;
    
    @Autowired
    private com.music.musiccatalogservice.service.FileDownloadService fileDownloadService;
    
    // Get Track Audio File
    @GetMapping("/tracks/{trackId}")
    public ResponseEntity<Resource> getTrackFile(@PathVariable Long trackId) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            if (track.getFilePath() == null || track.getFilePath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = Paths.get(track.getFilePath());
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath);
            
            // Determine content type based on file extension
            String contentType = "audio/mpeg"; // default to MP3
            String filePathStr = filePath.toString().toLowerCase();
            if (filePathStr.endsWith(".mp3")) {
                contentType = "audio/mpeg";
            } else if (filePathStr.endsWith(".wav")) {
                contentType = "audio/wav";
            } else if (filePathStr.endsWith(".ogg")) {
                contentType = "audio/ogg";
            } else if (filePathStr.endsWith(".m4a")) {
                contentType = "audio/mp4";
            } else if (filePathStr.endsWith(".flac")) {
                contentType = "audio/flac";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + track.getTitle() + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Download Track
    @GetMapping("/tracks/{trackId}/download")
    public ResponseEntity<Resource> downloadTrack(@PathVariable Long trackId) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            if (track.getFilePath() == null || track.getFilePath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = Paths.get(track.getFilePath());
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath);
            String filename = track.getTitle() + ".mp3";
            filename = filename.replaceAll("[^a-zA-Z0-9.-]", "_");
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Upload Track File
    @PostMapping("/tracks/{trackId}/upload")
    public ResponseEntity<String> uploadTrackFile(
            @PathVariable Long trackId,
            @RequestParam("file") MultipartFile file) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            
            // Create directory for track
            Path trackDir = Paths.get(tracksDir, trackId.toString());
            Files.createDirectories(trackDir);
            
            // Save file
            String filename = "track" + extension;
            Path filePath = trackDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update track file path
            track.setFilePath(filePath.toString().replace("\\", "/"));
            
            // Automatically detect audio duration
            try {
                Integer duration = audioDurationService.getDurationSeconds(filePath);
                if (duration != null && duration > 0) {
                    track.setDurationSeconds(duration);
                }
            } catch (Exception e) {
                // Log but don't fail upload if duration detection fails
                System.err.println("Could not detect duration: " + e.getMessage());
            }
            
            trackRepository.save(track);
            
            return ResponseEntity.ok("File uploaded successfully: " + filePath.toString() + 
                (track.getDurationSeconds() != null ? " (Duration: " + track.getDurationSeconds() + "s)" : ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading file: " + e.getMessage());
        }
    }
    
    // Download Track File from URL
    @PostMapping("/tracks/{trackId}/download-from-url")
    public ResponseEntity<String> downloadTrackFromUrl(
            @PathVariable Long trackId,
            @RequestParam("url") String fileUrl) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("URL не может быть пустым");
            }
            
            // Create directory for track
            Path trackDir = Paths.get(tracksDir, trackId.toString());
            Files.createDirectories(trackDir);
            
            // Get file extension from URL
            String extension = fileDownloadService.getFileExtensionFromUrl(fileUrl);
            String filename = "track" + extension;
            Path filePath = trackDir.resolve(filename);
            
            // Download file from URL
            fileDownloadService.downloadFile(fileUrl, filePath);
            
            // Update track file path
            track.setFilePath(filePath.toString().replace("\\", "/"));
            
            // Automatically detect audio duration
            try {
                Integer duration = audioDurationService.getDurationSeconds(filePath);
                if (duration != null && duration > 0) {
                    track.setDurationSeconds(duration);
                }
            } catch (Exception e) {
                // Log but don't fail download if duration detection fails
                System.err.println("Could not detect duration: " + e.getMessage());
            }
            
            trackRepository.save(track);
            
            return ResponseEntity.ok("File downloaded successfully from URL: " + filePath.toString() + 
                (track.getDurationSeconds() != null ? " (Duration: " + track.getDurationSeconds() + "s)" : ""));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading file from URL: " + e.getMessage());
        }
    }
    
    // Get Album Artwork
    @GetMapping("/artwork/albums/{albumId}")
    public ResponseEntity<?> getAlbumArtwork(@PathVariable Long albumId) {
        try {
            Album album = albumRepository.findById(albumId)
                    .orElseThrow(() -> new RuntimeException("Album not found"));
            
            String artworkPath = album.getArtworkPath();
            if (artworkPath == null || artworkPath.isEmpty()) {
                return getDefaultArtwork();
            }
            
            // If it's an HTTP/HTTPS URL, redirect to it
            if (artworkPath.startsWith("http://") || artworkPath.startsWith("https://")) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .header(HttpHeaders.LOCATION, artworkPath)
                        .build();
            }
            
            Path filePath = Paths.get(artworkPath);
            
            if (!Files.exists(filePath)) {
                return getDefaultArtwork();
            }
            
            Resource resource = new FileSystemResource(filePath);
            String contentType = Files.probeContentType(filePath);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                    .body(resource);
        } catch (Exception e) {
            return getDefaultArtwork();
        }
    }
    
    // Upload Album Artwork
    @PostMapping("/artwork/albums/{albumId}/upload")
    public ResponseEntity<String> uploadAlbumArtwork(
            @PathVariable Long albumId,
            @RequestParam("file") MultipartFile file) {
        try {
            Album album = albumRepository.findById(albumId)
                    .orElseThrow(() -> new RuntimeException("Album not found"));
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            
            // Create directory if needed
            Path artworkDirPath = Paths.get(artworkDir, "albums");
            Files.createDirectories(artworkDirPath);
            
            // Save file
            String filename = albumId + extension;
            Path filePath = artworkDirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update album artwork path
            album.setArtworkPath(filePath.toString().replace("\\", "/"));
            albumRepository.save(album);
            
            return ResponseEntity.ok("Artwork uploaded successfully: " + filePath.toString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading artwork: " + e.getMessage());
        }
    }
    
    // Get Artist Image
    @GetMapping("/artwork/artists/{artistId}")
    public ResponseEntity<?> getArtistImage(@PathVariable Long artistId) {
        try {
            Artist artist = artistRepository.findById(artistId)
                    .orElseThrow(() -> new RuntimeException("Artist not found"));
            
            String imagePath = artist.getImagePath();
            if (imagePath == null || imagePath.isEmpty()) {
                return getDefaultArtwork();
            }
            
            // If it's an HTTP/HTTPS URL, redirect to it
            if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .header(HttpHeaders.LOCATION, imagePath)
                        .build();
            }
            
            Path filePath = Paths.get(imagePath);
            
            if (!Files.exists(filePath)) {
                return getDefaultArtwork();
            }
            
            Resource resource = new FileSystemResource(filePath);
            String contentType = Files.probeContentType(filePath);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                    .body(resource);
        } catch (Exception e) {
            return getDefaultArtwork();
        }
    }
    
    // Upload Artist Image
    @PostMapping("/artwork/artists/{artistId}/upload")
    public ResponseEntity<String> uploadArtistImage(
            @PathVariable Long artistId,
            @RequestParam("file") MultipartFile file) {
        try {
            Artist artist = artistRepository.findById(artistId)
                    .orElseThrow(() -> new RuntimeException("Artist not found"));
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            
            // Create directory if needed
            Path artworkDirPath = Paths.get(artworkDir, "artists");
            Files.createDirectories(artworkDirPath);
            
            // Save file
            String filename = artistId + extension;
            Path filePath = artworkDirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update artist image path
            artist.setImagePath(filePath.toString().replace("\\", "/"));
            artistRepository.save(artist);
            
            return ResponseEntity.ok("Image uploaded successfully: " + filePath.toString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading image: " + e.getMessage());
        }
    }
    
    // Get Track Artwork
    @GetMapping("/artwork/tracks/{trackId}")
    public ResponseEntity<?> getTrackArtwork(@PathVariable Long trackId) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            String artworkPath = track.getArtworkPath();
            if (artworkPath != null && !artworkPath.isEmpty()) {
                // If it's an HTTP/HTTPS URL, redirect to it
                if (artworkPath.startsWith("http://") || artworkPath.startsWith("https://")) {
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .header(HttpHeaders.LOCATION, artworkPath)
                            .build();
                }
                
                // Otherwise, try to load as local file
                Path filePath = Paths.get(artworkPath);
                if (Files.exists(filePath)) {
                    Resource resource = new FileSystemResource(filePath);
                    String contentType = Files.probeContentType(filePath);
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                            .body(resource);
                }
            }
            
            // Fallback to album artwork
            if (track.getAlbumId() != null) {
                Album album = albumRepository.findById(track.getAlbumId()).orElse(null);
                if (album != null && album.getArtworkPath() != null && !album.getArtworkPath().isEmpty()) {
                    String albumArtworkPath = album.getArtworkPath();
                    // If it's an HTTP/HTTPS URL, redirect to it
                    if (albumArtworkPath.startsWith("http://") || albumArtworkPath.startsWith("https://")) {
                        return ResponseEntity.status(HttpStatus.FOUND)
                                .header(HttpHeaders.LOCATION, albumArtworkPath)
                                .build();
                    }
                    
                    Path filePath = Paths.get(albumArtworkPath);
                    if (Files.exists(filePath)) {
                        Resource resource = new FileSystemResource(filePath);
                        String contentType = Files.probeContentType(filePath);
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                                .body(resource);
                    }
                }
            }
            
            return getDefaultArtwork();
        } catch (Exception e) {
            return getDefaultArtwork();
        }
    }
    
    // Upload Track Artwork
    @PostMapping("/artwork/tracks/{trackId}/upload")
    public ResponseEntity<String> uploadTrackArtwork(
            @PathVariable Long trackId,
            @RequestParam("file") MultipartFile file) {
        try {
            Track track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new RuntimeException("Track not found"));
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            
            // Create directory if needed
            Path artworkDirPath = Paths.get(artworkDir, "tracks");
            Files.createDirectories(artworkDirPath);
            
            // Save file
            String filename = trackId + extension;
            Path filePath = artworkDirPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update track artwork path
            track.setArtworkPath(filePath.toString().replace("\\", "/"));
            trackRepository.save(track);
            
            return ResponseEntity.ok("Artwork uploaded successfully: " + filePath.toString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading artwork: " + e.getMessage());
        }
    }
    
    private ResponseEntity<Resource> getDefaultArtwork() {
        // Return default placeholder image
        // В реальном приложении можно вернуть статическое изображение
        return ResponseEntity.notFound().build();
    }
}

