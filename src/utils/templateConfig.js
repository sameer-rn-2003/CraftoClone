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

export const getNumericValue = (value, fallback = 0) => {
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
        configJson?.width ?? template?.config?.width ?? template?.width ?? template?.canvasWidth ?? template?.imgWidth,
        POSTER_SIZE.width,
    );
    const height = getNumericValue(
        configJson?.height ?? template?.config?.height ?? template?.height ?? template?.canvasHeight ?? template?.imgHeight,
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
        } else if (shape === 'square' || shape === 'rect' || shape === 'rectangle') {
            borderRadius = 0;
        } else if (['triangle', 'star', 'hexagon'].includes(shape)) {
            borderRadius = 0;
        }
    }

    let x = getNumericValue(frame.x, 0);
    let y = getNumericValue(frame.y, 0);

    const targetWidth = canvasSize?.width || POSTER_SIZE.width;
    const targetHeight = canvasSize?.height || POSTER_SIZE.height;

    // Only apply legacy center-coordinate adjustment for old admin templates
    // that used POSTER_SIZE (300×300). New templates with 1080×1920 have correct
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
        borderWidth: 0,
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
    if (photoLayer) {
        return normalizePhotoFrame({
            x: photoLayer.x,
            y: photoLayer.y,
            width: photoLayer.width,
            height: photoLayer.height,
            borderRadius: photoLayer.borderRadius,
            borderWidth: photoLayer.borderWidth,
            borderColor: photoLayer.borderColor,
        }, canvasSize);
    }

    // Compute a sensible fallback photo frame position when no explicit data exists
    return normalizePhotoFrame({
        x: Math.round(canvasSize.width * 0.30),
        y: Math.round(canvasSize.height * 0.21),
        width: Math.max(60, Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.40)),
        height: Math.max(60, Math.round(Math.min(canvasSize.width, canvasSize.height) * 0.40)),
        shape: 'circle',
        borderColor: '#FFFFFF',
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
        // borderWidth: getNumericValue(frame.borderWidth, 0) * Math.min(scaleX, scaleY),
        borderWidth:0,
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

    const scaleX = sourceCanvas.sourceWidth > 0 ? canvas.width / sourceCanvas.sourceWidth : 1;
    const scaleY = sourceCanvas.sourceHeight > 0 ? canvas.height / sourceCanvas.sourceHeight : 1;

    const photoFrameData = scaleFrameToCanvas(getTemplatePhotoFrame(template), sourceCanvas);
    const userAnimId = posterState.userPhotoAnimation || 'none';
    const templatePhotoFrameAnim = configJson?.photoFrame?.animation ?? configJson?.photo_frame?.animation;
    const resolvedAnimId = userAnimId !== 'none' ? userAnimId : (templatePhotoFrameAnim?.id ?? 'none');

    const photoFrameAnimation = resolvedAnimId !== 'none'
        ? { id: resolvedAnimId }
        : { id: 'none' };

    const nextPhotoFrame = photoFrameData ? (() => {
        const userScale = posterState.photoScale ?? 1;
        const userOffsetX = posterState.photoPosition?.x ?? 0;
        const userOffsetY = posterState.photoPosition?.y ?? 0;

        const adjustedWidth = Math.max(20, Math.round(photoFrameData.width * userScale));
        const adjustedHeight = Math.max(20, Math.round(photoFrameData.height * userScale));
        const adjustedX = Math.round(photoFrameData.x + (photoFrameData.width - adjustedWidth) / 2 + userOffsetX);
        const adjustedY = Math.round(photoFrameData.y + (photoFrameData.height - adjustedHeight) / 2 + userOffsetY);

        return {
            x: Math.max(0, adjustedX),
            y: Math.max(0, adjustedY),
            width: adjustedWidth,
            height: adjustedHeight,
            shape: posterState.photoShape === 'template' ? photoFrameData.shape : posterState.photoShape,
            borderColor: photoFrameData.borderColor,
            borderWidth: photoFrameData.borderWidth,
            animation: photoFrameAnimation,
        };
    })() : undefined;

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
    const { textFieldPositions = {} } = posterState;
    const layers = configJson?.layers ?? [];
    const textLayerMap = { '{{headline}}': 'name', '{{subtext}}': 'message' };
    const textLayerKeys = Object.keys(textLayerMap);
    layers.forEach(layer => {
        if (layer?.type === 'text' && layer.text) {
            const matchedKey = textLayerKeys.find(k => layer.text.includes(k));
            if (matchedKey) {
                const roleKey = textLayerMap[matchedKey];
                const existing = normalizedConfigFields.findIndex(f => f.key === roleKey);
                const layerField = {
                    key: roleKey,
                    x: layer.x ?? 16,
                    y: layer.y ?? 0,
                    fieldWidth: layer.width,
                    fontSize: layer.fontSize,
                    fontFamily: layer.fontFamily,
                    fontWeight: layer.fontWeight,
                    color: layer.color,
                    align: layer.align,
                    visible: true,
                };
                if (existing >= 0) {
                    normalizedConfigFields[existing] = {
                        ...normalizedConfigFields[existing],
                        x: layerField.x,
                        y: layerField.y,
                        fieldWidth: layerField.fieldWidth ?? normalizedConfigFields[existing].fieldWidth,
                    };
                } else {
                    normalizedConfigFields.push(layerField);
                }
            }
        }
    });
    const rawTextFields = Array.isArray(template?.textFields) ? template.textFields : [];
    const allTextFields = normalizedConfigFields.length > 0 ? normalizedConfigFields : rawTextFields;

    const getTextConfig = (key, field) => {
        const isName = key === 'name';
        const isMessage = key === 'message';
        const dyn = (!isName && !isMessage) ? (posterState.dynamicTextFields?.[key] || {}) : {};

        const layerOffset = textFieldPositions[key];
        const userOffset = isName
            ? posterState.namePosition
            : (isMessage ? posterState.messagePosition : (layerOffset || (dyn.position ?? { x: 0, y: 0 })));
        const userScale = isName ? posterState.nameScale : (isMessage ? posterState.messageScale : (dyn.scale ?? 1));
        const fontSizeOverride = isName ? posterState.nameFontSize : (isMessage ? posterState.messageFontSize : (dyn.fontSize ?? null));
        const colorOverride = isName ? posterState.nameColor : (isMessage ? posterState.messageColor : (dyn.color ?? null));

        const baseX = Math.round(getNumericValue(field.x, 16) * scaleX);
        const baseY = Math.round(getNumericValue(field.y, 0) * scaleY);
        const baseWidth = Math.round(getNumericValue(field.fieldWidth ?? field.width, sourceCanvas.sourceWidth - getNumericValue(field.x, 16) * 2) * scaleX);
        const baseHeight = Math.round(getNumericValue(field.height ?? 40, 40) * scaleY);
        const baseFontSize = Math.min(36, getNumericValue(fontSizeOverride ?? field.fontSize, 36));
        const scaledFontSize = Math.min(36, Math.round(baseFontSize * userScale));

        const adjustedX = Math.round(userOffset?.x ?? baseX);
        const adjustedY = Math.round(userOffset?.y ?? baseY);

        const getContent = () => {
            if (isName) return userData.headline;
            if (isMessage) return userData.subtext;
            return dyn.value ?? field.content ?? '';
        };

        const isVisible = isName ? posterState.showName !== false : (isMessage ? posterState.showMessage !== false : field.visible !== false);
        const isBold = isName ? posterState.nameBold !== false : (isMessage ? posterState.messageBold === true : (dyn.bold ?? false));
        const isItalic = isName ? posterState.nameItalic === true : (isMessage ? posterState.messageItalic === true : (dyn.italic ?? false));

        const result = {
            visible: isVisible,
            content: getContent(),
            position: {
                x: Math.max(0, adjustedX),
                y: Math.max(0, adjustedY),
            },
            fontSize: scaledFontSize,
            fontFamily: field.fontFamily ?? (isName ? 'Poppins' : (isMessage ? 'Inter' : undefined)),
            fontWeight: field.fontWeight ?? (isName ? 'bold' : (isMessage ? 'normal' : undefined)),
            color: colorOverride ?? field.color ?? (isName ? '#FFFFFF' : (isMessage ? '#EEEEEE' : '#FFFFFF')),
            align: posterState.textAlign ?? field.align ?? 'center',
            bold: isBold,
            italic: isItalic,
            shadow: posterState.textShadow === true,
        };
        
        if (isName || isMessage) {
            console.log(`[getTextConfig] ${key}:`, JSON.stringify({
                fieldX: field.x,
                fieldY: field.y,
                scaleX,
                scaleY,
                baseX,
                baseY,
                userOffset,
                adjustedX: result.position.x,
                adjustedY: result.position.y,
            }));
        }

        if (!isName && !isMessage && layerOffset) {
            console.log(`[getTextConfig] ${key} (layer):`, JSON.stringify({
                fieldX: field.x,
                fieldY: field.y,
                layerOffset,
                rawX,
                rawY,
                finalX: result.position.x,
                finalY: result.position.y,
            }));
        }
        
        return result;
    };

    const textFields = allTextFields.reduce((accumulator, field) => {
        const key = field?.key;
        if (!key) return accumulator;
        accumulator[key] = getTextConfig(key, field);
        return accumulator;
    }, {});

    const bgOverlay = getTemplateBackgroundOverlay(template);
    const backgroundOverlay = posterState.bgOverlayColor
        ? { enabled: false, color: posterState.bgOverlayColor, opacity: posterState.bgOverlayOpacity }
        : bgOverlay
            ? { enabled: false, color: bgOverlay.color ?? 'rgba(0,0,0,0.3)', opacity: getNumericValue(bgOverlay.opacity, 0.3) }
            : undefined;

    const premiumProfile = posterState.premiumProfile ?? {};
    const isPremium = posterState.isPremium === true;
    const business = premiumProfile.business ?? {};
    const personal = premiumProfile.personal ?? {};

    const normalizeSocialHandleObj = handles => Array.isArray(handles)
        ? handles.reduce((acc, h) => { if (h.platform && h.value?.trim()) acc[h.platform] = h.value.replace(/^@/, ''); return acc; }, {})
        : (handles || {});
    const businessSocial = normalizeSocialHandleObj(business.socialHandles);
    const personalSocial = normalizeSocialHandleObj(personal.socialHandles);
    const hasAnyHandle = obj => Object.values(obj).some(v => typeof v === 'string' && v.trim());
    const activeSocialHandles = hasAnyHandle(businessSocial) ? businessSocial : personalSocial;
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
        const defaultAnim = PHOTO_ANIMATION_DEFAULTS[resolvedAnimId];
        const userAnimObj = userAnimId !== 'none' ? null : templatePhotoFrameAnim;
        const baseAnim = matchedTemplateAnim ?? userAnimObj ?? {};
        animations.push({
            id: resolvedAnimId,
            from: baseAnim?.from ?? defaultAnim?.from ?? { translateY: 60, opacity: 0 },
            to: baseAnim?.to ?? defaultAnim?.to ?? { translateY: 0, opacity: 1 },
            loop: baseAnim?.loop ?? defaultAnim?.loop ?? false,
            duration: getNumericValue(baseAnim?.duration ?? defaultAnim?.duration, 1200),
            easing: baseAnim?.easing ?? defaultAnim?.easing ?? 'ease',
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
            message: business.businessDescription || '',
            mobile: business.contactMobileNumber || personal.mobileNumber || '',
            address: business.contactAddress || personal.address || '',
            organization: business.businessName || personal.organizationName || '',
            instagram: businessSocial.instagram || personalSocial.instagram || '',
        },
        layers: layers.length > 0 ? layers : undefined,
        width: configJson?.width || 1080,
        height: configJson?.height || 1920,
        version: configJson?.version || '1.0',
        variables: configJson?.variables || [],
        background: configJson?.background || '#ffffff',
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
