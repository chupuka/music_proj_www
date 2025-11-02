// Genre Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    // Ждем загрузки app.js, если он еще не загружен
    if (typeof window.initializeAuth !== 'function' || typeof window.initializeTheme !== 'function') {
        // Подождать немного для загрузки скриптов
        setTimeout(() => {
            initializePage();
        }, 100);
    } else {
        initializePage();
    }
});

async function initializePage() {
    console.log('[GENRE_PAGE] initializePage called');
    console.log('[GENRE_PAGE] window.initializeAuth:', typeof window.initializeAuth);
    console.log('[GENRE_PAGE] window.api:', typeof window.api);
    console.log('[GENRE_PAGE] window.api.isAuthenticated:', typeof window.api !== 'undefined' && window.api ? typeof window.api.isAuthenticated : 'N/A');
    
    // Initialize auth (user menu, login buttons)
    if (typeof window.initializeAuth === 'function') {
        console.log('[GENRE_PAGE] Calling window.initializeAuth');
        window.initializeAuth();
    } else {
        console.error('[GENRE_PAGE] window.initializeAuth is not a function');
    }
    
    // Initialize modals
    if (typeof window.initializeModals === 'function') {
        window.initializeModals();
    }
    
    // Initialize theme
    if (typeof window.initializeTheme === 'function') {
        window.initializeTheme();
    }
    
    // Initialize search
    const searchInput = document.getElementById('searchInput');
    if (searchInput && typeof window.performSearch === 'function') {
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.onclick = window.performSearch;
        }
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.performSearch();
            }
        });
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const genreName = urlParams.get('name');
    
    if (!genreName) {
        const container = document.getElementById('genreDetails');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Жанр не найден</p></div>';
        }
        return;
    }
    
    await loadGenreDetails(decodeURIComponent(genreName));
}

// Use getArtworkUrl from app.js if available, otherwise define fallback
function getArtworkUrl(track) {
    // Prevent infinite recursion: check if we're already calling the global function
    if (typeof window.getArtworkUrl === 'function' && !window._getArtworkUrlCalling) {
        try {
            window._getArtworkUrlCalling = true;
            const result = window.getArtworkUrl(track);
            window._getArtworkUrlCalling = false;
            return result;
        } catch (e) {
            window._getArtworkUrlCalling = false;
            console.error('Error calling window.getArtworkUrl:', e);
        }
    }
    
    // Fallback implementation - check track -> album -> artist
    if (!track) return '';
    
    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:8080';
    
    // Сначала пытаемся получить обложку трека
    if (track.artworkPath && track.artworkPath.trim() !== '') {
        if (track.artworkPath.startsWith('http://') || track.artworkPath.startsWith('https://')) {
            return track.artworkPath;
        }
        if (track.id) {
            return `${apiBaseUrl}/api/files/artwork/tracks/${track.id}`;
        }
    }
    
    // Затем обложку альбома
    if (track.albumId && window.albums && window.albums.length > 0) {
        const album = window.albums.find(a => a.id === track.albumId);
        if (album && album.artworkPath && album.artworkPath.trim() !== '') {
            if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                return album.artworkPath;
            }
            if (album.id) {
                return `${apiBaseUrl}/api/files/artwork/albums/${album.id}`;
            }
        }
    }
    
    // Затем фото артиста
    if (track.artistId && window.artists && window.artists.length > 0) {
        const artist = window.artists.find(a => a.id === track.artistId);
        if (artist && artist.imagePath && artist.imagePath.trim() !== '') {
            if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                return artist.imagePath;
            }
            if (artist.id) {
                return `${apiBaseUrl}/api/files/artwork/artists/${artist.id}`;
            }
        }
    }
    
    return '';
}

