import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import {
    getTemplateImageSource,
    getTemplateVideoSource,
} from '../../utils/templateMedia';

const TemplateMedia = ({
    template,
    style,
    resizeMode = 'cover',
    shouldPlay = true,
    muted = true,
    useImageFallbackForVideo = false,
    fallback,
}) => {
    const imageSource = getTemplateImageSource(template);
    const videoSource = getTemplateVideoSource(template);
    const shouldRenderImage = !videoSource || (useImageFallbackForVideo && imageSource);

    if (shouldRenderImage && imageSource) {
        return <Image source={imageSource} style={style} resizeMode={resizeMode} />;
    }

    if (videoSource) {
        return (
            <Video
                source={videoSource}
                style={style}
                paused={!shouldPlay}
                muted={muted}
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

export default React.memo(TemplateMedia);
