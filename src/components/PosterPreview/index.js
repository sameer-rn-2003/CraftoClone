import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import i18n from '../../i18n';
import {
    setMessagePosition,
    setMessageScale,
    setNamePosition,
    setNameScale,
    setPhotoPosition,
    setPhotoScale,
    updateStickerPosition,
    setBackgroundVideoDuration,
    setDynamicTextField,
} from '../../store/posterSlice';
import { COLORS, POSTER_SIZE } from '../../utils/constants';
import {
    getDefaultPhotoFramePosition,
    getDefaultNameTextPosition,
    getPhotoFrameBaseStyle,
    resolvePhotoFrameRadius,
} from '../../utils/photoFrameLayout';
import { isSvgShape } from '../../utils/shapes';
import ShapeClipView from '../ShapeClipView';
import TemplateMedia from '../TemplateMedia';
import { getTemplateImageSource, hasTemplateVideo } from '../../utils/templateMedia';
import ConfiguredTemplateLayers from '../ConfiguredTemplateLayers';
import DraggableTextField from '../DraggableTextField';
import {
    buildTemplateRenderContext,
    getTemplateEditableTextRole,
    getTemplateCanvasSize,
    getTemplateTextFields,
    getTemplateBackgroundOverlay,
    getTemplateAnimation,
    getNumericValue,
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
const PREMIUM_TOP_BAND_HEIGHT = 70;
const PREMIUM_BOTTOM_BAND_HEIGHT = 85;
const SOCIAL_PLATFORMS = [
    { key: 'facebook', icon: 'facebook' },
    { key: 'instagram', icon: 'instagram' },
    { key: 'twitter', icon: 'twitter' },
    { key: 'snapchat', icon: 'snapchat' },
    { key: 'other', icon: 'at' },
];

const buildSocialItems = handles => SOCIAL_PLATFORMS
    .map(platform => {
        const value = String(handles?.[platform.key] || '').trim();
        return value ? { ...platform, text: value } : null;
    })
    .filter(Boolean);

export const getPremiumDetailsForPoster = posterState => {
    if (!posterState?.isPremium) return null;

    const personal = posterState?.premiumProfile?.personal || {};
    const business = posterState?.premiumProfile?.business || {};
    const activeSection = posterState?.premiumProfile?.activeSection === 'business' ? 'business' : 'personal';
    const hasBusiness = activeSection === 'business';
    const source = hasBusiness ? business : personal;
    const socialItems = buildSocialItems(source.socialHandles);

    const details = hasBusiness ? {
        type: 'business',
        name: source.businessName,
        description: source.businessDescription,
        mobile: source.contactMobileNumber,
        address: source.contactAddress,
        social: source.contactSocialHandle,
        website: source.websiteLink,
        socials: socialItems,
    } : {
        type: 'personal',
        name: source.organizationName,
        description: '',
        mobile: source.mobileNumber,
        address: source.address,
        social: source.socialHandle,
        website: '',
        socials: socialItems,
    };

    const hasAnyDetails = [
        details.name,
        details.description,
        details.mobile,
        details.address,
        details.social,
        details.website,
        ...(details.socials || []).map(item => item.text),
    ].some(value => typeof value === 'string' && value.trim());
    return hasAnyDetails ? details : null;
};

export const getPosterCompositionSize = (template, posterState) => {
    const canvasSize = getTemplateCanvasSize(template);
    const premiumDetails = getPremiumDetailsForPoster(posterState);

    return {
        width: canvasSize.width,
        height: canvasSize.height
            + (premiumDetails ? PREMIUM_TOP_BAND_HEIGHT + PREMIUM_BOTTOM_BAND_HEIGHT : 0),
        posterTop: premiumDetails ? PREMIUM_TOP_BAND_HEIGHT : 0,
        posterHeight: canvasSize.height,
        topBandHeight: premiumDetails ? PREMIUM_TOP_BAND_HEIGHT : 0,
        bottomBandHeight: premiumDetails ? PREMIUM_BOTTOM_BAND_HEIGHT : 0,
    };
};

// ─── Fallback text field factories ────────────────────────────────
// Used when a template has no textFields defined (most reel/video templates).
// Positions are expressed as fractions of canvasSize so they work at any resolution.

const makeFallbackNameField = canvasSize => {
    const field = {
        y: Math.round(canvasSize.height * 0.60),
        x: 20,
        fieldWidth: canvasSize.width - 40,
        align: 'center',
        fontSize: 28,
    };
    return getDefaultNameTextPosition(field, canvasSize);
};

const makeFallbackMessageField = canvasSize => ({
    y: Math.round(canvasSize.height * 0.70),
    x: 20,
    fieldWidth: canvasSize.width - 40,
    align: 'center',
    fontSize: 18,
});

const getDesignLayout = (index = 0, canvasSize = POSTER_SIZE) => {
    if (!index) {
        return null;
    }

    const layouts = [
        {
            photo: { x: canvasSize.width * 0.09, y: canvasSize.height * 0.57, anchor: 'left' },
            nameY: canvasSize.height * 0.57,
            messageY: canvasSize.height * 0.66,
            align: 'right',
        },
        {
            photo: { x: canvasSize.width * 0.67, y: canvasSize.height * 0.57, anchor: 'left' },
            nameY: canvasSize.height * 0.56,
            messageY: canvasSize.height * 0.66,
            align: 'left',
        },
        {
            photo: { x: canvasSize.width * 0.5, y: canvasSize.height * 0.12, anchor: 'center' },
            nameY: canvasSize.height * 0.60,
            messageY: canvasSize.height * 0.70,
            align: 'center',
        },
    ];

    return layouts[(Math.abs(index) - 1) % layouts.length];
};

const applyDesignToFrame = ({ frameStyle, layout, canvasSize }) => {
    if (!frameStyle || !layout?.photo) return frameStyle;
    const width = Number(frameStyle.width) || Math.min(canvasSize.width, canvasSize.height) * 0.28;
    const height = Number(frameStyle.height) || width;
    const left = layout.photo.anchor === 'center'
        ? layout.photo.x - width / 2
        : layout.photo.x;

    return {
        ...frameStyle,
        left: Math.max(0, Math.min(canvasSize.width - width, left)),
        top: Math.max(0, Math.min(canvasSize.height - height, layout.photo.y)),
    };
};

const applyDesignToTextField = ({ field, y, align, canvasSize }) => {
    if (!align) {
        return field;
    }

    return {
        ...field,
        y: Math.round(y ?? field.y),
        x: align === 'center' ? 20 : field.x ?? 20,
        fieldWidth: align === 'center'
            ? canvasSize.width - 40
            : field.fieldWidth ?? canvasSize.width - 40,
        align,
    };
};

// ─── Background patterns ──────────────────────────────────────────

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
                borderRadius: size / 2, borderWidth: 0, borderColor: color + '30',
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
                borderRadius: 30, borderWidth: 0, borderColor: color + '25',
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

// ─── Photo animation ──────────────────────────────────────────────

const getPhotoAnimationConfig = (animationId, canvasSize = POSTER_SIZE, frameMetrics = {}, configAnimation = null) => {
    // If we have a config animation with from/to values and user hasn't disabled it, use them directly
    if (animationId !== 'none' && configAnimation && configAnimation.from && configAnimation.to) {
        return {
            from: configAnimation.from,
            to: configAnimation.to,
            loop: configAnimation.loop === true ? 'alternateSlow' : configAnimation.loop === 'alternateSlow' ? 'alternateSlow' : false,
            duration: configAnimation.duration || 1400,
            easing: configAnimation.easing === 'spring' ? 'bounce' : 'ease',
        };
    }

    const effectiveAnimationId = animationId;

    const frameWidth = Number(frameMetrics?.width) || 0;
    const frameHeight = Number(frameMetrics?.height) || 0;
    const travelX = Math.max(canvasSize.width * 0.9, frameWidth + canvasSize.width * 0.2);
    const travelY = Math.max(canvasSize.height * 0.9, frameHeight + canvasSize.height * 0.2);
    const diagonalX = Math.max(canvasSize.width * 0.7, frameWidth + canvasSize.width * 0.15);
    const diagonalY = Math.max(canvasSize.height * 0.7, frameHeight + canvasSize.height * 0.15);
    const shortTravelX = Math.max(canvasSize.width * 0.18, 36);
    const shortTravelY = Math.max(canvasSize.height * 0.18, 36);

    switch (effectiveAnimationId) {
        // case 'slide_left_center':
        //     return { from: { translateX: -travelX }, to: { translateX: 0 } };
        // case 'slide_right_center':
        //     return { from: { translateX: travelX }, to: { translateX: 0 } };
        // case 'slide_top_center':
        //     return { from: { translateY: -travelY }, to: { translateY: 0 } };
        // case 'slide_bottom_center':
        //     return { from: { translateY: travelY }, to: { translateY: 0 } };
        // case 'slide_top_left':
        //     return { from: { translateX: -diagonalX, translateY: -diagonalY }, to: { translateX: 0, translateY: 0 } };
        case 'slide_top_right':
            return { from: { translateX: diagonalX, translateY: -diagonalY }, to: { translateX: 0, translateY: 0 } };
        // case 'slide_bottom_left':
        //     return { from: { translateX: -diagonalX, translateY: diagonalY }, to: { translateX: 0, translateY: 0 } };
        // case 'slide_bottom_right':
        //     return { from: { translateX: diagonalX, translateY: diagonalY }, to: { translateX: 0, translateY: 0 } };
        // case 'bounce_left':
        //     return { from: { translateX: -travelX }, to: { translateX: 0 }, easing: 'bounce' };
        // case 'bounce_right':
        //     return { from: { translateX: travelX }, to: { translateX: 0 }, easing: 'bounce' };
        // case 'bounce_top':
        //     return { from: { translateY: -travelY }, to: { translateY: 0 }, easing: 'bounce' };
        // case 'bounce_bottom':
        //     return { from: { translateY: travelY }, to: { translateY: 0 }, easing: 'bounce' };
        // case 'zoom_in_soft':
        //     return { from: { scale: 0.72, opacity: 0.35 }, to: { scale: 1, opacity: 1 } };
        // case 'zoom_out_soft':
        //     return { from: { scale: 1.18, opacity: 0.45 }, to: { scale: 1, opacity: 1 } };
        // case 'pulse_soft':
        //     return { from: { scale: 0.94 }, to: { scale: 1.04 }, loop: 'alternate' };
        // case 'pulse_big':
        //     return { from: { scale: 0.88 }, to: { scale: 1.12 }, loop: 'alternate' };
        // case 'fade_in':
        //     return { from: { opacity: 0.1 }, to: { opacity: 1 } };
        case 'fade_up':
            return { from: { translateY: shortTravelY, opacity: 0.2 }, to: { translateY: 0, opacity: 1 } };
        // case 'fade_down':
        //     return { from: { translateY: -shortTravelY, opacity: 0.2 }, to: { translateY: 0, opacity: 1 } };
        case 'rotate_soft_left':
            return { from: { rotate: '-12deg', scale: 0.95 }, to: { rotate: '0deg', scale: 1 } };
        // case 'rotate_soft_right':
        //     return { from: { rotate: '12deg', scale: 0.95 }, to: { rotate: '0deg', scale: 1 } };
        // case 'flip_x_soft':
        //     return { from: { rotateX: '70deg', opacity: 0.4 }, to: { rotateX: '0deg', opacity: 1 } };
        // case 'flip_y_soft':
        //     return { from: { rotateY: '70deg', opacity: 0.4 }, to: { rotateY: '0deg', opacity: 1 } };
        // case 'float_left_right':
        //     return { from: { translateX: -shortTravelX }, to: { translateX: shortTravelX }, loop: 'alternateSlow' };
        case 'float_up_down':
            return { from: { translateY: -shortTravelY }, to: { translateY: shortTravelY }, loop: 'alternateSlow' };
        // case 'wiggle_soft':
        //     return { from: { rotate: '-5deg' }, to: { rotate: '5deg' }, loop: 'alternateFast' };
        case 'pop_in':
            return { from: { scale: 0.55, opacity: 0.25 }, to: { scale: 1, opacity: 1 }, easing: 'bounce' };
        // case 'drift_top_left':
        //     return { from: { translateX: -shortTravelX, translateY: -shortTravelY, scale: 0.96 }, to: { translateX: shortTravelX * 0.45, translateY: shortTravelY * 0.45, scale: 1.03 }, loop: 'alternateSlow' };
        // case 'drift_bottom_right':
        //     return { from: { translateX: shortTravelX, translateY: shortTravelY, scale: 0.96 }, to: { translateX: -shortTravelX * 0.45, translateY: -shortTravelY * 0.45, scale: 1.03 }, loop: 'alternateSlow' };
        case 'none':
        default:
            return null;
    }
};

export const usePhotoAnimationStyle = ({
    animationId = 'none',
    canvasSize,
    frameMetrics,
    enablePhotoAnimation = true,
    configAnimation = null,
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
                configAnimation,
            )
            : null),
        [animationId, canvasWidth, canvasHeight, enablePhotoAnimation, frameWidth, frameHeight, configAnimation],
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
                Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true }),
                Animated.timing(progress, { toValue: 0, duration, useNativeDriver: true }),
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
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.translateX ?? 0, config.to?.translateX ?? 0] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.translateY ?? 0, config.to?.translateY ?? 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.scale ?? 1, config.to?.scale ?? 1] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.rotate ?? '0deg', config.to?.rotate ?? '0deg'] }) },
            { rotateX: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.rotateX ?? '0deg', config.to?.rotateX ?? '0deg'] }) },
            { rotateY: progress.interpolate({ inputRange: [0, 1], outputRange: [config.from?.rotateY ?? '0deg', config.to?.rotateY ?? '0deg'] }) },
        ],
    } : {
        opacity: 1,
        transform: [],
    };
};

