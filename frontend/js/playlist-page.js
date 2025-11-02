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
                
                // Используем глобальную функцию getArtworkUrl или локальную
                let artworkUrl = '';
                if (typeof window.getArtworkUrl === 'function') {
                    try {
                        artworkUrl = window.getArtworkUrl(track);
                    } catch (e) {
                        console.warn('Error calling window.getArtworkUrl:', e);
                    }
                }
                
                // Fallback если глобальная функция не сработала
                if (!artworkUrl || artworkUrl.trim() === '') {
                    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:8080';
                    
                    // Проверяем track artwork
                    if (track.artworkPath && track.artworkPath.trim() !== '') {
                        if (track.artworkPath.startsWith('http://') || track.artworkPath.startsWith('https://')) {
                            artworkUrl = track.artworkPath;
                        } else if (track.id) {
                            artworkUrl = `${apiBaseUrl}/api/files/artwork/tracks/${track.id}`;
                        }
                    }
                    
                    // Проверяем album artwork
                    if ((!artworkUrl || artworkUrl.trim() === '') && track.albumId && window.albums && window.albums.length > 0) {
                        const album = window.albums.find(a => a.id === track.albumId);
                        if (album && album.artworkPath && album.artworkPath.trim() !== '') {
                            if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                                artworkUrl = album.artworkPath;
                            } else if (album.id) {
                                artworkUrl = `${apiBaseUrl}/api/files/artwork/albums/${album.id}`;
                            }
                        }
                    }
                    
                    // Проверяем artist image
                    if ((!artworkUrl || artworkUrl.trim() === '') && track.artistId && window.artists && window.artists.length > 0) {
                        const artist = window.artists.find(a => a.id === track.artistId);
                        if (artist && artist.imagePath && artist.imagePath.trim() !== '') {
                            if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                                artworkUrl = artist.imagePath;
                            } else if (artist.id) {
                                artworkUrl = `${apiBaseUrl}/api/files/artwork/artists/${artist.id}`;
                            }
                        }
                    }
                }
                
                const hasArtwork = artworkUrl && artworkUrl.trim() !== '' && artworkUrl !== 'undefined' && artworkUrl !== 'null';
                const artist = window.artists && window.artists.length > 0 ? window.artists.find(a => a.id === track.artistId) : null;
                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                const duration = formatDuration(track.durationSeconds || 0);
                
                // Формируем стиль для artwork
                let artworkStyle = '';
                if (hasArtwork) {
                    artworkStyle = `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;`;
                } else {
                    artworkStyle = 'background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;';
                }
                
                html += `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-number">${index + 1}</div>
                        <button class="btn-play" onclick="playTrackFromPlaylist(${track.id}, ${playlist.id})" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="track-artwork" style="${artworkStyle}">
                            ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <a href="track.html?id=${track.id}" class="track-title track-link">${escapeHtml(track.title)}</a>
                            <a href="artist.html?id=${track.artistId}" class="track-artist track-link">${escapeHtml(artistName)}</a>
                        </div>
                        <div class="track-duration">${duration}</div>
                        <div class="track-actions">
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

function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        console.log('[PLAYLIST] Setting playlist with', trackList.length, 'tracks');
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(trackList, 0);
            console.log('[PLAYLIST] Playlist set, calling playTrack for track:', trackList[0]?.id);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && trackList[0] && trackList[0].id) {
                try {
                    await window.playTrack(trackList[0].id);
                    console.log('[PLAYLIST] playTrack called successfully');
                } catch (error) {
                    console.error('[PLAYLIST] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[PLAYLIST] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[PLAYLIST] setPlaylist not available, using fallback');
            window.playlist = trackList;
            window.currentTrackIndex = 0;
            try {
                await window.playTrack(trackList[0].id);
            } catch (error) {
                console.error('[PLAYLIST] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[PLAYLIST] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
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
            // Если трек не найден в плейлисте, просто воспроизводим его
            if (window.playTrack) {
                await window.playTrack(trackId);
            }
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение
        console.log('[PLAYLIST] Setting playlist with', trackList.length, 'tracks, starting at index:', trackIndex);
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(trackList, trackIndex);
            console.log('[PLAYLIST] Playlist set, calling playTrack for track:', trackList[trackIndex]?.id);
            // Явно запускаем трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && trackList[trackIndex] && trackList[trackIndex].id) {
                try {
                    await window.playTrack(trackList[trackIndex].id);
                    console.log('[PLAYLIST] playTrack called successfully');
                } catch (error) {
                    console.error('[PLAYLIST] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[PLAYLIST] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[PLAYLIST] setPlaylist not available, using fallback');
            window.playlist = trackList;
            window.currentTrackIndex = trackIndex;
            try {
                await window.playTrack(trackId);
            } catch (error) {
                console.error('[PLAYLIST] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[PLAYLIST] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing track from playlist:', error);
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
        // Загружаем треки, артистов и альбомы перед отображением (нужны для artwork)
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
        const playlist = await api.getPlaylistById(playlistId);
        const playlistTracks = await api.getPlaylistTracks(playlistId);
        const playlistTrackIds = new Set(playlistTracks.map(t => t.id || parseInt(t)));
        
        const availableTracks = window.tracks.filter(t => !playlistTrackIds.has(t.id));
        
        // Используем глобальную функцию getArtworkUrl для правильного получения artwork
        const getArtworkUrlLocal = (track) => {
            // Сначала пытаемся использовать глобальную функцию getArtworkUrl из app.js
            if (typeof window.getArtworkUrl === 'function') {
                try {
                    const artwork = window.getArtworkUrl(track);
                    if (artwork && artwork.trim() !== '') {
                        return artwork;
                    }
                } catch (e) {
                    console.warn('Error calling window.getArtworkUrl:', e);
                }
            }
            
            // Fallback: проверяем track -> album -> artist
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
                        const artist = window.artists && window.artists.length > 0 ? window.artists.find(a => a.id === track.artistId) : null;
                        const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                        const artworkUrl = getArtworkUrlLocal(track);
                        const hasArtwork = artworkUrl && artworkUrl.trim() !== '' && artworkUrl !== 'undefined' && artworkUrl !== 'null';
                        return `
                            <div class="track-item" data-track-id="${track.id}">
                                <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : 'background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;'}">
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

