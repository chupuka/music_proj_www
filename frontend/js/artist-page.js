// Artist Page Script
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
    console.log('[ARTIST_PAGE] initializePage called');
    console.log('[ARTIST_PAGE] window.initializeAuth:', typeof window.initializeAuth);
    console.log('[ARTIST_PAGE] window.api:', typeof window.api);
    console.log('[ARTIST_PAGE] window.api.isAuthenticated:', typeof window.api !== 'undefined' && window.api ? typeof window.api.isAuthenticated : 'N/A');
    
    // Initialize auth (user menu, login buttons)
    if (typeof window.initializeAuth === 'function') {
        console.log('[ARTIST_PAGE] Calling window.initializeAuth');
        window.initializeAuth();
    } else {
        console.error('[ARTIST_PAGE] window.initializeAuth is not a function');
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
    
    // Get artist ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');
    
    if (!artistId) {
        const container = document.getElementById('artistDetails');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Исполнитель не найден</p></div>';
        }
        return;
    }
    
    await loadArtistDetails(artistId);
}

async function loadArtistDetails(artistId) {
    const container = document.getElementById('artistDetails');
    
    try {
        // Загружаем артистов
        await loadArtists();
        
        // Находим артиста
        const artist = window.artists.find(a => a.id === parseInt(artistId));
        if (!artist) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Исполнитель не найден</p></div>';
            return;
        }
        
        // Получаем треки артиста
        await loadTracks();
        const artistTracks = window.tracks.filter(t => t.artistId === parseInt(artistId));
        
        // Загружаем альбомы для отображения
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
        // Получаем URL изображения артиста
        const apiBaseUrl = window.API_BASE_URL || API_BASE_URL || 'http://localhost:8080';
        let imageUrl = '';
        if (artist.imagePath && artist.imagePath.trim() !== '') {
            if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                imageUrl = artist.imagePath;
            } else if (artist.id) {
                imageUrl = `${apiBaseUrl}/api/files/artwork/artists/${artist.id}`;
            }
        }
        
        // Формируем HTML
        const artistHtml = `
            <div class="artist-details-main">
                <div class="artist-details-image">
                    ${imageUrl 
                        ? `<img src="${imageUrl}" alt="${escapeHtml(artist.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                        : ''
                    }
                    <div style="${imageUrl ? 'display: none;' : 'display: flex;'} width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 50%;">
                        <i class="fas fa-user" style="font-size: 80px; color: #888;"></i>
                    </div>
                </div>
                <div class="artist-details-info">
                    <div class="artist-details-label">ИСПОЛНИТЕЛЬ</div>
                    <h1 class="artist-details-name">${escapeHtml(artist.name)}</h1>
                    <div class="artist-details-stats">
                        <span class="artist-track-count">${artistTracks.length} трек${artistTracks.length !== 1 ? 'ов' : ''}</span>
                        <div class="artist-stats" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                            <strong style="display: block; margin-bottom: 8px;">Статистика прослушиваний исполнителя:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px;">
                                ${(() => {
                                    const totalAll = artistTracks.reduce((sum, t) => sum + (t.playCountAll || 0), 0);
                                    const totalMonth = artistTracks.reduce((sum, t) => sum + (t.playCountMonth || 0), 0);
                                    const totalWeek = artistTracks.reduce((sum, t) => sum + (t.playCountWeek || 0), 0);
                                    const totalDay = artistTracks.reduce((sum, t) => sum + (t.playCountDay || 0), 0);
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
                    ${artist.description ? `
                    <div class="artist-description">
                        ${escapeHtml(artist.description)}
                    </div>
                    ` : ''}
                    <div class="artist-details-actions">
                        <button class="btn-listen" onclick="playArtistTracks(${artist.id})">
                            <i class="fas fa-play"></i> Слушать
                        </button>
                        <button class="btn-favorite-action" id="artistFavoriteBtn" onclick="toggleArtistFavorite(${artist.id})" title="Добавить в Мою музыку">
                            <i class="far fa-heart" id="artistFavoriteIcon"></i>
                        </button>
                        <button class="btn-share" title="Поделиться">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="artist-tracks-section">
                <div class="section-header">
                    <h2 class="section-title">Треки</h2>
                    <div class="artist-tabs">
                        <button class="tab-btn active" data-tab="popular">Популярные</button>
                        <button class="tab-btn" data-tab="new">Новинки</button>
                        <button class="tab-btn" data-tab="alphabetical">По алфавиту</button>
                    </div>
                </div>
                <div class="tracks-list">
                    ${artistTracks.map((track, index) => {
                        const artworkUrl = getArtworkUrl(track);
                        const duration = formatDuration(track.durationSeconds);
                        return `
                            <div class="track-item" data-track-id="${track.id}">
                                <div class="track-number">${index + 1}</div>
                                <button class="btn-play" onclick="playTrackFromArtist(${artist.id}, ${track.id})" title="Воспроизвести">
                                    <i class="fas fa-play"></i>
                                </button>
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
                                    <div class="track-artist"><a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artist.name)}</a></div>
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
                    }).join('')}
                </div>
            </div>
            
            <!-- Artist Albums Section -->
            <div class="artist-albums-section" style="margin-top: 40px;">
                <h2 class="section-title" style="margin-bottom: 24px;">Альбомы</h2>
                <div class="cards-grid">
                    ${(() => {
                        const artistAlbums = window.albums ? window.albums.filter(a => a.artistId === parseInt(artistId)) : [];
                        if (artistAlbums.length === 0) {
                            return '<div class="empty-state"><i class="fas fa-compact-disc"></i><p>Альбомов пока нет</p></div>';
                        }
                        return artistAlbums.map(album => {
                            let artworkUrl = '';
                            if (album.artworkPath) {
                                if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                                    artworkUrl = album.artworkPath;
                                } else {
                                    artworkUrl = `${apiBaseUrl}/api/files/artwork/albums/${album.id}`;
                                }
                            }
                            return `
                                <div class="card album-card" data-album-id="${album.id}" onclick="window.location.href='album.html?id=${album.id}'">
                                    <div class="card-image-container">
                                        ${artworkUrl ? `<img src="${artworkUrl}" alt="${escapeHtml(album.title)}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="card-image-placeholder" style="display: none;"><i class="fas fa-compact-disc"></i></div>` : '<div class="card-image-placeholder"><i class="fas fa-compact-disc"></i></div>'}
                                        <button class="card-play-button" onclick="event.stopPropagation(); playAlbum(${album.id})" title="Воспроизвести альбом">
                                            <i class="fas fa-play"></i>
                                        </button>
                                    </div>
                                    <a href="album.html?id=${album.id}" class="card-link" onclick="event.stopPropagation();">
                                        <div class="card-title">${escapeHtml(album.title)}</div>
                                        <div class="card-subtitle">${album.releaseYear || 'Альбом'}</div>
                                    </a>
                                </div>
                            `;
                        }).join('');
                    })()}
                </div>
            </div>
        `;
        
        container.innerHTML = artistHtml;
        
        // Check favorite status
        await checkArtistFavoriteStatus(parseInt(artistId));
        
        // Инициализация табов
        initializeArtistTabs(artistTracks);
        
    } catch (error) {
        console.error('Error loading artist details:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки: ${error.message}</p></div>`;
    }
}

function initializeArtistTabs(tracks) {
    document.querySelectorAll('.artist-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.artist-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            let sortedTracks = [...tracks];
            
            if (tab === 'new') {
                sortedTracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (tab === 'alphabetical') {
                sortedTracks.sort((a, b) => a.title.localeCompare(b.title));
            }
            // popular остается в исходном порядке
            
            const tracksList = document.querySelector('.artist-tracks-section .tracks-list');
            tracksList.innerHTML = sortedTracks.map((track, index) => {
                const artworkUrl = getArtworkUrl(track);
                const duration = formatDuration(track.durationSeconds);
                const artist = window.artists.find(a => a.id === track.artistId);
                return `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-number">${index + 1}</div>
                        <button class="btn-play" onclick="playTrackFromArtist(${track.artistId}, ${track.id})" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
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
                            <div class="track-artist"><a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artist ? artist.name : '')}</a></div>
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
            }).join('');
        });
    });
}

async function playArtistTracks(artistId) {
    try {
        // Если треки еще не загружены, загружаем их
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const artistTracks = window.tracks.filter(t => t.artistId === parseInt(artistId));
        if (artistTracks.length === 0) {
            alert('У этого исполнителя нет треков');
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        console.log('[ARTIST_PAGE] Setting playlist with', artistTracks.length, 'tracks');
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(artistTracks, 0);
            console.log('[ARTIST_PAGE] Playlist set, calling playTrack for track:', artistTracks[0]?.id);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && artistTracks[0] && artistTracks[0].id) {
                try {
                    await window.playTrack(artistTracks[0].id);
                    console.log('[ARTIST_PAGE] playTrack called successfully');
                } catch (error) {
                    console.error('[ARTIST_PAGE] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[ARTIST_PAGE] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[ARTIST_PAGE] setPlaylist not available, using fallback');
            window.playlist = artistTracks;
            window.currentTrackIndex = 0;
            try {
                await window.playTrack(artistTracks[0].id);
            } catch (error) {
                console.error('[ARTIST_PAGE] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[ARTIST_PAGE] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing artist tracks:', error);
        alert('Ошибка воспроизведения треков исполнителя: ' + error.message);
    }
}

async function playTrackFromArtist(artistId, trackId) {
    try {
        // Если треки еще не загружены, загружаем их
        if (!window.tracks || window.tracks.length === 0) {
            window.tracks = await api.getTracks();
        }
        
        const artistTracks = window.tracks.filter(t => t.artistId === parseInt(artistId));
        const trackIndex = artistTracks.findIndex(t => t.id === parseInt(trackId));
        
        if (trackIndex === -1) {
            // Если трек не найден в списке исполнителя, просто воспроизводим его
            if (window.playTrack) {
                await window.playTrack(trackId);
            }
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение
        console.log('[ARTIST_PAGE] Setting playlist with', artistTracks.length, 'tracks, starting at index:', trackIndex);
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(artistTracks, trackIndex);
            console.log('[ARTIST_PAGE] Playlist set, calling playTrack for track:', artistTracks[trackIndex]?.id);
            // Явно запускаем трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && artistTracks[trackIndex] && artistTracks[trackIndex].id) {
                try {
                    await window.playTrack(artistTracks[trackIndex].id);
                    console.log('[ARTIST_PAGE] playTrack called successfully');
                } catch (error) {
                    console.error('[ARTIST_PAGE] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[ARTIST_PAGE] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[ARTIST_PAGE] setPlaylist not available, using fallback');
            window.playlist = artistTracks;
            window.currentTrackIndex = trackIndex;
            try {
                await window.playTrack(trackId);
            } catch (error) {
                console.error('[ARTIST_PAGE] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[ARTIST_PAGE] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing track from artist:', error);
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

// Helper function for download
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

// Toggle favorite artist
async function toggleArtistFavorite(artistId) {
    const user = window.api.getCurrentUser();
    if (!user) {
        if (window.openModal) {
            window.openModal('loginModal');
        }
        return;
    }
    
    const btn = document.getElementById('artistFavoriteBtn');
    const icon = document.getElementById('artistFavoriteIcon');
    
    if (!btn || !icon) return;
    
    const isCurrentlyFavorite = btn.classList.contains('active');
    
    try {
        if (isCurrentlyFavorite) {
            await window.api.removeFavoriteArtist(user.id, artistId);
            btn.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
            // Save to localStorage as fallback
            const stored = localStorage.getItem(`favoriteArtists_${user.id}`);
            const artistIds = stored ? JSON.parse(stored) : [];
            const updated = artistIds.filter(id => id !== artistId);
            localStorage.setItem(`favoriteArtists_${user.id}`, JSON.stringify(updated));
        } else {
            await window.api.addFavoriteArtist(user.id, artistId);
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
            // Save to localStorage as fallback
            const stored = localStorage.getItem(`favoriteArtists_${user.id}`);
            const artistIds = stored ? JSON.parse(stored) : [];
            if (!artistIds.includes(artistId)) {
                artistIds.push(artistId);
                localStorage.setItem(`favoriteArtists_${user.id}`, JSON.stringify(artistIds));
            }
        }
    } catch (error) {
        console.error('Error toggling favorite artist:', error);
        alert('Ошибка: ' + (error.message || 'Не удалось добавить исполнителя'));
    }
}

// Check artist favorite status
async function checkArtistFavoriteStatus(artistId) {
    const user = window.api.getCurrentUser();
    if (!user) return;
    
    try {
        const favoriteArtistIds = await getFavoriteArtistIds(user.id);
        const btn = document.getElementById('artistFavoriteBtn');
        const icon = document.getElementById('artistFavoriteIcon');
        
        if (btn && icon && favoriteArtistIds.includes(artistId)) {
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    } catch (error) {
        console.warn('Error checking artist favorite status:', error);
    }
}

// Helper function to get favorite artist IDs
async function getFavoriteArtistIds(userId) {
    try {
        if (window.api.getFavoriteArtists) {
            return await window.api.getFavoriteArtists(userId);
        }
        const stored = localStorage.getItem(`favoriteArtists_${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Error getting favorite artists:', error);
        const stored = localStorage.getItem(`favoriteArtists_${userId}`);
        return stored ? JSON.parse(stored) : [];
    }
}

// Make functions globally available
window.playTrackFromArtist = playTrackFromArtist;
window.playArtistTracks = playArtistTracks;
window.downloadTrack = downloadTrack;
window.toggleArtistFavorite = toggleArtistFavorite;
window.playAlbum = window.playAlbum || async function(albumId) {
    try {
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        const album = window.albums.find(a => a.id === albumId);
        if (!album) return;
        
        const allTracks = await api.getTracks();
        const albumTracks = allTracks.filter(t => t.albumId === albumId);
        
        if (albumTracks.length === 0) {
            alert('В этом альбоме нет треков');
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        if (window.setPlaylist) {
            window.setPlaylist(albumTracks, 0);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && albumTracks[0] && albumTracks[0].id) {
                await window.playTrack(albumTracks[0].id);
            }
        } else if (window.playTrack) {
            window.playlist = albumTracks;
            window.currentTrackIndex = 0;
            await window.playTrack(albumTracks[0].id);
        }
    } catch (error) {
        console.error('Error playing album:', error);
        alert('Ошибка воспроизведения альбома: ' + error.message);
    }
};
