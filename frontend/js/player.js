// Audio Player State
let currentTrack = null;
let currentTrackIndex = -1;
let playlist = [];
let isPlaying = false;
let isShuffled = false;
let isRepeated = false;
let volume = 1.0;
let isMuted = false;

// Get API base URL
const API_BASE_URL_PLAYER = window.API_BASE_URL || 'http://localhost:8080';

// DOM Elements
const audioPlayer = document.getElementById('audioPlayerContainer');
const audioElement = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
const volumeSlider = document.getElementById('volumeSlider');
const volumeFill = document.getElementById('volumeFill');
const playerTrackTitle = document.getElementById('playerTrackTitle');
const playerTrackArtist = document.getElementById('playerTrackArtist');
const playerArtwork = document.getElementById('playerArtwork');
const repeatBtn = document.getElementById('repeatBtn');
const shuffleBtn = document.getElementById('shuffleBtn');

// Initialize Player
document.addEventListener('DOMContentLoaded', () => {
    initializePlayer();
    restorePlayerState();
});

function initializePlayer() {
    // Audio events
    audioElement.addEventListener('loadedmetadata', updateTotalTime);
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', onTrackEnd);
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
        // Notify app.js to update play buttons
        if (window.updatePlayButtons && typeof window.updatePlayButtons === 'function') {
            setTimeout(() => window.updatePlayButtons(), 50);
        }
    });
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
        // Notify app.js to update play buttons
        if (window.updatePlayButtons && typeof window.updatePlayButtons === 'function') {
            setTimeout(() => window.updatePlayButtons(), 50);
        }
    });
    
    // Volume
    audioElement.volume = volume;
    updateVolumeDisplay();
    
    // Progress bar drag - improved interaction
    let isDragging = false;
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        progressBar.classList.add('dragging');
        seek(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            seek(e);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            progressBar.classList.remove('dragging');
        }
    });
    
    // Also handle touch events for mobile
    progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        progressBar.classList.add('dragging');
        const touch = e.touches[0];
        const rect = progressBar.getBoundingClientRect();
        const clickX = touch.clientX - rect.left;
        seek({ clientX: touch.clientX, currentTarget: progressBar });
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            const rect = progressBar.getBoundingClientRect();
            seek({ clientX: touch.clientX, currentTarget: progressBar });
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            progressBar.classList.remove('dragging');
        }
    });
}

// Get current track info
function getCurrentTrackInfo() {
    return {
        track: currentTrack,
        trackId: currentTrack ? currentTrack.id : null,
        isPlaying: isPlaying
    };
}

