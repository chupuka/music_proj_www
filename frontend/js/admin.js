// Admin Panel State
let currentSection = 'artists';
let artists = [];
let albums = [];
let tracks = [];
let users = [];
let playlists = [];

// Get API base URL (use from api.js if available, otherwise default)
const getApiBaseUrl = () => {
    try {
        // Try to use API_BASE_URL from api.js
        if (typeof API_BASE_URL !== 'undefined') {
            return API_BASE_URL;
        }
    } catch (e) {
        // Ignore
    }
    return window.API_BASE_URL || 'http://localhost:8080';
};

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // Ensure api is available from window (set by api.js)
    if (typeof window.api === 'undefined') {
        console.error('API service not available. Make sure api.js is loaded before admin.js');
        alert('Ошибка: API сервис не загружен. Проверьте консоль браузера.');
        return;
    }
    
    console.log('Admin panel initializing...');
    console.log('API service available:', typeof window.api !== 'undefined');
    
    // Initialize theme
    initializeTheme();
    
    initializeNavigation();
    initializeModals();
    loadAllData();
});

// Theme initialization
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
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

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navigateToSection(section);
            
            // Update active state
            document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function navigateToSection(section) {
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    
    // Show selected section
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Load data for section if needed
    if (section === 'artists' && artists.length === 0) {
        loadArtists();
    } else if (section === 'albums' && albums.length === 0) {
        loadAlbums();
    } else if (section === 'tracks' && tracks.length === 0) {
        loadTracks();
    } else if (section === 'users' && users.length === 0) {
        loadUsers();
    } else if (section === 'playlists' && playlists.length === 0) {
        loadPlaylists();
    }
}

// Modals
function initializeModals() {
    document.getElementById('closeEntityModal').addEventListener('click', closeEntityModal);
    
    document.getElementById('entityModal').addEventListener('click', (e) => {
        if (e.target.id === 'entityModal') {
            closeEntityModal();
        }
    });
    
    document.getElementById('entityForm').addEventListener('submit', handleFormSubmit);
}

function openAddModal(type) {
    document.getElementById('entityType').value = type;
    document.getElementById('entityId').value = '';
    document.getElementById('modalTitle').textContent = `Добавить ${getEntityName(type)}`;
    
    // Hide all form sections and remove required
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
        section.querySelectorAll('[data-required]').forEach(field => {
            field.removeAttribute('required');
        });
    });
    
    // Show relevant form section and add required
    const section = document.querySelector(`[data-entity="${type}"]`);
    if (section) {
        section.style.display = 'block';
        section.querySelectorAll('[data-required="true"]').forEach(field => {
            field.setAttribute('required', 'required');
        });
    }
    
    // Reset form first
    document.getElementById('entityForm').reset();
    document.getElementById('entityType').value = type;
    hideError('entityError');
    
    // Clear artwork previews and URL fields
    const albumPreview = document.getElementById('albumArtworkPreview');
    const trackPreview = document.getElementById('trackArtworkPreview');
    const albumUrl = document.getElementById('albumArtworkUrl');
    const trackUrl = document.getElementById('trackArtworkUrl');
    if (albumPreview) albumPreview.style.display = 'none';
    if (trackPreview) trackPreview.style.display = 'none';
    if (albumUrl) albumUrl.value = '';
    if (trackUrl) trackUrl.value = '';
    
    // Open modal first to ensure elements are visible
    document.getElementById('entityModal').classList.add('active');
    
    // Load dependencies after modal is shown (with small delay to ensure DOM is ready)
    setTimeout(() => {
        if (type === 'album' || type === 'track') {
            loadArtistsForSelect();
        }
        if (type === 'track') {
            loadAlbumsForSelect();
        }
    }, 100);
}

