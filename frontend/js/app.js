// Application State
let currentPage = 'my-music';
let currentPeriod = 'day';
let tracks = [];
let artists = [];
let albums = [];
let filteredTracks = [];

// Make available globally
window.tracks = tracks;
window.artists = artists;
window.albums = albums;

// Initialize App with Page Transitions
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[MAIN] DOMContentLoaded - starting initialization');
    console.log('[MAIN] window.api:', typeof window.api);
    console.log('[MAIN] api object:', typeof api !== 'undefined' ? api : 'undefined');
    console.log('[MAIN] api.isAuthenticated:', typeof api !== 'undefined' && api ? api.isAuthenticated() : 'N/A');
    
    // Add page transition class
    const main = document.querySelector('main');
    if (main) {
        main.classList.add('page-transition');
    }
    
    // Инициализация только если элементы существуют
    const isMainPage = document.getElementById('tracksList') !== null;
    console.log('[MAIN] isMainPage:', isMainPage);
    
    // Auth initialization (всюду)
    console.log('[MAIN] Calling initializeAuth');
    initializeAuth();
    
    // Initialize modals
    console.log('[MAIN] Calling initializeModals');
    initializeModals();
    
    // Инициализация навигации только на главной странице
    if (isMainPage) {
        console.log('[MAIN] Main page - initializing navigation, filters, search');
        initializeNavigation();
        // initializeFilters(); // Убрано - фильтры больше не используются в жанрах
        initializeSearch();
        // Проверяем параметр поиска в URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            console.log('[MAIN] Search query found in URL:', searchQuery);
            document.getElementById('searchInput').value = searchQuery;
            searchAndDisplayResults(searchQuery);
        } else {
            // Load initial page content
            navigateToPage(currentPage);
        }
    }
    
    // Инициализация темы (всюду)
    console.log('[MAIN] Calling initializeTheme');
    initializeTheme();
    
    // Загружаем артистов и альбомы перед треками (нужны для отображения)
    console.log('[MAIN] Loading artists and albums');
    await Promise.all([
        loadArtists(),
        loadAlbums()
    ]);
    
    // Треки загружаются через navigateToPage
    
    console.log('[MAIN] Initialization complete');
});

// Auth Initialization - предотвращаем дублирование обработчиков
function initializeAuth() {
    console.log('[AUTH] initializeAuth called');
    console.log('[AUTH] api object:', typeof api !== 'undefined' ? api : 'undefined');
    console.log('[AUTH] api.isAuthenticated:', typeof api !== 'undefined' && api ? api.isAuthenticated() : 'N/A');
    
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginForm = document.getElementById('loginForm');
    
    const userMenu = document.getElementById('userMenu');
    console.log('[AUTH] DOM elements:', {
        loginBtn: !!loginBtn,
        profileBtn: !!profileBtn,
        logoutBtn: !!logoutBtn,
        loginForm: !!loginForm,
        userMenu: !!userMenu,
        loginBtnId: loginBtn ? loginBtn.id : 'N/A',
        userMenuId: userMenu ? userMenu.id : 'N/A'
    });
    
    // Проверяем наличие критически важных элементов (loginBtn обязателен)
    if (!loginBtn) {
        console.error('[AUTH] loginBtn missing! Cannot initialize auth. Page URL:', window.location.href);
        return; // loginBtn обязателен для работы
    }
    
    // Проверяем наличие других элементов, но продолжаем работу даже если их нет
    if (!userMenu) {
        console.error('[AUTH] userMenu missing! Cannot show user menu. Page URL:', window.location.href);
    }
    if (!profileBtn) {
        console.warn('[AUTH] profileBtn missing, will skip profile button handler');
    }
    if (!logoutBtn) {
        console.warn('[AUTH] logoutBtn missing, will skip logout button handler');
    }
    if (!loginForm) {
        console.warn('[AUTH] loginForm missing (normal for non-main pages), will skip login form handler');
    }
    
    // КРИТИЧНО: Продолжаем инициализацию даже если некоторые элементы отсутствуют
    // Обязательны только loginBtn и userMenu (для отображения пользователя)
    
    // Проверяем, были ли уже добавлены обработчики (используем data-атрибут)
    if (loginBtn.hasAttribute('data-auth-initialized')) {
        console.log('[AUTH] Already initialized, updating UI state');
        // Обновляем состояние UI даже если уже инициализировано
        updateUserMenuState();
        return;
    }
    
    // Помечаем loginBtn как инициализированный (это обязательный элемент)
    loginBtn.setAttribute('data-auth-initialized', 'true');
    if (profileBtn) profileBtn.setAttribute('data-auth-initialized', 'true');
    if (logoutBtn) logoutBtn.setAttribute('data-auth-initialized', 'true');
    if (loginForm) loginForm.setAttribute('data-auth-initialized', 'true');
    
    console.log('[AUTH] Setting up event listeners and updating UI state');
    
    // ВАЖНО: Сначала обновляем состояние UI (показываем пользователя если авторизован)
    // Обновляем состояние UI - ждем немного для загрузки DOM
    setTimeout(() => {
        console.log('[AUTH] Calling updateUserMenuState after delay');
        updateUserMenuState();
    }, 50);
    
    // Устанавливаем обработчики событий для loginBtn (обязателен)
    // Проверяем, есть ли уже обработчик (чтобы не дублировать)
    if (!loginBtn.hasAttribute('data-click-handler-added')) {
        loginBtn.setAttribute('data-click-handler-added', 'true');
        loginBtn.addEventListener('click', () => {
            console.log('[AUTH] Login button clicked');
            // На страницах без модала, перенаправляем на главную для входа
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                openModal('loginModal');
            } else {
                // Если модала нет, переходим на главную страницу
                window.location.href = 'index.html';
            }
        });
    }
    
    // Обработчики для других элементов (не обязательны)
    if (profileBtn && !profileBtn.hasAttribute('data-click-handler-added')) {
        profileBtn.setAttribute('data-click-handler-added', 'true');
        profileBtn.addEventListener('click', () => {
            console.log('[AUTH] Profile button clicked');
            openProfileModal();
        });
    }
    
    if (logoutBtn && !logoutBtn.hasAttribute('data-click-handler-added')) {
        logoutBtn.setAttribute('data-click-handler-added', 'true');
        logoutBtn.addEventListener('click', () => {
            console.log('[AUTH] Logout button clicked');
            api.logout();
            hideUserMenu();
            showLoginButton();
            const profileModal = document.getElementById('profileModal');
            if (profileModal && profileModal.classList.contains('active')) {
                closeModal('profileModal');
            }
        });
    }
    
    // Login Form (только если есть на странице)
    if (loginForm && !loginForm.hasAttribute('data-submit-handler-added')) {
        loginForm.setAttribute('data-submit-handler-added', 'true');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (!email || !password) {
                showError('loginError', 'Заполните все поля');
                return;
            }
            
            try {
                const user = await api.login(email, password);
                showSuccess('loginError', 'Успешный вход!');
                setTimeout(() => {
                    closeModal('loginModal');
                    updateUserMenuState();
                    hideError('loginError');
                    const form = document.getElementById('loginForm');
                    if (form) form.reset();
                }, 1000);
            } catch (error) {
                showError('loginError', error.message || 'Ошибка входа');
            }
        });
    }
    
    // Register Form (только если есть на странице)
    const registerForm = document.getElementById('registerForm');
    if (registerForm && !registerForm.hasAttribute('data-auth-initialized')) {
        registerForm.setAttribute('data-auth-initialized', 'true');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('regUsername')?.value,
                email: document.getElementById('regEmail')?.value,
                password: document.getElementById('regPassword')?.value,
                firstName: document.getElementById('regFirstName')?.value || null,
                lastName: document.getElementById('regLastName')?.value || null,
            };
            
            try {
                const user = await api.register(userData);
                showSuccess('registerError', 'Регистрация успешна!');
                setTimeout(() => {
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        closeModal('loginModal');
                    }
                    updateUserMenuState();
                    hideError('registerError');
                    if (registerForm) registerForm.reset();
                }, 1000);
            } catch (error) {
                showError('registerError', error.message || 'Ошибка регистрации');
            }
        });
    }
}

// Navigation
// Get play button HTML based on track state
function getPlayButtonHtml(trackId) {
    const trackInfo = window.getCurrentTrackInfo ? window.getCurrentTrackInfo() : { trackId: null, isPlaying: false };
    const isCurrentTrack = trackInfo.trackId === trackId;
    const isCurrentlyPlaying = isCurrentTrack && trackInfo.isPlaying;
    
    if (isCurrentlyPlaying) {
        // Show stop icon for currently playing track (only visible on hover)
        return `<button class="btn-play" onclick="playTrack(${trackId})" title="Остановить">
            <i class="fas fa-stop"></i>
        </button>`;
    } else {
        // Show play icon for other tracks (only visible on hover)
        return `<button class="btn-play" onclick="playTrack(${trackId})" title="Воспроизвести">
            <i class="fas fa-play"></i>
        </button>`;
    }
}

// Update all play buttons based on current track state
function updatePlayButtons() {
    // Get current track info without affecting playback
    const trackInfo = window.getCurrentTrackInfo ? window.getCurrentTrackInfo() : { trackId: null, isPlaying: false };
    
    // Only update buttons if there's a current track
    if (!trackInfo.trackId) return;
    
    document.querySelectorAll('.btn-play').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (!onclickAttr) return;
        
        const trackIdMatch = onclickAttr.match(/playTrack\((\d+)\)/);
        if (!trackIdMatch) return;
        
        const trackId = parseInt(trackIdMatch[1]);
        if (!trackId) return;
        
        const isCurrentTrack = trackInfo.trackId === trackId;
        const isCurrentlyPlaying = isCurrentTrack && trackInfo.isPlaying;
        
        const icon = btn.querySelector('i');
        if (icon) {
            if (isCurrentlyPlaying) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-stop');
                btn.setAttribute('title', 'Остановить');
            } else {
                icon.classList.remove('fa-stop');
                icon.classList.add('fa-play');
                btn.setAttribute('title', 'Воспроизвести');
            }
        }
    });
}

function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Add click handlers for logo links
    document.querySelectorAll('.logo-link, .site-name').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to "Моя музыка" and update active state
            navigateToPage('my-music');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const myMusicNav = document.querySelector('.nav-item[data-page="my-music"]');
            if (myMusicNav) {
                myMusicNav.classList.add('active');
            }
        });
    });
}