// Play Track (with pause logic if already playing)
async function playTrack(trackId) {
    console.log('[PLAYER] playTrack called with trackId:', trackId);
    console.log('[PLAYER] Current track:', currentTrack?.id, 'isPlaying:', isPlaying);
    
    // If the same track is already playing, toggle pause/play
    if (currentTrack && currentTrack.id === trackId && isPlaying) {
        console.log('[PLAYER] Same track playing, toggling pause');
        togglePlayPause();
        return;
    }
    
    // If the same track is paused, resume it (preserve current time)
    if (currentTrack && currentTrack.id === trackId && !isPlaying) {
        console.log('[PLAYER] Same track paused, resuming');
        // Resume from where it was paused, don't reset
        isPlaying = true;
        audioElement.play().catch(err => {
            console.error('[PLAYER] Error resuming playback:', err);
            isPlaying = false;
        });
        return;
    }
    
    // Find track in current playlist first
    let track = null;
    let foundIndex = -1;
    
    if (playlist && playlist.length > 0) {
        foundIndex = playlist.findIndex(t => t.id === trackId);
        if (foundIndex !== -1) {
            track = playlist[foundIndex];
        }
    }
    
    // If not found in playlist, try to find in all tracks
    if (!track) {
        // Try to find in window.tracks first
        const allTracks = window.tracks || [];
        const globalTrack = allTracks.find(t => t.id === trackId);
        if (globalTrack) {
            // Update playlist to include all tracks
            playlist = [...allTracks];
            foundIndex = allTracks.findIndex(t => t.id === trackId);
            track = globalTrack;
        } else {
            // If not found in window.tracks, try to fetch from API
            console.log('[PLAYER] Track not in window.tracks, fetching from API:', trackId);
            if (window.api && window.api.getTrackById) {
                try {
                    const fetchedTrack = await window.api.getTrackById(trackId);
                    if (fetchedTrack) {
                        track = fetchedTrack;
                        // Create a single-track playlist
                        playlist = [fetchedTrack];
                        foundIndex = 0;
                        // Update window.tracks if available
                        if (window.tracks && !window.tracks.find(t => t.id === trackId)) {
                            window.tracks.push(fetchedTrack);
                        }
                    }
                } catch (error) {
                    console.error('[PLAYER] Error fetching track:', error);
                }
            }
        }
    }
    
    if (!track) {
        console.error('[PLAYER] Track not found:', trackId);
        alert('Трек не найден. Пожалуйста, попробуйте обновить страницу.');
        return;
    }
    
    currentTrack = track;
    if (foundIndex !== -1) {
        currentTrackIndex = foundIndex;
    } else {
        // Fallback: try to find index
        currentTrackIndex = playlist.findIndex(t => t.id === trackId);
        if (currentTrackIndex === -1) {
            currentTrackIndex = 0;
        }
    }
    
    // Update UI
    // Название трека - ссылка на страницу трека
    playerTrackTitle.innerHTML = track.title 
        ? `<a href="track.html?id=${track.id}" class="player-track-link" style="color: inherit; text-decoration: none;">${escapeHtml(track.title)}</a>`
        : 'Неизвестный трек';
    
    // Get artist name - ссылка на страницу артиста
    if (track.artistId && window.artists && window.artists.length > 0) {
        const artist = window.artists.find(a => a.id === track.artistId);
        const artistName = artist ? artist.name : track.genre || 'Неизвестный исполнитель';
        playerTrackArtist.innerHTML = artist && track.artistId
            ? `<a href="artist.html?id=${track.artistId}" class="player-artist-link" style="color: inherit; text-decoration: none; opacity: 0.8;">${escapeHtml(artistName)}</a>`
            : artistName;
    } else {
        playerTrackArtist.textContent = track.genre || 'Неизвестный исполнитель';
    }
    
    // Set artwork
    updateArtwork(track);
    
    // Set audio source
    if (track.filePath) {
        // Use file path - URL к файлу через API Gateway
        const audioUrl = `${API_BASE_URL_PLAYER}/api/files/tracks/${trackId}`;
        console.log('Loading audio from:', audioUrl);
        audioElement.src = audioUrl;
        
        // Reset player state
        audioElement.currentTime = 0;
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        
        // Show player
        audioPlayer.classList.add('active');
        
        // Wait for metadata to load before playing
        const playWhenReady = () => {
            audioElement.removeEventListener('loadedmetadata', playWhenReady);
            audioElement.removeEventListener('error', handleError);
            
            // Update total time if available
            if (audioElement.duration && !isNaN(audioElement.duration)) {
                totalTimeEl.textContent = formatTime(audioElement.duration);
            } else if (track.durationSeconds) {
                // Use duration from track if audio metadata not available
                totalTimeEl.textContent = formatTime(track.durationSeconds);
            }
            
            // Record track play start in analytics (тихо, без ошибок в UI)
            if (window.api && window.api.getCurrentUser && window.api.recordTrackPlay) {
                const user = window.api.getCurrentUser();
                if (user && track.id) {
                    // Record play start (not completed yet) - тихо игнорируем ошибки
                    window.api.recordTrackPlay(user.id, track.id, 0, false)
                        .catch(() => {
                            // Тихо игнорируем - аналитика не критична для воспроизведения
                        });
                }
            }
            
            // Try to play
            audioElement.play().then(() => {
                console.log('[PLAYER] Audio playback started');
                isPlaying = true;
            }).catch(err => {
                console.error('[PLAYER] Ошибка воспроизведения:', err);
                isPlaying = false;
                alert('Не удалось воспроизвести трек. Возможно, файл не поддерживается или поврежден.');
            });
        };
        
        const handleError = (e) => {
            console.error('Error loading audio:', e);
            audioElement.removeEventListener('loadedmetadata', playWhenReady);
            audioElement.removeEventListener('error', handleError);
            alert('Не удалось загрузить аудио файл. Проверьте, что файл существует и доступен.');
        };
        
        audioElement.addEventListener('loadedmetadata', playWhenReady);
        audioElement.addEventListener('error', handleError);
        
        // Trigger load
        audioElement.load();
        
    } else {
        // Demo mode - используем заглушку
        audioElement.src = '';
        playerTrackTitle.textContent += ' (файл не загружен)';
        alert('Файл трека не загружен. Пожалуйста, загрузите аудио файл для этого трека.');
    }
}

