import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import {
    getTemplateImageSource,
    getTemplateVideoSource,
} from '../../utils/templateMedia';
import { POSTER_SIZE } from '../../utils/constants';
import { getTemplateBackgroundCrop } from '../../utils/templateConfig';

const getBackgroundCropStyle = crop => {
    if (!crop?.mediaWidth || !crop?.mediaHeight) {
        return null;
    }

    const baseScale = Math.max(
        POSTER_SIZE.width / crop.mediaWidth,
        POSTER_SIZE.height / crop.mediaHeight,
    );
    const renderScale = baseScale * (crop.scale ?? 1);

    return {
        position: 'absolute',
        left: crop.x ?? 0,
        top: crop.y ?? 0,
        width: crop.mediaWidth * renderScale,
        height: crop.mediaHeight * renderScale,
    };
};

const TemplateMedia = ({
    template,
    style,
    resizeMode = 'cover',
    shouldPlay = true,
    muted = true,
    useImageFallbackForVideo = false,
    fallback,
    onAudioAvailabilityChange,
}) => {
    const imageSource = getTemplateImageSource(template);
    const videoSource = getTemplateVideoSource(template);
    const backgroundCrop = getTemplateBackgroundCrop(template);
    const croppedImageStyle = getBackgroundCropStyle(backgroundCrop);
    const shouldRenderImage = !videoSource || (useImageFallbackForVideo && imageSource);

    if (shouldRenderImage && imageSource) {
        if (croppedImageStyle) {
            return (
                <View style={[style, styles.cropViewport]}>
                    <Image source={imageSource} style={croppedImageStyle} resizeMode="stretch" />
                </View>
            );
        }

        return <Image source={imageSource} style={style} resizeMode={resizeMode} />;
    }

    if (videoSource) {
        return (
            <Video
                source={videoSource}
                style={style}
                paused={!shouldPlay}
                muted={muted}
                onLoad={data => {
                    const hasAudio = Array.isArray(data?.audioTracks)
                        ? data.audioTracks.length > 0
                        : true;
                    onAudioAvailabilityChange?.(hasAudio);
                }}
                repeat
                resizeMode={resizeMode}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                controls={false}
            />
        );
    }

    if (fallback) {
        return <View style={StyleSheet.absoluteFill}>{fallback}</View>;
    }

    return null;
};

const styles = StyleSheet.create({
    cropViewport: {
        overflow: 'hidden',
    },
});

export default React.memo(TemplateMedia);
