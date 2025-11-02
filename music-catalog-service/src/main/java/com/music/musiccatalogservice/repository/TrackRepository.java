package com.music.musiccatalogservice.repository;

import com.music.musiccatalogservice.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long> {
    List<Track> findByArtistId(Long artistId);
    List<Track> findByAlbumId(Long albumId);
    List<Track> findByTitleContainingIgnoreCase(String title);
    List<Track> findByGenre(String genre);
    List<Track> findByIsNewReleaseTrue();
    List<Track> findByIsNewReleaseTrueOrderByCreatedAtDesc();
}
