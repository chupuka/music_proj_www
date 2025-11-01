package com.music.musiccatalogservice.service;

import com.music.musiccatalogservice.entity.TrackPlay;
import com.music.musiccatalogservice.repository.TrackPlayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TrackPlayService {
    
    @Autowired
    private TrackPlayRepository trackPlayRepository;
    
    public void recordPlay(Long trackId) {
        TrackPlay trackPlay = new TrackPlay();
        trackPlay.setTrackId(trackId);
        trackPlayRepository.save(trackPlay);
    }
    
    @Transactional(readOnly = true)
    public Long getPlayCount(Long trackId) {
        return trackPlayRepository.countByTrackId(trackId);
    }
    
    @Transactional(readOnly = true)
    public Long getPlayCountSince(Long trackId, LocalDateTime since) {
        return trackPlayRepository.countByTrackIdAndPlayedAtAfter(trackId, since);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Long> getPlayCounts(Long trackId) {
        Map<String, Long> counts = new HashMap<>();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayAgo = now.minusDays(1);
        LocalDateTime weekAgo = now.minusWeeks(1);
        LocalDateTime monthAgo = now.minusMonths(1);
        
        counts.put("all", getPlayCount(trackId));
        counts.put("day", getPlayCountSince(trackId, dayAgo));
        counts.put("week", getPlayCountSince(trackId, weekAgo));
        counts.put("month", getPlayCountSince(trackId, monthAgo));
        
        return counts;
    }
}

