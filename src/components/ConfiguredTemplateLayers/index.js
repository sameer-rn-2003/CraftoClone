import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import {
    getTemplateCanvasSize,
    getTemplateLayers,
    getTemplatePlaceholderKey,
    isBackgroundMediaLayer,
    isUserPhotoLayer,
    resolveTemplateValue,
} from '../../utils/templateConfig';

const getNumericValue = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSource = source => {
    if (!source) return null;
    if (typeof source === 'number') return source;
    if (typeof source === 'string') return { uri: source };
    if (typeof source === 'object' && source.uri) return source;
    return source;
};

const getLayerResizeMode = layer => {
    if (layer?.resizeMode) return layer.resizeMode;

    const layerId = String(layer?.id ?? '').toLowerCase();
    const placeholderKey = String(getTemplatePlaceholderKey(layer?.src) ?? '').toLowerCase();

    if (layerId.includes('logo') || placeholderKey === 'logo_url') {
        return 'contain';
    }

    return 'stretch';
};

const ConfiguredTemplateLayers = ({
    template,
    context = {},
    canvasLayout,
    renderUserPhotoLayer,
    renderTextLayer,
    skipBackgroundLayers = false,
}) => {
    const layers = getTemplateLayers(template);
    if (!layers.length) {
        return null;
    }

    const canvasSize = getTemplateCanvasSize(template);
    const layout = canvasLayout ?? {
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
    };
    const fontScale = Math.min(layout.scaleX ?? 1, layout.scaleY ?? 1);

    return (
        <>
            {layers.map((layer, index) => {
                if (!layer?.type) {
                    return null;
                }

                if (skipBackgroundLayers && isBackgroundMediaLayer(layer)) {
                    return null;
                }

                const left = getNumericValue(layer.x, 0) * (layout.scaleX ?? 1) + (layout.offsetX ?? 0);
                const top = getNumericValue(layer.y, 0) * (layout.scaleY ?? 1) + (layout.offsetY ?? 0);
                const width = getNumericValue(
                    layer.width,
                    Math.max(canvasSize.width - getNumericValue(layer.x, 0), 0),
                ) * (layout.scaleX ?? 1);
                const height = getNumericValue(
                    layer.height,
                    Math.max(canvasSize.height - getNumericValue(layer.y, 0), 0),
                ) * (layout.scaleY ?? 1);
                const opacity = Number.isFinite(Number(layer.opacity)) ? Number(layer.opacity) : 1;
                const layerKey = `${layer.id ?? layer.type}_${index}`;

                if (isUserPhotoLayer(layer)) {
                    if (!renderUserPhotoLayer) {
                        return null;
                    }

                    return (
                        <React.Fragment key={layerKey}>
                            {renderUserPhotoLayer({
                                layer,
                                layerStyle: {
                                    position: 'absolute',
                                    left,
                                    top,
                                    width,
                                    height,
                                    opacity,
                                },
                            })}
                        </React.Fragment>
                    );
                }

                if (layer.type === 'image') {
                    const resolvedSource = normalizeSource(
                        resolveTemplateValue(layer.src, template, context),
                    );

                    if (!resolvedSource) {
                        return null;
                    }

                    return (
                        <Image
                            key={layerKey}
                            pointerEvents="none"
                            source={resolvedSource}
                            style={[
                                styles.imageLayer,
                                {
                                    left,
                                    top,
                                    width,
                                    height,
                                    opacity,
                                },
                            ]}
                            resizeMode={getLayerResizeMode(layer)}
                        />
                    );
                }

                if (layer.type === 'text') {
                    const resolvedText = resolveTemplateValue(layer.text, template, context);
                    const fontSize = getNumericValue(layer.fontSize, 18) * fontScale;
                    const lineHeight = layer.lineHeight
                        ? getNumericValue(layer.lineHeight, fontSize) * fontScale
                        : undefined;
                    const letterSpacing = layer.letterSpacing
                        ? getNumericValue(layer.letterSpacing, 0) * fontScale
                        : undefined;
                    const textLayerStyle = {
                        position: 'absolute',
                        left,
                        top,
                        width,
                        color: layer.color ?? '#FFFFFF',
                        fontSize,
                        lineHeight,
                        letterSpacing,
                        fontFamily: layer.fontFamily,
                        fontWeight: layer.fontWeight ? String(layer.fontWeight) : undefined,
                        textAlign: layer.align ?? 'left',
                        opacity,
                    };

                    if (renderTextLayer) {
                        const customTextLayer = renderTextLayer({
                            layer,
                            resolvedText,
                            layerStyle: textLayerStyle,
                            layout,
                            fontScale,
                        });

                        if (customTextLayer !== undefined) {
                            return (
                                <React.Fragment key={layerKey}>
                                    {customTextLayer}
                                </React.Fragment>
                            );
                        }
                    }

                    if (!resolvedText) {
                        return null;
                    }

                    return (
                        <Text
                            key={layerKey}
                            allowFontScaling={false}
                            pointerEvents="none"
                            style={[styles.textLayer, textLayerStyle]}>
                            {resolvedText}
                        </Text>
                    );
                }

                return null;
            })}
        </>
    );
};

const styles = StyleSheet.create({
    imageLayer: {
        position: 'absolute',
    },
    textLayer: {
        position: 'absolute',
    },
});

export default React.memo(ConfiguredTemplateLayers);
