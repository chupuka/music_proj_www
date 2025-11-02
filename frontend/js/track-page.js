// Track Page Script
// Helper functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getArtworkUrl(track) {
    if (!track) return '';
    
    const apiBaseUrl = window.API_BASE_URL || API_BASE_URL || 'http://localhost:8080';
    
    // Сначала пытаемся получить обложку трека
    if (track.artworkPath && track.artworkPath.trim() !== '') {
        if (track.artworkPath.startsWith('http://') || track.artworkPath.startsWith('https://')) {
            return track.artworkPath;
        }
        // Проверяем, что track.id существует
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
    console.log('[TRACK_PAGE] initializePage called');
    console.log('[TRACK_PAGE] window.initializeAuth:', typeof window.initializeAuth);
    console.log('[TRACK_PAGE] window.api:', typeof window.api);
    console.log('[TRACK_PAGE] window.api.isAuthenticated:', typeof window.api !== 'undefined' && window.api ? typeof window.api.isAuthenticated : 'N/A');
    
    // Initialize auth (user menu, login buttons)
    if (typeof window.initializeAuth === 'function') {
        console.log('[TRACK_PAGE] Calling window.initializeAuth');
        window.initializeAuth();
    } else {
        console.error('[TRACK_PAGE] window.initializeAuth is not a function');
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
    
    // Get track ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('id');
    
    if (!trackId) {
        const container = document.getElementById('trackDetails');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Трек не найден</p></div>';
        }
        return;
    }
    
    await loadTrackDetails(trackId);
}

async function loadTrackDetails(trackId) {
    const container = document.getElementById('trackDetails');
    
    try {
        // Загружаем необходимые данные
        await Promise.all([
            loadArtists(),
            loadAlbums(),
            loadTracks() // Загружаем треки для фильтрации других треков исполнителя
        ]);
        
        // Загружаем информацию о треке
        const track = await window.api.getTrackById(trackId);
        if (!track) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Трек не найден</p></div>';
            return;
        }
        
        // Получаем дополнительные данные
        const artist = window.artists && window.artists.length > 0 
            ? window.artists.find(a => a.id === track.artistId) 
            : null;
        const album = window.albums && window.albums.length > 0 
            ? window.albums.find(a => a.id === track.albumId) 
            : null;
        const artworkUrl = getArtworkUrl(track);
        
        // Получаем другие треки этого исполнителя (треки уже загружены в loadTrackDetails)
        const artistTracks = (window.tracks || []).filter(t => t.artistId === track.artistId && t.id !== track.id).slice(0, 10);
        
        // Формируем HTML
        const trackHtml = `
            <div class="track-details-main">
                <div class="track-details-artwork">
                    ${artworkUrl 
                        ? `<img src="${artworkUrl}" alt="${escapeHtml(track.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;">`
                        : ''
                    }
                    <div style="${artworkUrl ? 'display: none;' : 'display: flex;'} width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 16px;">
                        <i class="fas fa-music" style="font-size: 80px; color: #888;"></i>
                    </div>
                </div>
                <div class="track-details-info">
                    <div class="track-details-label">ТРЕК</div>
                    <h1 class="track-details-title">${escapeHtml(track.title)}</h1>
                    <div class="track-details-meta">
                        <div class="track-meta-item">
                            <strong>Исполнитель:</strong> 
                            <a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artist ? artist.name : 'Неизвестный исполнитель')}</a>
                        </div>
                        ${album ? `
                        <div class="track-meta-item">
                            <strong>Альбом:</strong> <a href="album.html?id=${album.id}" class="album-link">${escapeHtml(album.title)}</a>
                        </div>
                        ` : ''}
                        ${track.genre ? `
                        <div class="track-meta-item">
                            <strong>Жанр:</strong> ${escapeHtml(track.genre)}
                        </div>
                        ` : ''}
                        <div class="track-meta-item">
                            <strong>Длительность:</strong> ${formatDuration(track.durationSeconds || 0)}
                        </div>
                        <div class="track-meta-item">
                            <strong>Битрейт:</strong> 320 kbps
                        </div>
                        <div class="track-meta-item">
                            <strong>Правообладатель:</strong> Aurora
                        </div>
                        <div class="track-meta-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                            <strong style="display: block; margin-bottom: 8px;">Статистика прослушиваний:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-headphones" style="color: #1142AA;"></i>
                                    <span><strong>Всего:</strong> ${track.playCountAll || 0}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-calendar-month" style="color: #1142AA;"></i>
                                    <span><strong>За месяц:</strong> ${track.playCountMonth || 0}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-calendar-week" style="color: #1142AA;"></i>
                                    <span><strong>За неделю:</strong> ${track.playCountWeek || 0}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-calendar-day" style="color: #1142AA;"></i>
                                    <span><strong>За день:</strong> ${track.playCountDay || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="track-details-actions">
                        <button class="btn-listen" onclick="playTrack(${track.id})">
                            <i class="fas fa-play"></i> Слушать
                        </button>
                        <button class="btn-download-action" onclick="downloadTrack(${track.id})" title="Скачать">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-share" title="Поделиться">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            ${artistTracks.length > 0 ? `
            <div class="other-tracks-section">
                <h2 class="section-title">Другие треки исполнителя ${escapeHtml(artist ? artist.name : '')}</h2>
                <div class="tracks-list">
                    ${artistTracks.map(t => {
                        const tArtworkUrl = getArtworkUrl(t);
                        const tDuration = formatDuration(t.durationSeconds);
                        return `
                            <div class="track-item" data-track-id="${t.id}">
                                <div class="track-artwork">
                                    ${tArtworkUrl 
                                        ? `<img src="${tArtworkUrl}" alt="${escapeHtml(t.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                        : ''
                                    }
                                    <div style="${tArtworkUrl ? 'display: none;' : ''} width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px; display: flex;">
                                        <i class="fas fa-music"></i>
                                    </div>
                                </div>
                                <div class="track-info">
                                    <div class="track-title"><a href="track.html?id=${t.id}" class="track-link">${escapeHtml(t.title)}</a></div>
                                    <div class="track-artist"><a href="artist.html?id=${t.artistId}" class="artist-link">${escapeHtml(artist ? artist.name : '')}</a></div>
                                </div>
                                <div class="track-duration">${tDuration}</div>
                                <div class="track-actions">
                                    <button class="btn-download" onclick="downloadTrack(${t.id})" title="Скачать">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        `;
        
        container.innerHTML = trackHtml;
        
    } catch (error) {
        console.error('Error loading track details:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки: ${error.message}</p></div>`;
    }
}

