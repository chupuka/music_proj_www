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
    // Fallback implementation
    if (!track) return '';
    const imagePath = track.artworkPath;
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath;
    }
    return track.artworkPath ? `${window.API_BASE_URL || 'http://localhost:8080'}/api/files/artwork/tracks/${track.id}` : '';
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
        
        // Загружаем артистов и альбомы если нужно
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
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
        
        let html = `
            <div class="album-details-main">
                <div class="album-details-artwork">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="album-details-info">
                    <div class="album-details-label">Жанр</div>
                    <h1 class="album-details-title">${escapeHtml(genreName)}</h1>
                    <div class="album-details-meta">${description}</div>
                    <div class="album-details-meta">${genreTracks.length} треков</div>
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
                            <button class="btn-play" onclick="playTrackFromGenre('${escapeHtml(genreName)}', ${track.id})" title="Воспроизвести">
                                <i class="fas fa-play"></i>
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

// Make functions globally available
window.playGenreTracks = playGenreTracks;
window.playTrackFromGenre = playTrackFromGenre;

