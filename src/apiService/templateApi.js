// src/apiService/templateApi.js

import API from './apiService';

export const getTemplatesApi = (params) => {
    console.log('Fetching templates with params:', params);
    return API.get('/v1/templates', { params });
};