async function navigateToPage(page) {
    currentPage = page;
    const titleMap = {
        'my-music': 'Моя музыка',
        'new-releases': 'Новинки',
        'artists': 'Исполнители',
        'recommendations': 'Рекомендации',
        'genres': 'Жанры'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titleMap[page] || 'Моя музыка';
    }
    
    const tracksList = document.getElementById('tracksList');
    const mainTabs = document.getElementById('mainTabs');
    const newReleasesTabs = document.getElementById('newReleasesTabs');
    const filtersContainer = document.getElementById('filtersContainer');
    
    // Reset class for tracks list
    if (tracksList) {
        tracksList.className = '';
    }
    
    // Show/hide tabs and filters based on page
    if (page === 'my-music') {
        if (mainTabs) mainTabs.style.display = 'flex';
        if (newReleasesTabs) newReleasesTabs.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        // Show sidebar for favorite artists
        const sidebar = document.getElementById('myMusicSidebar');
        const container = document.getElementById('mainContentContainer');
        if (sidebar) sidebar.style.display = 'block';
        if (container) container.style.display = 'grid';
        // Load favorite artists
        await loadFavoriteArtists();
        // Load default tab (favorite tracks)
        loadMyMusicTab('favorite-tracks');
        initializeMyMusicTabs();
    } else if (page === 'new-releases') {
        if (mainTabs) mainTabs.style.display = 'none';
        if (newReleasesTabs) newReleasesTabs.style.display = 'flex';
        if (filtersContainer) filtersContainer.style.display = 'none';
        const sidebar = document.getElementById('myMusicSidebar');
        const container = document.getElementById('mainContentContainer');
        if (sidebar) sidebar.style.display = 'none';
        if (container) container.style.display = 'block';
        // Load default tab (new tracks)
        loadNewReleasesTab('new-tracks');
        initializeNewReleasesTabs();
    } else if (page === 'artists') {
        if (mainTabs) mainTabs.style.display = 'none';
        if (newReleasesTabs) newReleasesTabs.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        const sidebar = document.getElementById('myMusicSidebar');
        const container = document.getElementById('mainContentContainer');
        if (sidebar) sidebar.style.display = 'none';
        if (container) container.style.display = 'block';
        displayArtists();
    } else if (page === 'recommendations') {
        if (mainTabs) mainTabs.style.display = 'none';
        if (newReleasesTabs) newReleasesTabs.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        const sidebar = document.getElementById('myMusicSidebar');
        const container = document.getElementById('mainContentContainer');
        if (sidebar) sidebar.style.display = 'none';
        if (container) container.style.display = 'block';
        loadRecommendations();
    } else if (page === 'genres') {
        if (mainTabs) mainTabs.style.display = 'none';
        if (newReleasesTabs) newReleasesTabs.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        const sidebar = document.getElementById('myMusicSidebar');
        const container = document.getElementById('mainContentContainer');
        if (sidebar) sidebar.style.display = 'none';
        if (container) container.style.display = 'block';
        
        // При переходе на вкладку "Жанры" всегда показываем список жанров
        // Очищаем URL от параметра genre, если он есть
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('genre')) {
            urlParams.delete('genre');
            const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
        
        // Всегда загружаем список жанров
        loadGenres();
    } else {
        // For tracks, ensure it's tracks-list class
        if (tracksList) {
            tracksList.className = 'tracks-list';
        }
        if (mainTabs) mainTabs.style.display = 'none';
        if (newReleasesTabs) newReleasesTabs.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'flex';
        loadTracks();
    }
    
    // Music continues playing - audio element is persistent across page navigation
    // The player.js audio element is not destroyed when navigating, so music keeps playing
    // IMPORTANT: Do NOT pause or stop the player when switching tabs
    
    // Update play buttons after navigation to reflect current player state
    // But do NOT dispatch play/pause events as they may interfere with playback
    setTimeout(() => {
        updatePlayButtons();
        // Just update buttons based on current state, don't trigger events
        // The player state is preserved, we just need to update button icons
    }, 200);
}

// Initialize tabs for My Music
function initializeMyMusicTabs() {
    // Remove old listeners
    document.querySelectorAll('#mainTabs .tab-btn-new').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    document.querySelectorAll('#mainTabs .tab-btn-new').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active state
            document.querySelectorAll('#mainTabs .tab-btn-new').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Load tab content
            loadMyMusicTab(tab);
        });
    });
}

// Initialize tabs for New Releases
function initializeNewReleasesTabs() {
    // Remove old listeners
    document.querySelectorAll('#newReleasesTabs .tab-btn-new').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    document.querySelectorAll('#newReleasesTabs .tab-btn-new').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active state
            document.querySelectorAll('#newReleasesTabs .tab-btn-new').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Load tab content
            loadNewReleasesTab(tab);
        });
    });
}

// Load New Releases tab content
async function loadNewReleasesTab(tab) {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (tab === 'new-tracks') {
            await loadNewTracksPage();
        } else if (tab === 'new-albums') {
            await displayNewAlbums();
        }
    } catch (error) {
        console.error('[APP] Error loading new releases tab content:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки: ${error.message}</p>
        </div>`;
    }
}

// Load My Music tab content
async function loadMyMusicTab(tab) {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (tab === 'favorite-tracks') {
            await loadFavoriteTracks();
        } else if (tab === 'playlists') {
            await loadPlaylists();
        }
    } catch (error) {
        console.error('[APP] Error loading tab content:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки: ${error.message}</p>
        </div>`;
    }
}

// Load favorite tracks (user's liked tracks)
async function loadFavoriteTracks() {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    try {
        const user = api.getCurrentUser();
        if (!user) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Войдите, чтобы увидеть свои треки</p></div>';
            return;
        }
        
        // Get user's favorite tracks
        const favoriteTracks = await api.getFavoriteTracks(user.id);
        
        if (favoriteTracks.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>У вас пока нет избранных треков</p><p style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">Добавляйте треки в избранное, нажимая на сердечко</p></div>';
            return;
        }
        
        // Display tracks
        tracksList.className = 'tracks-list';
        window.filteredTracks = favoriteTracks;
        
        // Устанавливаем window.favoriteTracks для восстановления состояния плеера
        window.favoriteTracks = favoriteTracks;
        // Устанавливаем плейлист в плеер для переключения треков
        if (window.setPlaylist && favoriteTracks.length > 0) {
            window.setPlaylist(favoriteTracks, 0);
        }
        
        let html = '';
        html += favoriteTracks.map((track, index) => {
            const artistName = getArtistName(track.artistId);
            const artworkUrl = getArtworkUrl(track) || 'logo.jpg';
            const duration = formatDuration(track.durationSeconds);
            
            return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                ${getPlayButtonHtml(track.id)}
                <div class="track-artwork" style="background-image: url('${artworkUrl}'); background-size: cover; background-position: center;" onclick="playTrack(${track.id})">
                    ${!artworkUrl || artworkUrl === 'logo.jpg' ? '<i class="fas fa-music"></i>' : ''}
                </div>
                <div class="track-info">
                    <div class="track-title" onclick="playTrack(${track.id})">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(artistName || 'Неизвестный исполнитель')}</div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                        <i class="fas fa-list"></i>
                    </button>` : ''}
                    <button class="btn-favorite active" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Удалить из избранного">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        tracksList.innerHTML = html;
        
        // Update play buttons after rendering
        setTimeout(() => updatePlayButtons(), 100);
    } catch (error) {
        console.error('[APP] Error loading favorite tracks:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки избранных треков: ${error.message}</p>
        </div>`;
    }
}

