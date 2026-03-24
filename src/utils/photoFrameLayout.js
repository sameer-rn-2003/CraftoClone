import { POSTER_SIZE } from './constants';

export const resolvePhotoFrameRadius = (photoShape, templateRadius) => {
    switch (photoShape) {
        case 'circle':
            return 999;
        case 'square':
            return 4;
        case 'rounded':
            return 24;
        default:
            return templateRadius ?? 0;
    }
};

export const getPosterFitLayout = (containerWidth, containerHeight) => {
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

    const posterRatio = POSTER_SIZE.width / POSTER_SIZE.height;

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
        scaleX: width / POSTER_SIZE.width,
        scaleY: height / POSTER_SIZE.height,
    };
};

export const getPhotoFrameBaseStyle = ({
    photoFrame,
    photoShape = 'template',
}) => {
    if (!photoFrame) return null;

    return {
        left: photoFrame.x,
        top: photoFrame.y,
        width: photoFrame.width,
        height: photoFrame.height,
        borderRadius: resolvePhotoFrameRadius(photoShape, photoFrame.borderRadius),
        borderColor: photoFrame.borderColor,
        borderWidth: photoFrame.borderWidth,
    };
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
    const frameLeft = photoFrame.x * scaleX + offsetX;
    const frameTop = photoFrame.y * scaleY + offsetY;
    const frameWidth = photoFrame.width * scaleX;
    const frameHeight = photoFrame.height * scaleY;

    const scaledWidth = frameWidth * photoScale;
    const scaledHeight = frameHeight * photoScale;
    const centerX = frameLeft + frameWidth / 2;
    const centerY = frameTop + frameHeight / 2;

    const shapeRadius = resolvePhotoFrameRadius(photoShape, photoFrame.borderRadius);
    const radiusScale = Math.min(scaleX, scaleY);

    return {
        left: centerX - scaledWidth / 2 + (photoPosition.x * scaleX),
        top: centerY - scaledHeight / 2 + (photoPosition.y * scaleY),
        width: scaledWidth,
        height: scaledHeight,
        borderRadius: shapeRadius * radiusScale,
        borderColor: photoFrame.borderColor,
        borderWidth: (photoFrame.borderWidth ?? 0) * radiusScale,
    };
};
