// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080'; // API Gateway

// API Service
class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // 204 No Content не имеет тела ответа
            if (response.status === 204) {
                return null;
            }
            
            // Проверяем, есть ли тело ответа
            const contentType = response.headers.get('content-type');
            const hasBody = contentType && contentType.includes('application/json');
            
            if (!hasBody && response.status >= 200 && response.status < 300) {
                // Успешный ответ без тела
                return null;
            }
            
            const text = await response.text();
            
            if (!response.ok) {
                let errorMessage = 'Ошибка запроса';
                if (text) {
                    try {
                        const errorData = JSON.parse(text);
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch {
                        errorMessage = text;
                    }
                }
                throw new Error(errorMessage);
            }
            
            // Парсим JSON только если есть содержимое
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth Methods
    async login(emailOrUsername, password) {
        console.log('[API] login called with:', emailOrUsername);
        // Попробуем сначала найти пользователя по email или username
        const users = await this.request('/api/users');
        const user = users.find(u => 
            u.email === emailOrUsername || u.username === emailOrUsername
        );
        
        if (!user) {
            console.warn('[API] login failed - user not found');
            throw new Error('Пользователь не найден');
        }

        // В реальном приложении здесь был бы отдельный endpoint для логина
        // Для демо используем простую проверку
        this.user = user;
        this.token = 'demo_token_' + user.id;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('[API] login successful, user:', user);
        console.log('[API] isAuthenticated now:', this.isAuthenticated());
        
        return user;
    }

    async register(userData) {
        const user = await this.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        // Автоматический логин после регистрации
        this.user = user;
        this.token = 'demo_token_' + user.id;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return user;
    }

    logout() {
        console.log('[API] logout called]');
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        console.log('[API] logout complete, isAuthenticated now:', this.isAuthenticated());
    }

    isAuthenticated() {
        const result = !!this.token && !!this.user;
        console.log('[API] isAuthenticated() called, result:', result, { token: !!this.token, user: !!this.user });
        return result;
    }

    getCurrentUser() {
        console.log('[API] getCurrentUser() called, returning:', this.user);
        return this.user;
    }

    // User Methods
    async getUsers() {
        return await this.request('/api/users');
    }

    async getUserById(id) {
        return await this.request(`/api/users/${id}`);
    }

    // Artist Methods
    async getArtists() {
        return await this.request('/api/artists');
    }

    async getArtistById(id) {
        return await this.request(`/api/artists/${id}`);
    }

    async createArtist(artistData) {
        return await this.request('/api/artists', {
            method: 'POST',
            body: JSON.stringify(artistData),
        });
    }

    async updateArtist(id, artistData) {
        return await this.request(`/api/artists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(artistData),
        });
    }

    async deleteArtist(id) {
        return await this.request(`/api/artists/${id}`, {
            method: 'DELETE',
        });
    }

    // Album Methods
    async getAlbums() {
        return await this.request('/api/albums');
    }

    async getAlbumById(id) {
        return await this.request(`/api/albums/${id}`);
    }

    async createAlbum(albumData) {
        return await this.request('/api/albums', {
            method: 'POST',
            body: JSON.stringify(albumData),
        });
    }

    async updateAlbum(id, albumData) {
        return await this.request(`/api/albums/${id}`, {
            method: 'PUT',
            body: JSON.stringify(albumData),
        });
    }

    async deleteAlbum(id) {
        return await this.request(`/api/albums/${id}`, {
            method: 'DELETE',
        });
    }

    // Track Methods
    async getTracks() {
        return await this.request('/api/tracks');
    }

    async getTrackById(id) {
        return await this.request(`/api/tracks/${id}`);
    }

    async getTracksByArtist(artistId) {
        return await this.request(`/api/tracks/artist/${artistId}`);
    }

    async createTrack(trackData) {
        return await this.request('/api/tracks', {
            method: 'POST',
            body: JSON.stringify(trackData),
        });
    }

    async updateTrack(id, trackData) {
        return await this.request(`/api/tracks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(trackData),
        });
    }

    async deleteTrack(id) {
        return await this.request(`/api/tracks/${id}`, {
            method: 'DELETE',
        });
    }

    // Playlist Methods
    async getPlaylists(userId) {
        if (userId) {
            return await this.request(`/api/playlists/user/${userId}`);
        }
        return await this.request('/api/playlists');
    }

    async createPlaylist(playlistData) {
        return await this.request('/api/playlists', {
            method: 'POST',
            body: JSON.stringify(playlistData),
        });
    }

    async updatePlaylist(id, playlistData) {
        return await this.request(`/api/playlists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(playlistData),
        });
    }

    async deletePlaylist(id) {
        return await this.request(`/api/playlists/${id}`, {
            method: 'DELETE',
        });
    }

    // Playlist Tracks Methods
    async addTrackToPlaylist(playlistId, trackId) {
        return await this.request('/api/playlist-tracks', {
            method: 'POST',
            body: JSON.stringify({ playlistId, trackId }),
        });
    }

    async getPlaylistTracks(playlistId) {
        try {
            const trackIds = await this.request(`/api/playlist-tracks/playlist/${playlistId}`);
            
            // Если trackIds пустой массив или null, возвращаем пустой массив
            if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
                return [];
            }
            
            // Получаем детали треков
            const tracks = [];
            for (const id of trackIds) {
                try {
                    const track = await this.getTrackById(id);
                    if (track) {
                        tracks.push(track);
                    }
                } catch (error) {
                    console.warn(`Ошибка загрузки трека ${id}:`, error);
                    // Продолжаем загрузку других треков
                }
            }
            return tracks;
        } catch (error) {
            console.warn('Error fetching playlist tracks (returning empty array):', error);
            // Всегда возвращаем пустой массив вместо ошибки, если плейлист не найден или пустой
            // Это позволяет отображать плейлист даже если в нем нет треков
            return [];
        }
    }

    async removeTrackFromPlaylist(playlistId, trackId) {
        return await this.request(`/api/playlist-tracks/playlist/${playlistId}/track/${trackId}`, {
            method: 'DELETE',
        });
    }

    // Favorite Tracks Methods
    async getFavoriteTracks(userId) {
        const trackIds = await this.request(`/api/favorite-tracks/user/${userId}`);
        // Получаем детали треков
        const tracks = [];
        for (const id of trackIds) {
            try {
                const track = await this.getTrackById(id);
                tracks.push(track);
            } catch (error) {
                console.error(`Ошибка загрузки трека ${id}:`, error);
            }
        }
        return tracks;
    }

    async addFavoriteTrack(userId, trackId) {
        return await this.request('/api/favorite-tracks', {
            method: 'POST',
            body: JSON.stringify({ userId, trackId }),
        });
    }

    async removeFavoriteTrack(userId, trackId) {
        return await this.request(`/api/favorite-tracks/user/${userId}/track/${trackId}`, {
            method: 'DELETE',
        });
    }

    async isFavorite(userId, trackId) {
        try {
            const result = await this.request(`/api/favorite-tracks/user/${userId}/track/${trackId}`);
            return result;
        } catch {
            return false;
        }
    }
    
    // Track Plays Methods
    async recordTrackPlay(trackId) {
        try {
            await this.request(`/api/tracks/${trackId}/play`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error recording track play:', error);
            // Не прерываем воспроизведение при ошибке записи
        }
    }
    
    // Search Methods
    async searchTracks(query) {
        return await this.request(`/api/tracks/search?query=${encodeURIComponent(query)}`);
    }
    
    async searchArtists(query) {
        return await this.request(`/api/artists/search?query=${encodeURIComponent(query)}`);
    }
    
    async getPlaylistById(id) {
        return await this.request(`/api/playlists/${id}`);
    }
}

// Export API instance
const api = new ApiService(API_BASE_URL);
console.log('[API] ApiService instance created:', api);
console.log('[API] api.isAuthenticated available:', typeof api.isAuthenticated === 'function');
console.log('[API] Initial auth state:', api.isAuthenticated());
console.log('[API] Initial user:', api.getCurrentUser());

// Make available globally for other scripts
window.api = api;
window.API_BASE_URL = API_BASE_URL;
console.log('[API] window.api set:', typeof window.api);

