import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    setMessagePosition,
    setMessageScale,
    setNamePosition,
    setNameScale,
    setPhotoPosition,
    setPhotoScale,
    updateStickerPosition,
} from '../../store/posterSlice';
import { COLORS, POSTER_SIZE } from '../../utils/constants';
import {
    getPhotoFrameBaseStyle,
    resolvePhotoFrameRadius,
} from '../../utils/photoFrameLayout';
import TemplateMedia from '../TemplateMedia';
import { getTemplateImageSource, hasTemplateVideo } from '../../utils/templateMedia';
import ConfiguredTemplateLayers from '../ConfiguredTemplateLayers';
import {
    buildTemplateRenderContext,
    getTemplateEditableTextRole,
    getTemplateCanvasSize,
    isConfigDrivenTemplate,
} from '../../utils/templateConfig';

const getTouchDistance = touches => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
};

const normalizeInteractionScale = interactionScale =>
    interactionScale && interactionScale > 0 ? interactionScale : 1;

const getScaledGestureDelta = (gesture, interactionScale = 1) => {
    const scale = normalizeInteractionScale(interactionScale);

    return {
        x: gesture.dx / scale,
        y: gesture.dy / scale,
    };
};

const MIN_TEXT_SCALE = 0.25;
const MAX_TEXT_SCALE = 3.0;

const DiagonalPattern = ({ color, canvasSize }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
            <View key={i} style={{
                position: 'absolute', height: 28,
                width: canvasSize.width * 2, top: -40 + i * 55, left: -60,
                backgroundColor: color + '20', transform: [{ rotate: '-35deg' }]
            }} />
        ))}
    </View>
);

const CirclesPattern = ({ color }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[200, 150, 90, 55].map((size, i) => (
            <View key={i} style={{
                position: 'absolute', width: size, height: size,
                borderRadius: size / 2, borderWidth: 2, borderColor: color + '30',
                top: i % 2 === 0 ? -size / 3 : undefined,
                bottom: i % 2 !== 0 ? -size / 3 : undefined,
                right: i < 2 ? -size / 3 : undefined,
                left: i >= 2 ? -size / 4 : undefined
            }} />
        ))}
    </View>
);

const DotsPattern = ({ color }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(24)].map((_, i) => (
            <View key={i} style={{
                position: 'absolute', width: 7, height: 7,
                borderRadius: 4, backgroundColor: color + '35',
                top: Math.floor(i / 6) * 70 + 20, left: (i % 6) * 65 + 15
            }} />
        ))}
    </View>
);

const WavesPattern = ({ color, canvasSize }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
            <View key={i} style={{
                position: 'absolute', height: 60,
                width: canvasSize.width + 60, left: -30, top: i * 100 - 20,
                borderRadius: 30, borderWidth: 2, borderColor: color + '25',
                transform: [{ rotate: '-8deg' }]
            }} />
        ))}
    </View>
);

const PatternLayer = ({ pattern, accentColor, canvasSize }) => {
    switch (pattern) {
        case 'diagonal': return <DiagonalPattern color={accentColor} canvasSize={canvasSize} />;
        case 'circles': return <CirclesPattern color={accentColor} />;
        case 'dots': return <DotsPattern color={accentColor} />;
        case 'waves': return <WavesPattern color={accentColor} canvasSize={canvasSize} />;
        default: return null;
    }
};

