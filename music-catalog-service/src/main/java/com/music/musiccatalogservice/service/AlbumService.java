package com.music.musiccatalogservice.service;

import com.music.musiccatalogservice.dto.AlbumDTO;
import com.music.musiccatalogservice.entity.Album;
import com.music.musiccatalogservice.repository.AlbumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AlbumService {
    
    @Autowired
    private AlbumRepository albumRepository;
    
    public AlbumDTO createAlbum(AlbumDTO albumDTO) {
        Album album = new Album();
        album.setArtistId(albumDTO.getArtistId());
        album.setTitle(albumDTO.getTitle());
        album.setReleaseYear(albumDTO.getReleaseYear());
        album.setArtworkPath(albumDTO.getArtworkPath());
        
        Album savedAlbum = albumRepository.save(album);
        return convertToDTO(savedAlbum);
    }
    
    @Transactional(readOnly = true)
    public List<AlbumDTO> getAllAlbums() {
        return albumRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AlbumDTO> getAlbumsByArtistId(Long artistId) {
        return albumRepository.findByArtistId(artistId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public AlbumDTO getAlbumById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));
        return convertToDTO(album);
    }
    
    public AlbumDTO updateAlbum(Long id, AlbumDTO albumDTO) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));
        
        if (albumDTO.getTitle() != null) {
            album.setTitle(albumDTO.getTitle());
        }
        if (albumDTO.getArtistId() != null) {
            album.setArtistId(albumDTO.getArtistId());
        }
        if (albumDTO.getReleaseYear() != null) {
            album.setReleaseYear(albumDTO.getReleaseYear());
        }
        if (albumDTO.getArtworkPath() != null) {
            album.setArtworkPath(albumDTO.getArtworkPath());
        }
        
        Album updatedAlbum = albumRepository.save(album);
        return convertToDTO(updatedAlbum);
    }
    
    public void deleteAlbum(Long id) {
        if (!albumRepository.existsById(id)) {
            throw new RuntimeException("Album not found with id: " + id);
        }
        albumRepository.deleteById(id);
    }
    
    private AlbumDTO convertToDTO(Album album) {
        AlbumDTO dto = new AlbumDTO();
        dto.setId(album.getId());
        dto.setArtistId(album.getArtistId());
        dto.setTitle(album.getTitle());
        dto.setReleaseYear(album.getReleaseYear());
        dto.setArtworkPath(album.getArtworkPath());
        dto.setCreatedAt(album.getCreatedAt());
        return dto;
    }
}

