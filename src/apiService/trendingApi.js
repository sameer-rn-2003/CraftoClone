import API from './apiService';

export const getTrendingTemplatesApi = (params = {}) => {
    return API.get('/v1/templates/trending', { params });
};

export default {
    getTrendingTemplatesApi,
};
