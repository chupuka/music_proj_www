package com.music.musiccatalogservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class FileDownloadService {
    
    private static final Logger logger = LoggerFactory.getLogger(FileDownloadService.class);
    
    private static final int CONNECT_TIMEOUT = 30000; // 30 seconds
    private static final int READ_TIMEOUT = 60000; // 60 seconds
    private static final int MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    
    /**
     * Скачивает файл по URL и сохраняет его локально
     * @param fileUrl URL файла для скачивания
     * @param destinationPath путь, куда сохранить файл
     * @return true если файл успешно скачан, false в противном случае
     * @throws Exception если произошла ошибка при скачивании
     */
    public boolean downloadFile(String fileUrl, Path destinationPath) throws Exception {
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("URL не может быть пустым");
        }
        
        if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
            throw new IllegalArgumentException("URL должен начинаться с http:// или https://");
        }
        
        logger.info("Downloading file from URL: {}", fileUrl);
        
        HttpURLConnection connection = null;
        InputStream inputStream = null;
        
        try {
            URL url = new URL(fileUrl);
            connection = (HttpURLConnection) url.openConnection();
            
            // Настройка соединения
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(CONNECT_TIMEOUT);
            connection.setReadTimeout(READ_TIMEOUT);
            connection.setInstanceFollowRedirects(true);
            
            // Устанавливаем User-Agent для совместимости с некоторыми серверами
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            
            // Проверяем размер файла
            long contentLength = connection.getContentLengthLong();
            if (contentLength > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Файл слишком большой (максимум 100 MB)");
            }
            
            // Проверяем Content-Type
            String contentType = connection.getContentType();
            if (contentType != null && !isAudioFile(contentType)) {
                logger.warn("Content-Type не является аудио файлом: {}", contentType);
                // Не блокируем загрузку, но предупреждаем
            }
            
            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new Exception("HTTP ошибка: " + responseCode + " - " + connection.getResponseMessage());
            }
            
            // Создаем директорию если нужно
            Files.createDirectories(destinationPath.getParent());
            
            // Скачиваем файл
            inputStream = connection.getInputStream();
            Files.copy(inputStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);
            
            logger.info("File successfully downloaded to: {}", destinationPath);
            return true;
            
        } catch (Exception e) {
            logger.error("Error downloading file from URL: {}", fileUrl, e);
            throw e;
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (Exception e) {
                    logger.warn("Error closing input stream", e);
                }
            }
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    /**
     * Проверяет, является ли Content-Type аудио файлом
     */
    private boolean isAudioFile(String contentType) {
        if (contentType == null) {
            return false;
        }
        String lowerContentType = contentType.toLowerCase();
        return lowerContentType.startsWith("audio/") ||
               lowerContentType.contains("audio") ||
               lowerContentType.contains("mp3") ||
               lowerContentType.contains("wav") ||
               lowerContentType.contains("ogg") ||
               lowerContentType.contains("flac") ||
               lowerContentType.contains("m4a");
    }
    
    /**
     * Получает расширение файла из URL
     */
    public String getFileExtensionFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return ".mp3"; // По умолчанию
        }
        
        try {
            // Убираем query параметры
            String urlWithoutQuery = fileUrl.split("\\?")[0];
            
            // Получаем расширение из имени файла
            int lastDot = urlWithoutQuery.lastIndexOf('.');
            int lastSlash = Math.max(urlWithoutQuery.lastIndexOf('/'), urlWithoutQuery.lastIndexOf('\\'));
            
            if (lastDot > lastSlash && lastDot < urlWithoutQuery.length() - 1) {
                String extension = urlWithoutQuery.substring(lastDot).toLowerCase();
                // Проверяем что расширение валидное
                if (extension.matches("\\.(mp3|wav|ogg|flac|m4a|aac|wma)$")) {
                    return extension;
                }
            }
        } catch (Exception e) {
            logger.warn("Could not extract extension from URL: {}", fileUrl, e);
        }
        
        return ".mp3"; // По умолчанию
    }
}
