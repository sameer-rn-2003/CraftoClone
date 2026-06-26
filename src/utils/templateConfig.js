import { POSTER_SIZE } from './constants';
import { PHOTO_ANIMATION_DEFAULTS } from './photoAnimationOptions';

const PLACEHOLDER_PATTERN = /^{{\s*([^}]+)\s*}}$/;
const VIDEO_SOURCE_PATTERN = /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i;
const URL_PATTERN = /^https?:\/\//i;
const LEGACY_CIRCLE_SAFE_INSET = 24;

const hasValue = value => value !== undefined && value !== null && value !== '';

const isHttpUrl = value => typeof value === 'string' && URL_PATTERN.test(value);

const pickFirstUrl = (...values) => {
    for (const value of values) {
        if (isHttpUrl(value)) {
            return value;
        }
    }
    return undefined;
};

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
    const configJson = template?.config_json ?? template?.config ?? null;
    const width = getNumericValue(
        configJson?.width ?? template?.config?.width ?? template?.width ?? template?.canvasWidth,
        POSTER_SIZE.width,
    );
    const height = getNumericValue(
        configJson?.height ?? template?.config?.height ?? template?.height ?? template?.canvasHeight,
        POSTER_SIZE.height,
    );

    return {
        width: width > 0 ? width : POSTER_SIZE.width,
        height: height > 0 ? height : POSTER_SIZE.height,
    };
};

export const getTemplateLayers = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    return Array.isArray(configJson?.layers) ? configJson.layers.filter(Boolean) : [];
};

export const isConfigDrivenTemplate = template => getTemplateLayers(template).length > 0;

export const getTemplateVariableDefaults = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    if (!Array.isArray(configJson?.variables)) {
        return {};
    }

    return configJson.variables.reduce((accumulator, variable) => {
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

const normalizePhotoFrame = (frame, canvasSize) => {
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

    const targetWidth = canvasSize?.width || POSTER_SIZE.width;
    const targetHeight = canvasSize?.height || POSTER_SIZE.height;

    // Only apply legacy center-coordinate adjustment for old admin templates
    // that used POSTER_SIZE (400×560). New templates with 1080×1920 have correct
    // top-left coordinates from the admin panel.
    const isLegacyCanvas = targetWidth <= POSTER_SIZE.width && targetHeight <= POSTER_SIZE.height;
    if (shape === 'circle' && isLegacyCanvas) {
        if (x + width > targetWidth) {
            x -= width / 2;
        }
        if (y + height > targetHeight) {
            y -= height / 2;
        }

        const maxCircleX = Math.max(0, targetWidth - width - LEGACY_CIRCLE_SAFE_INSET);
        x = Math.min(x, maxCircleX);
    }

    const normalized = {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width,
        height,
        shape,
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
    const canvasSize = getTemplateCanvasSize(template);
    const explicitPhotoFrame = normalizePhotoFrame(
        template?.photoFrame
        ?? template?.photo_frame
        ?? template?.config?.photoFrame
        ?? template?.config?.photo_frame
        ?? template?.config_json?.photoFrame
        ?? template?.config_json?.photo_frame,
        canvasSize,
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
    }, canvasSize);
};

export const getTemplateBackgroundCrop = template => normalizeBackgroundCrop(
    template?.backgroundCrop
    ?? template?.background_crop
    ?? template?.config?.backgroundCrop
    ?? template?.config?.background_crop,
);

export const getTemplateTextFields = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    if (configJson?.textFields && typeof configJson.textFields === 'object') {
        return configJson.textFields;
    }
    return template?.textFields ?? {};
};

export const getTemplateBackgroundOverlay = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    return configJson?.backgroundOverlay ?? template?.backgroundOverlay ?? null;
};

export const getTemplateAnimation = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    return configJson?.animation ?? [];
};

