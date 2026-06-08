import API from './apiService';

export const generateMediaApi = (data) => {
    if (!data) return Promise.reject(new Error('data required'));
    return API.post('/v1/media/generate', data);
};

export const getMediaStatusApi = (jobId) => {
    if (!jobId) return Promise.reject(new Error('jobId required'));
    return API.get(`/v1/media/status/${jobId}`);
};

export default {
    generateMediaApi,
    getMediaStatusApi,
};
