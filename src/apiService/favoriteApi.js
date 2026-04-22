import API from './apiService';

export const addFavoriteApi = templateId => API.post('/v1/favorites', {
    template_id: templateId,
});

export const getFavoritesApi = ({ page = 1, limit = 100 } = {}) =>
    API.get('/v1/favorites', {
        params: { page, limit },
    });

export const removeFavoriteApi = favoriteId => API.delete(`/v1/favorites/${favoriteId}`);