// Play/Pause
function togglePlayPause() {
    if (!currentTrack) {
        alert('Выберите трек для воспроизведения');
        return;
    }
    
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play();
    }
}

function updatePlayPauseButton() {
    if (isPlaying) {
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
    } else {
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    }
}

// Previous/Next
function previousTrack() {
    // Если плейлист пустой, пытаемся создать его из текущих треков на экране
    if (playlist.length === 0) {
        // Сначала пытаемся использовать favoriteTracks
        if (window.favoriteTracks && window.favoriteTracks.length > 0) {
            playlist = [...window.favoriteTracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else if (window.filteredTracks && window.filteredTracks.length > 0) {
            // Затем используем filteredTracks (треки на экране)
            playlist = [...window.filteredTracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else if (window.tracks && window.tracks.length > 0) {
            // Затем используем все треки
            playlist = [...window.tracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else {
            console.warn('[PLAYER] No playlist available for previous track');
            return;
        }
    }
    
    // Проверяем, что текущий индекс валидный
    if (currentTrackIndex < 0 || currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
    }
    
    if (isShuffled) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    }
    
    const nextTrack = playlist[currentTrackIndex];
    if (nextTrack && nextTrack.id) {
        playTrack(nextTrack.id);
    } else {
        console.error('[PLAYER] Invalid track at index:', currentTrackIndex);
    }
}

function nextTrack() {
    // Если плейлист пустой, пытаемся создать его из текущих треков на экране
    if (playlist.length === 0) {
        // Сначала пытаемся использовать favoriteTracks
        if (window.favoriteTracks && window.favoriteTracks.length > 0) {
            playlist = [...window.favoriteTracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else if (window.filteredTracks && window.filteredTracks.length > 0) {
            // Затем используем filteredTracks (треки на экране)
            playlist = [...window.filteredTracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else if (window.tracks && window.tracks.length > 0) {
            // Затем используем все треки
            playlist = [...window.tracks];
            if (currentTrack) {
                currentTrackIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentTrackIndex === -1) currentTrackIndex = 0;
            } else {
                currentTrackIndex = 0;
            }
        } else {
            console.warn('[PLAYER] No playlist available for next track');
            return;
        }
    }
    
    // Проверяем, что текущий индекс валидный
    if (currentTrackIndex < 0 || currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
    }
    
    if (isShuffled) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    const nextTrack = playlist[currentTrackIndex];
    if (nextTrack && nextTrack.id) {
        playTrack(nextTrack.id);
    } else {
        console.error('[PLAYER] Invalid track at index:', currentTrackIndex);
    }
}

function onTrackEnd() {
    // Record track completion in analytics (тихо, без ошибок в UI)
    if (currentTrack && window.api && window.api.getCurrentUser && window.api.recordTrackPlay) {
        const user = window.api.getCurrentUser();
        if (user && currentTrack.id && audioElement.duration) {
            const durationSeconds = Math.floor(audioElement.duration);
            window.api.recordTrackPlay(user.id, currentTrack.id, durationSeconds, true)
                .catch(() => {
                    // Тихо игнорируем - аналитика не критична для воспроизведения
                });
        }
    }
    
    if (isRepeated) {
        audioElement.currentTime = 0;
        audioElement.play();
    } else {
        nextTrack();
    }
}

// Progress
function updateProgress() {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
        
        // Update handle position
        const handle = progressBar.querySelector('.player-progress-handle');
        if (handle) {
            handle.style.right = `${100 - progress}%`;
            handle.style.transform = `translate(50%, -50%)`;
        }
    }
}

function updateTotalTime() {
    if (audioElement.duration) {
        totalTimeEl.textContent = formatTime(audioElement.duration);
    }
}

function seek(event) {
    if (!audioElement.src || !currentTrack) return;
    
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        const newTime = percentage * audioElement.duration;
        audioElement.currentTime = newTime;
        
        // Update UI immediately
        currentTimeEl.textContent = formatTime(newTime);
        progressFill.style.width = (percentage * 100) + '%';
        
        // Update handle position
        const handle = progressBar.querySelector('.player-progress-handle');
        if (handle) {
            handle.style.right = `${(1 - percentage) * 100}%`;
            handle.style.transform = `translate(50%, -50%)`;
        }
    }
}

// Volume
function toggleMute() {
    isMuted = !isMuted;
    audioElement.muted = isMuted;
    updateVolumeIcon();
}

function setVolume(event) {
    const rect = volumeSlider.getBoundingClientRect();
    const x = event.clientX - rect.left;
    volume = Math.max(0, Math.min(1, x / rect.width));
    
    audioElement.volume = volume;
    isMuted = volume === 0;
    
    updateVolumeDisplay();
}

function updateVolumeDisplay() {
    volumeFill.style.width = (volume * 100) + '%';
    updateVolumeIcon();
}

function updateVolumeIcon() {
    if (isMuted || volume === 0) {
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');
        volumeIcon.classList.add('fa-volume-mute');
    } else if (volume < 0.5) {
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');
        volumeIcon.classList.add('fa-volume-down');
    } else {
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');
        volumeIcon.classList.add('fa-volume-up');
    }
}

// Repeat/Shuffle
function toggleRepeat() {
    isRepeated = !isRepeated;
    repeatBtn.classList.toggle('active', isRepeated);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
}

// Artwork
function updateArtwork(track) {
    if (!track) {
        playerArtwork.innerHTML = '<i class="fas fa-music"></i>';
        return;
    }
    
    // Try to get artwork from track, album, or artist
    let artworkUrl = null;

    // Сначала проверяем обложку трека
    if (track.artworkPath && track.artworkPath.trim() !== '') {
        if (track.artworkPath.startsWith('http://') || track.artworkPath.startsWith('https://')) {
            artworkUrl = track.artworkPath;
        } else {
            artworkUrl = `${API_BASE_URL_PLAYER}/api/files/artwork/tracks/${track.id}`;
        }
    }

    // Затем обложку альбома
    if (!artworkUrl && track.albumId && window.albums && window.albums.length > 0) {
        const album = window.albums.find(a => a.id === track.albumId);
        if (album && album.artworkPath && album.artworkPath.trim() !== '') {
            if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                artworkUrl = album.artworkPath;
            } else {
                artworkUrl = `${API_BASE_URL_PLAYER}/api/files/artwork/albums/${album.id}`;
            }
        }
    }

    // Затем фото артиста
    if (!artworkUrl && track.artistId && window.artists && window.artists.length > 0) {
        const artist = window.artists.find(a => a.id === track.artistId);
        if (artist && artist.imagePath && artist.imagePath.trim() !== '') {
            if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                artworkUrl = artist.imagePath;
            } else {
                artworkUrl = `${API_BASE_URL_PLAYER}/api/files/artwork/artists/${artist.id}`;
            }
        }
    }

    if (artworkUrl) {
        const img = document.createElement('img');
        img.src = artworkUrl;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px;';
        img.onerror = () => {
            console.warn('Failed to load artwork:', artworkUrl);
            playerArtwork.innerHTML = '<i class="fas fa-music"></i>';
        };
        img.onload = () => {
            console.log('Artwork loaded successfully:', artworkUrl);
        };
        playerArtwork.innerHTML = '';
        playerArtwork.appendChild(img);
    } else {
        console.log('No artwork found for track:', track.title);
        playerArtwork.innerHTML = '<i class="fas fa-music"></i>';
    }
}

// Helpers
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Set playlist and play track at index
function setPlaylist(tracksArray, startIndex = 0) {
    if (!tracksArray || tracksArray.length === 0) {
        console.error('Invalid playlist: empty array');
        return;
    }
    
    if (startIndex < 0 || startIndex >= tracksArray.length) {
        console.error('Invalid start index:', startIndex);
        startIndex = 0;
    }
    
    // Set playlist and current index
    playlist = [...tracksArray];
    currentTrackIndex = startIndex;
    
    // НЕ воспроизводим трек автоматически - только устанавливаем плейлист
    // Воспроизведение должно происходить только при явном вызове playTrack() пользователем
    // Не обновляем currentTrack и UI - это будет сделано при явном воспроизведении
}

// Update global playTrack function and state
window.playTrack = playTrack;
window.getCurrentTrackInfo = getCurrentTrackInfo;
window.previousTrack = previousTrack;
window.nextTrack = nextTrack;
window.togglePlayPause = togglePlayPause;
window.toggleMute = toggleMute;
window.toggleRepeat = toggleRepeat;
window.toggleShuffle = toggleShuffle;
window.setVolume = setVolume;
window.seek = seek;
window.setPlaylist = setPlaylist;

// Save/Restore Player State
function savePlayerState() {
    try {
        const state = {
            currentTrackId: currentTrack ? currentTrack.id : null,
            currentTrackIndex: currentTrackIndex,
            playlist: playlist.map(t => ({ id: t.id, title: t.title, artistId: t.artistId, albumId: t.albumId })),
            isPlaying: isPlaying,
            currentTime: audioElement ? audioElement.currentTime : 0,
            volume: volume,
            isMuted: isMuted,
            isShuffled: isShuffled,
            isRepeated: isRepeated,
            timestamp: Date.now()
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save player state:', e);
    }
}

function restorePlayerState() {
    try {
        const saved = localStorage.getItem('playerState');
        if (!saved) return;
        
        const state = JSON.parse(saved);
        
        // Restore only if saved less than 1 hour ago
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - state.timestamp > oneHour) {
            localStorage.removeItem('playerState');
            return;
        }
        
        // Restore volume and mute state immediately
        if (state.volume !== undefined) {
            volume = state.volume;
            if (audioElement) {
                audioElement.volume = volume;
            }
        }
        if (state.isMuted !== undefined) {
            isMuted = state.isMuted;
            if (audioElement) {
                audioElement.muted = isMuted;
            }
        }
        updateVolumeDisplay();
        
        // Restore shuffle and repeat
        if (state.isShuffled !== undefined) {
            isShuffled = state.isShuffled;
            if (shuffleBtn) {
                shuffleBtn.classList.toggle('active', isShuffled);
            }
        }
        if (state.isRepeated !== undefined) {
            isRepeated = state.isRepeated;
            if (repeatBtn) {
                repeatBtn.classList.toggle('active', isRepeated);
            }
        }
        
        // Delay track restoration until tracks are loaded
        let retryCount = 0;
        const MAX_RETRIES = 10; // Maximum 5 seconds (10 * 500ms)
        
        const restoreTrack = () => {
            // Increment retry counter
            retryCount++;
            
            // Check if we've exceeded max retries
            if (retryCount > MAX_RETRIES) {
                console.warn('Could not restore player state: tracks not loaded within timeout');
                return;
            }
            
            // Wait for tracks to be loaded (check window.tracks)
            if (!window.tracks || window.tracks.length === 0) {
                // Retry after a short delay
                setTimeout(restoreTrack, 500);
                return;
            }
            
            const allTracks = window.tracks || [];
            
            // Restore playlist if we have full track data
            if (state.playlist && state.playlist.length > 0) {
                // Try to rebuild playlist from saved IDs
                const restoredPlaylist = state.playlist.map(savedTrack => {
                    return allTracks.find(t => t.id === savedTrack.id) || savedTrack;
                }).filter(t => t); // Remove nulls
                
                if (restoredPlaylist.length > 0) {
                    playlist = restoredPlaylist;
                }
            }
            
            // Restore current track if available
            if (state.currentTrackId) {
                const foundTrack = allTracks.find(t => t.id === state.currentTrackId);
                
                if (foundTrack) {
                    // Find index in playlist
                    if (state.currentTrackIndex !== undefined && 
                        state.currentTrackIndex >= 0 && 
                        state.currentTrackIndex < playlist.length) {
                        currentTrackIndex = state.currentTrackIndex;
                    } else {
                        currentTrackIndex = playlist.findIndex(t => t.id === state.currentTrackId);
                        if (currentTrackIndex === -1) {
                            currentTrackIndex = 0;
                        }
                    }
                    
                    // Load track but don't auto-play
                    loadTrackForRestore(foundTrack, state.currentTime || 0);
                }
            }
        };
        
        // Only start restoration if we're on a page that loads tracks
        // Check if there's a way to load tracks (e.g., api is available)
        if (window.api && typeof window.api.getTracks === 'function') {
            // Start restoration after a short delay to allow page to load
            setTimeout(restoreTrack, 1000);
        }
        
    } catch (e) {
        console.warn('Failed to restore player state:', e);
        localStorage.removeItem('playerState');
    }
}

function loadTrackForRestore(track, savedTime) {
    if (!track) return;
    
    currentTrack = track;
    
    // Update UI
    playerTrackTitle.innerHTML = track.title 
        ? `<a href="track.html?id=${track.id}" class="player-track-link" style="color: inherit; text-decoration: none;">${escapeHtml(track.title)}</a>`
        : 'Неизвестный трек';
    
    if (track.artistId && window.artists && window.artists.length > 0) {
        const artist = window.artists.find(a => a.id === track.artistId);
        const artistName = artist ? artist.name : track.genre || 'Неизвестный исполнитель';
        playerTrackArtist.innerHTML = artist && track.artistId
            ? `<a href="artist.html?id=${track.artistId}" class="player-artist-link" style="color: inherit; text-decoration: none; opacity: 0.8;">${escapeHtml(artistName)}</a>`
            : artistName;
    } else {
        playerTrackArtist.textContent = track.genre || 'Неизвестный исполнитель';
    }
    
    updateArtwork(track);
    
    // Set audio source
    if (track.filePath) {
        const audioUrl = `${API_BASE_URL_PLAYER}/api/files/tracks/${track.id}`;
        audioElement.src = audioUrl;
        
        // Show player
        audioPlayer.classList.add('active');
        
        // Restore time position when metadata loads
        const restoreTime = () => {
            audioElement.removeEventListener('loadedmetadata', restoreTime);
            if (savedTime > 0 && savedTime < audioElement.duration) {
                audioElement.currentTime = savedTime;
            }
            updateProgress();
        };
        
        audioElement.addEventListener('loadedmetadata', restoreTime);
        audioElement.load();
    }
}

// Save state periodically and on important events
setInterval(savePlayerState, 5000); // Save every 5 seconds
audioElement.addEventListener('timeupdate', () => {
    // Throttle save to every 2 seconds during playback
    if (!window._lastSaveTime || Date.now() - window._lastSaveTime > 2000) {
        savePlayerState();
        window._lastSaveTime = Date.now();
    }
});
audioElement.addEventListener('play', savePlayerState);
audioElement.addEventListener('pause', savePlayerState);

// Update global state
window.addEventListener('load', () => {
    // Update playlist when tracks change
    if (window.tracks && window.tracks.length > 0) {
        // Only update if we don't have a saved playlist
        if (!playlist || playlist.length === 0) {
            playlist = [...window.tracks];
        }
    }
});
