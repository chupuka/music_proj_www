// Album Page Script
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

async function loadTracks() {
    try {
        const tracks = await window.api.getTracks();
        window.tracks = tracks;
        return tracks;
    } catch (error) {
        console.error('Error loading tracks:', error);
        return [];
    }
}

// Declare toggleAlbumFavorite early so it's available when HTML is rendered
window.toggleAlbumFavorite = async function(albumId) {
    const user = window.api && window.api.getCurrentUser ? window.api.getCurrentUser() : null;
    if (!user) {
        if (window.openModal) {
            window.openModal('loginModal');
        } else {
            alert('Войдите, чтобы добавить треки в избранное');
        }
        return;
    }
    
    const btn = document.getElementById('albumFavoriteBtn');
    const icon = document.getElementById('albumFavoriteIcon');
    
    if (!btn || !icon) {
        console.error('Album favorite button not found');
        return;
    }
    
    try {
        // Get all tracks from the album
        const allTracks = await window.api.getTracks();
        const albumTracks = allTracks.filter(t => t.albumId === parseInt(albumId));
        
        if (albumTracks.length === 0) {
            alert('В этом альбоме нет треков');
            return;
        }
        
        // Add each track to favorites
        let addedCount = 0;
        for (const track of albumTracks) {
            try {
                const isFav = await window.api.isFavorite(user.id, track.id);
                if (!isFav) {
                    await window.api.addFavoriteTrack(user.id, track.id);
                    addedCount++;
                }
            } catch (error) {
                console.warn(`Error adding track ${track.id} to favorites:`, error);
            }
        }
        
        if (addedCount > 0) {
            alert(`Добавлено ${addedCount} треков в Мои треки`);
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            alert('Все треки этого альбома уже добавлены в Мои треки');
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    } catch (error) {
        console.error('Error adding album tracks to favorites:', error);
        alert('Ошибка при добавлении треков: ' + (error.message || 'Неизвестная ошибка'));
    }
};

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
    console.log('[ALBUM_PAGE] initializePage called');
    console.log('[ALBUM_PAGE] window.initializeAuth:', typeof window.initializeAuth);
    console.log('[ALBUM_PAGE] window.api:', typeof window.api);
    console.log('[ALBUM_PAGE] window.api.isAuthenticated:', typeof window.api !== 'undefined' && window.api ? typeof window.api.isAuthenticated : 'N/A');
    
    // Initialize auth (user menu, login buttons)
    if (typeof window.initializeAuth === 'function') {
        console.log('[ALBUM_PAGE] Calling window.initializeAuth');
        window.initializeAuth();
    } else {
        console.error('[ALBUM_PAGE] window.initializeAuth is not a function');
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
    
    // Get album ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');
    
    if (!albumId) {
        const container = document.getElementById('albumDetails');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Альбом не найден</p></div>';
        }
        return;
    }
    
    await loadAlbumDetails(albumId);
}

