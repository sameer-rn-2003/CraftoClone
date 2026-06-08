import API from './apiService';

export const trackTemplateActionApi = (templateId, data = {}) => {
    if (!templateId) return Promise.reject(new Error('templateId required'));
    return API.post(`/v1/templates/${templateId}/track`, data);
};

export default { trackTemplateActionApi };
