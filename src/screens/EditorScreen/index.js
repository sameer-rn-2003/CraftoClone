// src/screens/EditorScreen/index.js
// Full-featured Crafto-style poster editor with 4 customisation tabs:
//   Photo  — upload photo, drag hint
//   Text   — name/message, colour, size slider, bold/italic, shadow, align
//   Style  — photo frame shape, accent colour, background overlay
//   Stickers — tap to add sticker, drag to reposition, tap to delete

import React, { useCallback, useState, memo } from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
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
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
    FONTS, SPACING, BORDER_RADIUS, SHADOW, POSTER_SIZE,
} from '../../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const SCALE = (SCREEN_W - SPACING.base * 2) / POSTER_SIZE.width;
const PREVIEW_W = POSTER_SIZE.width * SCALE;
const PREVIEW_H = POSTER_SIZE.height * SCALE;

// ─── Constants ────────────────────────────────────────────────────
const EDITOR_COLORS = {
    background: '#F4F5FB',
    surface: '#FFFFFF',
    card: '#F7F8FF',
    text: '#1F2340',
    textSecondary: '#4B516A',
    textMuted: '#8A90A8',
    border: '#E3E6F2',
    primary: '#5B6CFF',
    primaryLight: '#7484FF',
    error: '#E25555',
    white: '#FFFFFF',
    glassBorder: '#E3E6F2',
};

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
    { id: 'template', labelKey: 'editor.style.photoShape.default', icon: '⬡' },
    { id: 'circle', labelKey: 'editor.style.photoShape.circle', icon: '●' },
    { id: 'rounded', labelKey: 'editor.style.photoShape.rounded', icon: '▣' },
    { id: 'square', labelKey: 'editor.style.photoShape.square', icon: '■' },
];

const BG_OVERLAYS = [
    { id: 'none', labelKey: 'editor.style.bgOverlay.none', value: null },
    { id: 'darkHalf', labelKey: 'editor.style.bgOverlay.darkHalf', value: 'rgba(0,0,0,0.5)' },
    { id: 'darkQuarter', labelKey: 'editor.style.bgOverlay.darkQuarter', value: 'rgba(0,0,0,0.25)' },
    { id: 'light', labelKey: 'editor.style.bgOverlay.light', value: 'rgba(255,255,255,0.15)' },
    { id: 'blue', labelKey: 'editor.style.bgOverlay.blue', value: 'rgba(44,83,255,0.4)' },
    { id: 'red', labelKey: 'editor.style.bgOverlay.red', value: 'rgba(255,65,108,0.4)' },
];

const STICKER_ROWS = [
    ['party-popper', 'star-four-points', 'fire', 'heart', 'lightning-bolt', 'meditation', 'sparkles', 'hand-heart'],
    ['trophy', 'crown', 'diamond-stone', 'target', 'rocket-launch', 'arm-flex', 'palette', 'music-note'],
    ['flower', 'flower-tulip', 'butterfly', 'weather-rainbow', 'weather-sunny', 'weather-night', 'flash', 'eye'],
    ['flag', 'bank', 'cake-variant', 'briefcase', 'bullhorn', 'fist', 'handshake', 'camera'],
];

const SCALE_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SCALE_LABELS = ['50%', '75%', '100%', '125%', '150%', '200%'];
const SIZE_PRESETS = [12, 16, 20, 24, 28, 32, 36];

