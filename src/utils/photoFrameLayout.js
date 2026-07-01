import { POSTER_SIZE } from './constants';
import { isSvgShape } from './shapes';

export const resolvePhotoFrameRadius = (photoShape, templateRadius) => {
    if (isSvgShape(photoShape)) return 0;
    switch (photoShape) {
        case 'circle':
            return 999;
        case 'square':
            return 4;
        case 'rect':
        case 'rectangle':
            return 0;
        default:
            return templateRadius ?? 0;
    }
};

export const getPosterFitLayout = (containerWidth, containerHeight, posterSize = POSTER_SIZE) => {
    if (!containerWidth || !containerHeight) {
        return {
            width: 0,
            height: 0,
            offsetX: 0,
            offsetY: 0,
            scaleX: 1,
            scaleY: 1,
        };
    }

    const posterRatio = posterSize.width / posterSize.height;

    let width = containerWidth;
    let height = containerWidth / posterRatio;

    if (height > containerHeight) {
        height = containerHeight;
        width = containerHeight * posterRatio;
    }

    return {
        width,
        height,
        offsetX: (containerWidth - width) / 2,
        offsetY: (containerHeight - height) / 2,
        scaleX: width / posterSize.width,
        scaleY: height / posterSize.height,
    };
};

export const getDefaultPhotoFramePosition = (frameStyle, canvasSize) => {
    if (!frameStyle || !canvasSize) return frameStyle;
    const margin = Math.max(8, Math.round(canvasSize.width * 0.04));
    return {
        ...frameStyle,
        left: margin,
        top: canvasSize.height - frameStyle.height - margin,
    };
};

export const getDefaultNameTextPosition = (field, canvasSize) => {
    if (!field || !canvasSize) return field;
    const margin = Math.max(8, Math.round(canvasSize.width * 0.04));
    return {
        ...field,
        x: Math.round(canvasSize.width * 0.50),
        y: Math.round(canvasSize.height * 0.80),
        fieldWidth: Math.round(canvasSize.width * 0.46),
        align: 'right',
    };
};

export const getPhotoFrameBaseStyle = ({
    photoFrame,
    photoShape = 'template',
    canvasSize,
}) => {
    if (!photoFrame) return null;

    const base = {
        left: photoFrame.x,
        top: photoFrame.y,
        width: photoFrame.width,
        height: photoFrame.height,
        borderRadius: resolvePhotoFrameRadius(photoShape, photoFrame.borderRadius),
        borderColor: photoFrame.borderColor,
        borderWidth: photoFrame.borderWidth,
    };

    return getDefaultPhotoFramePosition(base, canvasSize);
};

export const getScaledPhotoFrameStyle = ({
    photoFrame,
    posterLayout,
    photoPosition = { x: 0, y: 0 },
    photoScale = 1,
    photoShape = 'template',
}) => {
    if (!photoFrame || !posterLayout) return null;

    const { scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0 } = posterLayout;
    const frameWidth = photoFrame.width * scaleX;
    const frameHeight = photoFrame.height * scaleY;

    const scaledWidth = frameWidth * photoScale;
    const scaledHeight = frameHeight * photoScale;

    const shapeRadius = resolvePhotoFrameRadius(photoShape, photoFrame.borderRadius);
    const radiusScale = Math.min(scaleX, scaleY);

    const posterWidth = posterLayout.width ?? 0;
    const posterHeight = posterLayout.height ?? 0;
    const margin = Math.max(8, Math.round(posterWidth * 0.04));
    const defaultLeft = offsetX + margin;
    const defaultTop = offsetY + posterHeight - scaledHeight - margin;

    const rawLeft = defaultLeft + (photoPosition.x * scaleX);
    const rawTop = defaultTop + (photoPosition.y * scaleY);
    const minLeft = offsetX;
    const minTop = offsetY;
    const maxLeft = offsetX + Math.max(posterWidth - scaledWidth, 0);
    const maxTop = offsetY + Math.max(posterHeight - scaledHeight, 0);

    return {
        left: Math.min(maxLeft, Math.max(minLeft, rawLeft)),
        top: Math.min(maxTop, Math.max(minTop, rawTop)),
        width: scaledWidth,
        height: scaledHeight,
        borderRadius: shapeRadius * radiusScale,
        borderColor: photoFrame.borderColor,
        borderWidth: (photoFrame.borderWidth ?? 0) * radiusScale,
    };
};
