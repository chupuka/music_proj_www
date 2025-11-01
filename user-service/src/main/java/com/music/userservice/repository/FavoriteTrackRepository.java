package com.music.userservice.repository;

import com.music.userservice.entity.FavoriteTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteTrackRepository extends JpaRepository<FavoriteTrack, FavoriteTrack.FavoriteTrackId> {
    List<FavoriteTrack> findByUserId(Long userId);
    
    @Query("SELECT ft.trackId FROM FavoriteTrack ft WHERE ft.userId = :userId")
    List<Long> findTrackIdsByUserId(@Param("userId") Long userId);
    
    boolean existsByUserIdAndTrackId(Long userId, Long trackId);
    
    void deleteByUserIdAndTrackId(Long userId, Long trackId);
}