function openEditModal(type, entity) {
    document.getElementById('entityType').value = type;
    document.getElementById('entityId').value = entity.id;
    document.getElementById('modalTitle').textContent = `Редактировать ${getEntityName(type)}`;
    
    // Hide all form sections and remove required
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
        section.querySelectorAll('[data-required]').forEach(field => {
            field.removeAttribute('required');
        });
    });
    
    // Show relevant form section and add required
    const section = document.querySelector(`[data-entity="${type}"]`);
    if (section) {
        section.style.display = 'block';
        section.querySelectorAll('[data-required="true"]').forEach(field => {
            field.setAttribute('required', 'required');
        });
    }
    
    // Open modal first
    document.getElementById('entityModal').classList.add('active');
    hideError('entityError');
    
    // Load dependencies and then fill form (with delay to ensure select elements are populated)
    const fillForm = () => {
        if (type === 'artist') {
            document.getElementById('artistName').value = entity.name || '';
            document.getElementById('artistDescription').value = entity.description || '';
        } else if (type === 'album') {
            document.getElementById('albumTitle').value = entity.title || '';
            document.getElementById('albumReleaseYear').value = entity.releaseYear || '';
            // Заполняем URL обложки, если это URL, а не путь к файлу
            const artworkUrlInput = document.getElementById('albumArtworkUrl');
            if (artworkUrlInput && entity.artworkPath) {
                if (entity.artworkPath.startsWith('http://') || entity.artworkPath.startsWith('https://')) {
                    artworkUrlInput.value = entity.artworkPath;
                    previewArtworkUrl('albumArtworkUrl', 'albumArtworkPreview');
                }
            }
            // Устанавливаем artistId после загрузки списка
            setTimeout(() => {
                const select = document.getElementById('albumArtistId');
                if (select) {
                    select.value = entity.artistId || '';
                }
            }, 200);
        } else if (type === 'track') {
            document.getElementById('trackTitle').value = entity.title || '';
            document.getElementById('trackDuration').value = entity.durationSeconds || '';
            document.getElementById('trackGenre').value = entity.genre || '';
            document.getElementById('trackFilePath').value = entity.filePath || '';
            document.getElementById('trackFileUrl').value = '';
            // Заполняем URL обложки, если это URL, а не путь к файлу
            const artworkUrlInput = document.getElementById('trackArtworkUrl');
            if (artworkUrlInput && entity.artworkPath) {
                if (entity.artworkPath.startsWith('http://') || entity.artworkPath.startsWith('https://')) {
                    artworkUrlInput.value = entity.artworkPath;
                    previewArtworkUrl('trackArtworkUrl', 'trackArtworkPreview');
                }
            }
            // Устанавливаем artistId и albumId после загрузки списков
            setTimeout(() => {
                const artistSelect = document.getElementById('trackArtistId');
                const albumSelect = document.getElementById('trackAlbumId');
                if (artistSelect) {
                    artistSelect.value = entity.artistId || '';
                }
                if (albumSelect) {
                    albumSelect.value = entity.albumId || '';
                }
            }, 300);
        }
    };
    
    // Load dependencies
    if (type === 'album' || type === 'track') {
        loadArtistsForSelect().then(() => {
            if (type === 'track') {
                loadAlbumsForSelect().then(fillForm);
            } else {
                fillForm();
            }
        });
    } else {
        fillForm();
    }
}

function closeEntityModal() {
    document.getElementById('entityModal').classList.remove('active');
    document.getElementById('entityForm').reset();
    hideError('entityError');
    
    // Очищаем превью изображений
    document.querySelectorAll('[id$="Preview"]').forEach(img => {
        img.src = '';
        img.style.display = 'none';
    });
    
    // Очищаем статусы загрузки
    document.querySelectorAll('.upload-status').forEach(status => {
        status.textContent = '';
        status.classList.remove('error', 'success');
    });
}

function getEntityName(type) {
    const names = {
        'artist': 'исполнителя',
        'album': 'альбом',
        'track': 'трек'
    };
    return names[type] || type;
}

// Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Валидация формы
    const activeSection = document.querySelector('.form-section[style*="block"]') || document.querySelector('.form-section[data-entity="artist"]');
    const requiredFields = activeSection.querySelectorAll('[data-required="true"]');
    let isValid = true;
    
    for (const field of requiredFields) {
        if (!field.value || field.value.trim() === '') {
            field.style.borderColor = '#ff6b6b';
            isValid = false;
        } else {
            field.style.borderColor = '#e0e0e0';
        }
    }
    
    if (!isValid) {
        showError('entityError', 'Заполните все обязательные поля');
        return;
    }
    
    const type = document.getElementById('entityType').value;
    const id = document.getElementById('entityId').value;
    const formData = getFormData(type);
    
    try {
        let savedEntity;
        if (id) {
            // Update
            savedEntity = await updateEntity(type, id, formData);
        } else {
            // Create
            savedEntity = await createEntity(type, formData);
        }
        
        // Загружаем файлы после сохранения сущности
        if (savedEntity && savedEntity.id) {
            const entityId = savedEntity.id;
            
            // Загрузка обложек/изображений (только если файл выбран, а не URL)
            const albumArtworkUrl = document.getElementById('albumArtworkUrl').value.trim();
            if (type === 'album' && document.getElementById('albumArtwork').files[0] && !albumArtworkUrl) {
                try {
                    await uploadArtwork('album', entityId, 'albumArtwork');
                    const status = document.getElementById('albumArtworkStatus');
                    status.textContent = 'Обложка загружена';
                    status.classList.add('success');
                } catch (error) {
                    const status = document.getElementById('albumArtworkStatus');
                    status.textContent = 'Ошибка: ' + error.message;
                    status.classList.add('error');
                }
            } else if (type === 'album' && albumArtworkUrl) {
                const status = document.getElementById('albumArtworkStatus');
                status.textContent = 'URL обложки сохранен';
                status.classList.add('success');
            }
            
            if (type === 'artist' && document.getElementById('artistImage').files[0]) {
                try {
                    await uploadArtwork('artist', entityId, 'artistImage');
                    const status = document.getElementById('artistImageStatus');
                    status.textContent = 'Фото загружено';
                    status.classList.add('success');
                } catch (error) {
                    const status = document.getElementById('artistImageStatus');
                    status.textContent = 'Ошибка: ' + error.message;
                    status.classList.add('error');
                }
            }
            
            if (type === 'track') {
                // Загрузка аудио файла
                const trackFile = document.getElementById('trackFile').files[0];
                const trackFileUrl = document.getElementById('trackFileUrl').value.trim();
                
                if (trackFile) {
                    try {
                        await uploadTrackFile(entityId, 'trackFile');
                        const status = document.getElementById('trackFileStatus');
                        status.textContent = 'Аудио файл загружен';
                        status.classList.add('success');
                    } catch (error) {
                        const status = document.getElementById('trackFileStatus');
                        status.textContent = 'Ошибка: ' + error.message;
                        status.classList.add('error');
                    }
                } else if (trackFileUrl) {
                    // Скачивание файла по URL
                    try {
                        await downloadTrackFromUrl(entityId, trackFileUrl);
                        const status = document.getElementById('trackFileStatus');
                        status.textContent = 'Файл скачан по URL';
                        status.classList.add('success');
                    } catch (error) {
                        const status = document.getElementById('trackFileStatus');
                        status.textContent = 'Ошибка скачивания: ' + error.message;
                        status.classList.add('error');
                    }
                }
                
                // Загрузка обложки трека (только если файл выбран, а не URL)
                const trackArtworkUrl = document.getElementById('trackArtworkUrl').value.trim();
                if (document.getElementById('trackArtwork').files[0] && !trackArtworkUrl) {
                    try {
                        await uploadArtwork('track', entityId, 'trackArtwork');
                        const status = document.getElementById('trackArtworkStatus');
                        status.textContent = 'Обложка загружена';
                        status.classList.add('success');
                    } catch (error) {
                        const status = document.getElementById('trackArtworkStatus');
                        status.textContent = 'Ошибка: ' + error.message;
                        status.classList.add('error');
                    }
                } else if (trackArtworkUrl) {
                    const status = document.getElementById('trackArtworkStatus');
                    status.textContent = 'URL обложки сохранен';
                    status.classList.add('success');
                }
            }
        }
        
        // Ждем немного перед закрытием, чтобы показать статус загрузки
        setTimeout(() => {
            closeEntityModal();
            // Reload current section
            navigateToSection(currentSection);
        }, 1000);
    } catch (error) {
        showError('entityError', error.message || 'Ошибка сохранения');
    }
}

