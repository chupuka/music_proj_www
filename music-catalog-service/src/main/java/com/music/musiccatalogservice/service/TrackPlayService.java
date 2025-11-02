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

    public void setPlayCounts(Long trackId, Long playCountAll, Long playCountMonth, Long playCountWeek, Long playCountDay) {
        // Валидация входных данных
        if (trackId == null) {
            throw new IllegalArgumentException("Track ID cannot be null");
        }
        
        // Обработка null значений
        if (playCountAll == null) playCountAll = 0L;
        if (playCountMonth == null) playCountMonth = 0L;
        if (playCountWeek == null) playCountWeek = 0L;
        if (playCountDay == null) playCountDay = 0L;
        
        // Убедимся, что значения не отрицательные
        playCountAll = Math.max(0, playCountAll);
        playCountMonth = Math.max(0, playCountMonth);
        playCountWeek = Math.max(0, playCountWeek);
        playCountDay = Math.max(0, playCountDay);
        
        // Убедимся, что общее количество >= других значений
        playCountAll = Math.max(playCountAll, Math.max(playCountMonth, Math.max(playCountWeek, playCountDay)));
        
        // Удаляем все существующие записи для этого трека
        trackPlayRepository.deleteByTrackId(trackId);
        
        // Если все значения 0, просто выходим
        if (playCountAll == 0) {
            return;
        }
        
        LocalDateTime now = LocalDateTime.now();
        java.util.List<TrackPlay> trackPlays = new java.util.ArrayList<>();
        
        // Определяем границы для разных периодов
        long oldCount = playCountAll - playCountMonth; // Записи старше месяца
        long monthCount = playCountMonth - playCountWeek; // Записи за месяц, но старше недели
        long weekCount = playCountWeek - playCountDay; // Записи за неделю, но старше дня
        long dayCount = playCountDay; // Записи за день
        
        // Создаем записи для периода старше месяца
        for (long i = 0; i < oldCount; i++) {
            TrackPlay trackPlay = new TrackPlay();
            trackPlay.setTrackId(trackId);
            trackPlay.setPlayedAt(now.minusMonths(2).minusDays(i));
            trackPlays.add(trackPlay);
        }
        
        // Создаем записи за месяц (но старше недели)
        for (long i = 0; i < monthCount; i++) {
            TrackPlay trackPlay = new TrackPlay();
            trackPlay.setTrackId(trackId);
            trackPlay.setPlayedAt(now.minusWeeks(2).minusDays(i));
            trackPlays.add(trackPlay);
        }
        
        // Создаем записи за неделю (но старше дня)
        for (long i = 0; i < weekCount; i++) {
            TrackPlay trackPlay = new TrackPlay();
            trackPlay.setTrackId(trackId);
            trackPlay.setPlayedAt(now.minusDays(2).minusHours((int)i));
            trackPlays.add(trackPlay);
        }
        
        // Создаем записи за день
        for (long i = 0; i < dayCount; i++) {
            TrackPlay trackPlay = new TrackPlay();
            trackPlay.setTrackId(trackId);
            trackPlay.setPlayedAt(now.minusHours(1).minusMinutes((int)i));
            trackPlays.add(trackPlay);
        }
        
        // Batch save для оптимизации
        trackPlayRepository.saveAll(trackPlays);
    }
}
