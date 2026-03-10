// src/screens/EditorScreen/index.js
// Full-featured Crafto-style poster editor with 4 customisation tabs:
//   📸 Photo  — upload photo, drag hint
//   ✏️ Text   — name/message, colour, size slider, bold/italic, shadow, align
//   🎨 Style  — photo frame shape, accent colour, background overlay
//   😀 Stickers — tap to add emoji, drag to reposition, tap to delete

import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    setUserName, setUserMessage,
    setNameColor, setMessageColor,
    setNameFontSize, setMessageFontSize,
    setNameBold, setNameItalic,
    setMessageBold, setMessageItalic,
    setTextAlign, setTextShadow, setShowName, setShowMessage,
    setPhotoShape, setAccentColorOverride,
    setBgOverlayColor, setBgOverlayOpacity,
    addSticker, removeSticker,
    setPhotoScale,
} from '../../store/posterSlice';
import useImagePicker from '../../hooks/useImagePicker';
import PosterPreview from '../../components/PosterPreview';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import BackendMediaPicker from '../../components/BackendMediaPicker';
import {
    COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOW, POSTER_SIZE,
} from '../../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const SCALE = (SCREEN_W - SPACING.base * 2) / POSTER_SIZE.width;
const PREVIEW_W = POSTER_SIZE.width * SCALE;
const PREVIEW_H = POSTER_SIZE.height * SCALE;

// ─── Constants ────────────────────────────────────────────────────

const COLOUR_PALETTE = [
    '#FFFFFF', '#FFD700', '#FF6584', '#FF416C',
    '#43E97B', '#2F80ED', '#7C6FFF', '#F7971E',
    '#00C9FF', '#FC466B', '#3F5EFB', '#11998E',
    '#EB3349', '#00B09B', '#4A00E0', '#000000',
];

const ACCENT_PALETTE = [
    '#7C6FFF', '#FF416C', '#F7971E', '#FFD200',
    '#43E97B', '#2F80ED', '#FC466B', '#00C9FF',
    '#FF6584', '#4A00E0', '#11998E', '#EB3349',
];

const PHOTO_SHAPES = [
    { id: 'template', label: 'Default', icon: '⬡' },
    { id: 'circle', label: 'Circle', icon: '●' },
    { id: 'rounded', label: 'Rounded', icon: '▣' },
    { id: 'square', label: 'Square', icon: '■' },
];

const BG_OVERLAYS = [
    { label: 'None', value: null },
    { label: 'Dark ½', value: 'rgba(0,0,0,0.5)' },
    { label: 'Dark ¼', value: 'rgba(0,0,0,0.25)' },
    { label: 'Light', value: 'rgba(255,255,255,0.15)' },
    { label: 'Blue', value: 'rgba(44,83,255,0.4)' },
    { label: 'Red', value: 'rgba(255,65,108,0.4)' },
];

const STICKER_ROWS = [
    ['🎉', '🎊', '⭐', '🔥', '❤️', '💯', '✨', '🙏'],
    ['🌟', '🏆', '👑', '💎', '🎯', '🚀', '💪', '🎨'],
    ['🌹', '🌺', '🦋', '🌈', '☀️', '🌙', '⚡', '🔮'],
    ['🇮🇳', '🏛️', '🎂', '💼', '📢', '✊', '🤝', '📸'],
];

const SCALE_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SCALE_LABELS = ['50%', '75%', '100%', '125%', '150%', '200%'];
const SIZE_PRESETS = [12, 16, 20, 24, 28, 32, 36];

const TABS = [
    { id: 'photo', icon: '📸', label: 'Photo' },
    { id: 'text', icon: '✏️', label: 'Text' },
    { id: 'style', icon: '🎨', label: 'Style' },
    { id: 'stickers', icon: '😀', label: 'Stickers' },
];

// ─── Small reusable atoms ─────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <View style={s.sectionLabelRow}>
        <View style={s.sectionLabelLine} />
        <Text style={s.sectionLabelText}>{children}</Text>
        <View style={s.sectionLabelLine} />
    </View>
);

const RowLabel = ({ children }) => <Text style={s.rowLabel}>{children}</Text>;

