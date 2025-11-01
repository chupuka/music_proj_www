package com.music.musiccatalogservice.service;

import com.music.musiccatalogservice.dto.ArtistDTO;
import com.music.musiccatalogservice.entity.Artist;
import com.music.musiccatalogservice.repository.ArtistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ArtistService {
    
    @Autowired
    private ArtistRepository artistRepository;
    
    public ArtistDTO createArtist(ArtistDTO artistDTO) {
        Artist artist = new Artist();
        artist.setName(artistDTO.getName());
        artist.setDescription(artistDTO.getDescription());
        artist.setImagePath(artistDTO.getImagePath());
        
        Artist savedArtist = artistRepository.save(artist);
        return convertToDTO(savedArtist);
    }
    
    @Transactional(readOnly = true)
    public List<ArtistDTO> getAllArtists() {
        return artistRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<ArtistDTO> getAllArtists(Pageable pageable) {
        return artistRepository.findAll(pageable)
                .map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public ArtistDTO getArtistById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));
        return convertToDTO(artist);
    }
    
    public ArtistDTO updateArtist(Long id, ArtistDTO artistDTO) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));
        
        if (artistDTO.getName() != null) {
            artist.setName(artistDTO.getName());
        }
        if (artistDTO.getDescription() != null) {
            artist.setDescription(artistDTO.getDescription());
        }
        if (artistDTO.getImagePath() != null) {
            artist.setImagePath(artistDTO.getImagePath());
        }
        
        Artist updatedArtist = artistRepository.save(artist);
        return convertToDTO(updatedArtist);
    }
    
    public void deleteArtist(Long id) {
        if (!artistRepository.existsById(id)) {
            throw new RuntimeException("Artist not found with id: " + id);
        }
        artistRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<ArtistDTO> searchArtists(String query) {
        return artistRepository.findByNameContainingIgnoreCase(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private ArtistDTO convertToDTO(Artist artist) {
        ArtistDTO dto = new ArtistDTO();
        dto.setId(artist.getId());
        dto.setName(artist.getName());
        dto.setDescription(artist.getDescription());
        dto.setImagePath(artist.getImagePath());
        dto.setCreatedAt(artist.getCreatedAt());
        return dto;
    }
}

