package com.music.userservice.service;

import com.music.userservice.dto.PlaylistDTO;
import com.music.userservice.entity.Playlist;
import com.music.userservice.repository.PlaylistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlaylistService {
    
    @Autowired
    private PlaylistRepository playlistRepository;
    
    public PlaylistDTO createPlaylist(PlaylistDTO playlistDTO) {
        Playlist playlist = new Playlist();
        playlist.setUserId(playlistDTO.getUserId());
        playlist.setName(playlistDTO.getName());
        playlist.setDescription(playlistDTO.getDescription());
        playlist.setImagePath(playlistDTO.getImagePath());
        
        Playlist savedPlaylist = playlistRepository.save(playlist);
        return convertToDTO(savedPlaylist);
    }
    
    @Transactional(readOnly = true)
    public List<PlaylistDTO> getAllPlaylists() {
        return playlistRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PlaylistDTO> getPlaylistsByUserId(Long userId) {
        return playlistRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public PlaylistDTO getPlaylistById(Long id) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found with id: " + id));
        return convertToDTO(playlist);
    }
    
    public PlaylistDTO updatePlaylist(Long id, PlaylistDTO playlistDTO) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found with id: " + id));
        
        if (playlistDTO.getName() != null) {
            playlist.setName(playlistDTO.getName());
        }
        if (playlistDTO.getDescription() != null) {
            playlist.setDescription(playlistDTO.getDescription());
        }
        if (playlistDTO.getImagePath() != null) {
            playlist.setImagePath(playlistDTO.getImagePath());
        }
        
        Playlist updatedPlaylist = playlistRepository.save(playlist);
        return convertToDTO(updatedPlaylist);
    }
    
    public void deletePlaylist(Long id) {
        if (!playlistRepository.existsById(id)) {
            throw new RuntimeException("Playlist not found with id: " + id);
        }
        playlistRepository.deleteById(id);
    }
    
    private PlaylistDTO convertToDTO(Playlist playlist) {
        PlaylistDTO dto = new PlaylistDTO();
        dto.setId(playlist.getId());
        dto.setUserId(playlist.getUserId());
        dto.setName(playlist.getName());
        dto.setDescription(playlist.getDescription());
        dto.setImagePath(playlist.getImagePath());
        dto.setCreatedAt(playlist.getCreatedAt());
        return dto;
    }
}