const ColourSwatch = ({ color, active, onPress }) => (
    <Pressable
        onPress={onPress}
        style={[s.swatch, { backgroundColor: color },
        active && s.swatchActive,
        color === '#FFFFFF' && s.swatchBordered]}>
        {active && <Text style={{ fontSize: 10, color: color === '#FFFFFF' ? '#000' : '#fff' }}>✓</Text>}
    </Pressable>
);

const SizeBtn = ({ size, active, onPress }) => (
    <Pressable onPress={onPress}
        style={[s.sizeBtn, active && s.sizeBtnActive]}>
        <Text style={[s.sizeBtnText, active && s.sizeBtnTextActive]}>{size}</Text>
    </Pressable>
);

const StyleToggle = ({ label, active, onPress }) => (
    <Pressable onPress={onPress}
        style={[s.styleToggle, active && s.styleToggleActive]}>
        <Text style={[s.styleToggleText, active && s.styleToggleTextActive]}>{label}</Text>
    </Pressable>
);

const AlignBtn = ({ icon, label, value, current, onPress }) => (
    <Pressable onPress={() => onPress(value)}
        style={[s.alignBtn, current === value && s.alignBtnActive]}>
        <Text style={[s.alignIcon, current === value && s.alignIconActive]}>{icon}</Text>
        {label && <Text style={[s.alignLabel, current === value && s.alignLabelActive]}>{label}</Text>}
    </Pressable>
);

// ─── Tab panels ───────────────────────────────────────────────────

