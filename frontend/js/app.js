// Application State
let currentPage = 'new-tracks';
let currentPeriod = 'day';
let tracks = [];
let artists = [];
let albums = [];
let filteredTracks = [];

// Make available globally
window.tracks = tracks;
window.artists = artists;
window.albums = albums;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[MAIN] DOMContentLoaded - starting initialization');
    console.log('[MAIN] window.api:', typeof window.api);
    console.log('[MAIN] api object:', typeof api !== 'undefined' ? api : 'undefined');
    console.log('[MAIN] api.isAuthenticated:', typeof api !== 'undefined' && api ? api.isAuthenticated() : 'N/A');
    
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
        initializeFilters();
        initializeSearch();
        // Проверяем параметр поиска в URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            console.log('[MAIN] Search query found in URL:', searchQuery);
            document.getElementById('searchInput').value = searchQuery;
            searchAndDisplayResults(searchQuery);
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
    
    // Загружаем треки только на главной странице
    if (isMainPage) {
        console.log('[MAIN] Main page detected, loading tracks');
        await loadTracks();
    }
    
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
}

function navigateToPage(page) {
    currentPage = page;
    const titleMap = {
        'playlists': 'Мои плейлисты',
        'albums': 'Альбомы',
        'artists': 'Исполнители',
        'genres': 'Жанры',
        'new-tracks': 'Новинки'
    };
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        sectionTitle.textContent = titleMap[page] || 'Треки';
    }
    
    if (page === 'playlists') {
        loadPlaylists();
    } else if (page === 'albums') {
        displayAlbums();
    } else if (page === 'artists') {
        displayArtists();
    } else if (page === 'genres') {
        loadGenres();
    } else {
        loadTracks();
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

// Track Loading
async function loadTracks() {
    const tracksList = document.getElementById('tracksList');
    
    // Если элемента нет, просто загружаем данные без обновления DOM
    if (tracksList) {
        tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    try {
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
    
    if (filteredTracks.length === 0) {
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>Треков пока нет</p></div>';
        return;
    }
    
    tracksList.innerHTML = filteredTracks.map(track => {
        const duration = formatDuration(track.durationSeconds);
        const artistName = getArtistName(track.artistId);
        const artworkUrl = getArtworkUrl(track);
        
        // Если есть URL обложки, показываем изображение, иначе заглушку
        const artworkHtml = artworkUrl 
            ? `<img src="${artworkUrl}" alt="${escapeHtml(track.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : '';
        const placeholderHtml = artworkUrl 
            ? '<div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px;"><i class="fas fa-music"></i></div>'
            : '<div style="width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px; display: flex;"><i class="fas fa-music"></i></div>';
        
        return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-artwork">
                    ${artworkHtml}
                    ${placeholderHtml}
                </div>
                <div class="track-info">
                    <div class="track-title"><a href="track.html?id=${track.id}" class="track-link">${escapeHtml(track.title)}</a></div>
                    <div class="track-artist"><a href="artist.html?id=${track.artistId}" class="artist-link">${escapeHtml(artistName)}</a></div>
                </div>
                <div class="track-duration">${duration}</div>
                <div class="track-actions">
                    <button class="btn-play" onclick="playTrack(${track.id})" title="Воспроизвести">
                        <i class="fas fa-play"></i>
                    </button>
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
        
        if (window.setPlaylist) {
            window.setPlaylist(tracks, 0);
        } else if (window.playTrack) {
            window.playlist = tracks;
            window.currentTrackIndex = 0;
            window.playTrack(tracks[0].id);
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

// Отображение списка альбомов на странице
async function displayAlbums() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
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
                <div class="track-item" data-album-id="${album.id}">
                    <div class="track-artwork">
                        <a href="album.html?id=${album.id}" class="album-link" style="display: block; width: 100%; height: 100%;">
                            ${artworkUrl ? `<img src="${artworkUrl}" alt="${escapeHtml(album.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"><div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px;"><i class="fas fa-compact-disc"></i></div>` : '<i class="fas fa-compact-disc"></i>'}
                        </a>
                    </div>
                    <div class="track-info">
                        <div class="track-title"><a href="album.html?id=${album.id}" class="album-link">${escapeHtml(album.title)}</a></div>
                        <div class="track-artist"><a href="artist.html?id=${album.artistId}" class="artist-link">${escapeHtml(artistName)}</a></div>
                    </div>
                    ${album.releaseYear ? `<div class="track-duration">${album.releaseYear}</div>` : '<div class="track-duration"></div>'}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error displaying albums:', error);
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки альбомов</p></div>';
    }
}

// Отображение списка артистов на странице
async function displayArtists() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (!artists || artists.length === 0) {
            await loadArtists();
        }
        
        if (artists.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-user-friends"></i><p>Исполнителей пока нет</p></div>';
            return;
        }
        
        tracksList.innerHTML = artists.map(artist => {
            let imageUrl = '';
            if (artist.imagePath) {
                if (artist.imagePath.startsWith('http://') || artist.imagePath.startsWith('https://')) {
                    imageUrl = artist.imagePath;
                } else {
                    imageUrl = `${API_BASE_URL}/api/files/artwork/artists/${artist.id}`;
                }
            }
            return `
                <div class="track-item" data-artist-id="${artist.id}">
                    <div class="track-artwork">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(artist.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"><div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 8px;"><i class="fas fa-user"></i></div>` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div class="track-info">
                        <div class="track-title"><a href="artist.html?id=${artist.id}" class="artist-link">${escapeHtml(artist.name)}</a></div>
                        <div class="track-artist">${escapeHtml(artist.description || 'Описание отсутствует')}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error displaying artists:', error);
        tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка загрузки исполнителей</p></div>';
    }
}

// Genres
async function loadGenres() {
    const tracksList = document.getElementById('tracksList');
    tracksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const allTracks = await api.getTracks();
        const genres = [...new Set(allTracks.map(t => t.genre).filter(Boolean))];
        
        if (genres.length === 0) {
            tracksList.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><p>Жанров пока нет</p></div>';
            return;
        }
        
        tracksList.innerHTML = genres.map(genre => `
            <div class="track-item">
                <div class="track-artwork">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="track-info">
                    <a href="genre.html?name=${encodeURIComponent(genre)}" class="track-title track-link">${escapeHtml(genre)}</a>
                    <div class="track-artist">${allTracks.filter(t => t.genre === genre).length} треков</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        tracksList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></div>`;
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
                    <h3>Любимые треки</h3>
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
    profileInfo.innerHTML = `
        <div class="profile-info-item">
            <strong>Username:</strong> ${escapeHtml(user.username)}
        </div>
        <div class="profile-info-item">
            <strong>Email:</strong> ${escapeHtml(user.email)}
        </div>
        ${user.firstName ? `<div class="profile-info-item"><strong>Имя:</strong> ${escapeHtml(user.firstName)}</div>` : ''}
        ${user.lastName ? `<div class="profile-info-item"><strong>Фамилия:</strong> ${escapeHtml(user.lastName)}</div>` : ''}
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
                            <button class="btn-play" onclick="playTrack(${track.id})" title="Воспроизвести">
                                <i class="fas fa-play"></i>
                            </button>
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

// Track Actions
function playTrack(trackId) {
    // Импортированная функция из player.js
    if (window.playTrack) {
        window.playTrack(trackId);
    } else {
        // Fallback if player not loaded
        const track = tracks.find(t => t.id === trackId);
        if (track) {
            alert(`Воспроизведение: ${track.title}\nЗагрузка плеера...`);
        }
    }
}

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
    const savedTheme = localStorage.getItem('theme') || 'light';
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
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function applyTheme(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        document.body.classList.remove('dark-theme');
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

