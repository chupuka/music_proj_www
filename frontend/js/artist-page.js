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
                    ${artistTracks.map(track => {
                        const artworkUrl = getArtworkUrl(track);
                        const duration = formatDuration(track.durationSeconds);
                        return `
                            <div class="track-item" data-track-id="${track.id}">
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
        `;
        
        container.innerHTML = artistHtml;
        
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
            tracksList.innerHTML = sortedTracks.map(track => {
                const artworkUrl = getArtworkUrl(track);
                const duration = formatDuration(track.durationSeconds);
                const artist = window.artists.find(a => a.id === track.artistId);
                return `
                    <div class="track-item" data-track-id="${track.id}">
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

function playArtistTracks(artistId) {
    const artistTracks = window.tracks.filter(t => t.artistId === artistId);
    if (artistTracks.length > 0) {
        playTrack(artistTracks[0].id);
    }
}