const getPhotoAnimationConfig = (animationId, canvasSize = POSTER_SIZE, frameMetrics = {}) => {
    const frameWidth = Number(frameMetrics?.width) || 0;
    const frameHeight = Number(frameMetrics?.height) || 0;
    const travelX = Math.max(canvasSize.width * 0.9, frameWidth + canvasSize.width * 0.2);
    const travelY = Math.max(canvasSize.height * 0.9, frameHeight + canvasSize.height * 0.2);
    const diagonalX = Math.max(canvasSize.width * 0.7, frameWidth + canvasSize.width * 0.15);
    const diagonalY = Math.max(canvasSize.height * 0.7, frameHeight + canvasSize.height * 0.15);
    const shortTravelX = Math.max(canvasSize.width * 0.18, 36);
    const shortTravelY = Math.max(canvasSize.height * 0.18, 36);

    switch (animationId) {
        case 'slide_left_center':
            return { from: { translateX: -travelX }, to: { translateX: 0 } };
        case 'slide_right_center':
            return { from: { translateX: travelX }, to: { translateX: 0 } };
        case 'slide_top_center':
            return { from: { translateY: -travelY }, to: { translateY: 0 } };
        case 'slide_bottom_center':
            return { from: { translateY: travelY }, to: { translateY: 0 } };
        case 'slide_top_left':
            return { from: { translateX: -diagonalX, translateY: -diagonalY }, to: { translateX: 0, translateY: 0 } };
        case 'slide_top_right':
            return { from: { translateX: diagonalX, translateY: -diagonalY }, to: { translateX: 0, translateY: 0 } };
        case 'slide_bottom_left':
            return { from: { translateX: -diagonalX, translateY: diagonalY }, to: { translateX: 0, translateY: 0 } };
        case 'slide_bottom_right':
            return { from: { translateX: diagonalX, translateY: diagonalY }, to: { translateX: 0, translateY: 0 } };
        case 'bounce_left':
            return { from: { translateX: -travelX }, to: { translateX: 0 }, easing: 'bounce' };
        case 'bounce_right':
            return { from: { translateX: travelX }, to: { translateX: 0 }, easing: 'bounce' };
        case 'bounce_top':
            return { from: { translateY: -travelY }, to: { translateY: 0 }, easing: 'bounce' };
        case 'bounce_bottom':
            return { from: { translateY: travelY }, to: { translateY: 0 }, easing: 'bounce' };
        case 'zoom_in_soft':
            return { from: { scale: 0.72, opacity: 0.35 }, to: { scale: 1, opacity: 1 } };
        case 'zoom_out_soft':
            return { from: { scale: 1.18, opacity: 0.45 }, to: { scale: 1, opacity: 1 } };
        case 'pulse_soft':
            return { from: { scale: 0.94 }, to: { scale: 1.04 }, loop: 'alternate' };
        case 'pulse_big':
            return { from: { scale: 0.88 }, to: { scale: 1.12 }, loop: 'alternate' };
        case 'fade_in':
            return { from: { opacity: 0.1 }, to: { opacity: 1 } };
        case 'fade_up':
            return { from: { translateY: shortTravelY, opacity: 0.2 }, to: { translateY: 0, opacity: 1 } };
        case 'fade_down':
            return { from: { translateY: -shortTravelY, opacity: 0.2 }, to: { translateY: 0, opacity: 1 } };
        case 'rotate_soft_left':
            return { from: { rotate: '-12deg', scale: 0.95 }, to: { rotate: '0deg', scale: 1 } };
        case 'rotate_soft_right':
            return { from: { rotate: '12deg', scale: 0.95 }, to: { rotate: '0deg', scale: 1 } };
        case 'flip_x_soft':
            return { from: { rotateX: '70deg', opacity: 0.4 }, to: { rotateX: '0deg', opacity: 1 } };
        case 'flip_y_soft':
            return { from: { rotateY: '70deg', opacity: 0.4 }, to: { rotateY: '0deg', opacity: 1 } };
        case 'float_left_right':
            return { from: { translateX: -shortTravelX }, to: { translateX: shortTravelX }, loop: 'alternateSlow' };
        case 'float_up_down':
            return { from: { translateY: -shortTravelY }, to: { translateY: shortTravelY }, loop: 'alternateSlow' };
        case 'wiggle_soft':
            return { from: { rotate: '-5deg' }, to: { rotate: '5deg' }, loop: 'alternateFast' };
        case 'pop_in':
            return { from: { scale: 0.55, opacity: 0.25 }, to: { scale: 1, opacity: 1 }, easing: 'bounce' };
        case 'drift_top_left':
            return { from: { translateX: -shortTravelX, translateY: -shortTravelY, scale: 0.96 }, to: { translateX: shortTravelX * 0.45, translateY: shortTravelY * 0.45, scale: 1.03 }, loop: 'alternateSlow' };
        case 'drift_bottom_right':
            return { from: { translateX: shortTravelX, translateY: shortTravelY, scale: 0.96 }, to: { translateX: -shortTravelX * 0.45, translateY: -shortTravelY * 0.45, scale: 1.03 }, loop: 'alternateSlow' };
        case 'none':
        default:
            return null;
    }
};

const usePhotoAnimationStyle = ({
    animationId = 'none',
    canvasSize,
    frameMetrics,
    enablePhotoAnimation = true,
}) => {
    const progress = useRef(new Animated.Value(1)).current;
    const canvasWidth = canvasSize?.width ?? POSTER_SIZE.width;
    const canvasHeight = canvasSize?.height ?? POSTER_SIZE.height;
    const frameWidth = frameMetrics?.width ?? 0;
    const frameHeight = frameMetrics?.height ?? 0;
    const config = useMemo(
        () => (enablePhotoAnimation
            ? getPhotoAnimationConfig(
                animationId,
                { width: canvasWidth, height: canvasHeight },
                { width: frameWidth, height: frameHeight },
            )
            : null),
        [animationId, canvasWidth, canvasHeight, enablePhotoAnimation, frameWidth, frameHeight],
    );

    useEffect(() => {
        progress.stopAnimation();

        if (!config) {
            progress.setValue(1);
            return undefined;
        }

        progress.setValue(0);
        const duration = config.loop === 'alternateFast'
            ? 900
            : config.loop === 'alternateSlow'
                ? 2200
                : 1400;
        const easing = config.easing === 'bounce'
            ? Animated.spring(progress, {
                toValue: 1,
                speed: 1.8,
                bounciness: 14,
                useNativeDriver: true,
            })
            : Animated.timing(progress, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            });

        const animation = config.loop
            ? Animated.loop(Animated.sequence([
                Animated.timing(progress, {
                    toValue: 1,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
            ]))
            : easing;

        animation.start();

        return () => {
            animation.stop?.();
            progress.stopAnimation();
        };
    }, [config, progress]);

    return config ? {
        opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [config.from?.opacity ?? 1, config.to?.opacity ?? 1],
        }),
        transform: [
            {
                translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.translateX ?? 0, config.to?.translateX ?? 0],
                }),
            },
            {
                translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.translateY ?? 0, config.to?.translateY ?? 0],
                }),
            },
            {
                scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.scale ?? 1, config.to?.scale ?? 1],
                }),
            },
            {
                rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.rotate ?? '0deg', config.to?.rotate ?? '0deg'],
                }),
            },
            {
                rotateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.rotateX ?? '0deg', config.to?.rotateX ?? '0deg'],
                }),
            },
            {
                rotateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [config.from?.rotateY ?? '0deg', config.to?.rotateY ?? '0deg'],
                }),
            },
        ],
    } : {
        opacity: 1,
        transform: [],
    };
};

