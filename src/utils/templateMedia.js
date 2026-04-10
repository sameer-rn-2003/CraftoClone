export const getTemplateImageSource = template => {
    const image = template?.Image ?? template?.image ?? template?.imageUrl ?? template?.image_url;

    if (!image) return null;
    if (typeof image === 'number') return image;
    if (typeof image === 'string') return { uri: image };
    if (typeof image === 'object' && image.uri) return image;

    return image;
};

export const getTemplateVideoSource = template => {
    const video = template?.Video ?? template?.video ?? template?.videoUrl ?? template?.video_url;

    if (!video) return null;
    if (typeof video === 'number') return video;
    if (typeof video === 'string') return { uri: video };
    if (typeof video === 'object' && video.uri) return video;

    return video;
};

export const hasTemplateVideo = template => !!getTemplateVideoSource(template);
