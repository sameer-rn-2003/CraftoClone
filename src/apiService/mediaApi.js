import API from './apiService';

const normalizeUserData = (data = {}) => ({
    headline: data.headline ?? '',
    subtext: data.subtext ?? '',
});

const normalizeRenderConfig = (config = {}) => {
    const result = {};

    if (config.template) {
        result.template = config.template;
    }
    if (config.media) {
        result.media = config.media;
    }
    if (config.userContent) {
        result.userContent = config.userContent;
    }
    if (config.photoFrame) {
        result.photoFrame = config.photoFrame;
    }
    if (config.textFields) {
        result.textFields = config.textFields;
    }
    if (config.backgroundOverlay) {
        result.backgroundOverlay = config.backgroundOverlay;
    }
    if (config.premiumBands) {
        result.premiumBands = config.premiumBands;
    }
    if (Array.isArray(config.stickers)) {
        result.stickers = config.stickers;
    }
    if (Array.isArray(config.animation) && config.animation.length > 0) {
        result.animation = config.animation;
    }
    if (config.output) {
        result.output = config.output;
    }
    if (config.templateVariables) {
        result.templateVariables = config.templateVariables;
    }

    return result;
};

const normalizeGenerationPayload = (data = {}) => ({
    template_id: data.template_id ?? data.templateId,
    type: data.type ?? data.mediaType ?? 'IMAGE',
    user_data: normalizeUserData(data.user_data ?? data.context ?? {}),
    render_config: normalizeRenderConfig(data.render_config ?? data.renderConfig ?? {}),
});

export const generateMediaApi = (data) => {
    if (!data) return Promise.reject(new Error('data required'));

    const hasTopAnimation = Array.isArray(data?.render_config?.animation) && data.render_config.animation.length > 0;
    const photoFrameAnim = data?.render_config?.photoFrame?.animation;
    const hasPhotoFrameAnimation = photoFrameAnim && photoFrameAnim.id && photoFrameAnim.id !== 'none';
    const hasAnimation = hasTopAnimation || hasPhotoFrameAnimation;
    const type = hasAnimation ? 'VIDEO' : String(data?.type ?? data?.mediaType ?? 'IMAGE').toUpperCase();

    const payload = normalizeGenerationPayload({ ...data, type });
    console.log('[generateMedia] payload:', JSON.stringify(payload, null, 2));
    return API.post('/v1/generate', payload);
};

export const getMediaStatusApi = (jobId) => {
    if (!jobId) return Promise.reject(new Error('jobId required'));
    return API.get(`/v1/media/${jobId}`);
};

export default {
    generateMediaApi,
    getMediaStatusApi,
};