const AnimatedPhotoContent = ({ photoUri, resizeMode = 'cover' }) => {
    if (!photoUri) return null;
    return (
        <View style={styles.animatedPhotoContent}>
            <Image key={photoUri} source={{ uri: photoUri }} style={styles.photo} resizeMode={resizeMode} />
        </View>
    );
};

const getCenteredFallbackPhotoFrameStyle = ({ canvasSize = POSTER_SIZE, photoShape = 'template' }) => {
    const size = Math.max(96, Math.min(canvasSize.width, canvasSize.height) * 0.28);
    const templateRadius = size / 2;
    const base = {
        left: 0,
        top: 0,
        width: size,
        height: size,
        borderRadius: resolvePhotoFrameRadius(photoShape, templateRadius),
        borderColor: '#FFFFFF',
        borderWidth: 0,
    };
    return getDefaultPhotoFramePosition(base, canvasSize);
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
    configAnimation = null,
}) => {
    const dispatch = useDispatch();
    const { photoPosition } = useSelector(s => s.poster);
    const { t } = useTranslation();

    const pan = useRef(new Animated.ValueXY({ x: photoPosition.x, y: photoPosition.y })).current;
    const scaleAnim = useRef(new Animated.Value(photoScale)).current;

    const committed = useRef({ x: photoPosition.x, y: photoPosition.y });
    const committedScale = useRef(photoScale);

    const isPinching = useRef(false);
    const initPinchDist = useRef(null);
    const initPinchScale = useRef(photoScale);
    const localScale = useRef(photoScale);

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
                isPinching.current = false;
                initPinchDist.current = null;
                pan.setOffset(committed.current);
                pan.setValue({ x: 0, y: 0 });
                console.log(`[DraggablePhoto] Drag Start - committedPosition:`, committed.current, `scale:`, committedScale.current);
            },

            onPanResponderMove: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;
                if (touches.length >= 2) {
                    if (!allowPinchScale) return;
                    if (!initPinchDist.current) {
                        isPinching.current = true;
                        initPinchDist.current = getTouchDistance(touches);
                        initPinchScale.current = committedScale.current;
                        localScale.current = committedScale.current;
                        pan.flattenOffset();
                    } else {
                        const dist = getTouchDistance(touches);
                        const ratio = dist / initPinchDist.current;
                        const newScale = Math.min(3.0, Math.max(0.25, initPinchScale.current * ratio));
                        localScale.current = newScale;
                        scaleAnim.setValue(newScale);
                        console.log(`[DraggablePhoto] Pinching - scale: ${newScale.toFixed(3)}, ratio: ${ratio.toFixed(3)}`);
                    }
                } else if (!isPinching.current) {
                    const delta = getScaledGestureDelta(gesture, interactionScale);
                    console.log(`[DraggablePhoto] Dragging - offset: {dx: ${gesture.dx}, dy: ${gesture.dy}}, scaledDelta: {x: ${delta.x.toFixed(1)}, y: ${delta.y.toFixed(1)}}, committedPosition:`, committed.current);
                    pan.setValue(delta);
                }
            },

            onPanResponderRelease: (_, gesture) => {
                if (isPinching.current) {
                    committedScale.current = localScale.current;
                    console.log(`[DraggablePhoto] Pinch End - finalScale: ${localScale.current.toFixed(3)}`);
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
                    console.log(`[DraggablePhoto] Drag End - finalPosition: {x: ${next.x.toFixed(1)}, y: ${next.y.toFixed(1)}}, offset: {dx: ${gesture.dx}, dy: ${gesture.dy}}`);
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
        ?? getPhotoFrameBaseStyle({ photoFrame, photoShape, canvasSize })
        ?? getCenteredFallbackPhotoFrameStyle({ canvasSize, photoShape });

    const photoAnimationStyle = usePhotoAnimationStyle({
        animationId: photoAnimation,
        canvasSize,
        frameMetrics: frameBaseStyle,
        enablePhotoAnimation,
        configAnimation,
    });

    const svgShape = isSvgShape(photoShape);

    const wrapperStyle = {
        ...frameBaseStyle,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: svgShape ? 'transparent' : (frameBaseStyle?.backgroundColor ?? COLORS.surface),
    };

    return (
        <Animated.View
            style={[
                styles.photoWrapper,
                wrapperStyle,
                {
                    opacity: photoAnimationStyle.opacity,
                    transform: [
                        ...photoAnimationStyle.transform,
                        { scale: scaleAnim },
                        ...pan.getTranslateTransform(),
                    ],
                },
            ]}
            {...panResponder.panHandlers}>

            <ShapeClipView
                shape={photoShape}
                width={frameBaseStyle?.width ?? canvasSize.width}
                height={frameBaseStyle?.height ?? canvasSize.height}
                photoUri={svgShape ? photoUri : null}
                resizeMode={resizeMode}
                borderColor={frameBaseStyle?.borderColor}
                borderWidth={frameBaseStyle?.borderWidth}
                placeholderIcon={!photoUri ? 'account-outline' : null}
                style={svgShape ? { position: 'absolute', top: 0, left: 0 } : undefined}>
                {photoUri
                    ? <AnimatedPhotoContent photoUri={photoUri} resizeMode={resizeMode} />
                    : <View style={styles.photoPlaceholder}>
                        <MaterialCommunityIcons name="account-outline" style={styles.placeholderIcon} />
                        <Text style={styles.placeholderText}>{t('poster.uploadPhoto')}</Text>
                    </View>}
            </ShapeClipView>

            <View style={[styles.dragHandle, { borderColor: accentColor + 'CC' }]} pointerEvents="none">
                <Text style={styles.dragHandleIcon}>⊕</Text>
            </View>
        </Animated.View>
    );
};

export const StaticPhoto = ({
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
    configAnimation = null,
}) => {
    const frameBaseStyle = frameStyle
        ?? getPhotoFrameBaseStyle({ photoFrame, photoShape, canvasSize })
        ?? getCenteredFallbackPhotoFrameStyle({ canvasSize, photoShape });

    const photoAnimationStyle = usePhotoAnimationStyle({
        animationId: photoAnimation,
        canvasSize,
        frameMetrics: frameBaseStyle,
        enablePhotoAnimation,
        configAnimation,
    });

    const svgShape = isSvgShape(photoShape);

    const staticWrapperStyle = {
        ...frameBaseStyle,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: svgShape ? 'transparent' : (frameBaseStyle?.backgroundColor ?? COLORS.surface),
    };

    return (
        <Animated.View
            style={[
                styles.photoWrapper,
                staticWrapperStyle,
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
            <ShapeClipView
                shape={photoShape}
                width={frameBaseStyle?.width ?? canvasSize.width}
                height={frameBaseStyle?.height ?? canvasSize.height}
                photoUri={svgShape ? photoUri : null}
                resizeMode={resizeMode}
                borderColor={frameBaseStyle?.borderColor}
                borderWidth={frameBaseStyle?.borderWidth}
                placeholderIcon={!photoUri ? 'account-outline' : null}
                style={svgShape ? { position: 'absolute', top: 0, left: 0 } : undefined}>
                {photoUri
                    ? <AnimatedPhotoContent photoUri={photoUri} resizeMode={resizeMode} />
                    : <View style={styles.photoPlaceholder}>
                        <MaterialCommunityIcons name="account-outline" style={styles.placeholderIcon} />
                    </View>}
            </ShapeClipView>
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
    contentAnimationStyle,
    canvasSize,
    configBasePosition,
    configFieldWidth,
    configFieldHeight,
}) => {
    const dispatch = useDispatch();

    const initialAbsX = textPosition?.x ?? configBasePosition?.x ?? field?.x ?? 16;
    const initialAbsY = textPosition?.y ?? configBasePosition?.y ?? field?.y ?? 0;

    const pan = useRef(new Animated.ValueXY({ x: initialAbsX, y: initialAbsY })).current;
    const scaleAnim = useRef(new Animated.Value(textScale)).current;

    const committed = useRef({ x: initialAbsX, y: initialAbsY });
    const committedScale = useRef(textScale);

    const isPinching = useRef(false);
    const initPinchDist = useRef(null);
    const initPinchScale = useRef(textScale);
    const localScale = useRef(textScale);

    const prevTextPosition = useRef(textPosition);
    if (textPosition && !isPinching.current) {
        const px = textPosition.x;
        const py = textPosition.y;
        if (prevTextPosition.current?.x !== px || prevTextPosition.current?.y !== py) {
            prevTextPosition.current = textPosition;
            committed.current = { x: px, y: py };
            pan.setOffset({ x: 0, y: 0 });
            pan.setValue({ x: px, y: py });
        }
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
                console.log(`[DraggableText] GRANT | field: ${text} | committed:`, committed.current);
            },

            onPanResponderMove: (evt, gesture) => {
                const touches = evt.nativeEvent.touches;
                if (touches.length >= 2) {
                    if (!allowPinchScale) return;
                    if (!initPinchDist.current) {
                        isPinching.current = true;
                        initPinchDist.current = getTouchDistance(touches);
                        initPinchScale.current = committedScale.current;
                        localScale.current = committedScale.current;
                        pan.flattenOffset();
                    } else {
                        const dist = getTouchDistance(touches);
                        const ratio = dist / initPinchDist.current;
                        const maxScaleByWidth = canvasSize?.width
                            ? canvasSize.width / (field?.fieldWidth ?? field?.width ?? 200)
                            : MAX_TEXT_SCALE;
                        const newScale = Math.min(MAX_TEXT_SCALE, maxScaleByWidth, Math.max(MIN_TEXT_SCALE, initPinchScale.current * ratio));
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
                    const next = {
                        x: pan.x.__getValue(),
                        y: pan.y.__getValue(),
                    };
                    console.log(`[DraggableText] RELEASE | field: ${text} | next:`, next);
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
                textStyle,
                {
                    position: 'absolute',
                    left: pan.x,
                    top: pan.y,
                    opacity: contentAnimationStyle?.opacity ?? 1,
                    transform: [
                        ...(contentAnimationStyle?.transform || []),
                        { scale: scaleAnim },
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

const StaticText = ({ text, numberOfLines, field, textStyle, textPosition, textScale, contentAnimationStyle, configBasePosition }) => {
    const staticAbsX = textPosition?.x ?? configBasePosition?.x ?? field?.x ?? 16;
    const staticAbsY = textPosition?.y ?? configBasePosition?.y ?? field?.y ?? 0;
    return (
        <Animated.Text
            style={[
                styles.textField,
                textStyle,
                {
                    position: 'absolute',
                    left: staticAbsX,
                    top: staticAbsY,
                    opacity: contentAnimationStyle?.opacity ?? 1,
                    transform: [
                        ...(contentAnimationStyle?.transform || []),
                        { scale: textScale },
                    ],
                },
            ]}
            numberOfLines={numberOfLines}
            adjustsFontSizeToFit>
            {text}
        </Animated.Text>
    );
};

const DraggableNameText = props => <DraggableText {...props} numberOfLines={1} />;
const DraggableMessageText = props => <DraggableText {...props} numberOfLines={2} />;
const StaticNameText = props => <StaticText {...props} numberOfLines={1} />;
const StaticMessageText = props => <StaticText {...props} numberOfLines={2} />;

export const PremiumPosterDetailsFrame = ({
    details,
    canvasSize = POSTER_SIZE,
    layoutIndex = 0,
    topHeight = PREMIUM_TOP_BAND_HEIGHT,
    bottomHeight = PREMIUM_BOTTOM_BAND_HEIGHT,
}) => {
    if (!details) return null;

    const variant = Math.abs(layoutIndex || 0) % 3;
    const topAlignment = variant === 1 ? 'flex-start' : variant === 2 ? 'flex-end' : 'center';
    const topDirection = variant === 2 ? 'row-reverse' : 'row';
    const textAlign = variant === 1 ? 'left' : variant === 2 ? 'right' : 'center';
    const contactItems = [
        details.mobile ? { icon: 'phone-outline', text: details.mobile } : null,
        details.address ? { icon: 'map-marker-outline', text: details.address } : null,
        details.social ? { icon: 'at', text: details.social } : null,
        details.website ? { icon: 'web', text: details.website } : null,
    ].filter(Boolean);
    const socialItems = details.socials || [];

    return (
        <>
            <View style={[styles.premiumTopBand, { height: topHeight, width: canvasSize.width }]}>
                <View style={[
                    styles.premiumTopContent,
                    { justifyContent: topAlignment, flexDirection: topDirection },
                ]}>
                    <View style={[styles.premiumTitleWrap, { alignItems: topAlignment }]}>
                        {details.name ? (
                            <Text style={[styles.premiumName, { textAlign }]} numberOfLines={1}>
                                {details.name}
                            </Text>
                        ) : null}
                        {details.description ? (
                            <Text style={[styles.premiumDescription, { textAlign }]} numberOfLines={2}>
                                {details.description}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>
            <View style={[
                styles.premiumBottomBand,
                { height: bottomHeight, width: canvasSize.width, top: topHeight + canvasSize.height },
            ]}>
                <View style={styles.premiumContactGrid}>
                    {contactItems.map(item => (
                        <View key={`${item.icon}_${item.text}`} style={styles.premiumContactItem}>
                            <MaterialCommunityIcons name={item.icon} style={styles.premiumContactIcon} />
                            <Text style={styles.premiumContactText} numberOfLines={2}>
                                {item.text}
                            </Text>
                        </View>
                    ))}
                    {socialItems.map(item => (
                        <View key={`${item.key}_${item.text}`} style={styles.premiumContactItem}>
                            <MaterialCommunityIcons name={item.icon} style={styles.premiumContactIcon} />
                            <Text style={styles.premiumContactText} numberOfLines={1}>
                                {item.text}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </>
    );
};

// ─── PosterPreview ────────────────────────────────────────────────

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
    const dispatch = useDispatch();
    const onVideoLoad = useCallback((duration) => {
        dispatch(setBackgroundVideoDuration(duration));
    }, [dispatch]);
    const { t } = useTranslation();
    const selectedTemplate = p.selectedTemplate;
    const canvasSize = useMemo(() => getTemplateCanvasSize(selectedTemplate), [selectedTemplate]);
    const textFieldScale = useMemo(() => {
        const configJson = selectedTemplate?.config_json ?? selectedTemplate?.config ?? null;
        const sourceW = getNumericValue(
            configJson?.width ?? selectedTemplate?.config?.width ?? selectedTemplate?.width,
            canvasSize.width,
        );
        const sourceH = getNumericValue(
            configJson?.height ?? selectedTemplate?.config?.height ?? selectedTemplate?.height,
            canvasSize.height,
        );
        return {
            scaleX: sourceW > 0 ? canvasSize.width / sourceW : 1,
            scaleY: sourceH > 0 ? canvasSize.height / sourceH : 1,
        };
    }, [selectedTemplate, canvasSize]);
    const textFieldPositions = useSelector(state => state.poster.textFieldPositions);
    const activeTextField = useSelector(state => state.poster.activeTextField);
    const activeDesignLayout = useMemo(
        () => getDesignLayout(p.designLayoutIndex, canvasSize),
        [canvasSize, p.designLayoutIndex],
    );
    const premiumDetails = useMemo(() => getPremiumDetailsForPoster(p), [p]);
    const compositionSize = useMemo(
        () => getPosterCompositionSize(selectedTemplate, p),
        [p, selectedTemplate],
    );
    const displayPhotoUri = p.userPhoto;
    const isConfigDriven = useMemo(() => isConfigDrivenTemplate(selectedTemplate), [selectedTemplate]);
    const renderContext = useMemo(() => buildTemplateRenderContext({
        template: selectedTemplate,
        userPhoto: displayPhotoUri,
        userName: p.userName,
        userMessage: p.userMessage,
    }), [displayPhotoUri, p.userMessage, p.userName, selectedTemplate]);

    // Extract photo frame animation from config_json.photoFrame.animation
    const photoFrameAnimationConfig = useMemo(() => {
        const configJson = selectedTemplate?.config_json ?? selectedTemplate?.config ?? null;
        return configJson?.photoFrame?.animation ?? null;
    }, [selectedTemplate]);

    // Extract content animation from config_json.contentAnimation or textFields.*.animation
    const contentAnimationConfig = useMemo(() => {
        const configJson = selectedTemplate?.config_json ?? selectedTemplate?.config ?? null;
        if (configJson?.contentAnimation) return configJson.contentAnimation;
        const textFields = configJson?.textFields;
        if (textFields && typeof textFields === 'object') {
            for (const field of Object.values(textFields)) {
                if (field?.animation) return field.animation;
            }
        }
        return null;
    }, [selectedTemplate]);

    const contentAnimationId = contentAnimationConfig?.id || 'none';

    const contentAnimationStyle = usePhotoAnimationStyle({
        animationId: 'none',
        canvasSize,
        frameMetrics: { width: canvasSize.width * 0.8, height: 60 },
        enablePhotoAnimation: true,
        configAnimation: contentAnimationConfig,
    });

    if (!selectedTemplate) return null;

    const {
        backgroundColor, accentColor: templateAccent, headerColor,
        footerColor, pattern, photoFrame, layout = 'top',
    } = selectedTemplate;
    const templateImage = getTemplateImageSource(selectedTemplate);
    const templateHasVideo = hasTemplateVideo(selectedTemplate);
    const hasTemplateMedia = !!templateImage || templateHasVideo;

    const accentColor = p.accentColorOverride || templateAccent || COLORS.primary;

    // ── Text field resolution ────────────────────────────────────
    // Support both formats:
    // 1. config_json.textFields as object: { name: { position, width, fontSize, ... }, message: { ... } }
    // 2. Legacy array: [{ key: 'name', x, y, ... }, { key: 'message', ... }]
    const configTextFields = getTemplateTextFields(selectedTemplate);
    const legacyTextFields = selectedTemplate?.textFields;
    const hasObjectFormatTextFields = configTextFields && typeof configTextFields === 'object'
        && !Array.isArray(configTextFields) && Object.keys(configTextFields).length > 0;

    const normalizeTextField = (field, key) => {
        if (!field) return null;
        // New config_json format: { position: { x, y }, width, fontSize, ... }
        if (field.position && typeof field.position === 'object') {
            return {
                key,
                x: field.position.x ?? field.x ?? 16,
                y: field.position.y ?? field.y ?? 0,
                fieldWidth: field.width ?? field.fieldWidth ?? canvasSize.width - 32,
                fontSize: field.fontSize ?? (key === 'name' ? 28 : 18),
                fontFamily: field.fontFamily,
                fontWeight: field.fontWeight,
                color: field.color ?? '#FFFFFF',
                align: field.align ?? 'center',
                visible: field.visible !== false,
            };
        }
        // Legacy array format: { key, x, y, fieldWidth, fontSize, ... }
        if (field.key === key || (!field.key && key === 'name')) {
            return {
                key: key,
                x: field.x ?? 16,
                y: field.y ?? 0,
                fieldWidth: field.fieldWidth ?? field.width ?? canvasSize.width - 32,
                fontSize: field.fontSize ?? (key === 'name' ? 28 : 18),
                fontFamily: field.fontFamily,
                fontWeight: field.fontWeight,
                color: field.color ?? '#FFFFFF',
                align: field.align ?? 'center',
                visible: field.visible !== false,
            };
        }
        return null;
    };

    // Extract name and message fields from config_json or legacy format
    let nameField = null;
    let messageField = null;

    if (configTextFields && typeof configTextFields === 'object' && !Array.isArray(configTextFields)) {
        // config_json.textFields object format
        nameField = normalizeTextField(configTextFields.name, 'name');
        messageField = normalizeTextField(configTextFields.message, 'message');
    }

    // Fallback to legacy array format
    if (!nameField && Array.isArray(legacyTextFields)) {
        nameField = legacyTextFields.find(f => f?.key === 'name') ?? null;
        if (nameField) nameField = normalizeTextField(nameField, 'name');
    }
    if (!messageField && Array.isArray(legacyTextFields)) {
        messageField = legacyTextFields.find(f => f?.key === 'message') ?? null;
        if (messageField) messageField = normalizeTextField(messageField, 'message');
    }

    // Final fallback to sensible defaults
    if (!nameField) nameField = makeFallbackNameField(canvasSize);
    if (!messageField) messageField = makeFallbackMessageField(canvasSize);

    // Center the name field on the poster so it's always visible and draggable
    const centeredNameField = getDefaultNameTextPosition(applyDesignToTextField({
        field: nameField,
        y: activeDesignLayout?.nameY,
        align: activeDesignLayout?.align,
        canvasSize,
    }), canvasSize);
    const designedMessageField = applyDesignToTextField({
        field: messageField,
        y: activeDesignLayout?.messageY,
        align: activeDesignLayout?.align,
        canvasSize,
    });

    // ── Text styles ──────────────────────────────────────────────
    const nameFontWeight = p.nameBold ? 'bold' : 'normal';
    const nameFontStyle = p.nameItalic ? 'italic' : 'normal';
    const msgFontWeight = p.messageBold ? 'bold' : 'normal';
    const msgFontStyle = p.messageItalic ? 'italic' : 'normal';
    const shadowStyle = buildTextShadow(p.textShadow);

    const nameTextStyle = {
        fontSize: p.nameFontSize ?? nameField.fontSize ?? 28,
        fontWeight: nameFontWeight,
        fontStyle: nameFontStyle,
        color: p.nameColor ?? '#FFFFFF',
        textAlign: centeredNameField?.align ?? activeDesignLayout?.align ?? nameField.align ?? p.textAlign ?? 'center',
        ...shadowStyle,
    };

    const messageTextStyle = {
        fontSize: p.messageFontSize ?? messageField.fontSize ?? 18,
        fontWeight: msgFontWeight,
        fontStyle: msgFontStyle,
        color: p.messageColor ?? '#FFFFFF',
        textAlign: activeDesignLayout?.align ?? messageField.align ?? p.textAlign ?? 'center',
        ...shadowStyle,
    };

    const renderTextLayers = (layers) => {
        if (!layers) return null;
        const context = renderContext;
        const scaleX = textFieldScale.scaleX;
        const scaleY = textFieldScale.scaleY;
        
        return layers
            .filter(layer => layer?.type === 'text')
            .map((layer, index) => {
                const savedOffset = textFieldPositions[layer.id];
                const rawText = layer.text || '';

                const isNameLayer = rawText.includes('{{headline}}') || rawText.includes('{{name}}');
                const defaultNamePos = isNameLayer ? getDefaultNameTextPosition({ x: 0, y: 0, fieldWidth: 0 }, canvasSize) : null;
                const baseX = defaultNamePos ? Math.round(defaultNamePos.x) : (layer.x || 0) * scaleX;
                const baseY = defaultNamePos ? Math.round(defaultNamePos.y) : (layer.y || 0) * scaleY;
                const align = defaultNamePos ? defaultNamePos.align : layer.align;
                const isActive = interactive && activeTextField === layer.id;

                // Resolve text content from context
                let textContent = rawText;
                if (textContent.includes('{{')) {
                    textContent = textContent.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                        const trimmedKey = key.trim();
                        if (trimmedKey === 'headline' || trimmedKey === 'name') {
                            return context?.headline || context?.name || '';
                        }
                        if (trimmedKey === 'subtext' || trimmedKey === 'message') {
                            return context?.subtext || context?.message || '';
                        }
                        return context?.[trimmedKey] || match;
                    });
                }

                if (interactive) {
                    const layerStyle = {
                        width: (layer.width || 200) * scaleX,
                        height: (layer.height || 60) * scaleY,
                    };
                    return (
                        <DraggableTextField
                            key={`${layer.id}_${index}`}
                            fieldId={layer.id}
                            text={textContent}
                            baseX={baseX}
                            baseY={baseY}
                            style={layerStyle}
                            layout={canvasSize}
                            isActive={isActive}
                            fontSize={(Number(layer.fontSize) || 24) * Math.min(scaleX, scaleY)}
                            color={layer.color}
                            fontFamily={layer.fontFamily}
                            fontWeight={layer.fontWeight}
                            textAlign={align}
                            interactionScale={interactionScale}
                        />
                    );
                } else {
                    const absX = savedOffset?.x ?? baseX;
                    const absY = savedOffset?.y ?? baseY;
                    return (
                        <Text
                            key={`${layer.id}_${index}`}
                            style={{
                                position: 'absolute',
                                left: absX,
                                top: absY,
                                width: (layer.width || 200) * scaleX,
                                height: (layer.height || 60) * scaleY,
                                color: layer.color || '#FFFFFF',
                                fontSize: (Number(layer.fontSize) || 24) * Math.min(scaleX, scaleY),
                                fontFamily: layer.fontFamily || 'Poppins',
                                fontWeight: layer.fontWeight || 'bold',
                                textAlign: align || 'center',
                            }}
                        >
                            {textContent}
                        </Text>
                    );
                }
            });
    };

    // ── Config-driven text layer renderer ────────────────────────
    const renderConfigTextLayer = ({ layer, resolvedText }) => {
        const editableRole = getTemplateEditableTextRole(layer);
        if (!editableRole) return undefined;
        if (editableRole === 'name' && !p.showName) return null;
        if (editableRole === 'message' && !p.showMessage) return null;

        const field = getConfigTextField(layer);
        const namePlaceholder = resolveI18nContent(configTextFields?.name?.content);
        const messagePlaceholder = resolveI18nContent(configTextFields?.message?.content);
        const text = editableRole === 'name'
            ? (p.userName || namePlaceholder)
            : (p.userMessage || messagePlaceholder);
        const layerFontSize = Number.isFinite(Number(layer?.fontSize)) ? Number(layer.fontSize) : 18;
        const isTemplateDesign = !activeDesignLayout;
        const textStyle = {
            fontSize: editableRole === 'name' ? (p.nameFontSize ?? layerFontSize) : (p.messageFontSize ?? layerFontSize),
            fontWeight: editableRole === 'name' ? nameFontWeight : msgFontWeight,
            fontStyle: editableRole === 'name' ? nameFontStyle : msgFontStyle,
            color: editableRole === 'name' ? (p.nameColor ?? '#FFFFFF') : (p.messageColor ?? '#FFFFFF'),
            textAlign: isTemplateDesign
                ? (layer?.align || field.align || 'left')
                : (activeDesignLayout?.align ?? p.textAlign ?? layer?.align ?? 'left'),
            fontFamily: layer?.fontFamily,
            letterSpacing: Number.isFinite(Number(layer?.letterSpacing)) ? Number(layer.letterSpacing) : undefined,
            lineHeight: Number.isFinite(Number(layer?.lineHeight)) ? Number(layer.lineHeight) : undefined,
            opacity: Number.isFinite(Number(layer?.opacity)) ? Number(layer.opacity) : 1,
            ...shadowStyle,
        };

        if (!text) return undefined;

        if (editableRole === 'name') {
            const centeredField = getDefaultNameTextPosition(applyDesignToTextField({
                field,
                y: activeDesignLayout?.nameY,
                align: activeDesignLayout?.align,
                canvasSize,
            }), canvasSize);
            const nameTextStyle = { ...textStyle, textAlign: centeredField.align ?? 'right' };
            return interactive
                ? <DraggableNameText
                    field={centeredField}
                    text={text}
                    textStyle={nameTextStyle}
                    textPosition={p.namePosition}
                    textScale={p.nameScale ?? 1}
                    setPositionAction={setNamePosition}
                    setScaleAction={setNameScale}
                    allowPinchScale={allowPinchScale}
                    interactionScale={interactionScale}
                    contentAnimationStyle={contentAnimationStyle}
                    canvasSize={canvasSize}
                    configBasePosition={{ x: Math.round(centeredField.x ?? 16), y: Math.round(centeredField.y ?? 0) }}
                    configFieldWidth={layer.width ? Math.round(layer.width * textFieldScale.scaleX) : undefined}
                    configFieldHeight={layer.height ? Math.round(layer.height * textFieldScale.scaleY) : undefined} />
                : <StaticNameText
                    field={centeredField}
                    text={text}
                    textStyle={nameTextStyle}
                    textPosition={p.namePosition}
                    textScale={p.nameScale ?? 1}
                    contentAnimationStyle={contentAnimationStyle} />;
        }

        return interactive
            ? <DraggableMessageText
                field={applyDesignToTextField({
                    field,
                    y: activeDesignLayout?.messageY,
                    align: activeDesignLayout?.align,
                    canvasSize,
                })}
                text={text}
                textStyle={textStyle}
                textPosition={p.messagePosition}
                textScale={p.messageScale ?? 1}
                setPositionAction={setMessagePosition}
                setScaleAction={setMessageScale}
                allowPinchScale={allowPinchScale}
                interactionScale={interactionScale}
                contentAnimationStyle={contentAnimationStyle}
                canvasSize={canvasSize}
                configBasePosition={{ x: Math.round((field.x ?? 16) * textFieldScale.scaleX), y: Math.round((field.y ?? 0) * textFieldScale.scaleY) }}
                configFieldWidth={layer.width ? Math.round(layer.width * textFieldScale.scaleX) : undefined}
                configFieldHeight={layer.height ? Math.round(layer.height * textFieldScale.scaleY) : undefined} />
            : <StaticMessageText
                field={applyDesignToTextField({
                    field,
                    y: activeDesignLayout?.messageY,
                    align: activeDesignLayout?.align,
                    canvasSize,
                })}
                text={text}
                textStyle={textStyle}
                textPosition={p.messagePosition}
                textScale={p.messageScale ?? 1}
                contentAnimationStyle={contentAnimationStyle} />;
    };

    // ── Helpers ───────────────────────────────────────────────────
    const resolveI18nContent = (content) => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        if (typeof content === 'object' && !Array.isArray(content)) {
            const lang = i18n.language || 'en';
            return content[lang] ?? content['en'] ?? Object.values(content)[0] ?? '';
        }
        return '';
    };

    // ── Dynamic text fields from config.textFields ──────────────
    // Renders only non-name/message fields from the object-format textFields.
    // name and message are rendered by renderConfigTextLayer via layers.
    // For array-format textFields (legacy local templates), returns null —
    // those are handled by the legacy DraggableNameText / DraggableMessageText below.
    const renderDynamicTextFields = () => {
        if (!configTextFields || typeof configTextFields !== 'object' || Array.isArray(configTextFields)) return null;
        const fieldKeys = Object.keys(configTextFields);
        if (fieldKeys.length === 0) return null;

        const scaleX = textFieldScale.scaleX;
        const scaleY = textFieldScale.scaleY;
        const uniformScale = Math.min(scaleX, scaleY);

        return fieldKeys.map(key => {
            const field = configTextFields[key];
            if (!field) return null;

            const isName = key === 'name';
            const isMessage = key === 'message';

            if (isName && p.showName === false) return null;
            if (isMessage && p.showMessage === false) return null;
            if (field.visible === false) return null;

            const pos = (typeof field.position === 'object' && field.position !== null) ? field.position : {};
            const rawFieldDef = {
                x: Math.round((pos.x ?? 16) * scaleX),
                y: Math.round((pos.y ?? 0) * scaleY),
                fieldWidth: field.width ? Math.round(field.width * scaleX) : (canvasSize.width - Math.round((pos.x ?? 16) * scaleX) * 2),
                align: field.align ?? 'center',
            };
            const fieldDef = isName
                ? { ...rawFieldDef, ...getDefaultNameTextPosition(rawFieldDef, canvasSize) }
                : rawFieldDef;

            if (isName || isMessage) {
                const up = isName ? (p.namePosition ?? { x: 0, y: 0 }) : (p.messagePosition ?? { x: 0, y: 0 });
                console.log('[' + 'renderDynamicTextFields' + '] ' + key + ':', JSON.stringify({
                    posX: pos.x,
                    posY: pos.y,
                    scaleX,
                    scaleY,
                    fieldDefX: fieldDef.x,
                    fieldDefY: fieldDef.y,
                    fieldDefWidth: fieldDef.fieldWidth,
                    canvasW: canvasSize.width,
                    canvasH: canvasSize.height,
                    fieldWidth: field.width,
                    userPositionX: up.x,
                    userPositionY: up.y,
                }));
            }

            const dyn = (isName || isMessage) ? {} : (p.dynamicTextFields?.[key] || {});
            const isDynamic = !isName && !isMessage;

            const userValue = isName ? p.userName : (isMessage ? p.userMessage : (dyn?.value ?? ''));
            const placeholderText = resolveI18nContent(field.content);
            const displayText = userValue || placeholderText || '';

            const userFontSize = isName ? p.nameFontSize : (isMessage ? p.messageFontSize : (dyn?.fontSize ?? null));
            const effectiveFontSize = Math.min(36, userFontSize != null ? Math.round(userFontSize * uniformScale) : Math.round((field.fontSize ?? 18) * uniformScale));

            const userColor = isName ? p.nameColor : (isMessage ? p.messageColor : (dyn?.color ?? null));
            const effectiveColor = userColor ?? field.color ?? '#FFFFFF';

            const isBold = isName ? p.nameBold : (isMessage ? p.messageBold : (dyn?.bold ?? false));
            const isItalic = isName ? p.nameItalic : (isMessage ? p.messageItalic : (dyn?.italic ?? false));

            const userPosition = isName ? p.namePosition : (isMessage ? p.messagePosition : (dyn?.position ?? null));
            const userScale = isName ? (p.nameScale ?? 1) : (isMessage ? (p.messageScale ?? 1) : (dyn?.scale ?? 1));

            const setPositionAction = isName ? setNamePosition : (isMessage ? setMessagePosition : null);
            const setScaleAction = isName ? setNameScale : (isMessage ? setMessageScale : null);

            const getDynamicPositionSetter = () => {
                if (!isDynamic) return undefined;
                return pos => dispatch(setDynamicTextField({ key, field: { position: pos } }));
            };
            const getDynamicScaleSetter = () => {
                if (!isDynamic) return undefined;
                return scale => dispatch(setDynamicTextField({ key, field: { scale } }));
            };

            const textStyle = {
                fontSize: effectiveFontSize,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                color: effectiveColor,
                textAlign: fieldDef.align ?? 'center',
                fontFamily: field.fontFamily,
                ...shadowStyle,
            };

            if (!displayText) return null;

            const fieldForRender = fieldDef;

            if (interactive) {
                const posAction = setPositionAction || getDynamicPositionSetter();
                const scaleAction = setScaleAction || getDynamicScaleSetter();
                if (posAction && scaleAction) {
                    return (
                        <DraggableText
                            key={key}
                            field={fieldForRender}
                            text={displayText}
                            textStyle={textStyle}
                            textPosition={userPosition}
                            textScale={userScale}
                            setPositionAction={posAction}
                            setScaleAction={scaleAction}
                            allowPinchScale={allowPinchScale}
                            interactionScale={interactionScale}
                            contentAnimationStyle={contentAnimationStyle}
                            canvasSize={canvasSize}
                            numberOfLines={isMessage ? 2 : 1}
                            configBasePosition={{ x: fieldDef.x, y: fieldDef.y }}
                            configFieldWidth={fieldDef.fieldWidth}
                            configFieldHeight={field.height ? Math.round(field.height * scaleY) : undefined}
                        />
                    );
                }
            }

            return (
                <StaticText
                    key={key}
                    field={fieldForRender}
                    text={displayText}
                    textStyle={textStyle}
                    textPosition={userPosition}
                    textScale={userScale}
                    contentAnimationStyle={contentAnimationStyle}
                    numberOfLines={isMessage ? 2 : 1}
                />
            );
        });
    };

    // ── Photo layer ──────────────────────────────────────────────
    const basePhotoFrameStyle = getPhotoFrameBaseStyle({
        photoFrame,
        photoShape: p.photoShape ?? 'template',
        canvasSize,
    }) ?? getCenteredFallbackPhotoFrameStyle({ canvasSize, photoShape: p.photoShape ?? 'template' });

    const designedPhotoFrame = getDefaultPhotoFramePosition(applyDesignToFrame({
        frameStyle: basePhotoFrameStyle,
        layout: activeDesignLayout,
        canvasSize,
    }), canvasSize);

    const photoLayerNode = (designedPhotoFrame || displayPhotoUri)
        ? (
            interactive
                ? <DraggablePhoto
                    frameStyle={designedPhotoFrame}
                    photoUri={displayPhotoUri}
                    photoAnimation={p.userPhotoAnimation}
                    canvasSize={canvasSize}
                    accentColor={accentColor}
                    photoShape={p.photoShape ?? 'template'}
                    photoScale={p.photoScale ?? 1}
                    enablePhotoAnimation={enablePhotoAnimation}
                    allowPinchScale={allowPinchScale}
                    interactionScale={interactionScale}
                    configAnimation={photoFrameAnimationConfig} />
                : <StaticPhoto
                    frameStyle={designedPhotoFrame}
                    photoUri={displayPhotoUri}
                    photoPosition={p.photoPosition ?? { x: 0, y: 0 }}
                    photoAnimation={p.userPhotoAnimation}
                    canvasSize={canvasSize}
                    photoShape={p.photoShape ?? 'template'}
                    enablePhotoAnimation={enablePhotoAnimation}
                    photoScale={p.photoScale ?? 1}
                    configAnimation={photoFrameAnimationConfig} />
        )
        : null;

    const renderConfigUserPhotoLayer = ({ layer, layerStyle }) => {
        const configPhotoFrameStyle = getConfigPhotoFrameStyle({
            layer,
            layerStyle,
            photoShape: p.photoShape ?? 'template',
        });
        const designedConfigFrameStyle = getDefaultPhotoFramePosition(applyDesignToFrame({
            frameStyle: configPhotoFrameStyle,
            layout: activeDesignLayout,
            canvasSize,
        }), canvasSize);
        const resizeMode = layer?.resizeMode ?? 'cover';
        return interactive
            ? <DraggablePhoto
                frameStyle={designedConfigFrameStyle}
                photoUri={displayPhotoUri}
                photoAnimation={p.userPhotoAnimation}
                canvasSize={canvasSize}
                accentColor={accentColor}
                photoShape={p.photoShape ?? 'template'}
                photoScale={p.photoScale ?? 1}
                enablePhotoAnimation={enablePhotoAnimation}
                allowPinchScale={allowPinchScale}
                interactionScale={interactionScale}
                resizeMode={resizeMode}
                configAnimation={photoFrameAnimationConfig} />
            : <StaticPhoto
                frameStyle={designedConfigFrameStyle}
                photoUri={displayPhotoUri}
                photoPosition={p.photoPosition ?? { x: 0, y: 0 }}
                photoAnimation={p.userPhotoAnimation}
                canvasSize={canvasSize}
                photoShape={p.photoShape ?? 'template'}
                enablePhotoAnimation={enablePhotoAnimation}
                photoScale={p.photoScale ?? 1}
                resizeMode={resizeMode}
                configAnimation={photoFrameAnimationConfig} />;
    };

    // ── The display text (with guaranteed fallback) ──────────────
    const displayName = p.userName || '';
    const displayMessage = p.userMessage || '';

    return (
        <View
            ref={posterRef}
            style={[styles.composition, {
                width: compositionSize.width,
                height: compositionSize.height,
            }]}
            collapsable={false}>
            <PremiumPosterDetailsFrame
                details={premiumDetails}
                canvasSize={canvasSize}
                layoutIndex={p.designLayoutIndex}
                topHeight={compositionSize.topBandHeight}
                bottomHeight={compositionSize.bottomBandHeight}
            />

            <View style={[styles.poster, {
                backgroundColor,
                width: canvasSize.width,
                height: canvasSize.height,
                top: compositionSize.posterTop,
            }]}>

            {/* ── 0. Template media (image / video) ── */}
            {hasTemplateMedia ? (
                <TemplateMedia
                    template={selectedTemplate}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    shouldPlay={playVideo}
                    muted={mediaMuted}
                    onAudioAvailabilityChange={onMediaAudioStateChange}
                    onVideoLoad={onVideoLoad}
                    useImageFallbackForVideo={preferStillImageForVideo}
                />
            ) : null}

            {/* ── 1. Fallback colour header / left-bar (non-config, no media) ── */}
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

            {/* ── 2. Background overlay ── */}
            {(() => {
                const overlay = getTemplateBackgroundOverlay(selectedTemplate);
                const overlayColor = p.bgOverlayColor ?? overlay?.color ?? null;
                const overlayOpacity = p.bgOverlayOpacity ?? overlay?.opacity ?? 0.3;
                const overlayEnabled = overlay?.enabled !== false;
                if (!overlayColor || !overlayEnabled) return null;
                return (
                    <View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, {
                            backgroundColor: overlayColor,
                            opacity: overlayOpacity,
                        }]}
                    />
                );
            })()}

            {/* ── 3. Photo + text layers ── */}
            {isConfigDriven ? (
                <>
                    <ConfiguredTemplateLayers
                        template={selectedTemplate}
                        context={renderContext}
                        skipBackgroundLayers={hasTemplateMedia}
                        renderUserPhotoLayer={renderConfigUserPhotoLayer}
                        renderTextLayer={() => null}
                    />
                    {renderTextLayers(selectedTemplate?.config_json?.layers || selectedTemplate?.config?.layers)}
                </>
            ) : photoLayerNode}

            {/* ── 4. All text fields from config.textFields (name, message, extras) ── */}
            {renderDynamicTextFields()}

            {/* ── 5. Legacy name text (only used when no object-format textFields and no layers) ── */}
            {!hasObjectFormatTextFields && !isConfigDriven && p.showName && !!displayName && (
                interactive
                    ? <DraggableNameText
                        field={centeredNameField}
                        text={displayName}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition}
                        textScale={p.nameScale ?? 1}
                        setPositionAction={setNamePosition}
                        setScaleAction={setNameScale}
                        allowPinchScale={allowPinchScale}
                        interactionScale={interactionScale}
                        contentAnimationStyle={contentAnimationStyle}
                        canvasSize={canvasSize}
                        configBasePosition={{ x: Math.round(centeredNameField.x ?? 16), y: Math.round(centeredNameField.y ?? 0) }}
                        configFieldWidth={centeredNameField.fieldWidth ? Math.round(centeredNameField.fieldWidth) : undefined}
                        configFieldHeight={nameField?.height ? Math.round(nameField.height * textFieldScale.scaleY) : undefined} />
                    : <StaticNameText
                        field={centeredNameField}
                        text={displayName}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition}
                        textScale={p.nameScale ?? 1}
                        contentAnimationStyle={contentAnimationStyle} />
            )}

            {/* ── 6. Legacy message text (only used when no object-format textFields and no layers) ── */}
            {!hasObjectFormatTextFields && !isConfigDriven && p.showMessage && !!displayMessage && (
                interactive
                    ? <DraggableMessageText
                        field={designedMessageField}
                        text={displayMessage}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition}
                        textScale={p.messageScale ?? 1}
                        setPositionAction={setMessagePosition}
                        setScaleAction={setMessageScale}
                        allowPinchScale={allowPinchScale}
                        interactionScale={interactionScale}
                        contentAnimationStyle={contentAnimationStyle}
                        canvasSize={canvasSize}
                        configBasePosition={{ x: Math.round((messageField?.x ?? 16) * textFieldScale.scaleX), y: Math.round((messageField?.y ?? 0) * textFieldScale.scaleY) }}
                        configFieldWidth={messageField?.fieldWidth ? Math.round(messageField.fieldWidth * textFieldScale.scaleX) : undefined}
                        configFieldHeight={messageField?.height ? Math.round(messageField.height * textFieldScale.scaleY) : undefined} />
                    : <StaticMessageText
                        field={designedMessageField}
                        text={displayMessage}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition}
                        textScale={p.messageScale ?? 1}
                        contentAnimationStyle={contentAnimationStyle} />
            )}

            {(p.selectedTags || []).length > 0 ? (
                <View style={[styles.tagRibbon, {
                    top: Math.round(canvasSize.height * 0.82),
                    left: canvasSize.width * 0.06,
                    right: canvasSize.width * 0.06,
                }]} pointerEvents="none">
                    {(p.selectedTags || []).slice(0, 3).map(tag => (
                        <Text key={tag} style={styles.tagPill}>{tag}</Text>
                    ))}
                </View>
            ) : null}

            {/* ── 6. Stickers ── */}
            {(p.stickers ?? []).map(sticker => (
                <DraggableSticker
                    key={sticker.id}
                    sticker={sticker}
                    interactive={interactive}
                    interactionScale={interactionScale}
                />
            ))}

            {/* ── 7. Footer watermark (non-config only) ── */}
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
        </View>
    );
};

const styles = StyleSheet.create({
    composition: {
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#FFFFFF',
    },
    poster: {
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        overflow: 'hidden',
        position: 'absolute',
        left: 0,
    },
    header: {
        height: POSTER_SIZE.height * 0.48,
        width: '100%',
        overflow: 'hidden',
    },
    leftBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: POSTER_SIZE.width * 0.42,
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
    tagRibbon: {
        position: 'absolute',
        zIndex: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
    },
    tagPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)',
        color: '#111827',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
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
    premiumTopBand: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    premiumTopContent: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    premiumLogo: {
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        borderWidth: 1.5,
        borderColor: '#D9E2F2',
    },
    premiumTitleWrap: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    premiumName: {
        width: '100%',
        fontSize: 26,
        lineHeight: 32,
        color: '#111827',
        fontWeight: '800',
    },
    premiumDescription: {
        width: '100%',
        marginTop: 2,
        fontSize: 16,
        lineHeight: 18,
        color: '#4B5563',
        fontWeight: '500',
    },
    premiumBottomBand: {
        position: 'absolute',
        left: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    premiumContactGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 3,
    },
    premiumContactItem: {
        minWidth: '44%',
        maxWidth: '48%',
        minHeight: 26,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    premiumContactIcon: {
        fontSize: 14,
        color: '#0D62DF',
    },
    premiumContactText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 15,
        color: '#111827',
        fontWeight: '600',
    },
});

export default PosterPreview;