const AnimatedPhotoContent = ({ photoUri, resizeMode = 'cover' }) => {

    if (!photoUri) {
        return null;
    }

    return (
        <View style={styles.animatedPhotoContent}>
            <Image key={photoUri} source={{ uri: photoUri }} style={styles.photo} resizeMode={resizeMode} />
        </View>
    );
};

const getCenteredFallbackPhotoFrameStyle = ({
    canvasSize = POSTER_SIZE,
    photoShape = 'template',
}) => {
    const size = Math.max(96, Math.min(canvasSize.width, canvasSize.height) * 0.28);
    const left = (canvasSize.width - size) / 2;
    const top = (canvasSize.height - size) / 2;
    const templateRadius = size / 2;

    return {
        left,
        top,
        width: size,
        height: size,
        borderRadius: resolvePhotoFrameRadius(photoShape, templateRadius),
        borderColor: '#FFFFFF',
        borderWidth: 2,
    };
};

const DraggablePhoto = ({
    photoFrame,
    frameStyle,
    photoUri,
    photoAnimation,
    canvasSize = POSTER_SIZE,
    accentColor,
    photoShape,
    photoScale,
    enablePhotoAnimation = true,
    allowPinchScale = true,
    interactionScale = 1,
    resizeMode = 'cover',
}) => {
    const dispatch = useDispatch();
    const { photoPosition } = useSelector(s => s.poster);
    const { t } = useTranslation();

    const pan = useRef(new Animated.ValueXY({ x: photoPosition.x, y: photoPosition.y })).current;
    const scaleAnim = useRef(new Animated.Value(photoScale)).current;

    // Committed "at rest" values
    const committed = useRef({ x: photoPosition.x, y: photoPosition.y });
    const committedScale = useRef(photoScale);

    // Pinch state — mutated via refs so no re-renders needed
    const isPinching = useRef(false);
    const initPinchDist = useRef(null);   // null = pinch not active
    const initPinchScale = useRef(photoScale);
    const localScale = useRef(photoScale); // tracks value during active pinch

    // ── Sync from external photoPosition changes ──────────────────────
    const prevPhotoPosition = useRef(photoPosition);
    if (
        (prevPhotoPosition.current.x !== photoPosition.x || prevPhotoPosition.current.y !== photoPosition.y)
        && !isPinching.current
    ) {
        prevPhotoPosition.current = photoPosition;
        committed.current = { x: photoPosition.x, y: photoPosition.y };
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: photoPosition.x, y: photoPosition.y });
    }

    // ── Sync from external photoScale changes (preset buttons) ────────
    // useRef values don't update on re-render, so we sync manually.
    const prevPhotoScale = useRef(photoScale);
    if (prevPhotoScale.current !== photoScale && !isPinching.current) {
        prevPhotoScale.current = photoScale;
        scaleAnim.setValue(photoScale);
        committedScale.current = photoScale;
        localScale.current = photoScale;
    }

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                // Grant fires with 1 finger only — always start in drag mode.
                // If a second finger arrives we'll switch to pinch in onMove.
                isPinching.current = false;
                initPinchDist.current = null;
                pan.setOffset(committed.current);
                pan.setValue({ x: 0, y: 0 });
            },

            onPanResponderMove: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;

                if (touches.length >= 2) {
                    if (!allowPinchScale) {
                        return;
                    }
                    if (!initPinchDist.current) {
                        // ── Second finger just appeared: INITIALISE PINCH ──
                        isPinching.current = true;
                        initPinchDist.current = getTouchDistance(touches);
                        initPinchScale.current = committedScale.current;
                        localScale.current = committedScale.current;
                        // Abandon the drag offset we started in grant
                        pan.flattenOffset();
                    } else {
                        // ── Continuing pinch: update scale live ────────────
                        const dist = getTouchDistance(touches);
                        const ratio = dist / initPinchDist.current;
                        const newScale = Math.min(3.0, Math.max(0.25,
                            initPinchScale.current * ratio,
                        ));
                        localScale.current = newScale;
                        scaleAnim.setValue(newScale);
                    }
                } else if (!isPinching.current) {
                    // ── Single-finger drag ─────────────────────────────────
                    const delta = getScaledGestureDelta(gesture, interactionScale);
                    pan.setValue(delta);
                }
            },

            onPanResponderRelease: (_, gesture) => {
                if (isPinching.current) {
                    // Use localScale ref — reliable, no async needed
                    committedScale.current = localScale.current;
                    dispatch(setPhotoScale(localScale.current));
                    isPinching.current = false;
                    initPinchDist.current = null;
                } else {
                    pan.flattenOffset();
                    const delta = getScaledGestureDelta(gesture, interactionScale);
                    const next = {
                        x: committed.current.x + delta.x,
                        y: committed.current.y + delta.y,
                    };
                    committed.current = next;
                    dispatch(setPhotoPosition(next));
                }
            },

            onPanResponderTerminate: () => {
                isPinching.current = false;
                initPinchDist.current = null;
                pan.flattenOffset();
            },
        }),
    ).current;


    const frameBaseStyle = frameStyle
        ?? getPhotoFrameBaseStyle({ photoFrame, photoShape })
        ?? getCenteredFallbackPhotoFrameStyle({ canvasSize, photoShape });
    const photoAnimationStyle = usePhotoAnimationStyle({
        animationId: photoAnimation,
        canvasSize,
        frameMetrics: frameBaseStyle,
        enablePhotoAnimation,
    });
    return (
        <Animated.View
            style={[
                styles.photoWrapper,
                {
                    ...frameBaseStyle,
                    opacity: photoAnimationStyle.opacity,
                    // scale + translate are both in transform — this keeps the
                    // pinch centered, the drag offset applied, and the entry
                    // animation travelling across the poster canvas.
                    transform: [
                        ...photoAnimationStyle.transform,
                        { scale: scaleAnim },
                        ...pan.getTranslateTransform(),
                    ],
                },
            ]}
            {...panResponder.panHandlers}>

            {photoUri
                ? <AnimatedPhotoContent
                    photoUri={photoUri}
                    resizeMode={resizeMode}
                />
                : <View style={styles.photoPlaceholder}>
                    <MaterialCommunityIcons name="account-outline" style={styles.placeholderIcon} />
                    <Text style={styles.placeholderText}>{t('poster.uploadPhoto')}</Text>
                </View>}

            {/* Gesture hint badge */}
            <View style={[styles.dragHandle, { borderColor: accentColor + 'CC' }]} pointerEvents="none">
                <Text style={styles.dragHandleIcon}>⊕</Text>
            </View>
        </Animated.View>
    );
};

