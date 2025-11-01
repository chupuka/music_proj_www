// Playlist Page Logic
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
    console.log('[PLAYLIST_PAGE] initializePage called');
    console.log('[PLAYLIST_PAGE] window.initializeAuth:', typeof window.initializeAuth);
    console.log('[PLAYLIST_PAGE] window.api:', typeof window.api);
    console.log('[PLAYLIST_PAGE] window.api.isAuthenticated:', typeof window.api !== 'undefined' && window.api ? typeof window.api.isAuthenticated : 'N/A');
    
    // Initialize auth (user menu, login buttons)
    if (typeof window.initializeAuth === 'function') {
        console.log('[PLAYLIST_PAGE] Calling window.initializeAuth');
        window.initializeAuth();
    } else {
        console.error('[PLAYLIST_PAGE] window.initializeAuth is not a function');
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
    const playlistId = urlParams.get('id');
    
    if (!playlistId) {
        const container = document.getElementById('playlistDetails');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Плейлист не найден</p></div>';
        }
        return;
    }
    
    await loadPlaylistDetails(parseInt(playlistId));
}

async function loadPlaylistDetails(playlistId) {
    const container = document.getElementById('playlistDetails');
    if (!container) {
        console.error('Playlist container not found');
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        // Загружаем плейлист
        let playlist;
        try {
            playlist = await api.getPlaylistById(playlistId);
        } catch (error) {
            console.error('Error loading playlist:', error);
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки плейлиста: ${error.message || 'Плейлист не найден'}</p></div>`;
            return;
        }
        
        if (!playlist) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Плейлист не найден</p></div>';
            return;
        }
        
        // Загружаем треки плейлиста (может вернуть пустой массив без ошибки)
        let tracks = [];
        try {
            tracks = await api.getPlaylistTracks(playlistId);
            // Если tracks null или undefined, делаем пустым массивом
            if (!tracks) {
                tracks = [];
            }
        } catch (error) {
            console.warn('Error loading playlist tracks (continuing with empty list):', error);
            // Продолжаем с пустым списком треков
            tracks = [];
        }
        
        // Загружаем все треки для отображения информации
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        // Загружаем артистов и альбомы если нужно
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
        const user = api.getCurrentUser();
        const isOwner = user && user.id === playlist.userId;
        
        const artworkUrl = getPlaylistArtworkUrl(playlist);
        const hasArtwork = artworkUrl && artworkUrl.trim() !== '';
        
        let html = `
            <div class="album-details-main">
                <div class="album-details-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                    ${!hasArtwork ? '<i class="fas fa-list"></i>' : ''}
                </div>
                <div class="album-details-info">
                    <div class="album-details-label">Плейлист</div>
                    <h1 class="album-details-title">${escapeHtml(playlist.name)}</h1>
                    <div class="album-details-meta">${escapeHtml(playlist.description || 'Описание отсутствует')}</div>
                    <div class="album-details-meta">${tracks.length} треков</div>
                    ${isOwner ? `
                        <div class="album-details-actions">
                            <button class="btn-primary" onclick="openEditPlaylistModal(${playlist.id})">
                                <i class="fas fa-edit"></i> Редактировать
                            </button>
                            <button class="btn-primary" onclick="openAddTrackToPlaylistModal(${playlist.id})">
                                <i class="fas fa-plus"></i> Добавить треки
                            </button>
                        </div>
                    ` : ''}
                    <div class="album-details-actions">
                        <button class="btn-listen" onclick="playPlaylist(${playlist.id})">
                            <i class="fas fa-play"></i> Слушать плейлист
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (tracks.length > 0) {
            html += `
                <div class="album-tracks-section">
                    <h2>Треки в плейлисте</h2>
                    <div class="tracks-list">
            `;
            
            tracks.forEach((trackData, index) => {
                const track = window.tracks.find(t => t.id === trackData.id || t.id === parseInt(trackData));
                if (!track) return;
                
                const artworkUrl = getArtworkUrl(track);
                const hasArtwork = artworkUrl && artworkUrl.trim() !== '';
                const artist = window.artists.find(a => a.id === track.artistId);
                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                
                html += `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-number">${index + 1}</div>
                        <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                            ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <a href="track.html?id=${track.id}" class="track-title track-link">${escapeHtml(track.title)}</a>
                            <a href="artist.html?id=${track.artistId}" class="track-artist track-link">${escapeHtml(artistName)}</a>
                        </div>
                        <div class="track-actions">
                            <button class="btn-play" onclick="playTrackFromPlaylist(${track.id}, ${playlist.id})" title="Воспроизвести">
                                <i class="fas fa-play"></i>
                            </button>
                            ${isOwner ? `
                                <button class="btn-favorite" onclick="removeTrackFromPlaylist(${playlist.id}, ${track.id})" title="Удалить из плейлиста">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
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
                        <p>В плейлисте пока нет треков</p>
                        ${isOwner ? '<button class="btn-primary" onclick="openAddTrackToPlaylistModal(' + playlist.id + ')">Добавить треки</button>' : ''}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading playlist details:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></div>`;
    }
}

// Use getArtworkUrl from app.js if available, otherwise define fallback
function getArtworkUrl(track) {
    // Используем глобальную функцию из app.js, если она доступна
    if (typeof window.getArtworkUrl === 'function' && window.getArtworkUrl !== getArtworkUrl) {
        try {
            return window.getArtworkUrl(track);
        } catch (e) {
            console.warn('Error calling window.getArtworkUrl:', e);
            // Fallback к локальной реализации
        }
    }
    // Fallback implementation
    if (!track) return '';
    const imagePath = track.artworkPath;
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath;
    }
    return track.artworkPath && track.id ? `${window.API_BASE_URL || 'http://localhost:8080'}/api/files/artwork/tracks/${track.id}` : '';
}

function getPlaylistArtworkUrl(playlist) {
    if (!playlist || !playlist.imagePath) {
        return '';
    }
    const imagePath = playlist.imagePath;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    return `${window.API_BASE_URL || 'http://localhost:8080'}/api/files/playlists/${playlist.id}/image`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function playPlaylist(playlistId) {
    try {
        const tracks = await api.getPlaylistTracks(playlistId);
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const trackList = tracks.map(t => {
            const id = t.id || parseInt(t);
            return window.tracks.find(tr => tr.id === id);
        }).filter(t => t != null);
        
        if (trackList.length === 0) {
            alert('В плейлисте нет треков');
            return;
        }
        
        if (window.setPlaylist) {
            window.setPlaylist(trackList, 0);
        } else if (window.playTrack) {
            window.playlist = trackList;
            window.currentTrackIndex = 0;
            window.playTrack(trackList[0].id);
        }
    } catch (error) {
        console.error('Error playing playlist:', error);
        alert('Ошибка воспроизведения плейлиста: ' + error.message);
    }
}

async function playTrackFromPlaylist(trackId, playlistId) {
    try {
        const tracks = await api.getPlaylistTracks(playlistId);
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const trackList = tracks.map(t => {
            const id = t.id || parseInt(t);
            return window.tracks.find(tr => tr.id === id);
        }).filter(t => t != null);
        
        const trackIndex = trackList.findIndex(t => t.id === trackId);
        if (trackIndex === -1) {
            if (window.playTrack) {
                window.playTrack(trackId);
            }
            return;
        }
        
        if (window.setPlaylist) {
            window.setPlaylist(trackList, trackIndex);
        } else if (window.playTrack) {
            window.playlist = trackList;
            window.currentTrackIndex = trackIndex;
            window.playTrack(trackId);
        }
    } catch (error) {
        console.error('Error playing track from playlist:', error);
        if (window.playTrack) {
            window.playTrack(trackId);
        }
    }
}

async function removeTrackFromPlaylist(playlistId, trackId) {
    try {
        await api.removeTrackFromPlaylist(playlistId, trackId);
        await loadPlaylistDetails(playlistId);
    } catch (error) {
        alert('Ошибка удаления трека: ' + error.message);
    }
}

async function openEditPlaylistModal(playlistId) {
    try {
        const playlist = await api.getPlaylistById(playlistId);
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'editPlaylistModal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeEditPlaylistModal()">&times;</span>
                <h3>Редактировать плейлист</h3>
                <form id="editPlaylistForm" onsubmit="handleEditPlaylist(event, ${playlistId})">
                    <div class="form-group">
                        <label for="editPlaylistName">Название плейлиста *</label>
                        <input type="text" id="editPlaylistName" value="${escapeHtml(playlist.name)}" required>
                    </div>
                    <div class="form-group">
                        <label for="editPlaylistDescription">Описание</label>
                        <input type="text" id="editPlaylistDescription" value="${escapeHtml(playlist.description || '')}">
                    </div>
                    <div class="form-group">
                        <label for="editPlaylistImageUrl">URL изображения</label>
                        <input type="url" id="editPlaylistImageUrl" placeholder="https://example.com/image.jpg" value="${escapeHtml(playlist.imagePath || '')}">
                    </div>
                    <button type="submit" class="btn-primary">Сохранить</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditPlaylistModal();
            }
        });
    } catch (error) {
        alert('Ошибка загрузки плейлиста: ' + error.message);
    }
}

function closeEditPlaylistModal() {
    const modal = document.getElementById('editPlaylistModal');
    if (modal) {
        modal.remove();
    }
}

async function handleEditPlaylist(e, playlistId) {
    e.preventDefault();
    const name = document.getElementById('editPlaylistName').value.trim();
    const description = document.getElementById('editPlaylistDescription').value.trim();
    const imageUrl = document.getElementById('editPlaylistImageUrl').value.trim();
    
    try {
        await api.updatePlaylist(playlistId, {
            name: name,
            description: description || null,
            imagePath: imageUrl || null
        });
        closeEditPlaylistModal();
        await loadPlaylistDetails(playlistId);
        alert('Плейлист обновлен');
    } catch (error) {
        alert('Ошибка обновления плейлиста: ' + error.message);
    }
}

async function openAddTrackToPlaylistModal(playlistId) {
    try {
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        
        const playlist = await api.getPlaylistById(playlistId);
        const playlistTracks = await api.getPlaylistTracks(playlistId);
        const playlistTrackIds = new Set(playlistTracks.map(t => t.id || parseInt(t)));
        
        const availableTracks = window.tracks.filter(t => !playlistTrackIds.has(t.id));
        
        // Используем локальную функцию getArtworkUrl, чтобы избежать конфликта
        const getArtworkUrlLocal = (track) => {
            if (typeof window.getArtworkUrl === 'function' && window.getArtworkUrl !== getArtworkUrl) {
                try {
                    return window.getArtworkUrl(track);
                } catch (e) {
                    // Fallback
                }
            }
            if (!track) return '';
            const imagePath = track.artworkPath;
            if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
                return imagePath;
            }
            return track.artworkPath && track.id ? `${window.API_BASE_URL || 'http://localhost:8080'}/api/files/artwork/tracks/${track.id}` : '';
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'addTrackToPlaylistModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <span class="close" onclick="closeAddTrackToPlaylistModal()">&times;</span>
                <h3>Добавить треки в "${escapeHtml(playlist.name)}"</h3>
                <div class="tracks-list">
                    ${availableTracks.length === 0 ? '<div class="empty-state"><p>Нет доступных треков</p></div>' : availableTracks.map(track => {
                        const artist = window.artists.find(a => a.id === track.artistId);
                        const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                        const artworkUrl = getArtworkUrlLocal(track);
                        const hasArtwork = artworkUrl && artworkUrl.trim() !== '';
                        return `
                            <div class="track-item" data-track-id="${track.id}">
                                <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                                    ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                                </div>
                                <div class="track-info">
                                    <div class="track-title">${escapeHtml(track.title)}</div>
                                    <div class="track-artist">${escapeHtml(artistName)}</div>
                                </div>
                                <button class="btn-play" onclick="addTrackToPlaylistFromModal(${playlistId}, ${track.id})" title="Добавить">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddTrackToPlaylistModal();
            }
        });
    } catch (error) {
        alert('Ошибка загрузки треков: ' + error.message);
    }
}

function closeAddTrackToPlaylistModal() {
    const modal = document.getElementById('addTrackToPlaylistModal');
    if (modal) {
        modal.remove();
    }
}

async function addTrackToPlaylistFromModal(playlistId, trackId) {
    try {
        await api.addTrackToPlaylist(playlistId, trackId);
        await loadPlaylistDetails(playlistId);
        const item = document.querySelector(`#addTrackToPlaylistModal .track-item[data-track-id="${trackId}"]`);
        if (item) {
            item.style.opacity = '0.5';
            item.querySelector('.btn-play').innerHTML = '<i class="fas fa-check"></i>';
            item.querySelector('.btn-play').onclick = null;
        }
    } catch (error) {
        alert('Ошибка добавления трека: ' + error.message);
    }
}

// Make functions globally available
window.playPlaylist = playPlaylist;
window.playTrackFromPlaylist = playTrackFromPlaylist;
window.removeTrackFromPlaylist = removeTrackFromPlaylist;
window.openEditPlaylistModal = openEditPlaylistModal;
window.closeEditPlaylistModal = closeEditPlaylistModal;
window.handleEditPlaylist = handleEditPlaylist;
window.openAddTrackToPlaylistModal = openAddTrackToPlaylistModal;
window.closeAddTrackToPlaylistModal = closeAddTrackToPlaylistModal;
window.addTrackToPlaylistFromModal = addTrackToPlaylistFromModal;

