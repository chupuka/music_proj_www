package com.music.musiccatalogservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

@Service
public class AudioDurationService {
    
    private static final Logger logger = LoggerFactory.getLogger(AudioDurationService.class);
    
    /**
     * Определяет длительность аудио файла в секундах
     * Использует Java Sound API (встроенный в JDK)
     * Для MP3 файлов требуется MP3SPI провайдер
     * @param filePath путь к аудио файлу
     * @return длительность в секундах или null если не удалось определить
     */
    public Integer getDurationSeconds(Path filePath) {
        try {
            File audioFile = filePath.toFile();
            
            if (!audioFile.exists()) {
                logger.warn("Audio file not found: {}", filePath);
                return null;
            }
            
            // Используем Java Sound API для определения длительности
            AudioFileFormat fileFormat;
            try {
                fileFormat = AudioSystem.getAudioFileFormat(audioFile);
            } catch (UnsupportedAudioFileException e) {
                logger.warn("Unsupported audio file format: {}. Error: {}", filePath, e.getMessage());
                return null;
            }
            
            // Получаем свойства файла
            Map<String, Object> properties = fileFormat.properties();
            
            // Пытаемся получить длительность из свойств
            Object durationObj = properties.get("duration");
            if (durationObj instanceof Long) {
                Long duration = (Long) durationObj;
                // duration в микросекундах, конвертируем в секунды
                int durationSeconds = (int) (duration / 1_000_000);
                if (durationSeconds > 0) {
                    logger.info("Detected duration for {}: {} seconds (from properties)", filePath, durationSeconds);
                    return durationSeconds;
                }
            }
            
            // Альтернативный метод: используем frameLength и frameRate
            long frames = fileFormat.getFrameLength();
            if (frames > 0 && frames != Long.MAX_VALUE) {
                float frameRate = fileFormat.getFormat().getFrameRate();
                if (frameRate > 0 && !Float.isNaN(frameRate) && !Float.isInfinite(frameRate)) {
                    int durationSeconds = (int) (frames / frameRate);
                    if (durationSeconds > 0) {
                        logger.info("Detected duration for {}: {} seconds (from frames)", filePath, durationSeconds);
                        return durationSeconds;
                    }
                }
            }
            
            logger.warn("Could not determine duration for file: {} - properties or frames not available", filePath);
            return null;
            
        } catch (IOException e) {
            logger.warn("IO error reading audio file: {}. Error: {}", filePath, e.getMessage());
            return null;
        } catch (Exception e) {
            logger.warn("Unexpected error reading audio duration: {}. Error: {}", filePath, e.getMessage());
            return null;
        }
    }
    
    /**
     * Определяет длительность аудио файла в секундах
     * @param filePath путь к аудио файлу как строка
     * @return длительность в секундах или null если не удалось определить
     */
    public Integer getDurationSeconds(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        return getDurationSeconds(java.nio.file.Paths.get(filePath));
    }
}
