    import API from './apiService';

    export const getCategories = () => {
        return API.get('/v1/categories');
    };
    
    export const getCategoryTemplatesApi = (categoryId, params = {}) => {
        if (!categoryId) return Promise.reject(new Error('categoryId required'));
        return API.get(`/v1/categories/${categoryId}/templates`, { params });
    };
   