function getFormData(type) {
    const data = {};
    
    if (type === 'artist') {
        data.name = document.getElementById('artistName').value;
        data.description = document.getElementById('artistDescription').value;
        // Если указан URL фото, сохраняем его
        const imageUrl = document.getElementById('artistImageUrl').value.trim();
        if (imageUrl) {
            data.imagePath = imageUrl;
        }
    } else if (type === 'album') {
        data.title = document.getElementById('albumTitle').value;
        data.artistId = parseInt(document.getElementById('albumArtistId').value);
        const year = document.getElementById('albumReleaseYear').value;
        if (year) data.releaseYear = parseInt(year);
        // Если указан URL обложки, сохраняем его
        const artworkUrl = document.getElementById('albumArtworkUrl').value.trim();
        if (artworkUrl) {
            data.artworkPath = artworkUrl;
        }
    } else if (type === 'track') {
        data.title = document.getElementById('trackTitle').value;
        data.artistId = parseInt(document.getElementById('trackArtistId').value);
        const albumId = document.getElementById('trackAlbumId').value;
        if (albumId) data.albumId = parseInt(albumId);
        const duration = document.getElementById('trackDuration').value;
        if (duration) data.durationSeconds = parseInt(duration);
        data.genre = document.getElementById('trackGenre').value;
        data.filePath = document.getElementById('trackFilePath').value;
        // Если указан URL обложки, сохраняем его
        const artworkUrl = document.getElementById('trackArtworkUrl').value.trim();
        if (artworkUrl) {
            data.artworkPath = artworkUrl;
        }
    }
    
    return data;
}