const TABS = [
    { id: 'photo', icon: 'camera-outline', labelKey: 'editor.tabs.photo' },
    { id: 'text', icon: 'format-text', labelKey: 'editor.tabs.text' },
    // { id: 'style', icon: 'palette-outline', labelKey: 'editor.tabs.style' },
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

const PhotoTab = ({ onPickImage, pickingImage, userPhoto, photoScale, onScaleChange, photoFrame }) => {
    const { t } = useTranslation();

    return (
        <ScrollView
            style={s.tabScroll}
            contentContainerStyle={s.tabScrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
        <View style={{ gap: SPACING.md }}>

            {/* ── SECTION: Device gallery ──── */}
            <View style={s.photoSourceCard}>
                <View style={s.photoSourceHeader}>
                    <MaterialCommunityIcons name="cellphone" style={s.photoSourceIcon} />
                    <View>
                        <Text style={s.photoSourceTitle}>{t('editor.photo.fromDevice.title')}</Text>
                        <Text style={s.photoSourceSub}>{t('editor.photo.fromDevice.subtitle')}</Text>
                    </View>
                </View>

                {/* Upload button */}
                <Pressable style={[s.uploadBtn, userPhoto && s.uploadBtnActive]} onPress={onPickImage}>
                    <View style={[s.uploadIconWrapper, userPhoto && s.uploadIconWrapperActive]}>
                        <MaterialCommunityIcons
                            name={userPhoto ? 'check-circle' : 'camera-outline'}
                            style={s.uploadIcon}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.uploadLabel, userPhoto && { color: EDITOR_COLORS.primaryLight }]}>
                            {pickingImage
                                ? t('editor.photo.upload.selecting')
                                : userPhoto
                                    ? t('editor.photo.upload.changePhoto')
                                    : t('editor.photo.upload.uploadPhoto')}
                        </Text>
                        <Text style={s.uploadSub}>
                            {userPhoto ? t('editor.photo.upload.tapToReplace') : t('editor.photo.upload.formats')}
                        </Text>
                    </View>
                    <Text style={s.uploadChevron}>›</Text>
                </Pressable>

                {/* Drag hint */}
                {userPhoto && (
                    <View style={s.hintCard}>
                        <MaterialCommunityIcons name="gesture-tap-hold" style={s.hintIcon} />
                        <Text style={s.hintText}>
                            {t('editor.photo.dragHint')}
                        </Text>
                    </View>
                )}
            </View>

            {/* ── SECTION: Photo resize ──────── */}
            <View style={s.resizeSection}>
                <SectionLabel>{t('editor.photo.size')}</SectionLabel>
                {photoFrame && (
                    <Text style={s.frameSizeHint}>
                        {t('editor.photo.frameSize', {
                            width: Math.round(photoFrame.width),
                            height: Math.round(photoFrame.height),
                        })}
                    </Text>
                )}

                <View style={s.scaleRow}>
                    <Pressable
                        style={s.scaleBtn}
                        onPress={() => onScaleChange(Math.max(0.25, +(photoScale - 0.05).toFixed(2)))}>
                        <Text style={s.scaleBtnText}>−</Text>
                    </Pressable>

                    <View style={s.scaleDisplay}>
                        <Text style={s.scaleValue}>{Math.round(photoScale * 100)}%</Text>
                        <Text style={s.scaleHint}>{t('editor.photo.pinchHint')}</Text>
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
 
        </View>
    </ScrollView>
    );
};