async function loadGenreDetails(genreName) {
    const container = document.getElementById('genreDetails');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const allTracks = await api.getTracks();
        
        // Устанавливаем window.tracks для восстановления состояния плеера
        window.tracks = allTracks;
        
        const genreTracks = allTracks.filter(t => t.genre === genreName);
        
        // Перемешиваем треки случайным образом
        const shuffledTracks = genreTracks.sort(() => Math.random() - 0.5);
        
        // Загружаем артистов и альбомы обязательно (нужны для artwork)
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
        // Убеждаемся, что глобальные переменные установлены
        if (!window.tracks) window.tracks = allTracks;
        if (!window.artists) window.artists = [];
        if (!window.albums) window.albums = [];
        
        // Описания жанров
        const genreDescriptions = {
            'Rock': 'Рок-музыка — жанр популярной музыки, характеризующийся использованием электрогитар и мощным звучанием.',
            'Pop': 'Поп-музыка — массовая популярная музыка, ориентированная на широкую аудиторию.',
            'Jazz': 'Джаз — музыкальный стиль, возникший в конце XIX — начале XX века в США в результате синтеза африканской и европейской культур.',
            'Classical': 'Классическая музыка — музыкальный жанр, обычно относящийся к академической музыке западной традиции.',
            'Electronic': 'Электронная музыка — музыка, созданная с использованием электронных музыкальных инструментов и технологий.',
            'Hip-Hop': 'Хип-хоп — музыкальный жанр и культурное движение, зародившееся в афроамериканских и латиноамериканских кварталах Бронкса.',
            'Country': 'Кантри — форма популярной музыки, зародившаяся в южных штатах США в начале 1920-х годов.',
            'R&B': 'R&B (ритм-н-блюз) — жанр популярной музыки, который объединяет элементы ритм-энд-блюза, поп-музыки и соула.',
            'Metal': 'Метал — жанр рок-музыки, развившийся из хард-рока и характеризующийся тяжелым звуком и агрессивным исполнением.',
            'Reggae': 'Регги — направление музыки, зародившееся на Ямайке в конце 1960-х годов и получившее международное признание.',
            'Blues': 'Блюз — жанр музыки, зародившийся в афроамериканских сообществах юга США в конце XIX века.',
            'Folk': 'Фолк — традиционная музыка, передаваемая устно и отражающая культурные особенности народа.'
        };
        
        const description = genreDescriptions[genreName] || `Жанр "${genreName}" включает разнообразные музыкальные произведения в этом стиле.`;
        
        // Get genre image from genreImages mapping (from app.js)
        let genreImageUrl = '';
        if (typeof window.genreImages !== 'undefined' && window.genreImages) {
            genreImageUrl = window.genreImages[genreName] || window.genreImages['Поп'];
        }
        // Fallback to default genre image if not found
        if (!genreImageUrl) {
            genreImageUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop';
        }
        
        // Try to get artwork from first track in genre as fallback
        let genreArtworkUrl = genreImageUrl;
        if (shuffledTracks.length > 0) {
            const firstTrack = shuffledTracks[0];
            const trackArtwork = getArtworkUrl(firstTrack);
            if (trackArtwork && trackArtwork.trim() !== '') {
                // Use first track's artwork if genre image not available
                if (!genreImageUrl || genreImageUrl === 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop') {
                    genreArtworkUrl = trackArtwork;
                } else {
                    genreArtworkUrl = genreImageUrl;
                }
            }
        }
        
        let html = `
            <div class="album-details-main">
                <div class="album-details-artwork">
                    <img src="${genreArtworkUrl}" alt="${escapeHtml(genreName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: ${genreArtworkUrl && genreArtworkUrl !== '' ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 16px;">
                        <i class="fas fa-tag" style="font-size: 80px; color: #888;"></i>
                    </div>
                </div>
                <div class="album-details-info">
                    <div class="album-details-label">Жанр</div>
                    <h1 class="album-details-title">${escapeHtml(genreName)}</h1>
                    <div class="album-details-meta">${description}</div>
                    <div class="album-details-meta">${genreTracks.length} треков</div>
                    <div class="album-details-meta" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                        <strong style="display: block; margin-bottom: 8px;">Статистика прослушиваний жанра:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px;">
                            ${(() => {
                                const totalAll = genreTracks.reduce((sum, t) => sum + (t.playCountAll || 0), 0);
                                const totalMonth = genreTracks.reduce((sum, t) => sum + (t.playCountMonth || 0), 0);
                                const totalWeek = genreTracks.reduce((sum, t) => sum + (t.playCountWeek || 0), 0);
                                const totalDay = genreTracks.reduce((sum, t) => sum + (t.playCountDay || 0), 0);
                                return `
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-headphones" style="color: #1142AA;"></i>
                                        <span><strong>Всего:</strong> ${totalAll}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-calendar-month" style="color: #1142AA;"></i>
                                        <span><strong>За месяц:</strong> ${totalMonth}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-calendar-week" style="color: #1142AA;"></i>
                                        <span><strong>За неделю:</strong> ${totalWeek}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-calendar-day" style="color: #1142AA;"></i>
                                        <span><strong>За день:</strong> ${totalDay}</span>
                                    </div>
                                `;
                            })()}
                        </div>
                    </div>
                    <div class="album-details-actions">
                        <button class="btn-listen" onclick="playGenreTracks('${escapeHtml(genreName)}')">
                            <i class="fas fa-play"></i> Слушать жанр
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (shuffledTracks.length > 0) {
            html += `
                <div class="album-tracks-section">
                    <h2>Треки жанра "${escapeHtml(genreName)}"</h2>
                    <div class="tracks-list">
            `;
            
            shuffledTracks.forEach((track, index) => {
                // Ensure albums and artists are loaded before getting artwork
                const artworkUrl = getArtworkUrl(track);
                const hasArtwork = artworkUrl && artworkUrl.trim() !== '' && artworkUrl !== 'undefined' && artworkUrl !== 'null';
                const artist = window.artists && window.artists.length > 0 ? window.artists.find(a => a.id === track.artistId) : null;
                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                const duration = formatDuration(track.durationSeconds || 0);
                
                html += `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-number">${index + 1}</div>
                        <button class="btn-play" onclick="playTrackFromGenre('${escapeHtml(genreName)}', ${track.id})" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : 'background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;'}">
                            ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <a href="track.html?id=${track.id}" class="track-title track-link">${escapeHtml(track.title)}</a>
                            <a href="artist.html?id=${track.artistId}" class="track-artist track-link">${escapeHtml(artistName)}</a>
                            <div class="track-stats" style="font-size: 11px; color: #666; margin-top: 4px;">
                                <i class="fas fa-headphones"></i> ${track.playCountAll || 0} прослушиваний
                            </div>
                        </div>
                        <div class="track-duration">${duration}</div>
                        <div class="track-actions">
                            <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="album-tracks-section">
                    <div class="empty-state">
                        <i class="fas fa-music"></i>
                        <p>Треков этого жанра пока нет</p>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading genre details:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></div>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function playGenreTracks(genreName) {
    try {
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const genreTracks = window.tracks.filter(t => t.genre === genreName);
        const shuffledTracks = genreTracks.sort(() => Math.random() - 0.5);
        
        if (shuffledTracks.length === 0) {
            alert('В этом жанре нет треков');
            return;
        }
        
        if (window.setPlaylist) {
            window.setPlaylist(shuffledTracks, 0);
        } else if (window.playTrack) {
            window.playlist = shuffledTracks;
            window.currentTrackIndex = 0;
            window.playTrack(shuffledTracks[0].id);
        }
    } catch (error) {
        console.error('Error playing genre tracks:', error);
        alert('Ошибка воспроизведения: ' + error.message);
    }
}

