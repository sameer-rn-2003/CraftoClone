import API from './apiService';

export const trackTemplateActionApi = (templateId, data = {}) => {
    if (!templateId) return Promise.reject(new Error('templateId required'));
    const action = String(data.action || '').toLowerCase();

    if (action === 'download') {
        return API.post(`/v1/templates/${templateId}/download`);
    }

    if (action === 'share') {
        return API.post(`/v1/templates/${templateId}/share`);
    }

    return Promise.reject(new Error('template action must be download or share'));
};

export default { trackTemplateActionApi };
