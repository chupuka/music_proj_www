package com.music.userservice.repository;

import com.music.userservice.entity.PlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, PlaylistTrack.PlaylistTrackId> {
    List<PlaylistTrack> findByPlaylistId(Long playlistId);
    
    @Query("SELECT pt.trackId FROM PlaylistTrack pt WHERE pt.playlistId = :playlistId")
    List<Long> findTrackIdsByPlaylistId(@Param("playlistId") Long playlistId);
    
    void deleteByPlaylistId(Long playlistId);
}