// Load new tracks page
async function loadNewTracksPage() {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    try {
        // Load new tracks using API method
        const newTracks = await api.getNewTracks(50);
        
        if (newTracks.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>Новых треков пока нет</p></div>';
            return;
        }
        
        // Display tracks
        tracksList.className = 'tracks-list';
        window.filteredTracks = newTracks;
        
        // Устанавливаем плейлист в плеер для переключения треков
        if (window.setPlaylist && newTracks.length > 0) {
            window.setPlaylist(newTracks, 0);
        }
        
        let html = '';
        html += newTracks.map((track, index) => {
            const artistName = getArtistName(track.artistId);
            const artworkUrl = getArtworkUrl(track) || 'logo.jpg';
            const duration = formatDuration(track.durationSeconds);
            
            return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                ${getPlayButtonHtml(track.id)}
                <div class="track-artwork" style="background-image: url('${artworkUrl}'); background-size: cover; background-position: center;" onclick="playTrack(${track.id})">
                    ${!artworkUrl || artworkUrl === 'logo.jpg' ? '<i class="fas fa-music"></i>' : ''}
                </div>
                <div class="track-info">
                    <div class="track-title" onclick="playTrack(${track.id})">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(artistName || 'Неизвестный исполнитель')}</div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                        <i class="fas fa-list"></i>
                    </button>` : ''}
                    <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        tracksList.innerHTML = html;
        
        // Load favorite status
        if (api.isAuthenticated()) {
            loadFavoriteStatus();
        }
        
        // Update play buttons after rendering
        setTimeout(() => updatePlayButtons(), 100);
    } catch (error) {
        console.error('[APP] Error loading new tracks:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки новых треков: ${error.message}</p>
        </div>`;
    }
}

// Load recommendations
async function loadRecommendations() {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка рекомендаций...</p></div>';
    
    try {
        const user = api.getCurrentUser();
        if (!user) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Войдите, чтобы увидеть рекомендации</p></div>';
            return;
        }
        
        // Try to get recommendations from Recommendation Service
        let recommendedTrackIds = [];
        try {
            recommendedTrackIds = await api.getRecommendedTracks(user.id);
        } catch (error) {
            console.warn('[APP] Recommendation service not available, using analytics:', error);
            // Fallback: get popular tracks based on user history
            try {
                const history = await api.getUserHistory(user.id, 20);
                if (history && history.length > 0) {
                    // Get most played tracks from history
                    const trackCounts = {};
                    history.forEach(item => {
                        trackCounts[item.trackId] = (trackCounts[item.trackId] || 0) + 1;
                    });
                    // Sort by count and get top 10
                    recommendedTrackIds = Object.entries(trackCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([trackId]) => parseInt(trackId));
                }
            } catch (historyError) {
                console.warn('[APP] Could not get history:', historyError);
            }
        }
        
        // If no recommendations, use popular tracks
        if (!recommendedTrackIds || recommendedTrackIds.length === 0) {
            const popularTracks = await api.getPopularTracks(20);
            recommendedTrackIds = popularTracks.map(t => t.id);
        }
        
        // Load track details
        const recommendedTracks = [];
        for (const trackId of recommendedTrackIds) {
            try {
                const track = await api.getTrackById(trackId);
                if (track) {
                    recommendedTracks.push(track);
                }
            } catch (error) {
                console.warn(`[APP] Could not load track ${trackId}:`, error);
            }
        }
        
        if (recommendedTracks.length === 0) {
            // Fallback to popular tracks
            const popularTracks = await api.getPopularTracks(20);
            window.filteredTracks = popularTracks;
        } else {
            window.filteredTracks = recommendedTracks;
        }
        
        // Устанавливаем плейлист в плеер для переключения треков
        if (window.setPlaylist && window.filteredTracks.length > 0) {
            window.setPlaylist(window.filteredTracks, 0);
        }
        
        // Display tracks
        tracksList.className = 'tracks-list';
        
        let html = '';
        html += window.filteredTracks.map((track, index) => {
            const artistName = getArtistName(track.artistId);
            const artworkUrl = getArtworkUrl(track) || 'logo.jpg';
            const duration = formatDuration(track.durationSeconds);
            
            return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                ${getPlayButtonHtml(track.id)}
                <div class="track-artwork" style="background-image: url('${artworkUrl}'); background-size: cover; background-position: center;" onclick="playTrack(${track.id})">
                    ${!artworkUrl || artworkUrl === 'logo.jpg' ? '<i class="fas fa-music"></i>' : ''}
                </div>
                <div class="track-info">
                    <div class="track-title" onclick="playTrack(${track.id})">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(artistName || 'Неизвестный исполнитель')}</div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                        <i class="fas fa-list"></i>
                    </button>` : ''}
                    <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        tracksList.innerHTML = html;
        
        // Load favorite status
        if (api.isAuthenticated()) {
            loadFavoriteStatus();
        }
        
        // Update play buttons after rendering
        setTimeout(() => updatePlayButtons(), 100);
    } catch (error) {
        console.error('[APP] Error loading recommendations:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки рекомендаций: ${error.message}</p>
        </div>`;
    }
}

// Display new albums
async function displayNewAlbums() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка новых альбомов...</p></div>';
    
    try {
        if (!albums || albums.length === 0) {
            await loadAlbums();
        }
        
        if (albums.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-compact-disc"></i><p>Альбомов пока нет</p></div>';
            return;
        }
        
        // Загружаем артистов для отображения имен
        if (!artists || artists.length === 0) {
            await loadArtists();
        }
        
        // Сортируем альбомы по дате создания (новые первыми)
        const newAlbums = [...albums].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        }).slice(0, 20); // Показываем только 20 самых новых
        
        tracksList.className = 'cards-grid';
        tracksList.innerHTML = newAlbums.map(album => {
            let artworkUrl = '';
            if (album.artworkPath) {
                if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                    artworkUrl = album.artworkPath;
                } else {
                    artworkUrl = `${API_BASE_URL}/api/files/artwork/albums/${album.id}`;
                }
            }
            
            const artist = artists.find(a => a.id === album.artistId);
            const artistName = artist ? artist.name : 'Неизвестный исполнитель';
            
            return `
                <div class="card album-card" data-album-id="${album.id}">
                    <div class="card-image-container" onclick="window.location.href='album.html?id=${album.id}'">
                        ${artworkUrl ? `<img src="${artworkUrl}" alt="${escapeHtml(album.title)}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="card-image-placeholder" style="display: none;"><i class="fas fa-compact-disc"></i></div>` : '<div class="card-image-placeholder"><i class="fas fa-compact-disc"></i></div>'}
                        <button class="card-play-button" onclick="event.stopPropagation(); playAlbum(${album.id})" title="Воспроизвести альбом">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="card-add-button" onclick="event.stopPropagation(); addAlbumTracksToFavorites(${album.id})" data-album-id="${album.id}" title="Добавить треки альбома в Мои треки">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <a href="album.html?id=${album.id}" class="card-link" onclick="event.stopPropagation();">
                        <div class="card-title">${escapeHtml(album.title)}</div>
                        <div class="card-subtitle">${escapeHtml(artistName)}${album.releaseYear ? ' · ' + album.releaseYear : ''}</div>
                    </a>
                </div>
            `;
        }).join('');
        
        // Check favorite artists status for add buttons
        if (api.isAuthenticated()) {
            const user = api.getCurrentUser();
            if (user) {
                await checkArtistsFavoriteStatus();
            }
        }
    } catch (error) {
        console.error('Error displaying new albums:', error);
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки новых альбомов</p></div>';
    }
}

// Display popular tracks
async function displayPopularTracks() {
    const tracksList = document.getElementById('tracksList');
    
    if (tracksList) {
        tracksList.className = 'tracks-list';
    }
    
    try {
        if (!tracks || tracks.length === 0) {
            await loadTracks();
        }
        
        // Сортируем треки по количеству прослушиваний
        const popularTracks = [...tracks].sort((a, b) => {
            const countA = a.playCountAll || 0;
            const countB = b.playCountAll || 0;
            return countB - countA;
        }).slice(0, 50); // Показываем топ-50
        
        filteredTracks = popularTracks;
        renderTracks();
    } catch (error) {
        console.error('Error displaying popular tracks:', error);
        if (tracksList) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки популярных треков</p></div>';
        }
    }
}

// Search
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// Filters
function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            filterTracks();
        });
    });
}

// Modals
function initializeModals() {
    // Close buttons
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeModal('loginModal');
        });
    }
    
    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', () => {
            closeModal('profileModal');
        });
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Close on outside click
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                closeModal('loginModal');
            }
        });
    }
    
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target.id === 'profileModal') {
                closeModal('profileModal');
            }
        });
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tab}Form`);
    });
}

// Track Loading with Skeleton Loader
async function loadTracks() {
    const tracksList = document.getElementById('tracksList');
    
    // Если элемента нет, просто загружаем данные без обновления DOM
    if (tracksList) {
        // Show skeleton loader
        tracksList.innerHTML = Array(10).fill(0).map(() => `
            <div class="track-skeleton">
                <div class="skeleton-number"></div>
                <div class="skeleton-artwork"></div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="skeleton-duration"></div>
            </div>
        `).join('');
    }
    
    try {
        // Simulate minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        tracks = await api.getTracks();
        // Обновляем глобальную переменную
        window.tracks = tracks;
        
        // Обновляем DOM только если элемент существует
        if (tracksList) {
            filterTracks();
        }
    } catch (error) {
        if (tracksList) {
            tracksList.innerHTML = `<div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки треков: ${error.message}</p>
            </div>`;
        }
        console.error('Error loading tracks:', error);
    }
}

function filterTracks() {
    filteredTracks = [...tracks].sort((a, b) => {
        let countA = 0, countB = 0;
        
        switch (currentPeriod) {
            case 'day':
                countA = a.playCountDay || 0;
                countB = b.playCountDay || 0;
                break;
            case 'week':
                countA = a.playCountWeek || 0;
                countB = b.playCountWeek || 0;
                break;
            case 'month':
                countA = a.playCountMonth || 0;
                countB = b.playCountMonth || 0;
                break;
            default:
                countA = a.playCountAll || 0;
                countB = b.playCountAll || 0;
        }
        
        return countB - countA; // По убыванию
    });
    
    // Ограничиваем количество
    filteredTracks = filteredTracks.slice(0, 20);
    
    renderTracks();
}

