import { normalizeTemplateMediaType } from './templateConfig';

const normalizeSource = source => {
    if (!source) return null;
    if (typeof source === 'number') return source;
    if (typeof source === 'string') return { uri: source };
    if (typeof source === 'object' && source.uri) return source;
    return source;
};

export const getTemplateImageSource = template => {
    const mediaType = normalizeTemplateMediaType(template);
    const image = mediaType === 'IMAGE'
        ? template?.source
            ?? template?.Image
            ?? template?.image
            ?? template?.imageUrl
            ?? template?.image_url
            ?? template?.thumbnail
            ?? template?.thumbnail_url
        : template?.thumbnail
            ?? template?.thumbnail_url
            ?? template?.Image
            ?? template?.image
            ?? template?.imageUrl
            ?? template?.image_url;

    return normalizeSource(image);
};

export const getTemplateVideoSource = template => {
    const mediaType = normalizeTemplateMediaType(template);
    const video = mediaType === 'VIDEO'
        ? template?.source
            ?? template?.Video
            ?? template?.video
            ?? template?.videoUrl
            ?? template?.video_url
        : template?.Video
            ?? template?.video
            ?? template?.videoUrl
            ?? template?.video_url;

    return normalizeSource(video);
};

export const hasTemplateVideo = template => !!getTemplateVideoSource(template);
