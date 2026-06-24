    import API from './apiService';

    export const getCategories = () => {
        return API.get('/v1/categories');
    };
    
    export const getCategoryTemplatesApi = (categoryId, params = {}) => {
        if (!categoryId) return Promise.reject(new Error('categoryId required'));
        return API.get(`/v1/categories/${categoryId}/templates`, { params });
    };

    export const getSubcategories = (categoryId) => {
        const params = categoryId ? { category_id: categoryId } : {};
        return API.get('/v1/subcategories', { params });
    };

    export const getSubcategoryById = (id) => {
        if (!id) return Promise.reject(new Error('id required'));
        return API.get(`/v1/subcategories/${id}`);
    };
   