// Memoized TextTab to prevent unnecessary re-renders
const TextTab = memo(({ p, dispatch, onSave }) => {
    const { t } = useTranslation();
    const nameActive = idx => (p.nameFontSize ?? 26) === SIZE_PRESETS[idx];
    const msgActive = idx => (p.messageFontSize ?? 14) === SIZE_PRESETS[idx];

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={{ paddingBottom: SPACING.xxl }}>

            {/* ── SHOW / HIDE NAME ────────────────── */}
            <View style={s.visibilityRow}>
                <View style={s.visibilityLeft}>
                    <Text style={s.visibilityLabel}>{t('editor.visibility.showName')}</Text>
                    <Text style={s.visibilityHint}>
                        {p.showName ? t('editor.visibility.visible') : t('editor.visibility.hidden')}
                    </Text>
                </View>
                <Switch
                    value={p.showName}
                    onValueChange={v => dispatch(setShowName(v))}
                    trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                    thumbColor={EDITOR_COLORS.white}
                />
            </View>

            {p.showName && (
                <>
                    <AppTextInput
                        label={t('editor.text.name.label')}
                        value={p.userName}
                        onChangeText={v => dispatch(setUserName(v))}
                        placeholder={t('editor.text.name.placeholder')}
                        maxLength={40}
                        returnKeyType="done"
                    />

                    <RowLabel>{t('editor.text.name.colour')}</RowLabel>
                    <View style={s.paletteRow}>
                        {COLOUR_PALETTE.map(c => (
                            <ColourSwatch key={c} color={c} active={p.nameColor === c}
                                onPress={() => dispatch(setNameColor(p.nameColor === c ? null : c))} />
                        ))}
                    </View>

                    <RowLabel>{t('editor.text.name.size')}</RowLabel>
                    <View style={s.sizeRow}>
                        {SIZE_PRESETS.map((sz, i) => (
                            <SizeBtn key={sz} size={sz} active={nameActive(i)}
                                onPress={() => dispatch(setNameFontSize(nameActive(i) ? null : sz))} />
                        ))}
                    </View>

                    <RowLabel>{t('editor.text.name.style')}</RowLabel>
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
                    <Text style={s.visibilityLabel}>{t('editor.visibility.showMessage')}</Text>
                    <Text style={s.visibilityHint}>
                        {p.showMessage ? t('editor.visibility.visible') : t('editor.visibility.hidden')}
                    </Text>
                </View>
                <Switch
                    value={p.showMessage}
                    onValueChange={v => dispatch(setShowMessage(v))}
                    trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                    thumbColor={EDITOR_COLORS.white}
                />
            </View>

            {p.showMessage && (
                <>
                    <AppTextInput
                        label={t('editor.text.message.label')}
                        value={p.userMessage}
                        onChangeText={v => dispatch(setUserMessage(v))}
                        placeholder={t('editor.text.message.placeholder')}
                        multiline
                        maxLength={100}
                    />

                    <RowLabel>{t('editor.text.message.colour')}</RowLabel>
                    <View style={s.paletteRow}>
                        {COLOUR_PALETTE.map(c => (
                            <ColourSwatch key={c} color={c} active={p.messageColor === c}
                                onPress={() => dispatch(setMessageColor(p.messageColor === c ? null : c))} />
                        ))}
                    </View>

                    <RowLabel>{t('editor.text.message.size')}</RowLabel>
                    <View style={s.sizeRow}>
                        {SIZE_PRESETS.map((sz, i) => (
                            <SizeBtn key={sz} size={sz} active={msgActive(i)}
                                onPress={() => dispatch(setMessageFontSize(msgActive(i) ? null : sz))} />
                        ))}
                    </View>

                    <RowLabel>{t('editor.text.message.style')}</RowLabel>
                    <View style={s.toggleRow}>
                        <StyleToggle label="B" active={p.messageBold} onPress={() => dispatch(setMessageBold(!p.messageBold))} />
                        <StyleToggle label="I" active={p.messageItalic} onPress={() => dispatch(setMessageItalic(!p.messageItalic))} />
                    </View>
                </>
            )}

            <View style={s.divider} />

            {/* ── TEXT ALIGNMENT + SHADOW ── */}
            <RowLabel>{t('editor.text.alignment')}</RowLabel>
            <View style={s.toggleRow}>
                <AlignBtn icon="⬛◻◻" label={t('editor.text.align.left')} value="left" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
                <AlignBtn icon="◻⬛◻" label={t('editor.text.align.center')} value="center" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
                <AlignBtn icon="◻◻⬛" label={t('editor.text.align.right')} value="right" current={p.textAlign} onPress={v => dispatch(setTextAlign(v))} />
            </View>

            <View style={s.switchRow}>
                <View>
                    <Text style={s.switchLabel}>{t('editor.text.shadow.label')}</Text>
                    <Text style={s.switchSub}>{t('editor.text.shadow.subtitle')}</Text>
                </View>
                <Switch
                    value={p.textShadow}
                    onValueChange={v => dispatch(setTextShadow(v))}
                    trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                    thumbColor={EDITOR_COLORS.white}
                />
            </View>

            <View style={s.saveRow}>
                <AppButton
                    title="Save"
                    onPress={onSave}
                    variant="primary"
                    size="md"
                    style={s.saveBtn}
                />
            </View>
            </View>
        </ScrollView>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if these specific values change
    const p1 = prevProps.p;
    const p2 = nextProps.p;
    
    return (
        p1.showName === p2.showName &&
        p1.userName === p2.userName &&
        p1.nameColor === p2.nameColor &&
        p1.nameFontSize === p2.nameFontSize &&
        p1.nameBold === p2.nameBold &&
        p1.nameItalic === p2.nameItalic &&
        p1.showMessage === p2.showMessage &&
        p1.userMessage === p2.userMessage &&
        p1.messageColor === p2.messageColor &&
        p1.messageFontSize === p2.messageFontSize &&
        p1.messageBold === p2.messageBold &&
        p1.messageItalic === p2.messageItalic &&
        p1.textAlign === p2.textAlign &&
        p1.textShadow === p2.textShadow
    );
});

const StyleTab = ({ p, dispatch }) => {
    const { t } = useTranslation();

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
        <SectionLabel>{t('editor.style.photoFrame')}</SectionLabel>
        <View style={s.shapeRow}>
            {PHOTO_SHAPES.map(sh => (
                <Pressable key={sh.id} onPress={() => dispatch(setPhotoShape(sh.id))}
                    style={[s.shapeBtn, p.photoShape === sh.id && s.shapeBtnActive]}>
                    <Text style={s.shapeIcon}>{sh.icon}</Text>
                    <Text style={[s.shapeLabel, p.photoShape === sh.id && s.shapeLabelActive]}>
                        {t(sh.labelKey)}
                    </Text>
                </Pressable>
            ))}
        </View>

        <View style={s.divider} />

        <SectionLabel>{t('editor.style.accentColour')}</SectionLabel>
        <View style={s.paletteRow}>
            <Pressable onPress={() => dispatch(setAccentColorOverride(null))}
                style={[s.swatch, s.resetSwatch, !p.accentColorOverride && s.swatchActive]}>
                <Text style={{ fontSize: 8, color: EDITOR_COLORS.textMuted }}>{t('common.auto')}</Text>
            </Pressable>
            {ACCENT_PALETTE.map(c => (
                <ColourSwatch key={c} color={c} active={p.accentColorOverride === c}
                    onPress={() => dispatch(setAccentColorOverride(p.accentColorOverride === c ? null : c))} />
            ))}
        </View>

        <View style={s.divider} />

        <SectionLabel>{t('editor.style.backgroundOverlay')}</SectionLabel>
        <View style={s.overlayRow}>
            {BG_OVERLAYS.map(o => (
                <Pressable key={o.id} onPress={() => dispatch(setBgOverlayColor(o.value))}
                    style={[s.overlayBtn, p.bgOverlayColor === o.value && s.overlayBtnActive]}>
                    <Text style={[s.overlayLabel, p.bgOverlayColor === o.value && s.overlayLabelActive]}>
                        {t(o.labelKey)}
                    </Text>
                </Pressable>
            ))}
        </View>

        <View style={{ height: SPACING.xxl }} />
    </ScrollView>
    );
};

const StickersTab = ({ stickers, dispatch }) => {
    const { t } = useTranslation();

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.stickerHintCard}>
            <MaterialCommunityIcons name="lightbulb-on-outline" style={s.stickerHintIcon} />
            <Text style={s.stickerHint}>{t('editor.stickers.hint')}</Text>
        </View>
        {STICKER_ROWS.map((row, ri) => (
            <View key={ri} style={s.stickerRow}>
                {row.map(iconName => {
                    const inPoster = stickers.find(x => x.emoji === iconName);
                    return (
                        <Pressable key={iconName}
                            style={[s.stickerCell, inPoster && s.stickerCellActive]}
                            onPress={() => {
                                if (inPoster) {
                                    dispatch(removeSticker(inPoster.id));
                                } else {
                                    dispatch(addSticker({ emoji: iconName }));
                                }
                            }}>
                            <MaterialCommunityIcons name={iconName} style={s.stickerCellIcon} />
                            {inPoster && <View style={s.stickerCheckDot} />}
                        </Pressable>
                    );
                })}
            </View>
        ))}

        {stickers.length > 0 && (
            <View style={{ marginTop: SPACING.md }}>
                <RowLabel>{t('editor.stickers.added')}</RowLabel>
                <View style={s.activeStickers}>
                    {stickers.map(stk => (
                        <Pressable key={stk.id} style={s.activeStickerPill}
                            onPress={() => dispatch(removeSticker(stk.id))}>
                            <MaterialCommunityIcons name={stk.emoji} style={s.activeStickerIcon} />
                            <MaterialCommunityIcons name="close" style={s.removeStickerX} />
                        </Pressable>
                    ))}
                </View>
            </View>
        )}

        <View style={{ height: SPACING.xxl }} />
    </ScrollView>
    );
};