async function loadAlbumDetails(albumId) {
    const container = document.getElementById('albumDetails');
    
    // Сохраняем ID альбома для использования в playAlbum
    currentAlbumId = albumId;
    
    try {
        // Загружаем необходимые данные
        await Promise.all([
            loadArtists(),
            loadAlbums(),
            loadTracks()
        ]);
        
        // Загружаем информацию об альбоме
        const album = await window.api.request(`/api/albums/${albumId}`);
        if (!album) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Альбом не найден</p></div>';
            return;
        }
        
        // Получаем дополнительные данные
        const artist = window.artists && window.artists.length > 0 
            ? window.artists.find(a => a.id === album.artistId) 
            : null;
        
        // Получаем треки альбома
        const albumTracks = (window.tracks || []).filter(t => t.albumId === parseInt(albumId));
        
        // Получаем URL обложки альбома
        const apiBaseUrl = window.API_BASE_URL || API_BASE_URL || 'http://localhost:8080';
        let artworkUrl = '';
        if (album.artworkPath && album.artworkPath.trim() !== '') {
            if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                artworkUrl = album.artworkPath;
            } else if (album.id) {
                artworkUrl = `${apiBaseUrl}/api/files/artwork/albums/${album.id}`;
            }
        }
        
        // Формируем HTML
        const albumHtml = `
            <div class="album-details-main">
                <div class="album-details-artwork">
                    ${artworkUrl 
                        ? `<img src="${artworkUrl}" alt="${escapeHtml(album.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;">`
                        : ''
                    }
                    <div style="${artworkUrl ? 'display: none;' : 'display: flex;'} width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 16px;">
                        <i class="fas fa-compact-disc" style="font-size: 80px; color: #888;"></i>
                    </div>
                </div>
                <div class="album-details-info">
                    <div class="album-details-label">АЛЬБОМ</div>
                    <h1 class="album-details-title">${escapeHtml(album.title)}</h1>
                    <div class="album-details-meta">
                        <div class="track-meta-item">
                            <strong>Исполнитель:</strong> 
                            <a href="artist.html?id=${album.artistId}" class="artist-link">${escapeHtml(artist ? artist.name : 'Неизвестный исполнитель')}</a>
                        </div>
                        ${album.releaseYear ? `
                        <div class="track-meta-item">
                            <strong>Год выпуска:</strong> ${album.releaseYear}
                        </div>
                        ` : ''}
                        <div class="track-meta-item">
                            <strong>Треков:</strong> ${albumTracks.length}
                        </div>
                        <div class="track-meta-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                            <strong style="display: block; margin-bottom: 8px;">Статистика прослушиваний альбома:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px;">
                                ${(() => {
                                    const totalAll = albumTracks.reduce((sum, t) => sum + (t.playCountAll || 0), 0);
                                    const totalMonth = albumTracks.reduce((sum, t) => sum + (t.playCountMonth || 0), 0);
                                    const totalWeek = albumTracks.reduce((sum, t) => sum + (t.playCountWeek || 0), 0);
                                    const totalDay = albumTracks.reduce((sum, t) => sum + (t.playCountDay || 0), 0);
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
                    </div>
                    <div class="album-details-actions">
                        <button class="btn-listen" onclick="window.playAlbum()">
                            <i class="fas fa-play"></i> Слушать альбом
                        </button>
                        <button class="btn-favorite-action" id="albumFavoriteBtn" onclick="toggleAlbumFavorite(${album.id})" title="Добавить треки альбома в Мои треки">
                            <i class="far fa-heart" id="albumFavoriteIcon"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="album-tracks-section">
                <h2 class="section-title">Треки</h2>
                <div class="tracks-list">
                    ${albumTracks.length === 0 
                        ? '<div class="empty-state"><i class="fas fa-music"></i><p>В этом альбоме пока нет треков</p></div>'
                        : albumTracks.map((track, index) => {
                            const duration = formatDuration(track.durationSeconds);
                            const artworkUrl = getArtworkUrl(track);
                            return `
                                <div class="track-item" data-track-id="${track.id}">
                                    <div class="track-number">${index + 1}</div>
                                    <div class="track-artwork">
                                        ${artworkUrl 
                                            ? `<img src="${artworkUrl}" alt="${escapeHtml(track.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
                                            : ''
                                        }
                                        <div style="${artworkUrl ? 'display: none;' : 'display: flex;'} width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px;">
                                            <i class="fas fa-music"></i>
                                        </div>
                                    </div>
                                    <div class="track-info">
                                        <div class="track-title"><a href="track.html?id=${track.id}" class="track-link">${escapeHtml(track.title)}</a></div>
                                        <div class="track-artist"><a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artist ? artist.name : 'Неизвестный исполнитель')}</a></div>
                                        <div class="track-stats" style="font-size: 11px; color: #666; margin-top: 4px;">
                                            <i class="fas fa-headphones"></i> ${track.playCountAll || 0} прослушиваний
                                        </div>
                                    </div>
                                    <div class="track-duration">${duration}</div>
                                    <div class="track-actions">
                                        <button class="btn-play" onclick="window.playTrackFromAlbum(${track.id})" title="Воспроизвести">
                                            <i class="fas fa-play"></i>
                                        </button>
                                        <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                                            <i class="fas fa-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `;
        
        container.innerHTML = albumHtml;
        
        // Check album favorite status
        await checkAlbumFavoriteStatus(parseInt(albumId));
        
        // Load favorite status
        if (window.api && window.api.isAuthenticated()) {
            loadFavoriteStatus();
        }
    } catch (error) {
        console.error('Error loading album details:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки альбома</p></div>';
    }
}

async function loadArtists() {
    try {
        const artists = await window.api.getArtists();
        window.artists = artists;
        return artists;
    } catch (error) {
        console.error('Error loading artists:', error);
        return [];
    }
}

