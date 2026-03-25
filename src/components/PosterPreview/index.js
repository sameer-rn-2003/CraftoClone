import React, { useRef } from 'react';
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
    getScaledPhotoFrameStyle,
} from '../../utils/photoFrameLayout';

const getTouchDistance = touches => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
};

const MIN_TEXT_SCALE = 0.25;
const MAX_TEXT_SCALE = 3.0;

const DiagonalPattern = ({ color }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
            <View key={i} style={{
                position: 'absolute', height: 28,
                width: POSTER_SIZE.width * 2, top: -40 + i * 55, left: -60,
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

const WavesPattern = ({ color }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
            <View key={i} style={{
                position: 'absolute', height: 60,
                width: POSTER_SIZE.width + 60, left: -30, top: i * 100 - 20,
                borderRadius: 30, borderWidth: 2, borderColor: color + '25',
                transform: [{ rotate: '-8deg' }]
            }} />
        ))}
    </View>
);

const PatternLayer = ({ pattern, accentColor }) => {
    switch (pattern) {
        case 'diagonal': return <DiagonalPattern color={accentColor} />;
        case 'circles': return <CirclesPattern color={accentColor} />;
        case 'dots': return <DotsPattern color={accentColor} />;
        case 'waves': return <WavesPattern color={accentColor} />;
        default: return null;
    }
};

const DraggablePhoto = ({ photoFrame, photoUri, accentColor, photoShape, photoScale, allowPinchScale = true }) => {
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
                    Animated.event(
                        [null, { dx: pan.x, dy: pan.y }],
                        { useNativeDriver: false },
                    )(evt, gesture);
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
                    const next = {
                        x: committed.current.x + gesture.dx,
                        y: committed.current.y + gesture.dy,
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


    const frameBaseStyle = getPhotoFrameBaseStyle({ photoFrame, photoShape });

    return (
        <Animated.View
            style={[
                styles.photoWrapper,
                {
                    ...frameBaseStyle,
                    // scale + translate are both in transform — this keeps the
                    // pinch centered and the drag offset applied together
                    transform: [
                        { scale: scaleAnim },
                        ...pan.getTranslateTransform(),
                    ],
                },
            ]}
            {...panResponder.panHandlers}>

            {photoUri
                ? <Image key={photoUri} source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
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

const StaticPhoto = ({ photoFrame, photoUri, photoPosition, photoShape, photoScale }) => {
    const frameStyle = getScaledPhotoFrameStyle({
        photoFrame,
        posterLayout: {
            scaleX: 1,
            scaleY: 1,
            offsetX: 0,
            offsetY: 0,
        },
        photoPosition,
        photoScale,
        photoShape,
    });

    return (
        <View style={[styles.photoWrapper, frameStyle]}>
            {photoUri
                ? <Image key={photoUri} source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                : <View style={styles.photoPlaceholder}>
                    <MaterialCommunityIcons name="account-outline" style={styles.placeholderIcon} />
                </View>}
        </View>
    );
};

const DraggableSticker = ({ sticker, interactive }) => {
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
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: (_, g) => {
                pan.flattenOffset();
                const next = { x: committed.current.x + g.dx, y: committed.current.y + g.dy };
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
                    Animated.event(
                        [null, { dx: pan.x, dy: pan.y }],
                        { useNativeDriver: false },
                    )(evt, gesture);
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
                        x: committed.current.x + gesture.dx,
                        y: committed.current.y + gesture.dy,
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

const PosterPreview = ({ posterRef, interactive = false, allowPinchScale = interactive }) => {
    const p = useSelector(s => s.poster);
    const { t } = useTranslation();

    if (!p.selectedTemplate) return null;

    const selectedTemplate = p.selectedTemplate;
    const {
        backgroundColor, accentColor: templateAccent, headerColor,
        footerColor, pattern, photoFrame, textFields,
        layout = 'top',
    } = selectedTemplate;
    const templateImage = selectedTemplate.Image;


    const accentColor = p.accentColorOverride || templateAccent;
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

    return (
        <View
            ref={posterRef}
            style={[styles.poster, { backgroundColor }]}
            collapsable={false}>

            {/* ── 0. Template Image (optional) ─────────── */}
            {templateImage ? (
                <Image
                    source={templateImage}
                    style={{height:"100%", width:"100%"}}
                    resizeMode="cover"
                />
            ) : null}

            {!templateImage ? (
                layout === 'left' ? (
                    // Vertical coloured bar on the left ~40% of width
                    <View style={[styles.leftBar, { backgroundColor: headerColor }]}>
                        <PatternLayer pattern={pattern} accentColor={accentColor} />
                        <View style={[styles.leftBarAccent, { backgroundColor: accentColor }]} />
                    </View>
                ) : (
                    // Default top header band
                    <View style={[styles.header, { backgroundColor: headerColor }]}>
                        <PatternLayer pattern={pattern} accentColor={accentColor} />
                        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
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

            {interactive
                ? <DraggablePhoto
                    photoFrame={photoFrame}
                    photoUri={p.userPhoto}
                    accentColor={accentColor}
                    photoShape={p.photoShape ?? 'template'}
                    photoScale={p.photoScale ?? 1}
                    allowPinchScale={allowPinchScale} />
                : <StaticPhoto
                    photoFrame={photoFrame}
                    photoUri={p.userPhoto}
                    photoPosition={p.photoPosition ?? { x: 0, y: 0 }}
                    photoShape={p.photoShape ?? 'template'}
                    photoScale={p.photoScale ?? 1} />}


            {p.showName && nameField && (
                interactive
                    ? <DraggableNameText
                        field={nameField}
                        text={p.userName || nameField.label}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition ?? { x: 0, y: 0 }}
                        textScale={p.nameScale ?? 1}
                        setPositionAction={setNamePosition}
                        setScaleAction={setNameScale}
                        allowPinchScale={allowPinchScale} />
                    : <StaticNameText
                        field={nameField}
                        text={p.userName || nameField.label}
                        textStyle={nameTextStyle}
                        textPosition={p.namePosition ?? { x: 0, y: 50 }}
                        textScale={p.nameScale ?? 1} />
            )}

            {/* ── 4. Message (hidden if showMessage=false) ── */}
            {p.showMessage && messageField && (
                interactive
                    ? <DraggableMessageText
                        field={messageField}
                        text={p.userMessage || messageField.label}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                        textScale={p.messageScale ?? 1}
                        setPositionAction={setMessagePosition}
                        setScaleAction={setMessageScale}
                        allowPinchScale={allowPinchScale} />
                    : <StaticMessageText
                        field={messageField}
                        text={p.userMessage || messageField.label}
                        textStyle={messageTextStyle}
                        textPosition={p.messagePosition ?? { x: 0, y: 0 }}
                        textScale={p.messageScale ?? 1} />
            )}

            {/* ── 5. Stickers ──────────────────────────── */}
            {(p.stickers ?? []).map(sticker => (
                <DraggableSticker key={sticker.id} sticker={sticker} interactive={interactive} />
            ))}

            {/* ── 6. Footer ─────────────────────────────── */}
            <View style={[styles.footer, { backgroundColor: footerColor }]}>
                <Text style={styles.watermark}>{t('poster.watermark')}</Text>
            </View>
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

