// src/apiService/templateApi.js

import API from './apiService';

export const getTemplatesApi = (params) => {
    return API.get('/v1/templates', { params });
};