// ─── EditorScreen ─────────────────────────────────────────────────

const EditorScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const p = useSelector(state => state.poster);
    const { t } = useTranslation();
    const { pickImage, loading: pickingImage } = useImagePicker();
    const [activeTab, setActiveTab] = useState('photo');

    const handlePreview = useCallback(() => {
        if (!p.userPhoto) {
            Alert.alert(t('editor.noPhoto.title'), t('editor.noPhoto.message'), [{ text: t('common.ok') }]);
            return;
        }
        navigation.navigate('PreviewScreen');
    }, [p.userPhoto, navigation, t]);

    const handleTextSave = useCallback(() => {
        Keyboard.dismiss();
        setActiveTab('photo');
    }, []);

    const renderPanel = useCallback(() => {
        switch (activeTab) {
            case 'photo': return <PhotoTab onPickImage={pickImage} pickingImage={pickingImage}
                userPhoto={p.userPhoto} photoScale={p.photoScale}
                onScaleChange={scale => dispatch(setPhotoScale(scale))}
                photoFrame={p.selectedTemplate?.photoFrame} />;
            case 'text': return <TextTab p={p} dispatch={dispatch} onSave={handleTextSave} />;
            case 'style': return <StyleTab p={p} dispatch={dispatch} />;
            case 'stickers': return <StickersTab stickers={p.stickers} dispatch={dispatch} />;
            default: return null;
        }
    }, [activeTab, p, pickImage, pickingImage, dispatch, handleTextSave]);

    const shouldCollapsePoster = activeTab === 'text';
    const isTextTabActive = activeTab === 'text';

    return (
        <>
            <View style={s.header}>
                <Pressable
                    style={[s.backBtn, isTextTabActive && s.headerSaveBtn]}
                    onPress={isTextTabActive ? handleTextSave : () => navigation.goBack()}>
                    {isTextTabActive ? (
                        <Text style={s.headerSaveBtnText}>{t('preview.actions.save')}</Text>
                    ) : (
                        <MaterialCommunityIcons name="arrow-left" style={s.backIcon} />
                    )}
                </Pressable>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>{t('editor.title')}</Text>
                </View>
                <Pressable style={s.previewBtn} onPress={handlePreview}>
                    <MaterialCommunityIcons name="eye-outline" style={s.previewBtnIcon} />
                    <Text style={s.previewBtnText}>{t('editor.preview')}</Text>
                </Pressable>
            </View>

            {/* ── Poster preview ─────────────────────── */}
            <View style={[s.posterContainer, shouldCollapsePoster && s.posterContainerCollapsed]}>
                <View style={[s.posterShadowRing, shouldCollapsePoster && s.posterShadowRingCollapsed]} />
                <View style={[s.posterClip, shouldCollapsePoster && s.posterClipCollapsed]}>
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
                                <MaterialCommunityIcons
                                    name={tab.icon}
                                    style={[s.tabIcon, isActive && s.tabIconActive]}
                                />
                                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                                    {t(tab.labelKey)}
                                </Text>
                                {isActive && <View style={s.tabIndicator} />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* ── Panel ────────────────────────────────── */}
            <View style={s.panel}>
                <View style={s.panelInner}>
                    {renderPanel()}
                </View>
            </View>

            </>
    );
};

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: EDITOR_COLORS.background },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: EDITOR_COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: EDITOR_COLORS.glassBorder,
    },
    headerSaveBtn: {
        width: 'auto',
        minWidth: 66,
        paddingHorizontal: SPACING.md,
        backgroundColor: EDITOR_COLORS.primary,
        borderColor: EDITOR_COLORS.primary,
    },
    headerSaveBtnText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
        color: EDITOR_COLORS.white,
    },
    backIcon: { fontSize: 18, color: EDITOR_COLORS.text },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.extraBold,
        color: EDITOR_COLORS.text,
        letterSpacing: -0.3,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 3,
        backgroundColor: EDITOR_COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        ...SHADOW.small,
    },
    previewBtnIcon: { fontSize: 14, color: EDITOR_COLORS.white },
    previewBtnText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
        color: EDITOR_COLORS.white,
    },

    // Poster preview
    posterContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        position: 'relative',
    },
    posterContainerCollapsed: {
        paddingVertical: 0,
        height: 0,
        overflow: 'hidden',
    },
    posterShadowRing: {
        position: 'absolute',
        width: PREVIEW_W + 20,
        height: PREVIEW_H + 20,
        borderRadius: 18,
        backgroundColor: EDITOR_COLORS.primary + '0A',
        top: SPACING.sm - 10,
    },
    posterShadowRingCollapsed: {
        opacity: 0,
    },
    posterClip: {
        width: PREVIEW_W, height: PREVIEW_H,
        borderRadius: 16, overflow: 'hidden',
        ...SHADOW.large,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.glassBorder,
    },
    posterClipCollapsed: {
        height: 0,
        borderWidth: 0,
        opacity: 0,
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
        backgroundColor: EDITOR_COLORS.background,
        borderTopWidth: 1,
        borderTopColor: EDITOR_COLORS.border,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: EDITOR_COLORS.surface,
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
        backgroundColor: EDITOR_COLORS.primary + '18',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 5,
        width: 16,
        height: 3,
        borderRadius: 2,
        backgroundColor: EDITOR_COLORS.primary,
    },
    tabIcon: { fontSize: 18, color: EDITOR_COLORS.textMuted },
    tabIconActive: { color: EDITOR_COLORS.primaryLight },
    tabLabel: {
        fontSize: 9,
        color: EDITOR_COLORS.textMuted,
        fontWeight: FONTS.weights.semiBold,
        letterSpacing: 0.3,
    },
    tabLabelActive: {
        color: EDITOR_COLORS.primaryLight,
    },

    // Panel
    panel: { flex: 1 },
    panelInner: { flex: 1, paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
    tabScroll: { flex: 1 },
    tabScrollContent: { paddingBottom: SPACING.xxxl },

    // — Photo source cards (Device / Backend sections) —
    photoSourceCard: {
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    photoSourceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    photoSourceIcon: { fontSize: 20, color: EDITOR_COLORS.primary },
    photoSourceTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: EDITOR_COLORS.text,
    },
    photoSourceSub: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textMuted,
        marginTop: 1,
    },

    // — Photo tab upload button —
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: EDITOR_COLORS.card,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderWidth: 1.5,
        borderColor: EDITOR_COLORS.border,
        borderStyle: 'dashed',
    },
    uploadBtnActive: {
        borderColor: EDITOR_COLORS.primary,
        borderStyle: 'solid',
        backgroundColor: EDITOR_COLORS.primary + '10',
    },
    uploadIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: EDITOR_COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconWrapperActive: {
        backgroundColor: EDITOR_COLORS.primary + '20',
    },
    uploadIcon: { fontSize: 22, color: EDITOR_COLORS.primaryLight },
    uploadLabel: {
        fontSize: FONTS.sizes.base,
        color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.semiBold,
    },
    uploadSub: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textMuted,
        marginTop: 2,
    },
    uploadChevron: {
        fontSize: 22,
        color: EDITOR_COLORS.textMuted,
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EDITOR_COLORS.primary + '12',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.primary + '30',
    },
    hintIcon: { fontSize: 20, color: EDITOR_COLORS.primary },
    hintText: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: EDITOR_COLORS.textSecondary,
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
        backgroundColor: EDITOR_COLORS.border,
    },
    sectionLabelText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: EDITOR_COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    rowLabel: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: EDITOR_COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    divider: {
        height: 1,
        backgroundColor: EDITOR_COLORS.border,
        marginVertical: SPACING.md,
    },

    // — Colour palette —
    paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    swatch: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    swatchActive: { borderWidth: 3, borderColor: EDITOR_COLORS.white },
    swatchBordered: { borderWidth: 1, borderColor: EDITOR_COLORS.border },
    resetSwatch: {
        backgroundColor: EDITOR_COLORS.surface,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // — Size presets —
    sizeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
    sizeBtn: {
        width: 40, height: 30, borderRadius: BORDER_RADIUS.sm,
        backgroundColor: EDITOR_COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
    },
    sizeBtnActive: { backgroundColor: EDITOR_COLORS.primary, borderColor: EDITOR_COLORS.primary },
    sizeBtnText: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
    },
    sizeBtnTextActive: { color: EDITOR_COLORS.white },

    // — Style toggles (Bold/Italic) —
    toggleRow: { flexDirection: 'row', gap: SPACING.sm },
    styleToggle: {
        width: 52, height: 38, borderRadius: BORDER_RADIUS.sm,
        backgroundColor: EDITOR_COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
    },
    styleToggleActive: {
        backgroundColor: EDITOR_COLORS.primary,
        borderColor: EDITOR_COLORS.primary,
    },
    styleToggleText: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: EDITOR_COLORS.textSecondary,
    },
    styleToggleTextActive: { color: EDITOR_COLORS.white },

    // — Align buttons —
    alignBtn: {
        flex: 1, height: 50, borderRadius: BORDER_RADIUS.md,
        backgroundColor: EDITOR_COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
        gap: 2,
    },
    alignBtnActive: { backgroundColor: EDITOR_COLORS.primary, borderColor: EDITOR_COLORS.primary },
    alignIcon: { fontSize: 13, color: EDITOR_COLORS.textMuted },
    alignIconActive: { color: EDITOR_COLORS.white },
    alignLabel: { fontSize: FONTS.sizes.xs, color: EDITOR_COLORS.textMuted, fontWeight: FONTS.weights.medium },
    alignLabelActive: { color: EDITOR_COLORS.white },

    // — Switch row —
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
    },
    switchLabel: {
        fontSize: FONTS.sizes.base,
        color: EDITOR_COLORS.text,
        fontWeight: FONTS.weights.semiBold,
    },
    switchSub: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textMuted,
        marginTop: 2,
    },
    saveRow: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    saveBtn: {
        width: '100%',
    },

    // — Photo shape —
    shapeRow: { flexDirection: 'row', gap: SPACING.sm },
    shapeBtn: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1.5, borderColor: EDITOR_COLORS.border,
    },
    shapeBtnActive: {
        borderColor: EDITOR_COLORS.primary,
        backgroundColor: EDITOR_COLORS.primary + '14',
    },
    shapeIcon: { fontSize: 22, marginBottom: 4 },
    shapeLabel: { fontSize: FONTS.sizes.xs, color: EDITOR_COLORS.textMuted },
    shapeLabelActive: { color: EDITOR_COLORS.primary, fontWeight: FONTS.weights.bold },

    // — Overlay —
    overlayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    overlayBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
    },
    overlayBtnActive: { backgroundColor: EDITOR_COLORS.primary, borderColor: EDITOR_COLORS.primary },
    overlayLabel: { fontSize: FONTS.sizes.sm, color: EDITOR_COLORS.textSecondary },
    overlayLabelActive: { color: EDITOR_COLORS.white, fontWeight: FONTS.weights.bold },

    // — Stickers —
    stickerHintCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        marginBottom: SPACING.md,
    },
    stickerHintIcon: { fontSize: 18, color: EDITOR_COLORS.primary },
    stickerHint: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: EDITOR_COLORS.textSecondary,
        lineHeight: 16,
    },
    stickerRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    stickerCell: {
        flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
        position: 'relative',
    },
    stickerCellActive: {
        borderColor: EDITOR_COLORS.primary,
        backgroundColor: EDITOR_COLORS.primary + '14',
    },
    stickerCellIcon: { fontSize: 24, color: EDITOR_COLORS.textSecondary },
    stickerCheckDot: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: EDITOR_COLORS.primary,
    },
    activeStickers: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    activeStickerPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
    },
    activeStickerIcon: { fontSize: 20, color: EDITOR_COLORS.textSecondary },
    removeStickerX: { fontSize: FONTS.sizes.xs, color: EDITOR_COLORS.error },

    // — Photo resize —
    resizeSection: {
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
    },
    frameSizeHint: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textMuted,
        marginBottom: SPACING.sm,
        marginTop: -SPACING.xs,
        textAlign: 'center',
    },
    scaleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    scaleBtn: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: EDITOR_COLORS.primary + '20',
        borderWidth: 1, borderColor: EDITOR_COLORS.primary + '50',
        alignItems: 'center', justifyContent: 'center',
    },
    scaleBtnText: {
        fontSize: 22, color: EDITOR_COLORS.primaryLight,
        fontWeight: FONTS.weights.bold, lineHeight: 28,
    },
    scaleDisplay: { alignItems: 'center', flex: 1 },
    scaleValue: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.extraBold,
        color: EDITOR_COLORS.text,
    },
    scaleHint: { fontSize: FONTS.sizes.xs, color: EDITOR_COLORS.textMuted, marginTop: 2 },
    presetRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
    presetChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        backgroundColor: EDITOR_COLORS.card,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
    },
    presetChipActive: { backgroundColor: EDITOR_COLORS.primary, borderColor: EDITOR_COLORS.primary },
    presetChipText: {
        fontSize: FONTS.sizes.sm, color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
    },
    presetChipTextActive: { color: EDITOR_COLORS.white, fontWeight: FONTS.weights.bold },

    // — Visibility toggles —
    visibilityRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1, borderColor: EDITOR_COLORS.border,
        marginBottom: SPACING.sm,
    },
    visibilityLeft: { flex: 1, marginRight: SPACING.md },
    visibilityLabel: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: EDITOR_COLORS.text,
    },
    visibilityHint: {
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textMuted,
        marginTop: 3,
    },
});

export default EditorScreen;