const PhotoTab = ({ onPickImage, pickingImage, userPhoto, photoScale, onScaleChange }) => (
    <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: SPACING.md }}>

            {/* ── SECTION: Device gallery ──── */}
            <View style={s.photoSourceCard}>
                <View style={s.photoSourceHeader}>
                    <Text style={s.photoSourceIcon}>📱</Text>
                    <View>
                        <Text style={s.photoSourceTitle}>From Device</Text>
                        <Text style={s.photoSourceSub}>Your camera roll</Text>
                    </View>
                </View>

                {/* Upload button */}
                <Pressable style={[s.uploadBtn, userPhoto && s.uploadBtnActive]} onPress={onPickImage}>
                    <View style={[s.uploadIconWrapper, userPhoto && s.uploadIconWrapperActive]}>
                        <Text style={s.uploadIcon}>{userPhoto ? '✅' : '📷'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.uploadLabel, userPhoto && { color: COLORS.primaryLight }]}>
                            {pickingImage ? 'Selecting…' : userPhoto ? 'Change Photo' : 'Upload Photo'}
                        </Text>
                        <Text style={s.uploadSub}>
                            {userPhoto ? 'Tap to replace' : 'JPG, PNG supported'}
                        </Text>
                    </View>
                    <Text style={s.uploadChevron}>›</Text>
                </Pressable>

                {/* Drag hint */}
                {userPhoto && (
                    <View style={s.hintCard}>
                        <Text style={s.hintIcon}>✋</Text>
                        <Text style={s.hintText}>
                            Drag the photo on the poster above to reposition it!
                        </Text>
                    </View>
                )}
            </View>

            {/* ── SECTION: Photo resize ──────── */}
            <View style={s.resizeSection}>
                <SectionLabel>Photo Size</SectionLabel>

                <View style={s.scaleRow}>
                    <Pressable
                        style={s.scaleBtn}
                        onPress={() => onScaleChange(Math.max(0.25, +(photoScale - 0.05).toFixed(2)))}>
                        <Text style={s.scaleBtnText}>−</Text>
                    </Pressable>

                    <View style={s.scaleDisplay}>
                        <Text style={s.scaleValue}>{Math.round(photoScale * 100)}%</Text>
                        <Text style={s.scaleHint}>pinch to fine-tune</Text>
                    </View>

                    <Pressable
                        style={s.scaleBtn}
                        onPress={() => onScaleChange(Math.min(3.0, +(photoScale + 0.05).toFixed(2)))}>
                        <Text style={s.scaleBtnText}>+</Text>
                    </Pressable>
                </View>

                <View style={s.presetRow}>
                    {SCALE_PRESETS.map((sc, i) => {
                        const active = Math.abs(photoScale - sc) < 0.01;
                        return (
                            <Pressable key={sc} style={[s.presetChip, active && s.presetChipActive]}
                                onPress={() => onScaleChange(sc)}>
                                <Text style={[s.presetChipText, active && s.presetChipTextActive]}>
                                    {SCALE_LABELS[i]}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* ── SECTION: Backend media ────── */}
            <View style={s.photoSourceCard}>
                <View style={s.photoSourceHeader}>
                    <Text style={s.photoSourceIcon}>☁️</Text>
                    <View>
                        <Text style={s.photoSourceTitle}>From Backend</Text>
                        <Text style={s.photoSourceSub}>Templates from your server</Text>
                    </View>
                </View>
                <BackendMediaPicker />
            </View>

        </View>
    </ScrollView>
);

const TextTab = ({ p, dispatch }) => {
    const nameActive = idx => (p.nameFontSize ?? 26) === SIZE_PRESETS[idx];
    const msgActive = idx => (p.messageFontSize ?? 14) === SIZE_PRESETS[idx];

    return (
        <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── SHOW / HIDE NAME ────────────────── */}
            <View style={s.visibilityRow}>
                <View style={s.visibilityLeft}>
                    <Text style={s.visibilityLabel}>Show Name</Text>
                    <Text style={s.visibilityHint}>
                        {p.showName ? '● Visible on poster' : '○ Hidden from poster'}
                    </Text>
                </View>
                <Switch
                    value={p.showName}
                    onValueChange={v => dispatch(setShowName(v))}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                />
            </View>

            {p.showName && (
                <>
                    <AppTextInput label="Name" value={p.userName}
                        onChangeText={v => dispatch(setUserName(v))} placeholder="Your name" maxLength={40} />

                    <RowLabel>Name Colour</RowLabel>
                    <View style={s.paletteRow}>
                        {COLOUR_PALETTE.map(c => (
                            <ColourSwatch key={c} color={c} active={p.nameColor === c}
                                onPress={() => dispatch(setNameColor(p.nameColor === c ? null : c))} />
                        ))}
                    </View>

                    <RowLabel>Name Size</RowLabel>
                    <View style={s.sizeRow}>
                        {SIZE_PRESETS.map((sz, i) => (
                            <SizeBtn key={sz} size={sz} active={nameActive(i)}
                                onPress={() => dispatch(setNameFontSize(nameActive(i) ? null : sz))} />
                        ))}
                    </View>

                    <RowLabel>Name Style</RowLabel>
                    <View style={s.toggleRow}>
                        <StyleToggle label="B" active={p.nameBold} onPress={() => dispatch(setNameBold(!p.nameBold))} />
                        <StyleToggle label="I" active={p.nameItalic} onPress={() => dispatch(setNameItalic(!p.nameItalic))} />
                    </View>
                </>
            )}

            <View style={s.divider} />

            {/* ── SHOW / HIDE MESSAGE ──────────────── */}
            <View style={s.visibilityRow}>
                <View style={s.visibilityLeft}>
                    <Text style={s.visibilityLabel}>Show Message</Text>
                    <Text style={s.visibilityHint}>
                        {p.showMessage ? '● Visible on poster' : '○ Hidden from poster'}
                    </Text>
                </View>
                <Switch
                    value={p.showMessage}
                    onValueChange={v => dispatch(setShowMessage(v))}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                />
            </View>

            {p.showMessage && (
                <>
                    <AppTextInput label="Message" value={p.userMessage}
                        onChangeText={v => dispatch(setUserMessage(v))}
                        placeholder="Your message / tagline" multiline maxLength={100} />

                    <RowLabel>Message Colour</RowLabel>
                    <View style={s.paletteRow}>
                        {COLOUR_PALETTE.map(c => (
                            <ColourSwatch key={c} color={c} active={p.messageColor === c}
                                onPress={() => dispatch(setMessageColor(p.messageColor === c ? null : c))} />
                        ))}
                    </View>

                    <RowLabel>Message Size</RowLabel>
                    <View style={s.sizeRow}>
                        {SIZE_PRESETS.map((sz, i) => (
                            <SizeBtn key={sz} size={sz} active={msgActive(i)}
                                onPress={() => dispatch(setMessageFontSize(msgActive(i) ? null : sz))} />
                        ))}
                    </View>

                    <RowLabel>Message Style</RowLabel>
                    <View style={s.toggleRow}>
                        <StyleToggle label="B" active={p.messageBold} onPress={() => dispatch(setMessageBold(!p.messageBold))} />
                        <StyleToggle label="I" active={p.messageItalic} onPress={() => dispatch(setMessageItalic(!p.messageItalic))} />
                    </View>
                </>
            )}

            <View style={s.divider} />

            {/* ── TEXT ALIGNMENT + SHADOW ── */}
            <RowLabel>Alignment</RowLabel>
            <View style={s.toggleRow}>
                <AlignBtn icon="⬛◻◻" label="Left" value="left" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
                <AlignBtn icon="◻⬛◻" label="Center" value="center" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
                <AlignBtn icon="◻◻⬛" label="Right" value="right" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
            </View>

            <View style={s.switchRow}>
                <View>
                    <Text style={s.switchLabel}>Text Shadow</Text>
                    <Text style={s.switchSub}>Adds depth to text</Text>
                </View>
                <Switch
                    value={p.textShadow}
                    onValueChange={v => dispatch(setTextShadow(v))}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                />
            </View>

            <View style={{ height: SPACING.xxl }} />
        </ScrollView>
    );
};

const StyleTab = ({ p, dispatch }) => (
    <ScrollView showsVerticalScrollIndicator={false}>
        <SectionLabel>Photo Frame</SectionLabel>
        <View style={s.shapeRow}>
            {PHOTO_SHAPES.map(sh => (
                <Pressable key={sh.id} onPress={() => dispatch(setPhotoShape(sh.id))}
                    style={[s.shapeBtn, p.photoShape === sh.id && s.shapeBtnActive]}>
                    <Text style={s.shapeIcon}>{sh.icon}</Text>
                    <Text style={[s.shapeLabel, p.photoShape === sh.id && s.shapeLabelActive]}>
                        {sh.label}
                    </Text>
                </Pressable>
            ))}
        </View>

        <View style={s.divider} />

        <SectionLabel>Accent Colour</SectionLabel>
        <View style={s.paletteRow}>
            <Pressable onPress={() => dispatch(setAccentColorOverride(null))}
                style={[s.swatch, s.resetSwatch, !p.accentColorOverride && s.swatchActive]}>
                <Text style={{ fontSize: 8, color: COLORS.textMuted }}>AUTO</Text>
            </Pressable>
            {ACCENT_PALETTE.map(c => (
                <ColourSwatch key={c} color={c} active={p.accentColorOverride === c}
                    onPress={() => dispatch(setAccentColorOverride(p.accentColorOverride === c ? null : c))} />
            ))}
        </View>

        <View style={s.divider} />

        <SectionLabel>Background Overlay</SectionLabel>
        <View style={s.overlayRow}>
            {BG_OVERLAYS.map(o => (
                <Pressable key={o.label} onPress={() => dispatch(setBgOverlayColor(o.value))}
                    style={[s.overlayBtn, p.bgOverlayColor === o.value && s.overlayBtnActive]}>
                    <Text style={[s.overlayLabel, p.bgOverlayColor === o.value && s.overlayLabelActive]}>
                        {o.label}
                    </Text>
                </Pressable>
            ))}
        </View>

        <View style={{ height: SPACING.xxl }} />
    </ScrollView>
);

const StickersTab = ({ stickers, dispatch }) => (
    <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.stickerHintCard}>
            <Text style={s.stickerHintIcon}>💡</Text>
            <Text style={s.stickerHint}>Tap to place on poster • Drag to reposition • Tap again to remove</Text>
        </View>
        {STICKER_ROWS.map((row, ri) => (
            <View key={ri} style={s.stickerRow}>
                {row.map(emoji => {
                    const inPoster = stickers.find(x => x.emoji === emoji);
                    return (
                        <Pressable key={emoji}
                            style={[s.stickerCell, inPoster && s.stickerCellActive]}
                            onPress={() => {
                                if (inPoster) {
                                    dispatch(removeSticker(inPoster.id));
                                } else {
                                    dispatch(addSticker({ emoji }));
                                }
                            }}>
                            <Text style={s.stickerCellEmoji}>{emoji}</Text>
                            {inPoster && <View style={s.stickerCheckDot} />}
                        </Pressable>
                    );
                })}
            </View>
        ))}

        {stickers.length > 0 && (
            <View style={{ marginTop: SPACING.md }}>
                <RowLabel>Added stickers — drag on poster to reposition</RowLabel>
                <View style={s.activeStickers}>
                    {stickers.map(stk => (
                        <Pressable key={stk.id} style={s.activeStickerPill}
                            onPress={() => dispatch(removeSticker(stk.id))}>
                            <Text style={{ fontSize: 22 }}>{stk.emoji}</Text>
                            <Text style={s.removeStickerX}>✕</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        )}

        <View style={{ height: SPACING.xxl }} />
    </ScrollView>
);

// ─── EditorScreen ─────────────────────────────────────────────────

const EditorScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const p = useSelector(state => state.poster);
    const { pickImage, loading: pickingImage } = useImagePicker();
    const [activeTab, setActiveTab] = useState('photo');

    const handlePreview = useCallback(() => {
        if (!p.userPhoto) {
            Alert.alert('No Photo', 'Upload a photo first to preview your poster.', [{ text: 'OK' }]);
            return;
        }
        navigation.navigate('PreviewScreen');
    }, [p.userPhoto, navigation]);

    const renderPanel = () => {
        switch (activeTab) {
            case 'photo': return <PhotoTab onPickImage={pickImage} pickingImage={pickingImage}
                userPhoto={p.userPhoto} photoScale={p.photoScale}
                onScaleChange={scale => dispatch(setPhotoScale(scale))} />;
            case 'text': return <TextTab p={p} dispatch={dispatch} />;
            case 'style': return <StyleTab p={p} dispatch={dispatch} />;
            case 'stickers': return <StickersTab stickers={p.stickers} dispatch={dispatch} />;
            default: return null;
        }
    };

    return (
        <SafeAreaView style={s.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* ── Header ──────────────────────────────── */}
            <View style={s.header}>
                <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.backIcon}>←</Text>
                </Pressable>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>Edit Poster</Text>
                </View>
                <Pressable style={s.previewBtn} onPress={handlePreview}>
                    <Text style={s.previewBtnIcon}>✨</Text>
                    <Text style={s.previewBtnText}>Preview</Text>
                </Pressable>
            </View>

            {/* ── Poster preview ─────────────────────── */}
            <View style={s.posterContainer}>
                <View style={s.posterShadowRing} />
                <View style={s.posterClip}>
                    <View style={s.posterScaler}>
                        <PosterPreview interactive />
                    </View>
                </View>
            </View>

            {/* ── Premium Tab bar ─────────────────────── */}
            <View style={s.tabBarWrapper}>
                <View style={s.tabBar}>
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <Pressable
                                key={tab.id}
                                style={[s.tab, isActive && s.tabActive]}
                                onPress={() => setActiveTab(tab.id)}>
                                <Text style={[s.tabIcon, isActive && s.tabIconActive]}>{tab.icon}</Text>
                                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                                {isActive && <View style={s.tabIndicator} />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* ── Panel ────────────────────────────────── */}
            <KeyboardAvoidingView
                style={s.panel}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={s.panelInner}>
                    {renderPanel()}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    backIcon: { fontSize: 18, color: COLORS.text },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 3,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        ...SHADOW.small,
    },
    previewBtnIcon: { fontSize: 13 },
    previewBtnText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
        color: COLORS.white,
    },

    // Poster preview
    posterContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        position: 'relative',
    },
    posterShadowRing: {
        position: 'absolute',
        width: PREVIEW_W + 20,
        height: PREVIEW_H + 20,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '0A',
        top: SPACING.sm - 10,
    },
    posterClip: {
        width: PREVIEW_W, height: PREVIEW_H,
        borderRadius: 16, overflow: 'hidden',
        ...SHADOW.large,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    posterScaler: {
        width: POSTER_SIZE.width, height: POSTER_SIZE.height,
        transform: [{ scale: SCALE }],
        marginLeft: -(POSTER_SIZE.width * (1 - SCALE)) / 2,
        marginTop: -(POSTER_SIZE.height * (1 - SCALE)) / 2,
    },

    // Tab bar
    tabBarWrapper: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        gap: 2,
        position: 'relative',
    },
    tabActive: {
        backgroundColor: COLORS.primary + '18',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 5,
        width: 16,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
    tabIcon: { fontSize: 17 },
    tabIconActive: {},
    tabLabel: {
        fontSize: 9,
        color: COLORS.textMuted,
        fontWeight: FONTS.weights.semiBold,
        letterSpacing: 0.3,
    },
    tabLabelActive: {
        color: COLORS.primaryLight,
    },

    // Panel
    panel: { flex: 1 },
    panelInner: { flex: 1, paddingHorizontal: SPACING.base, paddingTop: SPACING.md },

    // — Photo source cards (Device / Backend sections) —
    photoSourceCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    photoSourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    photoSourceIcon: { fontSize: 20 },
    photoSourceTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    photoSourceSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },

    // — Photo tab upload button —
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    uploadBtnActive: {
        borderColor: COLORS.primary,
        borderStyle: 'solid',
        backgroundColor: COLORS.primary + '10',
    },
    uploadIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconWrapperActive: {
        backgroundColor: COLORS.primary + '20',
    },
    uploadIcon: { fontSize: 22 },
    uploadLabel: {
        fontSize: FONTS.sizes.base,
        color: COLORS.textSecondary,
        fontWeight: FONTS.weights.semiBold,
    },
    uploadSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    uploadChevron: {
        fontSize: 22,
        color: COLORS.textMuted,
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '12',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    hintIcon: { fontSize: 20 },
    hintText: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },

    // — Shared —
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    sectionLabelLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    sectionLabelText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    rowLabel: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },

    // — Colour palette —
    paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    swatch: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    swatchActive: { borderWidth: 3, borderColor: COLORS.white },
    swatchBordered: { borderWidth: 1, borderColor: COLORS.border },
    resetSwatch: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // — Size presets —
    sizeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
    sizeBtn: {
        width: 40, height: 30, borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    sizeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    sizeBtnText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
    },
    sizeBtnTextActive: { color: COLORS.white },

    // — Style toggles (Bold/Italic) —
    toggleRow: { flexDirection: 'row', gap: SPACING.sm },
    styleToggle: {
        width: 52, height: 38, borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    styleToggleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    styleToggleText: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textSecondary,
    },
    styleToggleTextActive: { color: COLORS.white },

    // — Align buttons —
    alignBtn: {
        flex: 1, height: 50, borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.border,
        gap: 2,
    },
    alignBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    alignIcon: { fontSize: 13, color: COLORS.textMuted },
    alignIconActive: { color: COLORS.white },
    alignLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: FONTS.weights.medium },
    alignLabelActive: { color: COLORS.white },

    // — Switch row —
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    switchLabel: {
        fontSize: FONTS.sizes.base,
        color: COLORS.text,
        fontWeight: FONTS.weights.semiBold,
    },
    switchSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },

    // — Photo shape —
    shapeRow: { flexDirection: 'row', gap: SPACING.sm },
    shapeBtn: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    shapeBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '14',
    },
    shapeIcon: { fontSize: 22, marginBottom: 4 },
    shapeLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
    shapeLabelActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },

    // — Overlay —
    overlayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    overlayBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: COLORS.border,
    },
    overlayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    overlayLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
    overlayLabelActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },

    // — Stickers —
    stickerHintCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    stickerHintIcon: { fontSize: 18 },
    stickerHint: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        lineHeight: 16,
    },
    stickerRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    stickerCell: {
        flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border,
        position: 'relative',
    },
    stickerCellActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '14',
    },
    stickerCellEmoji: { fontSize: 26 },
    stickerCheckDot: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    activeStickers: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    activeStickerPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderWidth: 1, borderColor: COLORS.border,
    },
    removeStickerX: { fontSize: FONTS.sizes.xs, color: COLORS.error },

    // — Photo resize —
    resizeSection: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    scaleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    scaleBtn: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: COLORS.primary + '20',
        borderWidth: 1, borderColor: COLORS.primary + '50',
        alignItems: 'center', justifyContent: 'center',
    },
    scaleBtnText: {
        fontSize: 22, color: COLORS.primaryLight,
        fontWeight: FONTS.weights.bold, lineHeight: 28,
    },
    scaleDisplay: { alignItems: 'center', flex: 1 },
    scaleValue: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
    },
    scaleHint: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
    presetRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
    presetChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: COLORS.border,
    },
    presetChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    presetChipText: {
        fontSize: FONTS.sizes.sm, color: COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
    },
    presetChipTextActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },

    // — Visibility toggles —
    visibilityRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1, borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    visibilityLeft: { flex: 1, marginRight: SPACING.md },
    visibilityLabel: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    visibilityHint: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 3,
    },
});

export default EditorScreen;