const StaticPhoto = ({
    photoFrame,
    frameStyle,
    photoUri,
    photoPosition,
    photoAnimation,
    canvasSize = POSTER_SIZE,
    photoShape,
    photoScale,
    enablePhotoAnimation = true,
    resizeMode = 'cover',
}) => {
    const frameBaseStyle = frameStyle
        ?? getPhotoFrameBaseStyle({ photoFrame, photoShape })
        ?? getCenteredFallbackPhotoFrameStyle({ canvasSize, photoShape });
    const photoAnimationStyle = usePhotoAnimationStyle({
        animationId: photoAnimation,
        canvasSize,
        frameMetrics: frameBaseStyle,
        enablePhotoAnimation,
    });
    return (
        <Animated.View
            style={[
                styles.photoWrapper,
                frameBaseStyle,
                {
                    opacity: photoAnimationStyle.opacity,
                    transform: [
                        ...photoAnimationStyle.transform,
                        { scale: photoScale ?? 1 },
                        { translateX: photoPosition?.x ?? 0 },
                        { translateY: photoPosition?.y ?? 0 },
                    ],
                },
            ]}
            pointerEvents="none">
            {photoUri
                ? <AnimatedPhotoContent
                    photoUri={photoUri}
                    resizeMode={resizeMode}
                />
                : <View style={styles.photoPlaceholder}>
                    <MaterialCommunityIcons name="account-outline" style={styles.placeholderIcon} />
                </View>}
        </Animated.View>
    );
};

const DraggableSticker = ({ sticker, interactive, interactionScale = 1 }) => {
    const dispatch = useDispatch();
    const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
    const committed = useRef({ x: sticker.x, y: sticker.y });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => interactive,
            onMoveShouldSetPanResponder: () => interactive,
            onPanResponderGrant: () => {
                pan.setOffset(committed.current);
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (_, gesture) => {
                const delta = getScaledGestureDelta(gesture, interactionScale);
                pan.setValue(delta);
            },
            onPanResponderRelease: (_, g) => {
                pan.flattenOffset();
                const delta = getScaledGestureDelta(g, interactionScale);
                const next = { x: committed.current.x + delta.x, y: committed.current.y + delta.y };
                committed.current = next;
                dispatch(updateStickerPosition({ id: sticker.id, ...next }));
            },
            onPanResponderTerminate: () => pan.flattenOffset(),
        }),
    ).current;

    if (!interactive) {
        return (
            <View style={{ position: 'absolute', left: sticker.x, top: sticker.y }} pointerEvents="none">
                <MaterialCommunityIcons name={sticker.emoji} style={styles.stickerIcon} />
            </View>
        );
    }

    return (
        <Animated.View style={[styles.stickerWrapper, { transform: pan.getTranslateTransform() }]}
            {...panResponder.panHandlers}>
            <MaterialCommunityIcons name={sticker.emoji} style={styles.stickerIcon} />
        </Animated.View>
    );
};