async function loadAlbums() {
    try {
        const albums = await window.api.request('/api/albums');
        window.albums = albums;
        return albums;
    } catch (error) {
        console.error('Error loading albums:', error);
        return [];
    }
}

async function loadFavoriteStatus() {
    const user = window.api.getCurrentUser();
    if (!user) return;
    
    const favoriteButtons = document.querySelectorAll('.btn-favorite[data-track-id]');
    for (const btn of favoriteButtons) {
        const trackId = parseInt(btn.getAttribute('data-track-id'));
        try {
            const isFav = await window.api.isFavorite(user.id, trackId);
            if (isFav) {
                btn.classList.add('active');
            }
        } catch (error) {
            // Ignore errors
        }
    }
}

// Store album tracks for playlist
let currentAlbumTracks = [];
let currentAlbumId = null;

async function playAlbum() {
    try {
        // Если альбом еще не загружен, пытаемся получить ID из URL
        if (!currentAlbumId) {
            const urlParams = new URLSearchParams(window.location.search);
            currentAlbumId = urlParams.get('id');
        }
        
        // Если ID альбома есть, получаем треки альбома
        let tracks = [];
        if (currentAlbumId) {
            if (!window.tracks || window.tracks.length === 0) {
                window.tracks = await window.api.getTracks();
            }
            tracks = window.tracks.filter(t => t.albumId === parseInt(currentAlbumId));
        } else {
            // Fallback: получаем треки из DOM
            const albumTrackElements = document.querySelectorAll('.track-item[data-track-id]');
            if (albumTrackElements.length === 0) {
                alert('Треков в альбоме нет');
                return;
            }
            
            const albumTrackIds = Array.from(albumTrackElements).map(el => 
                parseInt(el.getAttribute('data-track-id'))
            );
            
            if (!window.tracks || window.tracks.length === 0) {
                window.tracks = await window.api.getTracks();
            }
            
            tracks = albumTrackIds.map(id => 
                window.tracks.find(t => t.id === id)
            ).filter(t => t != null);
        }
        
        if (tracks.length === 0) {
            alert('В этом альбоме нет треков');
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        console.log('[ALBUM] Setting playlist with', tracks.length, 'tracks');
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(tracks, 0);
            console.log('[ALBUM] Playlist set, calling playTrack for track:', tracks[0]?.id);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && tracks[0] && tracks[0].id) {
                try {
                    await window.playTrack(tracks[0].id);
                    console.log('[ALBUM] playTrack called successfully');
                } catch (error) {
                    console.error('[ALBUM] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[ALBUM] window.playTrack not available or invalid');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[ALBUM] setPlaylist not available, using fallback');
            window.playlist = tracks;
            window.currentTrackIndex = 0;
            try {
                await window.playTrack(tracks[0].id);
            } catch (error) {
                console.error('[ALBUM] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[ALBUM] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing album:', error);
        alert('Ошибка воспроизведения альбома: ' + error.message);
    }
}

// Function to play track from album (sets playlist starting from this track)
async function playTrackFromAlbum(trackId) {
    try {
        // Если альбом еще не загружен, пытаемся получить ID из URL
        if (!currentAlbumId) {
            const urlParams = new URLSearchParams(window.location.search);
            currentAlbumId = urlParams.get('id');
        }
        
        // Получаем треки альбома
        let tracks = [];
        let trackIndex = -1;
        
        if (currentAlbumId) {
            // Если ID альбома есть, получаем треки из window.tracks
            if (!window.tracks || window.tracks.length === 0) {
                window.tracks = await window.api.getTracks();
            }
            tracks = window.tracks.filter(t => t.albumId === parseInt(currentAlbumId));
            trackIndex = tracks.findIndex(t => t.id === parseInt(trackId));
        } else {
            // Fallback: получаем треки из DOM
            const albumTrackElements = document.querySelectorAll('.track-item[data-track-id]');
            if (albumTrackElements.length === 0) {
                // Если треки в DOM не найдены, просто воспроизводим трек
                if (window.playTrack) {
                    await window.playTrack(trackId);
                }
                return;
            }
            
            const albumTrackIds = Array.from(albumTrackElements).map(el => 
                parseInt(el.getAttribute('data-track-id'))
            );
            
            trackIndex = albumTrackIds.indexOf(parseInt(trackId));
            if (trackIndex === -1) {
                // Если трек не найден в альбоме, просто воспроизводим его
                if (window.playTrack) {
                    await window.playTrack(trackId);
                }
                return;
            }
            
            if (!window.tracks || window.tracks.length === 0) {
                window.tracks = await window.api.getTracks();
            }
            
            tracks = albumTrackIds.map(id => 
                window.tracks.find(t => t.id === id)
            ).filter(t => t != null);
        }
        
        if (tracks.length === 0) {
            console.error('No tracks found for album');
            // Fallback: пытаемся воспроизвести трек напрямую
            if (window.playTrack) {
                await window.playTrack(trackId);
            }
            return;
        }
        
        if (trackIndex === -1) {
            // Если индекс трека не найден, просто воспроизводим его
            if (window.playTrack) {
                await window.playTrack(trackId);
            }
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение
        console.log('[ALBUM] Setting playlist with', tracks.length, 'tracks, starting at index:', trackIndex);
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(tracks, trackIndex);
            console.log('[ALBUM] Playlist set, calling playTrack for track:', tracks[trackIndex]?.id);
            // Явно запускаем трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && tracks[trackIndex] && tracks[trackIndex].id) {
                try {
                    await window.playTrack(tracks[trackIndex].id);
                    console.log('[ALBUM] playTrack called successfully');
                } catch (error) {
                    console.error('[ALBUM] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[ALBUM] window.playTrack not available or invalid');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[ALBUM] setPlaylist not available, using fallback');
            window.playlist = tracks;
            window.currentTrackIndex = trackIndex;
            try {
                await window.playTrack(trackId);
            } catch (error) {
                console.error('[ALBUM] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[ALBUM] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing track from album:', error);
        // Fallback: пытаемся воспроизвести трек напрямую
        if (window.playTrack) {
            try {
                await window.playTrack(trackId);
            } catch (e) {
                console.error('Error in fallback playTrack:', e);
                alert('Ошибка воспроизведения трека: ' + error.message);
            }
        } else {
            alert('Ошибка воспроизведения трека: ' + error.message);
        }
    }
}


// Check album favorite status (if all tracks are in favorites)
async function checkAlbumFavoriteStatus(albumId) {
    const user = window.api.getCurrentUser();
    if (!user) return;
    
    try {
        const allTracks = await window.api.getTracks();
        const albumTracks = allTracks.filter(t => t.albumId === parseInt(albumId));
        
        if (albumTracks.length === 0) return;
        
        // Check if all tracks are in favorites
        let allInFavorites = true;
        for (const track of albumTracks) {
            try {
                const isFav = await window.api.isFavorite(user.id, track.id);
                if (!isFav) {
                    allInFavorites = false;
                    break;
                }
            } catch (error) {
                // Ignore errors
            }
        }
        
        const btn = document.getElementById('albumFavoriteBtn');
        const icon = document.getElementById('albumFavoriteIcon');
        
        if (btn && icon && allInFavorites) {
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    } catch (error) {
        console.warn('Error checking album favorite status:', error);
    }
}

// Make functions globally available
window.playAlbum = playAlbum;
window.playTrackFromAlbum = playTrackFromAlbum;

async function toggleFavorite(trackId) {
    const user = window.api.getCurrentUser();
    if (!user) {
        if (window.openModal) {
            window.openModal('loginModal');
        }
        return;
    }
    
    const btn = document.querySelector(`.btn-favorite[data-track-id="${trackId}"]`);
    const isCurrentlyFavorite = btn.classList.contains('active');
    
    try {
        if (isCurrentlyFavorite) {
            await window.api.removeFavoriteTrack(user.id, trackId);
            btn.classList.remove('active');
        } else {
            await window.api.addFavoriteTrack(user.id, trackId);
            btn.classList.add('active');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Ошибка: ' + error.message);
    }
}

async function downloadTrack(trackId) {
    const track = (window.tracks || []).find(t => t.id === trackId);
    if (!track) {
        alert('Трек не найден');
        return;
    }

    if (!track.filePath) {
        alert('Файл трека не загружен');
        return;
    }

    try {
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/files/tracks/${trackId}/download`);

        if (!response.ok) {
            throw new Error('Ошибка скачивания');
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${track.title}.mp3`;

        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        alert('Ошибка скачивания: ' + error.message);
    }
}

// Make functions available globally
window.playTrack = window.playTrack || playTrack;
window.toggleFavorite = toggleFavorite;
window.downloadTrack = downloadTrack;