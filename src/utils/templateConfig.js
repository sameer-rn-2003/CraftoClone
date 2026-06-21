import { POSTER_SIZE } from './constants';

const PLACEHOLDER_PATTERN = /^{{\s*([^}]+)\s*}}$/;
const VIDEO_SOURCE_PATTERN = /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i;
const LEGACY_CIRCLE_SAFE_INSET = 24;

const hasValue = value => value !== undefined && value !== null && value !== '';

const getNumericValue = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toCamelCase = key =>
    String(key)
        .replace(/[-_\s]+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
        .replace(/^([A-Z])/, match => match.toLowerCase());

const toSnakeCase = key =>
    String(key)
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();

const getValueByKey = (source, key) => {
    if (!source || !key) return undefined;

    const variants = [
        key,
        String(key).toLowerCase(),
        toCamelCase(key),
        toSnakeCase(key),
    ];

    for (const variant of variants) {
        if (hasValue(source[variant])) {
            return source[variant];
        }
    }

    return undefined;
};

const pickFirstValue = (...values) => {
    for (const value of values) {
        if (hasValue(value)) {
            return value;
        }
    }

    return undefined;
};

export const getTemplatePlaceholderKey = value => {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(PLACEHOLDER_PATTERN);
    return match ? match[1].trim() : null;
};

export const getTemplateTextPlaceholderKey = layer =>
    getTemplatePlaceholderKey(layer?.text);

export const isUserPhotoLayer = layer =>
    layer?.id === 'user_photo' || getTemplatePlaceholderKey(layer?.src) === 'user_photo';

export const isBackgroundMediaLayer = layer =>
    layer?.id === 'bg' || getTemplatePlaceholderKey(layer?.src) === 'background_image';

const TEMPLATE_TEXT_ROLE_MAP = {
    headline: 'name',
    title: 'name',
    name: 'name',
    user_name: 'name',
    username: 'name',
    full_name: 'name',
    subtext: 'message',
    subtitle: 'message',
    message: 'message',
    user_message: 'message',
    tagline: 'message',
    caption: 'message',
    quote: 'message',
};

export const getTemplateEditableTextRole = layer => {
    const candidates = [
        layer?.id,
        getTemplateTextPlaceholderKey(layer),
    ];

    for (const candidate of candidates) {
        if (!candidate) continue;
        const normalizedKey = toSnakeCase(candidate);
        const role = TEMPLATE_TEXT_ROLE_MAP[normalizedKey];
        if (role) {
            return role;
        }
    }

    return null;
};

export const normalizeTemplateMediaType = template => {
    const rawType = String(template?.mediaType ?? template?.type ?? '').toUpperCase();
    if (rawType === 'IMAGE' || rawType === 'VIDEO') {
        return rawType;
    }

    const sourceCandidate = pickFirstValue(
        template?.source,
        template?.template_url,
        template?.templateUrl,
        template?.video,
        template?.video_url,
        template?.videoUrl,
        template?.Video,
        template?.image,
        template?.image_url,
        template?.imageUrl,
        template?.Image,
    );

    if (typeof sourceCandidate === 'string' && VIDEO_SOURCE_PATTERN.test(sourceCandidate)) {
        return 'VIDEO';
    }

    return 'IMAGE';
};

export const getTemplateCanvasSize = template => {
    const width = getNumericValue(
        template?.config?.width ?? template?.width ?? template?.canvasWidth,
        POSTER_SIZE.width,
    );
    const height = getNumericValue(
        template?.config?.height ?? template?.height ?? template?.canvasHeight,
        POSTER_SIZE.height,
    );

    return {
        width: width > 0 ? width : POSTER_SIZE.width,
        height: height > 0 ? height : POSTER_SIZE.height,
    };
};

export const getTemplateLayers = template =>
    Array.isArray(template?.config?.layers) ? template.config.layers.filter(Boolean) : [];

export const isConfigDrivenTemplate = template => getTemplateLayers(template).length > 0;

export const getTemplateVariableDefaults = template => {
    if (!Array.isArray(template?.config?.variables)) {
        return {};
    }

    return template.config.variables.reduce((accumulator, variable) => {
        if (!variable?.key) return accumulator;
        accumulator[variable.key] = variable.default ?? '';
        return accumulator;
    }, {});
};

export const resolveTemplateValue = (value, template, context = {}) => {
    if (typeof value !== 'string') {
        return value;
    }

    const placeholderKey = getTemplatePlaceholderKey(value);
    if (!placeholderKey) {
        return value;
    }

    const variableDefaults = getTemplateVariableDefaults(template);

    return pickFirstValue(
        getValueByKey(context, placeholderKey),
        getValueByKey(template, placeholderKey),
        getValueByKey(variableDefaults, placeholderKey),
    ) ?? '';
};

const normalizePhotoFrame = frame => {
    if (!frame) return null;

    const width = getNumericValue(frame.width, 0);
    const height = getNumericValue(frame.height, 0);
    const shape = String(frame.shape ?? '').toLowerCase();
    const explicitRadius = getNumericValue(frame.radius, 0);
    const legacyBorderRadius = getNumericValue(frame.borderRadius ?? frame.border_radius, 0);
    let borderRadius = legacyBorderRadius;

    if (!borderRadius) {
        if (explicitRadius > 0) {
            borderRadius = explicitRadius;
        } else if (shape === 'circle') {
            borderRadius = Math.min(width, height) / 2;
        } else if (shape === 'square') {
            borderRadius = 0;
        }
    }

    let x = getNumericValue(frame.x, 0);
    let y = getNumericValue(frame.y, 0);

    // Older admin circle templates were saved using center coordinates.
    if (shape === 'circle') {
        if (x + width > POSTER_SIZE.width) {
            x -= width / 2;
        }
        if (y + height > POSTER_SIZE.height) {
            y -= height / 2;
        }

        const maxCircleX = Math.max(0, POSTER_SIZE.width - width - LEGACY_CIRCLE_SAFE_INSET);
        x = Math.min(x, maxCircleX);
    }

    const normalized = {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width,
        height,
        borderRadius,
        borderWidth: getNumericValue(frame.borderWidth ?? frame.border_width, 0),
        borderColor: frame.borderColor ?? frame.border_color ?? '#FFFFFF',
    };

    if (!normalized.width || !normalized.height) {
        return null;
    }

    return normalized;
};

const normalizeBackgroundCrop = crop => {
    if (!crop) return null;

    const mediaWidth = getNumericValue(crop.mediaWidth ?? crop.media_width, 0);
    const mediaHeight = getNumericValue(crop.mediaHeight ?? crop.media_height, 0);
    const scale = getNumericValue(crop.scale, 1);
    const x = getNumericValue(crop.x, 0);
    const y = getNumericValue(crop.y, 0);

    if (!mediaWidth || !mediaHeight) {
        return null;
    }

    return {
        x,
        y,
        scale: scale > 0 ? scale : 1,
        mediaWidth,
        mediaHeight,
    };
};

export const getTemplatePhotoFrame = template => {
    const explicitPhotoFrame = normalizePhotoFrame(
        template?.photoFrame
        ?? template?.photo_frame
        ?? template?.config?.photoFrame
        ?? template?.config?.photo_frame,
    );
    if (explicitPhotoFrame) {
        return explicitPhotoFrame;
    }

    const photoLayer = getTemplateLayers(template).find(isUserPhotoLayer);
    if (!photoLayer) {
        return null;
    }

    return normalizePhotoFrame({
        x: photoLayer.x,
        y: photoLayer.y,
        width: photoLayer.width,
        height: photoLayer.height,
        borderRadius: photoLayer.borderRadius,
        borderWidth: photoLayer.borderWidth,
        borderColor: photoLayer.borderColor,
    });
};

export const getTemplateBackgroundCrop = template => normalizeBackgroundCrop(
    template?.backgroundCrop
    ?? template?.background_crop
    ?? template?.config?.backgroundCrop
    ?? template?.config?.background_crop,
);

const getTemplateVideoSource = template => pickFirstValue(
    template?.source,
    template?.Video,
    template?.video,
    template?.video_url,
    template?.videoUrl,
    template?.template_url,
    template?.templateUrl,
    template?.url,
);

const getTemplateImageSource = template => pickFirstValue(
    template?.source,
    template?.Image,
    template?.image,
    template?.image_url,
    template?.imageUrl,
    template?.thumbnail,
    template?.thumbnail_url,
    template?.thumbnailUrl,
);

export const buildTemplateRenderContext = ({
    template,
    userPhoto,
    userName,
    userMessage,
    framePng,
    backgroundImage,
    logoUrl,
    headline,
    subtext,
    premiumProfile,
} = {}) => {
    const mediaType = normalizeTemplateMediaType(template);
    const businessLogo = premiumProfile?.business?.businessLogo;
    const personalLogo = premiumProfile?.personal?.organizationLogo;
    const backgroundFallback = mediaType === 'VIDEO'
        ? getTemplateVideoSource(template)
        : getTemplateImageSource(template);
    const configuredBackground = getValueByKey(template, 'background_image');

    return {
        user_photo: userPhoto,
        user_name: userName,
        username: userName,
        name: userName,
        user_message: userMessage,
        message: userMessage,
        tagline: userMessage,
        caption: userMessage,
        frame_png: pickFirstValue(framePng, getValueByKey(template, 'frame_png')),
        background_image: pickFirstValue(
            backgroundImage,
            mediaType === 'VIDEO' && VIDEO_SOURCE_PATTERN.test(String(configuredBackground || ''))
                ? configuredBackground
                : undefined,
            mediaType === 'IMAGE' ? configuredBackground : undefined,
            backgroundFallback,
        ),
        logo_url: pickFirstValue(
            logoUrl,
            businessLogo,
            personalLogo,
            getValueByKey(template, 'logo_url'),
        ),
        headline: pickFirstValue(headline, userName),
        subtext: pickFirstValue(subtext, userMessage),
    };
};

const scaleFrameToCanvas = (frame, canvasSize) => {
    if (!frame) return null;

    const sourceSize = getTemplateCanvasSize({
        width: canvasSize?.sourceWidth,
        height: canvasSize?.sourceHeight,
    });
    const targetWidth = canvasSize?.width || sourceSize.width;
    const targetHeight = canvasSize?.height || sourceSize.height;
    const scaleX = targetWidth / sourceSize.width;
    const scaleY = targetHeight / sourceSize.height;

    return {
        x: getNumericValue(frame.x, 0) * scaleX,
        y: getNumericValue(frame.y, 0) * scaleY,
        width: getNumericValue(frame.width, 0) * scaleX,
        height: getNumericValue(frame.height, 0) * scaleY,
        borderRadius: getNumericValue(frame.borderRadius ?? frame.radius, 0) * Math.min(scaleX, scaleY),
        borderColor: frame.borderColor ?? '#FFFFFF',
        borderWidth: getNumericValue(frame.borderWidth, 0) * Math.min(scaleX, scaleY),
        shape: frame.shape,
    };
};

const buildDefaultTemplateLayers = ({ template, canvas, photoFrame, textFields, mediaType }) => {
    const backgroundSource = pickFirstValue(
        template?.source,
        template?.Video,
        template?.video,
        template?.video_url,
        template?.videoUrl,
        template?.Image,
        template?.image,
        template?.image_url,
        template?.imageUrl,
        template?.thumbnail,
    );

    const layers = [];

    if (backgroundSource) {
        layers.push({
            id: mediaType === 'VIDEO' ? 'bg_video' : 'bg',
            type: mediaType === 'VIDEO' ? 'video' : 'image',
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            src: '{{background_image}}',
            opacity: 1,
            zIndex: 0,
        });
    }

    if (photoFrame) {
        layers.push({
            id: 'user_photo',
            type: 'image',
            x: photoFrame.x,
            y: photoFrame.y,
            width: photoFrame.width,
            height: photoFrame.height,
            src: '{{user_photo}}',
            borderRadius: photoFrame.borderRadius,
            borderColor: photoFrame.borderColor,
            borderWidth: photoFrame.borderWidth,
            zIndex: 2,
        });
    }

    Object.entries(textFields).forEach(([key, field], index) => {
        if (!field?.visible) return;
        layers.push({
            id: key === 'name' ? 'headline' : 'subtext',
            type: 'text',
            x: field.position.x,
            y: field.position.y,
            width: field.width,
            text: key === 'name' ? '{{headline}}' : '{{subtext}}',
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
            fontWeight: field.fontWeight,
            color: field.color,
            align: field.align,
            zIndex: 3 + index,
        });
    });

    return layers;
};

export const buildTemplateRenderConfig = ({
    template,
    posterState = {},
    userData = {},
} = {}) => {
    const mediaType = normalizeTemplateMediaType(template);
    const canvas = getTemplateCanvasSize(template);
    const sourceCanvas = {
        ...canvas,
        sourceWidth: getNumericValue(template?.width ?? template?.config?.width, canvas.width),
        sourceHeight: getNumericValue(template?.height ?? template?.config?.height, canvas.height),
    };
    const photoFrame = scaleFrameToCanvas(getTemplatePhotoFrame(template), sourceCanvas);
    const rawTextFields = Array.isArray(template?.textFields) ? template.textFields : [];

    const textFields = rawTextFields.reduce((accumulator, field) => {
        const key = field?.key === 'message' ? 'message' : 'name';
        const userOffset = key === 'name'
            ? posterState.namePosition
            : posterState.messagePosition;
        const userScale = key === 'name'
            ? posterState.nameScale
            : posterState.messageScale;
        const fontSizeOverride = key === 'name'
            ? posterState.nameFontSize
            : posterState.messageFontSize;
        const colorOverride = key === 'name'
            ? posterState.nameColor
            : posterState.messageColor;

        accumulator[key] = {
            visible: key === 'name' ? posterState.showName !== false : posterState.showMessage !== false,
            content: key === 'name' ? userData.headline : userData.subtext,
            position: {
                x: getNumericValue(field.x, 16),
                y: getNumericValue(field.y, 0),
            },
            userOffset: userOffset ?? { x: 0, y: 0 },
            userScale: userScale ?? 1,
            width: getNumericValue(field.fieldWidth ?? field.width, canvas.width - getNumericValue(field.x, 16) * 2),
            fontSize: getNumericValue(fontSizeOverride ?? field.fontSize, key === 'name' ? 28 : 14),
            fontFamily: field.fontFamily ?? 'System',
            fontWeight: field.fontWeight ?? (key === 'name' ? 'bold' : 'normal'),
            color: colorOverride ?? field.color ?? '#FFFFFF',
            align: posterState.textAlign ?? field.align ?? 'center',
            bold: key === 'name' ? posterState.nameBold !== false : posterState.messageBold === true,
            italic: key === 'name' ? posterState.nameItalic === true : posterState.messageItalic === true,
            shadow: posterState.textShadow === true,
        };
        return accumulator;
    }, {});

    const nextPhotoFrame = photoFrame ? {
        ...photoFrame,
        userPosition: posterState.photoPosition ?? { x: 0, y: 0 },
        userScale: posterState.photoScale ?? 1,
        shape: posterState.photoShape === 'template' ? photoFrame.shape : posterState.photoShape,
        animation: {
            id: posterState.userPhotoAnimation || 'none',
        },
    } : null;

    const configLayers = getTemplateLayers(template);
    const templateLayers = configLayers.length
        ? configLayers
        : buildDefaultTemplateLayers({
            template,
            canvas,
            photoFrame: nextPhotoFrame,
            textFields,
            mediaType,
        });

    return {
        template: {
            id: template?.id,
            name: template?.name,
            category: template?.category,
            mediaType,
            version: template?.version ?? '1.0',
            canvas,
            accentColor: posterState.accentColorOverride ?? template?.accentColor,
            backgroundColor: template?.backgroundColor,
            footerColor: template?.footerColor,
        },
        media: {
            type: mediaType,
            backgroundSource: userData.background_image,
            thumbnailSource: template?.thumbnail,
            frameOverlaySource: userData.frame_png,
            backgroundCrop: template?.backgroundCrop ?? null,
        },
        userContent: {
            photo: posterState.userPhoto,
            name: posterState.userName,
            message: posterState.userMessage,
            isPremium: posterState.isPremium === true,
        },
        photoFrame: nextPhotoFrame,
        textFields: {
            ...textFields,
            global: {
                textAlign: posterState.textAlign ?? 'center',
                textShadow: posterState.textShadow === true,
            },
        },
        premiumProfile: posterState.premiumProfile,
        premiumBands: posterState.premiumBands,
        stickers: posterState.stickers ?? [],
        backgroundOverlay: {
            enabled: !!posterState.bgOverlayColor,
            color: posterState.bgOverlayColor,
            opacity: posterState.bgOverlayOpacity ?? 0.3,
        },
        designLayout: {
            index: posterState.designLayoutIndex ?? 0,
        },
        specialCategory: posterState.specialCategoryContext,
        selectedTags: posterState.selectedTags ?? [],
        templateVariables: userData,
        templateLayers,
        output: {
            format: mediaType === 'VIDEO' ? 'MP4' : 'JPEG',
            quality: 'high',
            width: canvas.width,
            height: canvas.height,
            fps: mediaType === 'VIDEO' ? 30 : undefined,
            includeAnimation: mediaType === 'VIDEO',
        },
    };
};

export const normalizeTemplateApiItem = item => {
    const config = item?.config_json ?? item?.config ?? null;
    const mediaType = normalizeTemplateMediaType(item);

    const source = pickFirstValue(
        item?.source,
        item?.template_url,
        item?.templateUrl,
        item?.url,
        mediaType === 'VIDEO'
            ? pickFirstValue(item?.video, item?.video_url, item?.videoUrl, item?.Video)
            : pickFirstValue(item?.image, item?.image_url, item?.imageUrl, item?.Image),
        pickFirstValue(item?.video, item?.video_url, item?.videoUrl, item?.Video),
        pickFirstValue(item?.image, item?.image_url, item?.imageUrl, item?.Image),
    );

    const thumbnail = pickFirstValue(
        item?.thumbnail,
        item?.thumbnail_url,
        item?.thumbnailUrl,
        item?.poster,
        item?.poster_url,
        item?.posterUrl,
        item?.image,
        item?.image_url,
        item?.imageUrl,
        item?.Image,
        mediaType === 'IMAGE' ? source : undefined,
    );

    const categoryValue = typeof item?.category === 'string'
        ? item.category
        : item?.category?.name ?? item?.category?.title ?? item?.category?.slug;

    const normalizedTemplate = {
        ...item,
        id: String(item?.id ?? item?._id ?? source ?? Date.now()),
        name: item?.name ?? item?.title ?? item?.category?.name ?? 'Untitled',
        category: categoryValue ? String(categoryValue).toLowerCase() : 'general',
        mediaType,
        source,
        thumbnail,
        config,
        photoFrame: getTemplatePhotoFrame({
            ...item,
            config,
        }),
        backgroundCrop: getTemplateBackgroundCrop({
            ...item,
            config,
        }),
        accentColor: item?.accentColor ?? item?.accent_color ?? '#CCCCCC',
        backgroundColor: config?.background ?? item?.backgroundColor ?? item?.background_color ?? '#000000',
        Image: mediaType === 'IMAGE' ? source : thumbnail,
        Video: mediaType === 'VIDEO' ? source : pickFirstValue(
            item?.video,
            item?.video_url,
            item?.videoUrl,
            item?.Video,
        ),
        // Metrics from API
        download_count: getNumericValue(item?.download_count ?? item?.downloadCount ?? item?.downloads ?? 0, 0),
        share_count: getNumericValue(item?.share_count ?? item?.shareCount ?? item?.shares ?? 0, 0),
    };

    return normalizedTemplate;
};

export const dedupeTemplates = templates => {
    const seen = new Map();

    for (const template of templates) {
        if (!template) continue;

        const key = [
            template.id,
            template.mediaType,
            template.source,
            template.thumbnail,
        ].filter(Boolean).join('::');

        if (!seen.has(key)) {
            seen.set(key, template);
        }
    }

    return Array.from(seen.values());
};