const buildTextShadow = enabled =>
    enabled
        ? { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
        : {};

const resolveTextBounds = field => ({
    top: field.y,
    left: field.x ?? 16,
    width: field.fieldWidth ?? undefined,
    right: field.fieldWidth !== undefined ? undefined
        : field.x !== undefined ? undefined
            : 16,
});

const getConfigTextField = layer => ({
    y: Number(layer?.y) || 0,
    x: Number.isFinite(Number(layer?.x)) ? Number(layer.x) : undefined,
    fieldWidth: Number.isFinite(Number(layer?.width)) ? Number(layer.width) : undefined,
    align: layer?.align ?? 'left',
});

const getConfigPhotoFrameStyle = ({ layer, layerStyle, photoShape = 'template' }) => {
    const templateRadius = Number.isFinite(Number(layer?.borderRadius))
        ? Number(layer.borderRadius)
        : Number.isFinite(Number(layer?.border_radius))
            ? Number(layer.border_radius)
            : 0;
    const templateBorderWidth = Number.isFinite(Number(layer?.borderWidth))
        ? Number(layer.borderWidth)
        : Number.isFinite(Number(layer?.border_width))
            ? Number(layer.border_width)
            : 0;

    return {
        ...layerStyle,
        borderRadius: resolvePhotoFrameRadius(photoShape, templateRadius),
        borderColor: layer?.borderColor ?? layer?.border_color ?? 'transparent',
        borderWidth: templateBorderWidth,
    };
};

const DraggableText = ({
    text,
    numberOfLines,
    field,
    textStyle,
    textPosition,
    textScale,
    setPositionAction,
    setScaleAction,
    allowPinchScale = true,
    interactionScale = 1,
}) => {
    const dispatch = useDispatch();

    const pan = useRef(new Animated.ValueXY({ x: textPosition.x, y: textPosition.y })).current;
    const scaleAnim = useRef(new Animated.Value(textScale)).current;

    const committed = useRef({ x: textPosition.x, y: textPosition.y });
    const committedScale = useRef(textScale);

    const isPinching = useRef(false);
    const initPinchDist = useRef(null);
    const initPinchScale = useRef(textScale);
    const localScale = useRef(textScale);

    const prevTextPosition = useRef(textPosition);
    if (
        (prevTextPosition.current.x !== textPosition.x || prevTextPosition.current.y !== textPosition.y)
        && !isPinching.current
    ) {
        prevTextPosition.current = textPosition;
        committed.current = { x: textPosition.x, y: textPosition.y };
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: textPosition.x, y: textPosition.y });
    }

    const prevTextScale = useRef(textScale);
    if (prevTextScale.current !== textScale && !isPinching.current) {
        prevTextScale.current = textScale;
        scaleAnim.setValue(textScale);
        committedScale.current = textScale;
        localScale.current = textScale;
    }

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                isPinching.current = false;
                initPinchDist.current = null;
                pan.setOffset(committed.current);
                pan.setValue({ x: 0, y: 0 });
            },

            onPanResponderMove: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;

                if (touches.length >= 2) {
                    if (!allowPinchScale) {
                        return;
                    }
                    if (!initPinchDist.current) {
                        isPinching.current = true;
                        initPinchDist.current = getTouchDistance(touches);
                        initPinchScale.current = committedScale.current;
                        localScale.current = committedScale.current;
                        pan.flattenOffset();
                    } else {
                        const dist = getTouchDistance(touches);
                        const ratio = dist / initPinchDist.current;
                        const newScale = Math.min(MAX_TEXT_SCALE, Math.max(
                            MIN_TEXT_SCALE,
                            initPinchScale.current * ratio,
                        ));
                        localScale.current = newScale;
                        scaleAnim.setValue(newScale);
                    }
                } else if (!isPinching.current) {
                    const delta = getScaledGestureDelta(gesture, interactionScale);
                    pan.setValue(delta);
                }
            },

            onPanResponderRelease: (_, gesture) => {
                if (isPinching.current) {
                    committedScale.current = localScale.current;
                    dispatch(setScaleAction(localScale.current));
                    isPinching.current = false;
                    initPinchDist.current = null;
                } else {
                    pan.flattenOffset();
                    const delta = getScaledGestureDelta(gesture, interactionScale);
                    const next = {
                        x: committed.current.x + delta.x,
                        y: committed.current.y + delta.y,
                    };
                    committed.current = next;
                    dispatch(setPositionAction(next));
                }
            },

            onPanResponderTerminate: () => {
                isPinching.current = false;
                initPinchDist.current = null;
                pan.flattenOffset();
            },
        }),
    ).current;

    return (
        <Animated.Text
            style={[
                styles.textField,
                resolveTextBounds(field),
                textStyle,
                {
                    transform: [
                        { scale: scaleAnim },
                        ...pan.getTranslateTransform(),
                    ],
                },
            ]}
            numberOfLines={numberOfLines}
            adjustsFontSizeToFit
            {...panResponder.panHandlers}>
            {text}
        </Animated.Text>
    );
};

