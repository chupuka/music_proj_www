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
                    </div>
                    <div class="album-details-actions">
                        <button class="btn-listen" onclick="window.playAlbum()">
                            <i class="fas fa-play"></i> Слушать альбом
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

function playAlbum() {
    // Get all album tracks from the DOM
    const albumTrackElements = document.querySelectorAll('.track-item[data-track-id]');
    if (albumTrackElements.length === 0) return;
    
    // Get track IDs in order
    const albumTrackIds = Array.from(albumTrackElements).map(el => 
        parseInt(el.getAttribute('data-track-id'))
    );
    
    // Get full track objects from window.tracks
    if (!window.tracks || window.tracks.length === 0) {
        console.error('Tracks not loaded');
        return;
    }
    
    // Create playlist from album tracks
    const tracks = albumTrackIds.map(id => 
        window.tracks.find(t => t.id === id)
    ).filter(t => t != null);
    
    if (tracks.length === 0) {
        console.error('No tracks found for album');
        return;
    }
    
    // Set playlist and start playing from first track
    if (window.setPlaylist) {
        window.setPlaylist(tracks, 0);
    } else if (window.playTrack) {
        // Fallback: set playlist directly and play first track
        window.playlist = tracks;
        window.currentTrackIndex = 0;
        window.playTrack(tracks[0].id);
    }
}

// Function to play track from album (sets playlist starting from this track)
function playTrackFromAlbum(trackId) {
    // Get all album tracks from the DOM
    const albumTrackElements = document.querySelectorAll('.track-item[data-track-id]');
    if (albumTrackElements.length === 0) {
        // Fallback to regular playTrack
        if (window.playTrack) {
            window.playTrack(trackId);
        }
        return;
    }
    
    // Get track IDs in order
    const albumTrackIds = Array.from(albumTrackElements).map(el => 
        parseInt(el.getAttribute('data-track-id'))
    );
    
    // Find index of selected track
    const trackIndex = albumTrackIds.indexOf(parseInt(trackId));
    if (trackIndex === -1) {
        console.error('Track not found in album');
        // Fallback to regular playTrack
        if (window.playTrack) {
            window.playTrack(trackId);
        }
        return;
    }
    
    // Get full track objects from window.tracks
    if (!window.tracks || window.tracks.length === 0) {
        console.error('Tracks not loaded');
        return;
    }
    
    // Create playlist from album tracks
    const tracks = albumTrackIds.map(id => 
        window.tracks.find(t => t.id === id)
    ).filter(t => t != null);
    
    if (tracks.length === 0) {
        console.error('No tracks found for album');
        return;
    }
    
    // Set playlist starting from selected track
    if (window.setPlaylist) {
        window.setPlaylist(tracks, trackIndex);
    } else if (window.playTrack) {
        // Fallback: set playlist directly and play selected track
        window.playlist = tracks;
        window.currentTrackIndex = trackIndex;
        window.playTrack(trackId);
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