export const getTemplateOutput = template => {
    const configJson = template?.config_json ?? template?.config ?? null;
    return configJson?.output ?? null;
};

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
    headline,
    subtext,
    userName,
    userMessage,
} = {}) => {
    return {
        headline: headline || userName || '',
        subtext: subtext || userMessage || '',
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
    const configJson = template?.config_json ?? template?.config ?? null;
    const canvas = getTemplateCanvasSize(template);
    const sourceCanvas = {
        ...canvas,
        sourceWidth: getNumericValue(
            configJson?.width ?? template?.config?.width ?? template?.width,
            canvas.width,
        ),
        sourceHeight: getNumericValue(
            configJson?.height ?? template?.config?.height ?? template?.height,
            canvas.height,
        ),
    };

    const photoFrameData = scaleFrameToCanvas(getTemplatePhotoFrame(template), sourceCanvas);
    const userAnimId = posterState.userPhotoAnimation || 'none';
    const templatePhotoFrameAnim = configJson?.photoFrame?.animation ?? configJson?.photo_frame?.animation;
    const resolvedAnimId = userAnimId !== 'none' ? userAnimId : (templatePhotoFrameAnim?.id ?? 'none');

    const photoFrameAnimation = resolvedAnimId !== 'none'
        ? { id: resolvedAnimId }
        : { id: 'none' };

    const nextPhotoFrame = photoFrameData ? {
        x: photoFrameData.x,
        y: photoFrameData.y,
        width: photoFrameData.width,
        height: photoFrameData.height,
        shape: posterState.photoShape === 'template' ? photoFrameData.shape : posterState.photoShape,
        borderColor: photoFrameData.borderColor,
        borderWidth: photoFrameData.borderWidth,
        animation: photoFrameAnimation,
    } : undefined;

    const configTextFields = getTemplateTextFields(template);
    const normalizedConfigFields = [];
    if (configTextFields && typeof configTextFields === 'object' && !Array.isArray(configTextFields)) {
        Object.entries(configTextFields).forEach(([key, field]) => {
            if (field && typeof field === 'object') {
                normalizedConfigFields.push({
                    key,
                    x: field.position?.x ?? field.x ?? 16,
                    y: field.position?.y ?? field.y ?? 0,
                    fieldWidth: field.width ?? field.fieldWidth,
                    fontSize: field.fontSize,
                    fontFamily: field.fontFamily,
                    fontWeight: field.fontWeight,
                    color: field.color,
                    align: field.align,
                    visible: field.visible !== false,
                });
            }
        });
    }
    const rawTextFields = Array.isArray(template?.textFields) ? template.textFields : [];
    const allTextFields = normalizedConfigFields.length > 0 ? normalizedConfigFields : rawTextFields;

    const textFields = allTextFields.reduce((accumulator, field) => {
        const key = field?.key === 'message' ? 'message' : 'name';
        const userOffset = key === 'name' ? posterState.namePosition : posterState.messagePosition;
        const userScale = key === 'name' ? posterState.nameScale : posterState.messageScale;
        const fontSizeOverride = key === 'name' ? posterState.nameFontSize : posterState.messageFontSize;
        const colorOverride = key === 'name' ? posterState.nameColor : posterState.messageColor;

        accumulator[key] = {
            visible: key === 'name' ? posterState.showName !== false : posterState.showMessage !== false,
            content: key === 'name' ? userData.headline : userData.subtext,
            position: {
                x: getNumericValue(field.x, 16) + (userOffset?.x ?? 0),
                y: getNumericValue(field.y, 0) + (userOffset?.y ?? 0),
            },
            width: getNumericValue(field.fieldWidth ?? field.width, canvas.width - getNumericValue(field.x, 16) * 2),
            fontSize: getNumericValue(fontSizeOverride ?? field.fontSize, key === 'name' ? 64 : 36),
            fontFamily: field.fontFamily ?? (key === 'name' ? 'Poppins' : 'Inter'),
            fontWeight: field.fontWeight ?? (key === 'name' ? 'bold' : 'normal'),
            color: colorOverride ?? field.color ?? (key === 'name' ? '#FFFFFF' : '#EEEEEE'),
            align: posterState.textAlign ?? field.align ?? 'center',
            bold: key === 'name' ? posterState.nameBold !== false : posterState.messageBold === true,
            italic: key === 'name' ? posterState.nameItalic === true : posterState.messageItalic === true,
            shadow: posterState.textShadow === true,
        };
        return accumulator;
    }, {});

    const bgOverlay = getTemplateBackgroundOverlay(template);
    const backgroundOverlay = posterState.bgOverlayColor
        ? { enabled: true, color: posterState.bgOverlayColor, opacity: posterState.bgOverlayOpacity }
        : bgOverlay
            ? { enabled: bgOverlay.enabled !== false, color: bgOverlay.color ?? 'rgba(0,0,0,0.3)', opacity: getNumericValue(bgOverlay.opacity, 0.3) }
            : undefined;

    const premiumProfile = posterState.premiumProfile ?? {};
    const isPremium = posterState.isPremium === true;
    const business = premiumProfile.business ?? {};
    const personal = premiumProfile.personal ?? {};

    const activeSocialHandles = business.socialHandles || personal.socialHandles || {};
    const SOCIAL_PLATFORMS = [
        { key: 'facebook', icon: 'facebook' },
        { key: 'instagram', icon: 'instagram' },
        { key: 'twitter', icon: 'twitter' },
        { key: 'snapchat', icon: 'snapchat' },
        { key: 'other', icon: 'link' },
    ];
    const socialHandlesArray = SOCIAL_PLATFORMS
        .filter(p => activeSocialHandles[p.key]?.trim())
        .map(p => ({
            platform: p.key,
            value: `@${activeSocialHandles[p.key]}`,
            icon: p.icon,
        }));

    const premiumBands = isPremium ? {
        topBandHeight: 70,
        bottomBandHeight: 85,
        showTopBand: true,
        showBottomBand: true,
        topBand: {
            title: posterState.userName || '',
            subtitle: business.businessName || personal.organizationName || '',
        },
        bottomBand: {
            contactFields: [
                {
                    type: 'mobile',
                    label: 'Mobile',
                    value: business.contactMobileNumber || personal.mobileNumber || '',
                    icon: 'phone',
                },
                {
                    type: 'address',
                    label: 'Address',
                    value: business.contactAddress || personal.address || '',
                    icon: 'map-marker',
                },
            ],
            socialHandles: socialHandlesArray,
        },
    } : undefined;

    const templateOutput = getTemplateOutput(template);
    const bgSource = pickFirstValue(
        template?.source,
        template?.Video,
        template?.video,
        template?.video_url,
        template?.videoUrl,
    );
    const isVideoBackground = bgSource && /\.mp4|\.mov|m4v|\.webm|\.avi|\.mkv/i.test(bgSource);
    const rawDuration = isVideoBackground && posterState.backgroundVideoDuration
        ? posterState.backgroundVideoDuration
        : getNumericValue(templateOutput?.duration, 10);
    const outputDuration = Math.min(rawDuration, 30);

    const animations = [];
    if (resolvedAnimId && resolvedAnimId !== 'none') {
        const templateAnimations = configJson?.animation || [];
        const matchedTemplateAnim = templateAnimations.find(a => a?.id === resolvedAnimId);
        const userExplicitlyChose = userAnimId !== 'none';
        const defaultAnim = PHOTO_ANIMATION_DEFAULTS[resolvedAnimId];
        const baseAnim = matchedTemplateAnim ?? (userExplicitlyChose ? defaultAnim : templatePhotoFrameAnim) ?? defaultAnim;
        animations.push({
            id: resolvedAnimId,
            from: baseAnim?.from ?? { translateY: 60, opacity: 0 },
            to: baseAnim?.to ?? { translateY: 0, opacity: 1 },
            loop: baseAnim?.loop ?? false,
            duration: getNumericValue(baseAnim?.duration, 1200),
            easing: baseAnim?.easing ?? 'ease',
        });
    }

    const output = {
        format: templateOutput?.format ?? (animations.length > 0 ? 'MP4' : 'JPEG'),
        quality: templateOutput?.quality ?? 'high',
        fps: getNumericValue(templateOutput?.fps, 30),
        duration: outputDuration,
        includeAnimation: templateOutput?.includeAnimation ?? animations.length > 0,
    };

    const isLocalAssetUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return /^(http:\/\/localhost|http:\/\/127\.0\.0\.1|http:\/\/10\.|http:\/\/192\.168\.)/.test(url.trim());
    };

    const safeBackgroundSource = pickFirstUrl(
        template?.source,
        template?.image_url,
        template?.imageUrl,
        template?.video_url,
        template?.videoUrl,
    );
    const backgroundSource = isLocalAssetUrl(safeBackgroundSource)
        ? undefined
        : safeBackgroundSource;

    return {
        template: {
            canvas: { width: canvas.width, height: canvas.height },
            accentColor: posterState.accentColorOverride ?? template?.accentColor ?? configJson?.accentColor ?? '#CCCCCC',
            backgroundColor: configJson?.background ?? template?.backgroundColor ?? '#000000',
        },
        media: {
            backgroundSource,
            frameOverlaySource: pickFirstValue(
                configJson?.frameOverlaySource,
                configJson?.frame_overlay_source,
            ),
        },
        userContent: {
            photo: posterState.userPhoto,
            name: posterState.userName,
            message: posterState.userMessage,
            isPremium,
        },
        photoFrame: nextPhotoFrame,
        textFields: Object.keys(textFields).length > 0 ? textFields : undefined,
        backgroundOverlay,
        premiumBands,
        stickers: posterState.stickers ?? [],
        animation: animations.length > 0 ? animations : undefined,
        output,
        templateVariables: {
            name: posterState.userName || '',
            message: business.businessDescription || posterState.userMessage || '',
            mobile: business.contactMobileNumber || personal.mobileNumber || '',
            address: business.contactAddress || personal.address || '',
            organization: business.businessName || personal.organizationName || '',
            instagram: business.socialHandles?.instagram || personal.socialHandles?.instagram || '',
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
        config_json: config,
        photoFrame: getTemplatePhotoFrame({
            ...item,
            config,
        }),
        textFields: config?.textFields ?? item?.textFields ?? [],
        backgroundOverlay: config?.backgroundOverlay ?? item?.backgroundOverlay ?? null,
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
