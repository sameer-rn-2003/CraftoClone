import API from './apiService';

const normalizeGenerationPayload = (data = {}) => ({
    template_id: data.template_id ?? data.templateId,
    type: data.type ?? data.mediaType ?? 'IMAGE',
    user_data: data.user_data ?? data.context ?? {},
    render_config: data.render_config ?? data.renderConfig ?? {},
});

export const generateImageApi = (data) => {
    if (!data) return Promise.reject(new Error('data required'));
    return API.post('/v1/generate/image', normalizeGenerationPayload({ ...data, type: 'IMAGE' }));
};

export const generateVideoApi = (data) => {
    if (!data) return Promise.reject(new Error('data required'));
    return API.post('/v1/generate/video', normalizeGenerationPayload({ ...data, type: 'VIDEO' }));
};

export const generateMediaApi = (data) => {
    const type = String(data?.type ?? data?.mediaType ?? '').toUpperCase();
    return type === 'VIDEO' ? generateVideoApi(data) : generateImageApi(data);
};

export const getMediaStatusApi = (jobId) => {
    if (!jobId) return Promise.reject(new Error('jobId required'));
    return API.get(`/v1/media/${jobId}`);
};

export default {
    generateImageApi,
    generateVideoApi,
    generateMediaApi,
    getMediaStatusApi,
};