function renderTracks() {
    const tracksList = document.getElementById('tracksList');
    
    // Ensure tracks list has correct class for thin stripes display
    if (tracksList) {
        tracksList.className = 'tracks-list';
    }
    
    if (filteredTracks.length === 0) {
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>Треков пока нет</p></div>';
        return;
    }
    
    tracksList.innerHTML = filteredTracks.map((track, index) => {
        const duration = formatDuration(track.durationSeconds);
        const artistName = getArtistName(track.artistId);
        const artworkUrl = getArtworkUrl(track);
        
        // Если есть URL обложки, показываем изображение, иначе заглушку
        const artworkHtml = artworkUrl 
            ? `<img src="${artworkUrl}" alt="${escapeHtml(track.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`
            : '';
        const placeholderHtml = artworkUrl 
            ? '<div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 4px;"><i class="fas fa-music"></i></div>'
            : '<div style="width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 4px; display: flex;"><i class="fas fa-music"></i></div>';
        
        return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                ${getPlayButtonHtml(track.id)}
                <div class="track-artwork">
                    ${artworkHtml}
                    ${placeholderHtml}
                </div>
                <div class="track-info">
                    <div class="track-title"><a href="track.html?id=${track.id}" class="track-link">${escapeHtml(track.title)}</a></div>
                    <div class="track-artist"><a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artistName)}</a></div>
                    <div class="track-stats">
                        <i class="fas fa-headphones"></i> ${track.playCountAll || 0} прослушиваний
                        ${track.playCountMonth > 0 ? ` | <i class="fas fa-calendar-month"></i> ${track.playCountMonth} за месяц` : ''}
                    </div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                        <i class="fas fa-list"></i>
                    </button>` : ''}
                    <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Load favorite status for each track
    if (api.isAuthenticated()) {
        loadFavoriteStatus();
    }
    
    // Update play buttons after rendering
    setTimeout(() => updatePlayButtons(), 100);
}

async function loadFavoriteStatus() {
    const user = api.getCurrentUser();
    if (!user) return;
    
    for (const track of filteredTracks) {
        try {
            const isFav = await api.isFavorite(user.id, track.id);
            const btn = document.querySelector(`.btn-favorite[data-track-id="${track.id}"]`);
            if (btn) {
                if (isFav) {
                    btn.classList.add('active');
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }
}

// Playlists
async function loadPlaylists() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const user = api.getCurrentUser();
        if (!user) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Войдите, чтобы увидеть свои плейлисты</p></div>';
            return;
        }
        
        const playlists = await api.getPlaylists(user.id);
        
        let html = '';
        
        // Кнопка создания плейлиста
        html += `
            <div style="margin-bottom: 20px;">
                <button class="btn-primary" onclick="openCreatePlaylistModal()" style="width: auto; padding: 10px 20px;">
                    <i class="fas fa-plus"></i> Создать плейлист
                </button>
            </div>
        `;
        
        if (playlists.length === 0) {
            html += '<div class="empty-state"><i class="fas fa-list"></i><p>У вас пока нет плейлистов. Создайте свой первый плейлист!</p></div>';
        } else {
            html += playlists.map(playlist => {
                const artworkUrl = getPlaylistArtworkUrl(playlist);
                return `
                <div class="track-item" data-playlist-id="${playlist.id}">
                    <div class="track-artwork" style="background-image: url('${artworkUrl}'); background-size: cover; background-position: center;">
                        ${!playlist.imagePath ? '<i class="fas fa-list"></i>' : ''}
                    </div>
                    <div class="track-info" style="flex: 1;">
                        <a href="playlist.html?id=${playlist.id}" class="track-title track-link">${escapeHtml(playlist.name)}</a>
                        <div class="track-artist">${escapeHtml(playlist.description || 'Описание отсутствует')}</div>
                    </div>
                    <div class="track-actions">
                        <button class="btn-play" onclick="playPlaylist(${playlist.id})" title="Воспроизвести">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-download" onclick="openPlaylistEditModal(${playlist.id})" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-favorite" onclick="deletePlaylist(${playlist.id})" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        }
        
        tracksList.innerHTML = html;
    } catch (error) {
        console.error('Error loading playlists:', error);
        tracksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки плейлистов: ${error.message || 'Неизвестная ошибка'}</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                    Возможно, проблема с базой данных. Проверьте, что колонка image_path добавлена в таблицу playlists.
                </p>
                <button class="btn-primary" onclick="loadPlaylists()" style="margin-top: 15px;">
                    <i class="fas fa-refresh"></i> Попробовать снова
                </button>
            </div>
        `;
    }
}

// Create Playlist Modal
function openCreatePlaylistModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'createPlaylistModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeCreatePlaylistModal()">&times;</span>
            <h3>Создать плейлист</h3>
            <form id="createPlaylistForm" onsubmit="handleCreatePlaylist(event)">
                <div class="form-group">
                    <label for="playlistName">Название плейлиста *</label>
                    <input type="text" id="playlistName" required>
                </div>
                <div class="form-group">
                    <label for="playlistDescription">Описание</label>
                    <input type="text" id="playlistDescription">
                </div>
                <div class="form-group">
                    <label for="playlistImageUrl">URL изображения</label>
                    <input type="url" id="playlistImageUrl" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group">
                    <label for="playlistImageFile">Или загрузить изображение</label>
                    <input type="file" id="playlistImageFile" accept="image/*">
                    <small style="color: #666;">Пока поддерживается только URL</small>
                </div>
                <button type="submit" class="btn-primary">Создать</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCreatePlaylistModal();
        }
    });
}

function closeCreatePlaylistModal() {
    const modal = document.getElementById('createPlaylistModal');
    if (modal) {
        modal.remove();
    }
}

async function handleCreatePlaylist(e) {
    e.preventDefault();
    const user = api.getCurrentUser();
    if (!user) {
        alert('Необходимо войти в систему');
        return;
    }
    
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    const imageUrl = document.getElementById('playlistImageUrl').value.trim();
    
    if (!name) {
        alert('Введите название плейлиста');
        return;
    }
    
    try {
        await api.createPlaylist({
            userId: user.id,
            name: name,
            description: description || null,
            imagePath: imageUrl || null
        });
        closeCreatePlaylistModal();
        await loadPlaylists();
        alert('Плейлист создан успешно!');
    } catch (error) {
        alert('Ошибка создания плейлиста: ' + error.message);
    }
}

async function deletePlaylist(playlistId) {
    // Удаление без подтверждения
    
    try {
        await api.deletePlaylist(playlistId);
        await loadPlaylists();
        alert('Плейлист удален');
    } catch (error) {
        alert('Ошибка удаления плейлиста: ' + error.message);
    }
}

async function playPlaylist(playlistId) {
    try {
        const tracks = await api.getPlaylistTracks(playlistId);
        if (tracks.length === 0) {
            alert('В этом плейлисте нет треков');
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        console.log('[PLAYLIST_APP] Setting playlist with', tracks.length, 'tracks');
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(tracks, 0);
            console.log('[PLAYLIST_APP] Playlist set, calling playTrack for track:', tracks[0]?.id);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && tracks[0] && tracks[0].id) {
                try {
                    await window.playTrack(tracks[0].id);
                    console.log('[PLAYLIST_APP] playTrack called successfully');
                } catch (error) {
                    console.error('[PLAYLIST_APP] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[PLAYLIST_APP] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[PLAYLIST_APP] setPlaylist not available, using fallback');
            window.playlist = tracks;
            window.currentTrackIndex = 0;
            try {
                await window.playTrack(tracks[0].id);
            } catch (error) {
                console.error('[PLAYLIST_APP] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[PLAYLIST_APP] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        alert('Ошибка загрузки плейлиста: ' + error.message);
    }
}

function openPlaylistEditModal(playlistId) {
    // TODO: Реализовать редактирование плейлиста
    alert('Редактирование плейлиста будет добавлено позже');
}

// Add Track to Playlist Modal
async function openAddToPlaylistModal(trackId) {
    const user = api.getCurrentUser();
    if (!user) {
        alert('Необходимо войти в систему');
        return;
    }
    
    try {
        const playlists = await api.getPlaylists(user.id);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'addToPlaylistModal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeAddToPlaylistModal()">&times;</span>
                <h3>Добавить в плейлист</h3>
                ${playlists.length === 0 
                    ? '<p>У вас пока нет плейлистов. <a href="#" onclick="closeAddToPlaylistModal(); openCreatePlaylistModal(); return false;">Создайте плейлист</a></p>'
                    : `<div style="max-height: 400px; overflow-y: auto;">
                        ${playlists.map(playlist => `
                            <div class="track-item" style="cursor: pointer; margin-bottom: 10px;" onclick="addTrackToPlaylist(${playlist.id}, ${trackId})">
                                <div class="track-artwork">
                                    <i class="fas fa-list"></i>
                                </div>
                                <div class="track-info" style="flex: 1;">
                                    <div class="track-title">${escapeHtml(playlist.name)}</div>
                                    <div class="track-artist">${escapeHtml(playlist.description || 'Без описания')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddToPlaylistModal();
            }
        });
    } catch (error) {
        alert('Ошибка загрузки плейлистов: ' + error.message);
    }
}

function closeAddToPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    if (modal) {
        modal.remove();
    }
}

async function addTrackToPlaylist(playlistId, trackId) {
    try {
        await api.addTrackToPlaylist(playlistId, trackId);
        closeAddToPlaylistModal();
        alert('Трек добавлен в плейлист!');
    } catch (error) {
        alert('Ошибка добавления трека: ' + error.message);
    }
}

// Make functions globally available
window.initializeAuth = initializeAuth;
window.initializeTheme = initializeTheme;
window.initializeModals = initializeModals;
window.applyTheme = applyTheme;
window.showUserMenu = showUserMenu;
window.hideUserMenu = hideUserMenu;
window.playAlbum = playAlbum;
window.playArtistTracks = playArtistTracks;
window.playGenreTracks = playGenreTracks;
window.loadGenreTracks = loadGenreTracks;
window.loadGenreTracksFromList = loadGenreTracksFromList;
window.goBackToGenres = goBackToGenres;
window.playAllTracks = playAllTracks;
window.loadAllTracks = loadAllTracks;
window.playTrack = playTrack; // Export playTrack from app.js (wrapper for player.js)
window.updatePlayButtons = updatePlayButtons; // Export updatePlayButtons for player.js to call
window.showLoginButton = showLoginButton;
window.updateUserMenuState = updateUserMenuState;
window.performSearch = performSearch;
window.searchAndDisplayResults = searchAndDisplayResults;
window.getArtworkUrl = getArtworkUrl;
window.getPlaylistArtworkUrl = getPlaylistArtworkUrl;

window.openCreatePlaylistModal = openCreatePlaylistModal;
window.closeCreatePlaylistModal = closeCreatePlaylistModal;
window.handleCreatePlaylist = handleCreatePlaylist;
window.deletePlaylist = deletePlaylist;
window.playPlaylist = playPlaylist;
window.openAddToPlaylistModal = openAddToPlaylistModal;
window.closeAddToPlaylistModal = closeAddToPlaylistModal;
window.addTrackToPlaylist = addTrackToPlaylist;

// Artists - загрузка данных для использования в других функциях
async function loadArtists() {
    try {
        artists = await api.getArtists();
        // Update global state
        window.artists = artists;
    } catch (error) {
        console.error('Error loading artists:', error);
        // Не показываем ошибку, просто оставляем пустой массив
        artists = [];
        window.artists = artists;
    }
}

// Albums - загрузка данных для использования в других функциях
async function loadAlbums() {
    try {
        albums = await api.request('/api/albums');
        // Update global state
        window.albums = albums;
    } catch (error) {
        console.error('Error loading albums:', error);
        // Не показываем ошибку, просто оставляем пустой массив
        albums = [];
        window.albums = albums;
    }
}

// Отображение списка альбомов на странице (Large Cards)
async function displayAlbums() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка альбомов...</p></div>';
    
    try {
        if (!albums || albums.length === 0) {
            await loadAlbums();
        }
        
        if (albums.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-compact-disc"></i><p>Альбомов пока нет</p></div>';
            return;
        }
        
        // Загружаем артистов для отображения имен
        if (!artists || artists.length === 0) {
            await loadArtists();
        }
        
        tracksList.className = 'cards-grid';
        tracksList.innerHTML = albums.map(album => {
            let artworkUrl = '';
            if (album.artworkPath) {
                if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                    artworkUrl = album.artworkPath;
                } else {
                    artworkUrl = `${API_BASE_URL}/api/files/artwork/albums/${album.id}`;
                }
            }
            
            const artist = artists.find(a => a.id === album.artistId);
            const artistName = artist ? artist.name : 'Неизвестный исполнитель';
            
            return `
                <div class="card album-card" data-album-id="${album.id}">
                    <div class="card-image-container" onclick="window.location.href='album.html?id=${album.id}'">
                        ${artworkUrl ? `<img src="${artworkUrl}" alt="${escapeHtml(album.title)}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="card-image-placeholder" style="display: none;"><i class="fas fa-compact-disc"></i></div>` : '<div class="card-image-placeholder"><i class="fas fa-compact-disc"></i></div>'}
                        <button class="card-play-button" onclick="event.stopPropagation(); playAlbum(${album.id})" title="Воспроизвести альбом">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="card-add-button" onclick="event.stopPropagation(); addAlbumTracksToFavorites(${album.id})" data-album-id="${album.id}" title="Добавить треки альбома в Мои треки">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <a href="album.html?id=${album.id}" class="card-link" onclick="event.stopPropagation();">
                        <div class="card-title">${escapeHtml(album.title)}</div>
                        <div class="card-subtitle">${escapeHtml(artistName)}${album.releaseYear ? ' · ' + album.releaseYear : ''}</div>
                    </a>
                </div>
            `;
        }).join('');
        
        // Check favorite artists status for add buttons
        if (api.isAuthenticated()) {
            const user = api.getCurrentUser();
            if (user) {
                await checkArtistsFavoriteStatus();
            }
        }
    } catch (error) {
        console.error('Error displaying albums:', error);
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки альбомов</p></div>';
    }
}

// Check and update favorite artists status
async function checkArtistsFavoriteStatus() {
    const user = api.getCurrentUser();
    if (!user) return;
    
    try {
        const favoriteArtistIds = await getFavoriteArtistIds(user.id);
        document.querySelectorAll('.card-add-button[data-artist-id]').forEach(btn => {
            const artistId = parseInt(btn.dataset.artistId);
            if (favoriteArtistIds.includes(artistId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } catch (error) {
        console.warn('Error checking artists favorite status:', error);
    }
}

// Helper function to play album
async function playAlbum(albumId) {
    try {
        const album = albums.find(a => a.id === albumId);
        if (!album) return;
        
        // Load album tracks
        const allTracks = await api.getTracks();
        const albumTracks = allTracks.filter(t => t.albumId === albumId);
        
        if (albumTracks.length === 0) {
            alert('В этом альбоме нет треков');
            return;
        }
        
        if (window.setPlaylist) {
            window.setPlaylist(albumTracks, 0);
        } else if (window.playTrack) {
            window.playlist = albumTracks;
            window.currentTrackIndex = 0;
            window.playTrack(albumTracks[0].id);
        }
    } catch (error) {
        console.error('Error playing album:', error);
    }
}

// Genre images mapping (можно использовать реальные изображения со Spotify)
const genreImages = {
    'Рок': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    'Поп': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    'Хип-Хоп': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    'Электронная': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    'Джаз': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    'Классическая': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    'Рэп': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    'R&B': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    'Кантри': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    'Метал': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    'Регги': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    'Блюз': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    'Инди': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    'Фолк': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    'Альтернатива': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
};

// Make genreImages globally available
window.genreImages = genreImages;

// Default artist images (можно использовать реальные изображения)
const defaultArtistImages = [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop'
];

// Отображение списка артистов на странице (Large Cards)
async function displayArtists() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка исполнителей...</p></div>';
    
    try {
        if (!artists || artists.length === 0) {
            await loadArtists();
        }
        
        if (artists.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-user-friends"></i><p>Исполнителей пока нет</p></div>';
            return;
        }
        
        tracksList.className = 'cards-grid';
        tracksList.innerHTML = artists.map((artist, index) => {
            let imageUrl = '';
            if (artist.imagePath) {
                if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                    imageUrl = artist.imagePath;
                } else {
                    imageUrl = `${API_BASE_URL}/api/files/artwork/artists/${artist.id}`;
                }
            } else {
                // Use default image based on index
                imageUrl = defaultArtistImages[index % defaultArtistImages.length];
            }
            
            // Get track count for this artist
            const trackCount = tracks.filter(t => t.artistId === artist.id).length;
            
            return `
                <div class="card artist-card" data-artist-id="${artist.id}">
                    <div class="card-image-container" onclick="window.location.href='artist.html?id=${artist.id}'">
                        <img src="${imageUrl}" alt="${escapeHtml(artist.name)}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="card-image-placeholder" style="display: none;"><i class="fas fa-user"></i></div>
                        <button class="card-play-button" onclick="event.stopPropagation(); playArtistTracks(${artist.id})" title="Воспроизвести исполнителя">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="card-add-button" onclick="event.stopPropagation(); toggleFavoriteArtist(${artist.id})" data-artist-id="${artist.id}" title="Добавить в Мою музыку">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <a href="artist.html?id=${artist.id}" class="card-link" onclick="event.stopPropagation();">
                        <div class="card-title">${escapeHtml(artist.name)}</div>
                        <div class="card-subtitle">Исполнитель${trackCount > 0 ? ' · ' + trackCount + ' треков' : ''}</div>
                    </a>
                </div>
            `;
        }).join('');
        
        // Check favorite artists status for add buttons
        if (api.isAuthenticated()) {
            const user = api.getCurrentUser();
            if (user) {
                await checkArtistsFavoriteStatus();
            }
        }
    } catch (error) {
        console.error('Error displaying artists:', error);
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки исполнителей</p></div>';
    }
}

// Helper function to play artist tracks
async function playArtistTracks(artistId) {
    try {
        // Если треки еще не загружены, загружаем их
        if (!tracks || tracks.length === 0) {
            tracks = await api.getTracks();
            window.tracks = tracks;
        }
        
        const artistTracks = tracks.filter(t => t.artistId === artistId);
        if (artistTracks.length === 0) {
            alert('У этого исполнителя нет треков');
            return;
        }
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        console.log('[ARTIST] Setting playlist with', artistTracks.length, 'tracks');
        if (window.setPlaylist && typeof window.setPlaylist === 'function') {
            window.setPlaylist(artistTracks, 0);
            console.log('[ARTIST] Playlist set, calling playTrack for track:', artistTracks[0]?.id);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && typeof window.playTrack === 'function' && artistTracks[0] && artistTracks[0].id) {
                try {
                    await window.playTrack(artistTracks[0].id);
                    console.log('[ARTIST] playTrack called successfully');
                } catch (error) {
                    console.error('[ARTIST] Error calling playTrack:', error);
                    alert('Ошибка воспроизведения: ' + error.message);
                }
            } else {
                console.error('[ARTIST] window.playTrack not available or invalid');
                alert('Плеер не доступен. Пожалуйста, обновите страницу.');
            }
        } else if (window.playTrack && typeof window.playTrack === 'function') {
            console.log('[ARTIST] setPlaylist not available, using fallback');
            window.playlist = artistTracks;
            window.currentTrackIndex = 0;
            try {
                await window.playTrack(artistTracks[0].id);
            } catch (error) {
                console.error('[ARTIST] Error in fallback playTrack:', error);
                alert('Ошибка воспроизведения: ' + error.message);
            }
        } else {
            console.error('[ARTIST] Neither setPlaylist nor playTrack available');
            alert('Плеер не доступен. Пожалуйста, обновите страницу.');
        }
    } catch (error) {
        console.error('Error playing artist tracks:', error);
        alert('Ошибка воспроизведения треков исполнителя: ' + error.message);
    }
}

// Genres - Large Cards with Images
async function loadGenres() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка жанров...</p></div>';
    
    try {
        const allTracks = await api.getTracks();
        const genreList = [...new Set(allTracks.map(t => t.genre).filter(Boolean))];
        
        // Limit to top 10 genres by track count, or show all if less than 10
        const genresWithCounts = genreList.map(genre => ({
            name: genre,
            count: allTracks.filter(t => t.genre === genre).length
        })).sort((a, b) => b.count - a.count);
        
        const topGenres = genresWithCounts.slice(0, 10);
        
        tracksList.className = 'cards-grid';
        
        let html = '';
        
        // Add "Все треки" card at the beginning
        html += `
            <div class="card genre-card" onclick="loadAllTracks()">
                <div class="card-image-container">
                    <div class="card-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-music" style="font-size: 60px; color: white;"></i>
                    </div>
                    <button class="card-play-button" onclick="event.stopPropagation(); playAllTracks()" title="Воспроизвести все треки">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="card-link" style="cursor: pointer;">
                    <div class="card-title">Все треки</div>
                    <div class="card-subtitle">${allTracks.length} треков</div>
                </div>
            </div>
        `;
        
        // Add genre cards
        if (topGenres.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><p>Жанров пока нет</p></div>';
            return;
        }
        
        html += topGenres.map(genre => {
            // Get genre image with fallback
            let imageUrl = genreImages[genre.name] || genreImages['Поп'];
            if (!imageUrl) {
                // Use default image if genre not found in mapping
                imageUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop';
            }
            
            return `
                <div class="card genre-card" onclick="loadGenreTracksFromList('${escapeHtml(genre.name)}')">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${escapeHtml(genre.name)}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.style.display='block'; if(this.nextElementSibling) this.nextElementSibling.style.display='none';">
                        <div class="card-image-placeholder" style="display: none;"><i class="fas fa-tags"></i></div>
                        <button class="card-play-button" onclick="event.stopPropagation(); playGenreTracks('${escapeHtml(genre.name)}')" title="Воспроизвести жанр">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                    <div class="card-link" style="cursor: pointer;" onclick="loadGenreTracksFromList('${escapeHtml(genre.name)}')">
                        <div class="card-title">${escapeHtml(genre.name)}</div>
                        <div class="card-subtitle">${genre.count} треков</div>
                    </div>
                </div>
            `;
        }).join('');
        
        tracksList.innerHTML = html;
    } catch (error) {
        tracksList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></div>`;
    }
}

// Load genre tracks on main page (without navigation)
async function loadGenreTracks(genreName) {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка треков...</p></div>';
    
    try {
        // Загружаем треки, артистов и альбомы
        const allTracks = await api.getTracks();
        window.tracks = allTracks;
        
        // Загружаем артистов и альбомы для artwork
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        if (!window.albums || window.albums.length === 0) {
            window.albums = await api.getAlbums();
        }
        
        const genreTracks = allTracks.filter(t => t.genre === genreName);
        
        if (genreTracks.length === 0) {
            tracksList.innerHTML = `<div class="empty-state"><i class="fas fa-tags"></i><p>В жанре "${escapeHtml(genreName)}" пока нет треков</p></div>`;
            return;
        }
        
        // Перемешиваем треки случайным образом
        const shuffledTracks = [...genreTracks].sort(() => Math.random() - 0.5);
        
        // Устанавливаем плейлист для переключения треков
        window.filteredTracks = shuffledTracks;
        if (window.setPlaylist && shuffledTracks.length > 0) {
            window.setPlaylist(shuffledTracks, 0);
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
            'Folk': 'Фолк — традическая музыка, передаваемая устно и отражающая культурные особенности народа.',
            'Вокал': 'Вокальная музыка — музыка, в которой основная роль отводится голосу.'
        };
        
        const description = genreDescriptions[genreName] || `Жанр "${genreName}" включает разнообразные музыкальные произведения в этом стиле.`;
        
        // Get genre image
        let genreImageUrl = '';
        if (typeof window.genreImages !== 'undefined' && window.genreImages) {
            genreImageUrl = window.genreImages[genreName] || window.genreImages['Поп'];
        }
        if (!genreImageUrl) {
            genreImageUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop';
        }
        
        // Try to get artwork from first track
        let genreArtworkUrl = genreImageUrl;
        if (shuffledTracks.length > 0) {
            const firstTrack = shuffledTracks[0];
            const trackArtwork = getArtworkUrl(firstTrack);
            if (trackArtwork && trackArtwork.trim() !== '') {
                if (!genreImageUrl || genreImageUrl === 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop') {
                    genreArtworkUrl = trackArtwork;
                } else {
                    genreArtworkUrl = genreImageUrl;
                }
            }
        }
        
        // Статистика
        const totalAll = genreTracks.reduce((sum, t) => sum + (t.playCountAll || 0), 0);
        const totalMonth = genreTracks.reduce((sum, t) => sum + (t.playCountMonth || 0), 0);
        const totalWeek = genreTracks.reduce((sum, t) => sum + (t.playCountWeek || 0), 0);
        const totalDay = genreTracks.reduce((sum, t) => sum + (t.playCountDay || 0), 0);
        
        tracksList.className = 'tracks-list';
        
        let html = `
            <div style="margin-bottom: 20px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; gap: 20px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <img src="${genreArtworkUrl}" alt="${escapeHtml(genreName)}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="display: none; width: 80px; height: 80px; border-radius: 8px; background: rgba(255,255,255,0.1); align-items: center; justify-content: center;">
                            <i class="fas fa-tag" style="font-size: 40px; color: #888;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; color: #888; margin-bottom: 4px;">ЖАНР</div>
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">${escapeHtml(genreName)}</h1>
                            <div style="margin-top: 8px; color: #999; font-size: 14px;">${description}</div>
                            <div style="margin-top: 12px; display: flex; gap: 16px; font-size: 12px; color: #666;">
                                <span><i class="fas fa-music"></i> ${genreTracks.length} треков</span>
                                <span><i class="fas fa-headphones"></i> ${totalAll} прослушиваний</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn-listen" onclick="playGenreTracks('${escapeHtml(genreName)}')" style="padding: 12px 24px;">
                    <i class="fas fa-play"></i> Слушать жанр
                </button>
            </div>
        `;
        
        html += `
            <div class="tracks-list">
        `;
        
        shuffledTracks.forEach((track, index) => {
            const artworkUrl = getArtworkUrl(track);
            const hasArtwork = artworkUrl && artworkUrl.trim() !== '' && artworkUrl !== 'undefined' && artworkUrl !== 'null';
            const artist = window.artists && window.artists.length > 0 ? window.artists.find(a => a.id === track.artistId) : null;
            const artistName = artist ? artist.name : 'Неизвестный исполнитель';
            const duration = formatDuration(track.durationSeconds || 0);
            
            html += `
                <div class="track-item" data-track-id="${track.id}">
                    <div class="track-number">${index + 1}</div>
                    ${getPlayButtonHtml(track.id)}
                    <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : 'background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;'}" onclick="playTrack(${track.id})">
                        ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                    </div>
                    <div class="track-info">
                        <a href="track.html?id=${track.id}" class="track-title track-link" onclick="event.stopPropagation();">${escapeHtml(track.title)}</a>
                        <a href="artist.html?id=${track.artistId}" class="track-artist track-link" onclick="event.stopPropagation();">${escapeHtml(artistName)}</a>
                        <div class="track-stats" style="font-size: 11px; color: #666; margin-top: 4px;">
                            <i class="fas fa-headphones"></i> ${track.playCountAll || 0} прослушиваний
                        </div>
                    </div>
                    <div class="track-duration">${duration}</div>
                    <div class="track-actions">
                        <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                            <i class="fas fa-download"></i>
                        </button>
                        ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                            <i class="fas fa-list"></i>
                        </button>` : ''}
                        <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        tracksList.innerHTML = html;
        
        // Update play buttons
        setTimeout(() => updatePlayButtons(), 100);
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = `Жанр: ${genreName}`;
        }
        
    } catch (error) {
        console.error('[APP] Error loading genre tracks:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки треков жанра: ${error.message}</p>
        </div>`;
    }
}

// Function to load genre tracks from genre list click
async function loadGenreTracksFromList(genreName) {
    // Загружаем треки жанра напрямую, без изменения URL и навигации
    await loadGenreTracks(genreName);
}

// Function to go back to genres list
function goBackToGenres() {
    // Remove genre parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('genre');
    window.history.pushState({}, '', url);
    
    // Navigate to genres page
    navigateToPage('genres');
}

// Load all tracks (without genre filter)
async function loadAllTracks() {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка всех треков...</p></div>';
    
    try {
        const allTracks = await api.getTracks();
        
        if (allTracks.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>Треков пока нет</p></div>';
            return;
        }
        
        // Display tracks
        tracksList.className = 'tracks-list';
        window.filteredTracks = allTracks;
        
        let html = '';
        html += allTracks.map((track, index) => {
            const artistName = getArtistName(track.artistId);
            const artworkUrl = getArtworkUrl(track) || 'logo.jpg';
            const duration = formatDuration(track.durationSeconds);
            
            return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-number">${index + 1}</div>
                ${getPlayButtonHtml(track.id)}
                <div class="track-artwork" style="background-image: url('${artworkUrl}'); background-size: cover; background-position: center;" onclick="playTrack(${track.id})">
                    ${!artworkUrl || artworkUrl === 'logo.jpg' ? '<i class="fas fa-music"></i>' : ''}
                </div>
                <div class="track-info">
                    <div class="track-title" onclick="playTrack(${track.id})">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(artistName || 'Неизвестный исполнитель')}</div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-download" onclick="downloadTrack(${track.id})" title="Скачать">
                        <i class="fas fa-download"></i>
                    </button>
                    ${api.isAuthenticated() ? `<button class="btn-add-to-playlist" onclick="openAddToPlaylistModal(${track.id})" title="Добавить в плейлист">
                        <i class="fas fa-list"></i>
                    </button>` : ''}
                    <button class="btn-favorite" onclick="toggleFavorite(${track.id})" data-track-id="${track.id}" title="Добавить в избранное">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        tracksList.innerHTML = html;
        
        // Load favorite status
        if (api.isAuthenticated()) {
            loadFavoriteStatus();
        }
        
        // Update play buttons after rendering
        setTimeout(() => updatePlayButtons(), 100);
    } catch (error) {
        console.error('[APP] Error loading all tracks:', error);
        tracksList.innerHTML = `<div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки треков: ${error.message}</p>
        </div>`;
    }
}

// Play all tracks
async function playAllTracks() {
    try {
        const allTracks = await api.getTracks();
        if (allTracks.length === 0) {
            alert('Треков пока нет');
            return;
        }
        
        // Shuffle tracks for variety
        const shuffledTracks = [...allTracks].sort(() => Math.random() - 0.5);
        
        if (window.setPlaylist) {
            window.setPlaylist(shuffledTracks, 0);
        } else if (window.playTrack) {
            window.playlist = shuffledTracks;
            window.currentTrackIndex = 0;
            window.playTrack(shuffledTracks[0].id);
        }
    } catch (error) {
        console.error('Error playing all tracks:', error);
        alert('Ошибка воспроизведения: ' + error.message);
    }
}

// Helper function to play genre tracks
async function playGenreTracks(genreName) {
    try {
        // Если треки еще не загружены, загружаем их
        if (!tracks || tracks.length === 0) {
            tracks = await api.getTracks();
            window.tracks = tracks;
        }
        
        const genreTracks = tracks.filter(t => t.genre === genreName);
        if (genreTracks.length === 0) {
            alert('В этом жанре нет треков');
            return;
        }
        
        // Shuffle tracks for variety
        const shuffledTracks = [...genreTracks].sort(() => Math.random() - 0.5);
        
        // Устанавливаем плейлист и начинаем воспроизведение первого трека
        if (window.setPlaylist) {
            window.setPlaylist(shuffledTracks, 0);
            // Явно запускаем первый трек после установки плейлиста
            if (window.playTrack && shuffledTracks[0] && shuffledTracks[0].id) {
                window.playTrack(shuffledTracks[0].id);
            }
        } else if (window.playTrack) {
            window.playlist = shuffledTracks;
            window.currentTrackIndex = 0;
            window.playTrack(shuffledTracks[0].id);
        }
    } catch (error) {
        console.error('Error playing genre tracks:', error);
        alert('Ошибка воспроизведения жанра: ' + error.message);
    }
}

// Profile Modal
async function openProfileModal() {
    console.log('[PROFILE] openProfileModal called');
    const user = api.getCurrentUser();
    if (!user) {
        console.log('[PROFILE] No user, opening login modal');
        openModal('loginModal');
        return;
    }
    
    console.log('[PROFILE] User found:', user);
    
    // Проверяем существование модала, если нет - создаем динамически
    let profileModal = document.getElementById('profileModal');
    if (!profileModal) {
        console.log('[PROFILE] Modal not found, creating dynamically');
        profileModal = document.createElement('div');
        profileModal.className = 'modal';
        profileModal.id = 'profileModal';
        profileModal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('profileModal')">&times;</span>
                <div class="profile-header">
                    <h2>Профиль пользователя</h2>
                    <div class="profile-info" id="profileInfo">
                        <!-- Информация о пользователе -->
                    </div>
                </div>
                <div class="profile-content">
                    <h3><i class="fas fa-heart"></i> Любимые треки</h3>
                    <div class="favorite-tracks" id="favoriteTracks">
                        <!-- Любимые треки будут загружены -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(profileModal);
        
        // Добавляем обработчик закрытия при клике вне модала
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeModal('profileModal');
            }
        });
    }
    
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) {
        console.error('[PROFILE] profileInfo element not found!');
        return;
    }
    
    console.log('[PROFILE] Setting profile info');
    
    // Генерируем инициалы для аватара
    const getInitials = (username, firstName, lastName) => {
        if (firstName && lastName) {
            return (firstName[0] + lastName[0]).toUpperCase();
        }
        if (firstName) {
            return firstName[0].toUpperCase();
        }
        if (username && username.length >= 2) {
            return username.substring(0, 2).toUpperCase();
        }
        return username ? username[0].toUpperCase() : 'U';
    };
    
    const initials = getInitials(user.username, user.firstName, user.lastName);
    
    // Форматируем дату регистрации
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('ru-RU', options);
        } catch (e) {
            return '—';
        }
    };
    
    profileInfo.innerHTML = `
        <div class="profile-banner"></div>
        <div class="profile-avatar-container">
            <div class="profile-avatar">${initials}</div>
        </div>
        <div class="profile-info-section">
            <div class="profile-stats">
                <div class="profile-stat-item">
                    <div class="profile-stat-value" id="favoriteCount">0</div>
                    <div class="profile-stat-label">Любимых треков</div>
                </div>
                <div class="profile-stat-item">
                    <div class="profile-stat-value" id="playlistCount">—</div>
                    <div class="profile-stat-label">Плейлистов</div>
                </div>
            </div>
            <div class="profile-info-grid">
                <div class="profile-info-item">
                    <span class="profile-info-item-label">Username</span>
                    <span class="profile-info-item-value">${escapeHtml(user.username)}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-item-label">Email</span>
                    <span class="profile-info-item-value">${escapeHtml(user.email)}</span>
                </div>
                ${user.createdAt ? `<div class="profile-info-item">
                    <span class="profile-info-item-label">Дата регистрации</span>
                    <span class="profile-info-item-value">${formatDate(user.createdAt)}</span>
                </div>` : ''}
                ${user.firstName ? `<div class="profile-info-item">
                    <span class="profile-info-item-label">Имя</span>
                    <span class="profile-info-item-value">${escapeHtml(user.firstName)}</span>
                </div>` : ''}
                ${user.lastName ? `<div class="profile-info-item">
                    <span class="profile-info-item-label">Фамилия</span>
                    <span class="profile-info-item-value">${escapeHtml(user.lastName)}</span>
                </div>` : ''}
            </div>
        </div>
    `;
    
    // Load favorite tracks
    const favoriteTracksDiv = document.getElementById('favoriteTracks');
    if (!favoriteTracksDiv) {
        console.error('[PROFILE] favoriteTracks element not found!');
        return;
    }
    
    console.log('[PROFILE] Loading favorite tracks');
    favoriteTracksDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const favorites = await api.getFavoriteTracks(user.id);
        
        // Загружаем артистов для отображения имен
        if (!window.artists || window.artists.length === 0) {
            window.artists = await api.getArtists();
        }
        
        // Обновляем счетчик любимых треков
        const favoriteCountElement = document.getElementById('favoriteCount');
        if (favoriteCountElement) {
            favoriteCountElement.textContent = favorites.length;
        }
        
        // Загружаем количество плейлистов
        try {
            const playlists = await api.getPlaylists(user.id);
            const playlistCountElement = document.getElementById('playlistCount');
            if (playlistCountElement) {
                playlistCountElement.textContent = playlists.length;
            }
        } catch (error) {
            console.warn('[PROFILE] Error loading playlists count:', error);
        }
        
        // Статистика времени прослушивания удалена по запросу пользователя
        
        // Загружаем историю прослушиваний (последние 20 треков)
        try {
            const history = await api.getUserHistory(user.id, 20);
            if (history && history.length > 0 && window.tracks) {
                // Добавляем секцию истории в профиль
                const historySection = `
                    <div class="profile-content" style="margin-top: 32px;">
                        <h3><i class="fas fa-history"></i> История прослушиваний</h3>
                        <div class="favorite-tracks" id="listenHistory">
                            ${history.slice(0, 10).map(item => {
                                const track = window.tracks.find(t => t.id === item.trackId);
                                if (!track) return '';
                                const artist = window.artists.find(a => a.id === track.artistId);
                                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                                const listenedDate = new Date(item.listenedAt).toLocaleDateString('ru-RU');
                                return `
                                    <div class="track-item">
                                        <div class="track-info">
                                            <div class="track-title">
                                                <a href="track.html?id=${track.id}" class="track-link">${escapeHtml(track.title)}</a>
                                            </div>
                                            <div class="track-artist">
                                                ${track.artistId ? `<a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artistName)}</a>` : escapeHtml(artistName)}
                                                <span style="opacity: 0.6; margin-left: 8px;">• ${listenedDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                // Добавляем после favorite tracks
                const profileContent = document.querySelector('.profile-content');
                if (profileContent && history.length > 0) {
                    profileContent.insertAdjacentHTML('afterend', historySection);
                }
            }
        } catch (error) {
            console.warn('[PROFILE] Error loading listen history:', error);
        }
        
        if (favorites.length === 0) {
            favoriteTracksDiv.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>У вас пока нет любимых треков</p></div>';
        } else {
            favoriteTracksDiv.innerHTML = favorites.map(track => {
                const duration = formatDuration(track.durationSeconds);
                const artworkUrl = getArtworkUrl(track);
                const hasArtwork = artworkUrl && artworkUrl.trim() !== '';
                const artist = window.artists.find(a => a.id === track.artistId);
                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                
                return `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                            ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <div class="track-title">
                                <a href="track.html?id=${track.id}" class="track-link">${escapeHtml(track.title)}</a>
                            </div>
                            <div class="track-artist">
                                ${track.artistId ? `<a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artistName)}</a>` : escapeHtml(artistName)}
                                ${track.genre ? ` · <a href="genre.html?name=${encodeURIComponent(track.genre)}" class="genre-link" style="color: inherit; opacity: 0.8;">${escapeHtml(track.genre)}</a>` : ''}
                            </div>
                        </div>
                        <div class="track-duration">${duration}</div>
                        <div class="track-actions">
                            ${getPlayButtonHtml(track.id)}
                            <button class="btn-favorite active" onclick="removeFavorite(${track.id})" title="Удалить из избранного">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('[PROFILE] Error loading favorite tracks:', error);
        favoriteTracksDiv.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки: ${error.message}</p></div>`;
    }
    
    console.log('[PROFILE] Opening modal');
    openModal('profileModal');
}

// Track Actions - wrapper function for global access
async function playTrack(trackId) {
    // Call the actual playTrack from player.js (now async)
    if (window.playTrack && typeof window.playTrack === 'function') {
        try {
            await window.playTrack(trackId);
            // Update play buttons after state change
            setTimeout(() => updatePlayButtons(), 100);
        } catch (error) {
            console.error('[APP] Error in playTrack:', error);
            const track = tracks.find(t => t.id === trackId) || window.tracks?.find(t => t.id === trackId);
            if (track) {
                alert(`Ошибка воспроизведения: ${track.title}\n${error.message || 'Попробуйте позже'}`);
            }
        }
    } else {
        // Fallback: try to wait for player.js to load
        console.warn('[APP] playTrack: window.playTrack not available, waiting...');
        setTimeout(async () => {
            if (window.playTrack && typeof window.playTrack === 'function') {
                try {
                    await window.playTrack(trackId);
                    setTimeout(() => updatePlayButtons(), 100);
                } catch (error) {
                    console.error('[APP] Error in playTrack (retry):', error);
                }
            } else {
                console.error('[APP] playTrack: window.playTrack still not available');
                const track = tracks.find(t => t.id === trackId) || window.tracks?.find(t => t.id === trackId);
                if (track) {
                    alert(`Воспроизведение: ${track.title}\nПлеер загружается...`);
                }
            }
        }, 100);
    }
}

// Listen to player state changes
document.addEventListener('DOMContentLoaded', () => {
    // Update buttons when track changes
    const audioElement = document.getElementById('audioElement');
    if (audioElement) {
        audioElement.addEventListener('play', updatePlayButtons);
        audioElement.addEventListener('pause', updatePlayButtons);
        audioElement.addEventListener('loadedmetadata', updatePlayButtons);
    }
});

async function downloadTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
        alert('Трек не найден');
        return;
    }
    
    if (!track.filePath) {
        alert('Файл трека не загружен');
        return;
    }
    
    try {
        // Скачивание через API
        const response = await fetch(`${API_BASE_URL}/api/files/tracks/${trackId}/download`);
        
        if (!response.ok) {
            throw new Error('Ошибка скачивания');
        }
        
        // Получаем имя файла из заголовков или используем название трека
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${track.title}.mp3`;
        
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        // Создаем blob и скачиваем
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

async function toggleFavorite(trackId) {
    const user = api.getCurrentUser();
    if (!user) {
        openModal('loginModal');
        return;
    }
    
    const btn = document.querySelector(`.btn-favorite[data-track-id="${trackId}"]`);
    const isCurrentlyFavorite = btn.classList.contains('active');
    
    try {
        if (isCurrentlyFavorite) {
            await api.removeFavoriteTrack(user.id, trackId);
            btn.classList.remove('active');
        } else {
            await api.addFavoriteTrack(user.id, trackId);
            btn.classList.add('active');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function removeFavorite(trackId) {
    const user = api.getCurrentUser();
    if (!user) return;
    
    try {
        await api.removeFavoriteTrack(user.id, trackId);
        openProfileModal(); // Refresh profile
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Add all album tracks to favorites
async function addAlbumTracksToFavorites(albumId) {
    const user = api.getCurrentUser();
    if (!user) {
        openModal('loginModal');
        return;
    }
    
    try {
        // Get all tracks from the album
        const allTracks = await api.getTracks();
        const albumTracks = allTracks.filter(t => t.albumId === albumId);
        
        if (albumTracks.length === 0) {
            alert('В этом альбоме нет треков');
            return;
        }
        
        // Add each track to favorites
        let addedCount = 0;
        for (const track of albumTracks) {
            try {
                const isFav = await api.isFavorite(user.id, track.id);
                if (!isFav) {
                    await api.addFavoriteTrack(user.id, track.id);
                    addedCount++;
                }
            } catch (error) {
                console.warn(`Error adding track ${track.id} to favorites:`, error);
            }
        }
        
        if (addedCount > 0) {
            alert(`Добавлено ${addedCount} треков в Мои треки`);
            // Refresh favorite tracks if on "Моя музыка" page
            if (currentPage === 'my-music') {
                const activeTab = document.querySelector('#mainTabs .tab-btn-new.active')?.dataset.tab;
                if (activeTab === 'favorite-tracks') {
                    await loadFavoriteTracks();
                }
            }
        } else {
            alert('Все треки этого альбома уже добавлены в Мои треки');
        }
    } catch (error) {
        console.error('Error adding album tracks to favorites:', error);
        alert('Ошибка при добавлении треков: ' + error.message);
    }
}

// Toggle favorite artist (add/remove from "Моя музыка")
async function toggleFavoriteArtist(artistId) {
    const user = api.getCurrentUser();
    if (!user) {
        openModal('loginModal');
        return;
    }
    
    const btn = document.querySelector(`.card-add-button[data-artist-id="${artistId}"]`);
    if (!btn) return;
    
    const isCurrentlyFavorite = btn.classList.contains('active');
    
    try {
        if (isCurrentlyFavorite) {
            await api.removeFavoriteArtist(user.id, artistId);
            btn.classList.remove('active');
            // Save to localStorage as fallback
            const stored = localStorage.getItem(`favoriteArtists_${user.id}`);
            const artistIds = stored ? JSON.parse(stored) : [];
            const updated = artistIds.filter(id => id !== artistId);
            localStorage.setItem(`favoriteArtists_${user.id}`, JSON.stringify(updated));
            // Reload favorite artists if on "Моя музыка" page
            if (currentPage === 'my-music') {
                await loadFavoriteArtists();
            }
        } else {
            await api.addFavoriteArtist(user.id, artistId);
            btn.classList.add('active');
            // Save to localStorage as fallback
            const stored = localStorage.getItem(`favoriteArtists_${user.id}`);
            const artistIds = stored ? JSON.parse(stored) : [];
            if (!artistIds.includes(artistId)) {
                artistIds.push(artistId);
                localStorage.setItem(`favoriteArtists_${user.id}`, JSON.stringify(artistIds));
            }
            // Reload favorite artists if on "Моя музыка" page
            if (currentPage === 'my-music') {
                await loadFavoriteArtists();
            }
        }
    } catch (error) {
        console.error('Error toggling favorite artist:', error);
        alert('Ошибка: ' + (error.message || 'Не удалось добавить исполнителя'));
    }
}

// Load favorite artists for sidebar in "Моя музыка"
async function loadFavoriteArtists() {
    const listContainer = document.getElementById('favoriteArtistsList');
    if (!listContainer) return;
    
    try {
        const user = api.getCurrentUser();
        if (!user) {
            listContainer.innerHTML = '<div class="empty-state-small"><i class="fas fa-info-circle"></i><p>Войдите, чтобы видеть своих исполнителей</p></div>';
            return;
        }
        
        // Get favorite artist IDs (using the favorite artist API)
        // For now, we'll use localStorage or API if available
        const favoriteArtistIds = await getFavoriteArtistIds(user.id);
        
        if (!favoriteArtistIds || favoriteArtistIds.length === 0) {
            listContainer.innerHTML = '<div class="empty-state-small"><i class="fas fa-user-friends"></i><p>У вас пока нет избранных исполнителей</p></div>';
            return;
        }
        
        // Load artist details
        if (!artists || artists.length === 0) {
            await loadArtists();
        }
        
        const favoriteArtists = artists.filter(a => favoriteArtistIds.includes(a.id));
        
        if (favoriteArtists.length === 0) {
            listContainer.innerHTML = '<div class="empty-state-small"><i class="fas fa-user-friends"></i><p>Исполнители не найдены</p></div>';
            return;
        }
        
        // Render favorite artists
        listContainer.innerHTML = favoriteArtists.map(artist => {
            let imageUrl = '';
            if (artist.imagePath) {
                if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                    imageUrl = artist.imagePath;
                } else {
                    imageUrl = `${API_BASE_URL}/api/files/artwork/artists/${artist.id}`;
                }
            } else {
                imageUrl = defaultArtistImages[0];
            }
            
            return `
                <div class="favorite-artist-item" data-artist-id="${artist.id}">
                    <div class="favorite-artist-image" onclick="window.location.href='artist.html?id=${artist.id}'">
                        <img src="${imageUrl}" alt="${escapeHtml(artist.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="favorite-artist-placeholder" style="display: none;"><i class="fas fa-user"></i></div>
                    </div>
                    <div class="favorite-artist-info">
                        <a href="artist.html?id=${artist.id}" class="favorite-artist-name">${escapeHtml(artist.name)}</a>
                        <button class="favorite-artist-remove" onclick="toggleFavoriteArtist(${artist.id})" title="Удалить из Моей музыки">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading favorite artists:', error);
        listContainer.innerHTML = '<div class="empty-state-small"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки</p></div>';
    }
}

// Helper function to get favorite artist IDs
async function getFavoriteArtistIds(userId) {
    try {
        // Try to use API if available
        if (api.getFavoriteArtists) {
            return await api.getFavoriteArtists(userId);
        }
        // Fallback: check localStorage
        const stored = localStorage.getItem(`favoriteArtists_${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Error getting favorite artists:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem(`favoriteArtists_${userId}`);
        return stored ? JSON.parse(stored) : [];
    }
}

// UI Helpers
// User menu functions
function updateUserMenuState() {
    console.log('[USER_MENU] updateUserMenuState called');
    console.log('[USER_MENU] api:', typeof api !== 'undefined' ? api : 'undefined');
    
    if (!api) {
        console.warn('[USER_MENU] api not available, retrying in 100ms');
        // Если api еще не загружен, попробуем позже
        setTimeout(updateUserMenuState, 100);
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    
    console.log('[USER_MENU] DOM elements:', {
        loginBtn: !!loginBtn,
        userMenu: !!userMenu,
        loginBtnStyle: loginBtn ? loginBtn.style.display : 'N/A',
        userMenuStyle: userMenu ? userMenu.style.display : 'N/A'
    });
    
    // Проверяем существование элементов
    if (!loginBtn || !userMenu) {
        console.warn('[USER_MENU] Required elements missing:', {
            loginBtn: !!loginBtn,
            userMenu: !!userMenu
        });
        return;
    }
    
    const isAuthenticated = api.isAuthenticated();
    const currentUser = api.getCurrentUser();
    console.log('[USER_MENU] Auth state:', {
        isAuthenticated: isAuthenticated,
        currentUser: currentUser
    });
    
    if (isAuthenticated) {
        console.log('[USER_MENU] User authenticated, showing user menu');
        showUserMenu();
    } else {
        console.log('[USER_MENU] User not authenticated, showing login button');
        showLoginButton();
        if (userMenu) userMenu.style.display = 'none';
    }
}

function showUserMenu() {
    console.log('[SHOW_USER_MENU] showUserMenu called');
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    console.log('[SHOW_USER_MENU] Elements:', {
        loginBtn: !!loginBtn,
        userMenu: !!userMenu,
        userName: !!userName
    });
    
    if (loginBtn) {
        console.log('[SHOW_USER_MENU] Hiding login button');
        loginBtn.style.display = 'none';
    } else {
        console.warn('[SHOW_USER_MENU] loginBtn not found');
    }
    
    if (userMenu) {
        console.log('[SHOW_USER_MENU] Showing user menu');
        userMenu.style.display = 'flex';
        const user = api ? api.getCurrentUser() : null;
        console.log('[SHOW_USER_MENU] Current user:', user);
        
        if (user) {
            if (userName) {
                console.log('[SHOW_USER_MENU] Setting username to:', user.username);
                userName.textContent = user.username;
            } else {
                console.warn('[SHOW_USER_MENU] userName element not found');
            }
            
            // Добавляем аватар в кнопку профиля
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                // Генерируем инициалы для аватара
                const getInitials = (username, firstName, lastName) => {
                    if (firstName && lastName) {
                        return (firstName[0] + lastName[0]).toUpperCase();
                    }
                    if (firstName) {
                        return firstName[0].toUpperCase();
                    }
                    if (username && username.length >= 2) {
                        return username.substring(0, 2).toUpperCase();
                    }
                    return username ? username[0].toUpperCase() : 'U';
                };
                
                const initials = getInitials(user.username, user.firstName, user.lastName);
                
                // Проверяем, есть ли уже аватар
                let avatarElement = profileBtn.querySelector('.btn-profile-avatar');
                if (!avatarElement) {
                    // Удаляем иконку, если есть
                    const iconElement = profileBtn.querySelector('i');
                    if (iconElement) {
                        iconElement.remove();
                    }
                    // Создаем аватар
                    avatarElement = document.createElement('div');
                    avatarElement.className = 'btn-profile-avatar';
                    profileBtn.insertBefore(avatarElement, userName);
                }
                avatarElement.textContent = initials;
            }
        } else {
            console.warn('[SHOW_USER_MENU] No user object available');
        }
    } else {
        console.warn('[SHOW_USER_MENU] userMenu not found');
    }
}

function hideUserMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    if (loginBtn) loginBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
}

function showLoginButton() {
    console.log('[SHOW_LOGIN] showLoginButton called');
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('[SHOW_LOGIN] Showing login button');
        loginBtn.style.display = 'block';
    } else {
        console.warn('[SHOW_LOGIN] loginBtn not found');
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    element.style.backgroundColor = '#fee';
    element.style.color = '#c33';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    element.style.backgroundColor = '#efe';
    element.style.color = '#3c3';
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('show');
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getArtistName(artistId) {
    if (!artistId || !artists || artists.length === 0) {
        return 'Неизвестный исполнитель';
    }
    const artist = artists.find(a => a.id === artistId);
    return artist ? artist.name : 'Неизвестный исполнитель';
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

function getArtworkUrl(track) {
    if (!track) return '';
    
    // Сначала пытаемся получить обложку трека
    if (track.artworkPath && track.artworkPath.trim() !== '') {
        // Если это URL (начинается с http:// или https://), используем его напрямую
        if (track.artworkPath.startsWith('http://') || track.artworkPath.startsWith('https://')) {
            return track.artworkPath;
        }
        // Иначе это путь к локальному файлу - используем API
        return `${API_BASE_URL}/api/files/artwork/tracks/${track.id}`;
    }

    // Затем обложку альбома (используем window.albums для глобальной доступности)
    if (track.albumId && window.albums && window.albums.length > 0) {
        const album = window.albums.find(a => a.id === track.albumId);
        if (album && album.artworkPath && album.artworkPath.trim() !== '') {
            // Если это URL, используем его напрямую
            if (album.artworkPath.startsWith('http://') || album.artworkPath.startsWith('https://')) {
                return album.artworkPath;
            }
            // Иначе используем API, если путь не пустой
            return `${API_BASE_URL}/api/files/artwork/albums/${album.id}`;
        }
    }

    // Затем фото артиста (используем window.artists для глобальной доступности)
    if (track.artistId && window.artists && window.artists.length > 0) {
        const artist = window.artists.find(a => a.id === track.artistId);
        if (artist && artist.imagePath && artist.imagePath.trim() !== '') {
            // Если это URL, используем его напрямую
            if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                return artist.imagePath;
            }
            // Иначе используем API, если путь не пустой
            return `${API_BASE_URL}/api/files/artwork/artists/${artist.id}`;
        }
    }

    // По умолчанию возвращаем пустую строку (покажется иконка)
    return '';
}


// Search functionality
function performSearch() {
    const query = document.getElementById('searchInput')?.value.trim();
    if (!query) {
        return;
    }
    
    // Если мы не на главной странице, перенаправляем на главную с параметром поиска
    if (!document.getElementById('tracksList')) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        return;
    }
    
    searchAndDisplayResults(query);
}

async function searchAndDisplayResults(query) {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const [tracks, artists] = await Promise.all([
            api.searchTracks(query),
            api.searchArtists(query)
        ]);
        
        let html = '';
        
        if (artists.length > 0) {
            html += '<h3 style="margin: 20px 0 10px; color: #666;">Исполнители</h3>';
            html += artists.map(artist => {
                const artworkUrl = artist.imagePath && (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://'))
                    ? artist.imagePath
                    : `${window.API_BASE_URL || 'http://localhost:8080'}/api/files/artwork/artists/${artist.id}`;
                const hasArtwork = artist.imagePath;
                
                return `
                    <div class="track-item" data-artist-id="${artist.id}">
                        <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                            ${!hasArtwork ? '<i class="fas fa-user"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <a href="artist.html?id=${artist.id}" class="track-title track-link">${escapeHtml(artist.name)}</a>
                            <div class="track-artist">Исполнитель</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        if (tracks.length > 0) {
            html += '<h3 style="margin: 20px 0 10px; color: #666;">Треки</h3>';
            
            if (!window.artists || window.artists.length === 0) {
                window.artists = await api.getArtists();
            }
            
            html += tracks.map(track => {
                const artworkUrl = getArtworkUrl(track);
                const hasArtwork = artworkUrl && artworkUrl.trim() !== '';
                const artist = window.artists.find(a => a.id === track.artistId);
                const artistName = artist ? artist.name : 'Неизвестный исполнитель';
                
                return `
                    <div class="track-item" data-track-id="${track.id}">
                        <div class="track-artwork" style="${hasArtwork ? `background-image: url('${artworkUrl}'); background-size: cover; background-position: center;` : ''}">
                            ${!hasArtwork ? '<i class="fas fa-music"></i>' : ''}
                        </div>
                        <div class="track-info">
                            <a href="track.html?id=${track.id}" class="track-title track-link">${escapeHtml(track.title)}</a>
                            <a href="artist.html?id=${track.artistId}" class="track-artist track-link">${escapeHtml(artistName)}</a>
                        </div>
                        <div class="track-actions">
                            <button class="btn-play" onclick="playTrack(${track.id})" title="Воспроизвести">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        if (html === '') {
            html = '<div class="empty-state"><i class="fas fa-search"></i><p>Ничего не найдено</p></div>';
        }
        
        tracksList.innerHTML = html;
    } catch (error) {
        console.error('Search error:', error);
        tracksList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка поиска: ${error.message}</p></div>`;
    }
}

// Theme toggle - предотвращаем дублирование обработчиков
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) {
        return;
    }
    
    // Проверяем, был ли уже добавлен обработчик
    if (themeToggle.hasAttribute('data-theme-initialized')) {
        return;
    }
    
    // Помечаем как инициализированное
    themeToggle.setAttribute('data-theme-initialized', 'true');
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function applyTheme(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (theme === 'dark') {
        document.body.classList.remove('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        document.body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Additional global exports (duplicates removed, see line 702-713)

