package com.music.musiccatalogservice.repository;

import com.music.musiccatalogservice.entity.TrackPlay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrackPlayRepository extends JpaRepository<TrackPlay, Long> {
    
    @Query("SELECT COUNT(tp) FROM TrackPlay tp WHERE tp.trackId = :trackId")
    Long countByTrackId(@Param("trackId") Long trackId);
    
    @Query("SELECT COUNT(tp) FROM TrackPlay tp WHERE tp.trackId = :trackId AND tp.playedAt >= :since")
    Long countByTrackIdAndPlayedAtAfter(@Param("trackId") Long trackId, @Param("since") LocalDateTime since);
    
    List<TrackPlay> findByTrackId(Long trackId);
}