async function playTrackFromGenre(genreName, trackId) {
    try {
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const genreTracks = window.tracks.filter(t => t.genre === genreName);
        const shuffledTracks = genreTracks.sort(() => Math.random() - 0.5);
        
        const trackIndex = shuffledTracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) {
            if (window.playTrack) {
                window.playTrack(trackId);
            }
            return;
        }
        
        if (window.setPlaylist) {
            window.setPlaylist(shuffledTracks, trackIndex);
        } else if (window.playTrack) {
            window.playlist = shuffledTracks;
            window.currentTrackIndex = trackIndex;
            window.playTrack(trackId);
        }
    } catch (error) {
        console.error('Error playing track from genre:', error);
        if (window.playTrack) {
            window.playTrack(trackId);
        }
    }
}

// Helper functions
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function downloadTrack(trackId) {
    if (window.downloadTrack) {
        window.downloadTrack(trackId);
    } else {
        const track = window.tracks.find(t => t.id === trackId);
        if (track && track.filePath) {
            window.open(`${window.API_BASE_URL || 'http://localhost:8080'}/api/files/tracks/${trackId}`, '_blank');
        }
    }
}

// Make functions globally available
window.playGenreTracks = playGenreTracks;
window.playTrackFromGenre = playTrackFromGenre;
window.downloadTrack = downloadTrack;