// CRUD Operations
async function loadAllData() {
    try {
        // Загружаем исполнителей первыми, так как они нужны для альбомов и треков
        await loadArtists();
        // Остальные данные можно загружать параллельно
        await Promise.all([
            loadAlbums(),
            loadTracks(),
            loadUsers(),
            loadPlaylists()
        ]);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

async function loadArtists() {
    const tbody = document.getElementById('artists-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><div class="spinner"></div></td></tr>';
    
    try {
        artists = await window.api.getArtists();
        renderArtists();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state-table"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></td></tr>`;
    }
}

function renderArtists() {
    const tbody = document.getElementById('artists-table-body');
    
    if (artists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state-table"><i class="fas fa-user-friends"></i><p>Исполнителей пока нет</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = artists.map(artist => `
        <tr>
            <td>${artist.id}</td>
            <td><strong>${escapeHtml(artist.name)}</strong></td>
            <td>${escapeHtml(artist.description || '-')}</td>
            <td>${formatDate(artist.createdAt)}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal('artist', ${JSON.stringify(artist).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn-delete" onclick="deleteArtist(${artist.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadAlbums() {
    const tbody = document.getElementById('albums-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><div class="spinner"></div></td></tr>';
    
    try {
        albums = await window.api.request('/api/albums');
        renderAlbums();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state-table"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></td></tr>`;
    }
}

function renderAlbums() {
    const tbody = document.getElementById('albums-table-body');
    
    if (albums.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state-table"><i class="fas fa-compact-disc"></i><p>Альбомов пока нет</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = albums.map(album => {
        const artist = artists.find(a => a.id === album.artistId);
        return `
            <tr>
                <td>${album.id}</td>
                <td><strong>${escapeHtml(album.title)}</strong></td>
                <td>${escapeHtml(artist ? artist.name : 'Неизвестно')}</td>
                <td>${album.releaseYear || '-'}</td>
                <td>${formatDate(album.createdAt)}</td>
                <td>
                    <button class="btn-edit" onclick="openEditModal('album', ${JSON.stringify(album).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn-delete" onclick="deleteAlbum(${album.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTracks() {
    const tbody = document.getElementById('tracks-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell"><div class="spinner"></div></td></tr>';
    
    try {
        tracks = await window.api.getTracks();
        renderTracks();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state-table"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></td></tr>`;
    }
}

function renderTracks() {
    const tbody = document.getElementById('tracks-table-body');
    
    if (tracks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state-table"><i class="fas fa-music"></i><p>Треков пока нет</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = tracks.map(track => {
        const artist = artists.find(a => a.id === track.artistId);
        const album = albums.find(a => a.id === track.albumId);
        return `
            <tr>
                <td>${track.id}</td>
                <td><strong>${escapeHtml(track.title)}</strong></td>
                <td>${escapeHtml(artist ? artist.name : 'Неизвестно')}</td>
                <td>${escapeHtml(album ? album.title : '-')}</td>
                <td>${formatDuration(track.durationSeconds || 0)}</td>
                <td>${escapeHtml(track.genre || '-')}</td>
                <td>
                    <button class="btn-edit" onclick="openEditModal('track', ${JSON.stringify(track).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn-delete" onclick="deleteTrack(${track.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell"><div class="spinner"></div></td></tr>';
    
    try {
        users = await window.api.getUsers();
        renderUsers();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state-table"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></td></tr>`;
    }
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state-table"><i class="fas fa-users"></i><p>Пользователей пока нет</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${escapeHtml(user.username)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.firstName || '-')}</td>
            <td>${escapeHtml(user.lastName || '-')}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-delete" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadPlaylists() {
    const tbody = document.getElementById('playlists-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><div class="spinner"></div></td></tr>';
    
    try {
        playlists = await window.api.getPlaylists();
        renderPlaylists();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state-table"><i class="fas fa-exclamation-triangle"></i><p>Ошибка: ${error.message}</p></td></tr>`;
    }
}

function renderPlaylists() {
    const tbody = document.getElementById('playlists-table-body');
    
    if (playlists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state-table"><i class="fas fa-list"></i><p>Плейлистов пока нет</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = playlists.map(playlist => {
        const user = users.find(u => u.id === playlist.userId);
        return `
            <tr>
                <td>${playlist.id}</td>
                <td><strong>${escapeHtml(playlist.name)}</strong></td>
                <td>${escapeHtml(user ? user.username : 'Неизвестно')}</td>
                <td>${escapeHtml(playlist.description || '-')}</td>
                <td>${formatDate(playlist.createdAt)}</td>
                <td>
                    <button class="btn-delete" onclick="deletePlaylist(${playlist.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Create/Update/Delete
async function createEntity(type, data) {
    if (type === 'artist') {
        return await window.api.createArtist(data);
    } else if (type === 'album') {
        return await window.api.request('/api/albums', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    } else if (type === 'track') {
        return await window.api.createTrack(data);
    }
}

async function updateEntity(type, id, data) {
    if (type === 'artist') {
        return await window.api.request(`/api/artists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    } else if (type === 'album') {
        return await window.api.request(`/api/albums/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    } else if (type === 'track') {
        return await window.api.request(`/api/tracks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
}

async function deleteArtist(id) {
    if (!confirm('Вы уверены, что хотите удалить этого исполнителя?')) return;
    
    try {
        await window.api.request(`/api/artists/${id}`, { method: 'DELETE' });
        loadArtists();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function deleteAlbum(id) {
    if (!confirm('Вы уверены, что хотите удалить этот альбом?')) return;
    
    try {
        await window.api.request(`/api/albums/${id}`, { method: 'DELETE' });
        loadAlbums();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function deleteTrack(id) {
    if (!confirm('Вы уверены, что хотите удалить этот трек?')) return;
    
    try {
        await window.api.request(`/api/tracks/${id}`, { method: 'DELETE' });
        loadTracks();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
        await window.api.request(`/api/users/${id}`, { method: 'DELETE' });
        loadUsers();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function deletePlaylist(id) {
    if (!confirm('Вы уверены, что хотите удалить этот плейлист?')) return;
    
    try {
        await window.api.request(`/api/playlists/${id}`, { method: 'DELETE' });
        loadPlaylists();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Helper Functions
async function loadArtistsForSelect() {
    try {
        // Загружаем исполнителей, если еще не загружены
        if (artists.length === 0) {
            artists = await window.api.getArtists();
            console.log('Загружено исполнителей:', artists.length);
        }
        
        // Заполняем оба select элемента (для альбомов и треков)
        const albumSelect = document.getElementById('albumArtistId');
        const trackSelect = document.getElementById('trackArtistId');
        
        if (!albumSelect && !trackSelect) {
            console.warn('Select элементы для исполнителей не найдены');
            return;
        }
        
        let options = '';
        if (artists.length > 0) {
            options = artists.map(a => 
                `<option value="${a.id}">${escapeHtml(a.name || 'Без названия')}</option>`
            ).join('');
        } else {
            options = '<option value="" disabled>Нет доступных исполнителей. Сначала добавьте исполнителя.</option>';
        }
        
        if (albumSelect) {
            const currentValue = albumSelect.value;
            albumSelect.innerHTML = '<option value="">Выберите исполнителя</option>' + options;
            if (currentValue) {
                albumSelect.value = currentValue;
            }
            console.log('Заполнен select для альбомов:', albumSelect.options.length, 'опций');
        }
        
        if (trackSelect) {
            const currentValue = trackSelect.value;
            trackSelect.innerHTML = '<option value="">Выберите исполнителя</option>' + options;
            if (currentValue) {
                trackSelect.value = currentValue;
            }
            console.log('Заполнен select для треков:', trackSelect.options.length, 'опций');
        }
    } catch (error) {
        console.error('Ошибка загрузки исполнителей:', error);
        // Показываем ошибку пользователю
        const albumSelect = document.getElementById('albumArtistId');
        const trackSelect = document.getElementById('trackArtistId');
        if (albumSelect) {
            albumSelect.innerHTML = '<option value="">Ошибка загрузки. Проверьте консоль.</option>';
        }
        if (trackSelect) {
            trackSelect.innerHTML = '<option value="">Ошибка загрузки. Проверьте консоль.</option>';
        }
    }
}

async function loadAlbumsForSelect() {
    try {
        // Загружаем альбомы, если еще не загружены
        if (albums.length === 0) {
            albums = await window.api.request('/api/albums');
        }
        
        const select = document.getElementById('trackAlbumId');
        if (select) {
            const currentValue = select.value;
            const options = albums.map(a => 
                `<option value="${a.id}">${escapeHtml(a.title)}</option>`
            ).join('');
            
            select.innerHTML = '<option value="">Без альбома</option>' + options;
            if (currentValue) {
                select.value = currentValue;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки альбомов:', error);
        const select = document.getElementById('trackAlbumId');
        if (select) {
            select.innerHTML = '<option value="">Ошибка загрузки альбомов</option>';
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('show');
}

// Artwork Preview
function previewArtwork(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewArtworkUrl(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input && input.value.trim()) {
        const url = input.value.trim();
        // Проверяем, что это валидный URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            preview.src = url;
            preview.style.display = 'block';
            preview.onerror = function() {
                preview.style.display = 'none';
                const status = inputId.includes('album') 
                    ? document.getElementById('albumArtworkStatus')
                    : document.getElementById('trackArtworkStatus');
                if (status) {
                    status.textContent = 'Не удалось загрузить изображение по указанному URL';
                    status.classList.add('error');
                }
            };
        }
    } else {
        preview.style.display = 'none';
    }
}

// Upload Artwork
async function uploadArtwork(type, entityId, fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput.files || !fileInput.files[0]) {
        return null;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        let url;
        const apiBaseUrl = getApiBaseUrl();
        if (type === 'album') {
            url = `${apiBaseUrl}/api/files/artwork/albums/${entityId}/upload`;
        } else if (type === 'artist') {
            url = `${apiBaseUrl}/api/files/artwork/artists/${entityId}/upload`;
        } else if (type === 'track') {
            url = `${apiBaseUrl}/api/files/artwork/tracks/${entityId}/upload`;
        } else {
            return null;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ошибка загрузки файла');
        }
        
        const result = await response.text();
        return result;
    } catch (error) {
        console.error('Ошибка загрузки обложки:', error);
        throw error;
    }
}

// Upload Track File
async function downloadTrackFromUrl(trackId, fileUrl) {
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
    
    const formData = new URLSearchParams();
    formData.append('url', fileUrl);
    
    const response = await fetch(`${API_BASE_URL}/api/files/tracks/${trackId}/download-from-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.text();
    return result;
}

async function uploadTrackFile(trackId, fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput.files || !fileInput.files[0]) {
        return null;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const apiBaseUrl = getApiBaseUrl();
        const url = `${apiBaseUrl}/api/files/tracks/${trackId}/upload`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ошибка загрузки файла');
        }
        
        const result = await response.text();
        return result;
    } catch (error) {
        console.error('Ошибка загрузки аудио файла:', error);
        throw error;
    }
}