const StaticText = ({ text, numberOfLines, field, textStyle, textPosition, textScale }) => (
    <Text
        style={[
            styles.textField,
            resolveTextBounds(field),
            textStyle,
            {
                transform: [
                    { scale: textScale },
                    { translateX: textPosition.x },
                    { translateY: textPosition.y },
                ],
            },
        ]}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit>
        {text}
    </Text>
);

const DraggableNameText = props => <DraggableText {...props} numberOfLines={1} />;
const DraggableMessageText = props => <DraggableText {...props} numberOfLines={2} />;
const StaticNameText = props => <StaticText {...props} numberOfLines={1} />;
const StaticMessageText = props => <StaticText {...props} numberOfLines={2} />;

const PosterPreview = ({
    posterRef,
    interactive = false,
    allowPinchScale = interactive,
    playVideo = true,
    enablePhotoAnimation = true,
    mediaMuted = true,
    onMediaAudioStateChange,
    preferStillImageForVideo = false,
    interactionScale = 1,
}) => {
    const p = useSelector(s => s.poster);
    // console.log('PosterPreview - selectedTemplate:', p);
    const { t } = useTranslation();
    const selectedTemplate = p.selectedTemplate;
    const canvasSize = useMemo(() => getTemplateCanvasSize(selectedTemplate), [selectedTemplate]);
    const isConfigDriven = useMemo(() => isConfigDrivenTemplate(selectedTemplate), [selectedTemplate]);
    const renderContext = useMemo(() => buildTemplateRenderContext({
        template: selectedTemplate,
        userPhoto: p.userPhoto,
        userName: p.userName,
        userMessage: p.userMessage,
        premiumProfile: p.premiumProfile,
    }), [p.premiumProfile, p.userMessage, p.userName, p.userPhoto, selectedTemplate]);

    if (!selectedTemplate) return null;

    const {
        backgroundColor, accentColor: templateAccent, headerColor,
        footerColor, pattern, photoFrame, textFields,
        layout = 'top',
    } = selectedTemplate;
    const templateImage = getTemplateImageSource(selectedTemplate);
    const templateHasVideo = hasTemplateVideo(selectedTemplate);
    const hasTemplateMedia = !!templateImage || templateHasVideo;


    const accentColor = p.accentColorOverride || templateAccent || COLORS.primary;
    const nameField = textFields?.find(f => f.key === 'name');
    const messageField = textFields?.find(f => f.key === 'message');

    const nameFontWeight = p.nameBold ? 'bold' : 'normal';
    const nameFontStyle = p.nameItalic ? 'italic' : 'normal';
    const msgFontWeight = p.messageBold ? 'bold' : 'normal';
    const msgFontStyle = p.messageItalic ? 'italic' : 'normal';
    const shadowStyle = buildTextShadow(p.textShadow);
    const nameTextStyle = nameField ? {
        fontSize: p.nameFontSize ?? nameField.fontSize,
        fontWeight: nameFontWeight,
        fontStyle: nameFontStyle,
        color: p.nameColor ?? nameField.color,
        textAlign: nameField.x !== undefined ? (nameField.align || 'left') : p.textAlign,
        ...shadowStyle,
    } : null;
    const messageTextStyle = messageField ? {
        fontSize: p.messageFontSize ?? messageField.fontSize,
        fontWeight: msgFontWeight,
        fontStyle: msgFontStyle,
        color: p.messageColor ?? messageField.color,
        textAlign: messageField.x !== undefined ? (messageField.align || 'left') : p.textAlign,
        ...shadowStyle,
    } : null;
    const renderConfigTextLayer = ({ layer, resolvedText }) => {
        const editableRole = getTemplateEditableTextRole(layer);

        if (!editableRole) {
            return undefined;
        }

        if (editableRole === 'name' && !p.showName) {
            return null;
        }

        if (editableRole === 'message' && !p.showMessage) {
            return null;
        }

        const field = getConfigTextField(layer);
        const text = editableRole === 'name'
            ? (p.userName || resolvedText || '')
            : (p.userMessage || resolvedText || '');
        const layerFontSize = Number.isFinite(Number(layer?.fontSize))
            ? Number(layer.fontSize)
            : 18;
        const textStyle = {
            fontSize: editableRole === 'name'
                ? (p.nameFontSize ?? layerFontSize)
                : (p.messageFontSize ?? layerFontSize),
            fontWeight: editableRole === 'name'
                ? nameFontWeight
                : msgFontWeight,
            fontStyle: editableRole === 'name'
                ? nameFontStyle
                : msgFontStyle,
            color: editableRole === 'name'
                ? (p.nameColor ?? layer?.color ?? '#FFFFFF')
                : (p.messageColor ?? layer?.color ?? '#FFFFFF'),
            textAlign: field.x !== undefined
                ? (layer?.align || 'left')
                : p.textAlign,
            fontFamily: layer?.fontFamily,
            letterSpacing: Number.isFinite(Number(layer?.letterSpacing))
                ? Number(layer.letterSpacing)
                : undefined,
            lineHeight: Number.isFinite(Number(layer?.lineHeight))
                ? Number(layer.lineHeight)
                : undefined,
            opacity: Number.isFinite(Number(layer?.opacity))
                ? Number(layer.opacity)
                : 1,
            ...shadowStyle,
        };

        if (!text) {
            return null;
        }

        if (editableRole === 'name') {
            return interactive
                ? <DraggableNameText
                    field={field}
                    text={text}
                    textStyle={textStyle}
                    textPosition={p.namePosition ?? { x: 0, y: 0 }}
                    textScale={p.nameScale ?? 1}
                    setPositionAction={setNamePosition}
                    setScaleAction={setNameScale}
                    allowPinchScale={allowPinchScale}
                    interactionScale={interactionScale} />
                : <StaticNameText
                    field={field}
                    text={text}
                    textStyle={textStyle}
                    textPosition={p.namePosition ?? { x: 0, y: 0 }}
                    textScale={p.nameScale ?? 1} />;
        }

        return interactive
            ? <DraggableMessageText
                field={field}
                text={text}
                textStyle={textStyle}
                textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                textScale={p.messageScale ?? 1}
                setPositionAction={setMessagePosition}
                setScaleAction={setMessageScale}
                allowPinchScale={allowPinchScale}
                interactionScale={interactionScale} />
            : <StaticMessageText
                field={field}
                text={text}
                textStyle={textStyle}
                textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                textScale={p.messageScale ?? 1} />;
    };
    const photoLayerNode = (photoFrame || p.userPhoto)
        ? (
            interactive
                ? <DraggablePhoto
                    photoFrame={photoFrame}
                    photoUri={p.userPhoto}
                    photoAnimation={p.userPhotoAnimation}
                    canvasSize={canvasSize}
                    accentColor={accentColor}
                    photoShape={p.photoShape ?? 'template'}
                    photoScale={p.photoScale ?? 1}
                    enablePhotoAnimation={enablePhotoAnimation}
                    allowPinchScale={allowPinchScale}
                    interactionScale={interactionScale} />
                : <StaticPhoto
                    photoFrame={photoFrame}
                    photoUri={p.userPhoto}
                    photoPosition={p.photoPosition ?? { x: 0, y: 0 }}
                    photoAnimation={p.userPhotoAnimation}
                    canvasSize={canvasSize}
                    photoShape={p.photoShape ?? 'template'}
                    enablePhotoAnimation={enablePhotoAnimation}
                    photoScale={p.photoScale ?? 1} />
        )
        : null;
    const renderConfigUserPhotoLayer = ({ layer, layerStyle }) => {
        const configPhotoFrameStyle = getConfigPhotoFrameStyle({
            layer,
            layerStyle,
            photoShape: p.photoShape ?? 'template',
        });
        const resizeMode = layer?.resizeMode ?? 'cover';

        return interactive
            ? <DraggablePhoto
                frameStyle={configPhotoFrameStyle}
                photoUri={p.userPhoto}
                photoAnimation={p.userPhotoAnimation}
                canvasSize={canvasSize}
                accentColor={accentColor}
                photoShape={p.photoShape ?? 'template'}
                photoScale={p.photoScale ?? 1}
                enablePhotoAnimation={enablePhotoAnimation}
                allowPinchScale={allowPinchScale}
                interactionScale={interactionScale}
                resizeMode={resizeMode} />
            : <StaticPhoto
                frameStyle={configPhotoFrameStyle}
                photoUri={p.userPhoto}
                photoPosition={p.photoPosition ?? { x: 0, y: 0 }}
                photoAnimation={p.userPhotoAnimation}
                canvasSize={canvasSize}
                photoShape={p.photoShape ?? 'template'}
                enablePhotoAnimation={enablePhotoAnimation}
                photoScale={p.photoScale ?? 1}
                resizeMode={resizeMode} />;
    };

    return (
        <View
            ref={posterRef}
            style={[styles.poster, {
                backgroundColor,
                width: canvasSize.width,
                height: canvasSize.height,
            }]}
            collapsable={false}>

            {/* ── 0. Template Image (optional) ─────────── */}
            {hasTemplateMedia ? (
                <TemplateMedia
                    template={selectedTemplate}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    shouldPlay={playVideo}
                    muted={mediaMuted}
                    onAudioAvailabilityChange={onMediaAudioStateChange}
                    useImageFallbackForVideo={preferStillImageForVideo}
                />
            ) : null}

            {!hasTemplateMedia && !isConfigDriven ? (
                layout === 'left' ? (
                    <View style={[styles.leftBar, {
                        backgroundColor: headerColor,
                        width: canvasSize.width * 0.42,
                        height: canvasSize.height,
                    }]}>
                        <PatternLayer pattern={pattern} accentColor={accentColor} canvasSize={canvasSize} />
                        <View style={[styles.leftBarAccent, {
                            backgroundColor: accentColor,
                            width: Math.max(4, canvasSize.width * 0.01),
                        }]} />
                    </View>
                ) : (
                    <View style={[styles.header, {
                        backgroundColor: headerColor,
                        height: canvasSize.height * 0.48,
                    }]}>
                        <PatternLayer pattern={pattern} accentColor={accentColor} canvasSize={canvasSize} />
                        <View style={[styles.accentBar, {
                            backgroundColor: accentColor,
                            height: Math.max(5, canvasSize.height * 0.009),
                        }]} />
                    </View>
                )
            ) : null}

            {/* ── Background overlay (optional) ─────────── */}
            {p.bgOverlayColor && (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, {
                        backgroundColor: p.bgOverlayColor,
                        opacity: p.bgOverlayOpacity,
                    }]}
                />
            )}

            {isConfigDriven ? (
                <ConfiguredTemplateLayers
                    template={selectedTemplate}
                    context={renderContext}
                    skipBackgroundLayers={hasTemplateMedia}
                    renderUserPhotoLayer={renderConfigUserPhotoLayer}
                    renderTextLayer={renderConfigTextLayer}
                />
            ) : photoLayerNode}


            {!isConfigDriven && p.showName && nameField && (
                interactive
                    ? <DraggableNameText
                        field={nameField}
                        text={p.userName || nameField.label}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition ?? { x: 0, y: 0 }}
                        textScale={p.nameScale ?? 1}
                        setPositionAction={setNamePosition}
                        setScaleAction={setNameScale}
                        allowPinchScale={allowPinchScale}
                        interactionScale={interactionScale} />
                    : <StaticNameText
                        field={nameField}
                        text={p.userName || nameField.label}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition ?? { x: 0, y: 50 }}
                        textScale={p.nameScale ?? 1} />
            )}

            {/* ── 4. Message (hidden if showMessage=false) ── */}
            {!isConfigDriven && p.showMessage && messageField && (
                interactive
                    ? <DraggableMessageText
                        field={messageField}
                        text={p.userMessage || messageField.label}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                        textScale={p.messageScale ?? 1}
                        setPositionAction={setMessagePosition}
                        setScaleAction={setMessageScale}
                        allowPinchScale={allowPinchScale}
                        interactionScale={interactionScale} />
                    : <StaticMessageText
                        field={messageField}
                        text={p.userMessage || messageField.label}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                        textScale={p.messageScale ?? 1} />
            )}

            {/* ── 5. Stickers ──────────────────────────── */}
            {(p.stickers ?? []).map(sticker => (
                <DraggableSticker
                    key={sticker.id}
                    sticker={sticker}
                    interactive={interactive}
                    interactionScale={interactionScale}
                />
            ))}

            {/* ── 6. Footer ─────────────────────────────── */}
            {!isConfigDriven ? (
                <View style={[styles.footer, {
                    backgroundColor: footerColor,
                    height: Math.max(36, canvasSize.height * 0.064),
                }]}>
                    <Text style={[styles.watermark, {
                        fontSize: Math.max(10, canvasSize.width * 0.025),
                    }]}>
                        {t('poster.watermark')}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    poster: {
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        overflow: 'hidden',
        position: 'relative',
    },
    header: {
        height: POSTER_SIZE.height * 0.48,
        width: '100%',
        overflow: 'hidden',
    },
    // Left vertical bar (for layout:'left' templates)
    leftBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: POSTER_SIZE.width * 0.42,  // ~168px
        height: POSTER_SIZE.height,
        overflow: 'hidden',
    },
    leftBarAccent: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 4,
        height: '100%',
    },
    accentBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 5,
    },
    photoWrapper: {
        position: 'absolute',
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    animatedPhotoContent: {
        width: '100%',
        height: '100%',
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.card,
    },
    placeholderIcon: { fontSize: 48, color: COLORS.textMuted },
    placeholderText: {
        fontSize: 11, color: COLORS.textMuted, marginTop: 6,
        textAlign: 'center', paddingHorizontal: 8,
    },
    dragHandle: {
        position: 'absolute', bottom: 6, right: 6,
        width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    dragHandleIcon: { fontSize: 14, color: '#FFFFFF' },
    stickerWrapper: { position: 'absolute', zIndex: 10 },
    stickerIcon: {
        fontSize: 44,
        color: COLORS.text,
        textShadowColor: 'rgba(255,255,255,0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
    },
    textField: {
        position: 'absolute', left: 16, right: 16,
    },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
        alignItems: 'center', justifyContent: 'center',
    },
    watermark: {
        fontSize: 10, color: COLORS.white + 'AA',
        letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600',
    },
});

export default PosterPreview;

