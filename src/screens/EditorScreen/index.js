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
    Image,
    Keyboard,
    Pressable,
    ScrollView,
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
    setPhotoShape,
    addSticker, removeSticker,
    setPhotoScale, setPremiumStatus, setPremiumProfileField,
} from '../../store/posterSlice';
import useImagePicker from '../../hooks/useImagePicker';
import PosterPreview from '../../components/PosterPreview';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import SubscriptionModal from '../../components/SubscriptionModal';
import { mergeUserProfile } from '../../utils/userStorage';
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


const PHOTO_SHAPES = [
    { id: 'template', labelKey: 'editor.style.photoShape.default', icon: '⬡' },
    { id: 'circle', labelKey: 'editor.style.photoShape.circle', icon: '●' },
    { id: 'rounded', labelKey: 'editor.style.photoShape.rounded', icon: '▣' },
    { id: 'square', labelKey: 'editor.style.photoShape.square', icon: '■' },
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
    { id: 'details', icon: 'card-account-details-outline', labelKey: 'editor.tabs.details' },
    { id: 'style', icon: 'palette-outline', labelKey: 'editor.tabs.style' },
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

const LockedInputWrapper = ({ locked, onUnlock, children, style, showOverlay = true }) => {
    if (!locked) {
        return style ? <View style={style}>{children}</View> : children;
    }

    return (
        <Pressable onPress={onUnlock} style={[s.lockedFieldWrap, style]}>
            <View pointerEvents="none">{children}</View>
            {showOverlay && <View pointerEvents="none" style={s.lockedFieldOverlay} />}
            <View pointerEvents="none" style={s.lockedBadge}>
                <MaterialCommunityIcons name="lock-outline" style={s.lockedBadgeIcon} />
                <Text style={s.lockedBadgeText}>Premium</Text>
            </View>
        </Pressable>
    );
};

// ─── Tab panels ───────────────────────────────────────────────────

const PhotoTab = ({
    onPickImage,
    pickingImage,
    userPhoto,
    photoScale,
    onScaleChange,
    photoFrame,
    isPremium,
    onUnlockPremium,
}) => {
    const { t } = useTranslation();
    const photoResizeLocked = !isPremium;

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
                <View style={[s.resizeSection, photoResizeLocked && s.lockedSection]}>
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
                            onPress={() => {
                                if (photoResizeLocked) {
                                    onUnlockPremium();
                                    return;
                                }
                                onScaleChange(Math.max(0.25, +(photoScale - 0.05).toFixed(2)));
                            }}>
                            <Text style={s.scaleBtnText}>−</Text>
                        </Pressable>

                        <View style={s.scaleDisplay}>
                            <Text style={s.scaleValue}>{Math.round(photoScale * 100)}%</Text>
                            <Text style={s.scaleHint}>{t('editor.photo.pinchHint')}</Text>
                        </View>

                        <Pressable
                            style={s.scaleBtn}
                            onPress={() => {
                                if (photoResizeLocked) {
                                    onUnlockPremium();
                                    return;
                                }
                                onScaleChange(Math.min(3.0, +(photoScale + 0.05).toFixed(2)));
                            }}>
                            <Text style={s.scaleBtnText}>+</Text>
                        </Pressable>
                    </View>

                    <View style={s.presetRow}>
                        {SCALE_PRESETS.map((sc, i) => {
                            const active = Math.abs(photoScale - sc) < 0.01;
                            return (
                                <Pressable key={sc} style={[s.presetChip, active && s.presetChipActive]}
                                    onPress={() => {
                                        if (photoResizeLocked) {
                                            onUnlockPremium();
                                            return;
                                        }
                                        onScaleChange(sc);
                                    }}>
                                    <Text style={[s.presetChipText, active && s.presetChipTextActive]}>
                                        {SCALE_LABELS[i]}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {photoResizeLocked && (
                        <Pressable style={s.lockedHintRow} onPress={onUnlockPremium}>
                            <MaterialCommunityIcons name="lock-outline" style={s.lockedHintIcon} />
                            <Text style={s.lockedHintText}>Photo resize is premium. Tap to unlock.</Text>
                        </Pressable>
                    )}
                </View>

            </View>
        </ScrollView>
    );
};
// Memoized TextTab to prevent unnecessary re-renders
const TextTab = memo(({ p, dispatch, onSave, onUnlockPremium }) => {
    const { t } = useTranslation();
    const nameActive = idx => (p.nameFontSize ?? 26) === SIZE_PRESETS[idx];
    const msgActive = idx => (p.messageFontSize ?? 14) === SIZE_PRESETS[idx];
    const locked = !p.isPremium;
    const showName =  p.showName;
    const showMessage = locked ? true : p.showMessage;

    const handlePremiumAction = action => {
        if (locked) {
            onUnlockPremium();
            return;
        }
        action();
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={{ paddingBottom: SPACING.xxl }}>

                {/* ── SHOW / HIDE NAME ────────────────── */}
                {/* <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium} showOverlay={false}> */}
                    <View style={s.visibilityRow}>
                        <View style={s.visibilityLeft}>
                            <Text style={s.visibilityLabel}>{t('editor.visibility.showName')}</Text>
                            <Text style={s.visibilityHint}>
                                {showName ? t('editor.visibility.visible') : t('editor.visibility.hidden')}
                            </Text>
                        </View>
                        <Switch
                            value={showName}
                            // disabled={locked}
                            onValueChange={v => dispatch(setShowName(v))}
                            trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                            thumbColor={EDITOR_COLORS.white}
                        />
                    </View>
                {/* </LockedInputWrapper> */}

                {showName && (
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
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.paletteRow, locked && s.lockedSection]}>
                                {COLOUR_PALETTE.map(c => (
                                    <ColourSwatch key={c} color={c} active={p.nameColor === c}
                                        onPress={() => handlePremiumAction(() => dispatch(setNameColor(p.nameColor === c ? null : c)))} />
                                ))}
                            </View>
                        </LockedInputWrapper>

                        <RowLabel>{t('editor.text.name.size')}</RowLabel>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.sizeRow, locked && s.lockedSection]}>
                                {SIZE_PRESETS.map((sz, i) => (
                                    <SizeBtn key={sz} size={sz} active={nameActive(i)}
                                        onPress={() => handlePremiumAction(() => dispatch(setNameFontSize(nameActive(i) ? null : sz)))} />
                                ))}
                            </View>
                        </LockedInputWrapper>

                        <RowLabel>{t('editor.text.name.style')}</RowLabel>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.toggleRow, locked && s.lockedSection]}>
                                <StyleToggle label="B" active={p.nameBold} onPress={() => handlePremiumAction(() => dispatch(setNameBold(!p.nameBold)))} />
                                <StyleToggle label="I" active={p.nameItalic} onPress={() => handlePremiumAction(() => dispatch(setNameItalic(!p.nameItalic)))} />
                            </View>
                        </LockedInputWrapper>
                    </>
                )}

                <View style={s.divider} />

                {/* ── SHOW / HIDE MESSAGE ──────────────── */}
                <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium} showOverlay={false}>
                    <View style={s.visibilityRow}>
                        <View style={s.visibilityLeft}>
                            <Text style={s.visibilityLabel}>{t('editor.visibility.showMessage')}</Text>
                            <Text style={s.visibilityHint}>
                                {showMessage ? t('editor.visibility.visible') : t('editor.visibility.hidden')}
                            </Text>
                        </View>
                        <Switch
                            value={showMessage}
                            disabled={locked}
                            onValueChange={v => dispatch(setShowMessage(v))}
                            trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                            thumbColor={EDITOR_COLORS.white}
                        />
                    </View>
                </LockedInputWrapper>

                {showMessage && (
                    <>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <AppTextInput
                                label={t('editor.text.message.label')}
                                value={p.userMessage}
                                onChangeText={v => dispatch(setUserMessage(v))}
                                placeholder={t('editor.text.message.placeholder')}
                                multiline
                                maxLength={100}
                                editable={!locked}
                                locked={locked}
                                onLockedPress={onUnlockPremium}
                            />
                        </LockedInputWrapper>

                        <RowLabel>{t('editor.text.message.colour')}</RowLabel>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.paletteRow, locked && s.lockedSection]}>
                                {COLOUR_PALETTE.map(c => (
                                    <ColourSwatch key={c} color={c} active={p.messageColor === c}
                                        onPress={() => handlePremiumAction(() => dispatch(setMessageColor(p.messageColor === c ? null : c)))} />
                                ))}
                            </View>
                        </LockedInputWrapper>

                        <RowLabel>{t('editor.text.message.size')}</RowLabel>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.sizeRow, locked && s.lockedSection]}>
                                {SIZE_PRESETS.map((sz, i) => (
                                    <SizeBtn key={sz} size={sz} active={msgActive(i)}
                                        onPress={() => handlePremiumAction(() => dispatch(setMessageFontSize(msgActive(i) ? null : sz)))} />
                                ))}
                            </View>
                        </LockedInputWrapper>

                        <RowLabel>{t('editor.text.message.style')}</RowLabel>
                        <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                            <View style={[s.toggleRow, locked && s.lockedSection]}>
                                <StyleToggle label="B" active={p.messageBold} onPress={() => handlePremiumAction(() => dispatch(setMessageBold(!p.messageBold)))} />
                                <StyleToggle label="I" active={p.messageItalic} onPress={() => handlePremiumAction(() => dispatch(setMessageItalic(!p.messageItalic)))} />
                            </View>
                        </LockedInputWrapper>
                    </>
                )}

                <View style={s.divider} />

                {/* ── TEXT ALIGNMENT + SHADOW ── */}
                <RowLabel>{t('editor.text.alignment')}</RowLabel>
                <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                <View style={[s.toggleRow, locked && s.lockedSection]}>
                    <AlignBtn icon="⬛◻◻" label={t('editor.text.align.left')} value="left" current={p.textAlign}
                        onPress={v => handlePremiumAction(() => dispatch(setTextAlign(v)))} />
                    <AlignBtn icon="◻⬛◻" label={t('editor.text.align.center')} value="center" current={p.textAlign}
                        onPress={v => handlePremiumAction(() => dispatch(setTextAlign(v)))} />
                    <AlignBtn icon="◻◻⬛" label={t('editor.text.align.right')} value="right" current={p.textAlign}
                        onPress={v => handlePremiumAction(() => dispatch(setTextAlign(v)))} />
                </View>
                </LockedInputWrapper>

                <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                <View style={s.switchRow}>
                    <View>
                        <Text style={s.switchLabel}>{t('editor.text.shadow.label')}</Text>
                        <Text style={s.switchSub}>{t('editor.text.shadow.subtitle')}</Text>
                    </View>
                    <Switch
                        value={p.textShadow}
                        disabled={locked}
                        onValueChange={v => dispatch(setTextShadow(v))}
                        trackColor={{ false: EDITOR_COLORS.border, true: EDITOR_COLORS.primary }}
                        thumbColor={EDITOR_COLORS.white}
                    />
                </View>
                </LockedInputWrapper>

                {locked && (
                    <Pressable style={s.lockedHintRow} onPress={onUnlockPremium}>
                        <MaterialCommunityIcons name="lock-outline" style={s.lockedHintIcon} />
                        <Text style={s.lockedHintText}>Only name editing is free. Other text controls are premium.</Text>
                    </Pressable>
                )}

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
    const p1 = prevProps.p;
    const p2 = nextProps.p;

    return (
        p1.isPremium === p2.isPremium &&
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
const StyleTab = ({ p, dispatch, isPremium, onUnlockPremium }) => {
    const { t } = useTranslation();
    const locked = !isPremium;

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            <SectionLabel>{t('editor.style.photoFrame')}</SectionLabel>
            <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium}>
                <View style={[s.shapeRow, locked && s.lockedSection]}>
                    {PHOTO_SHAPES.map(sh => (
                        <Pressable
                            key={sh.id}
                            onPress={() => dispatch(setPhotoShape(sh.id))}
                            style={[s.shapeBtn, p.photoShape === sh.id && s.shapeBtnActive]}>
                            <Text style={s.shapeIcon}>{sh.icon}</Text>
                            <Text style={[s.shapeLabel, p.photoShape === sh.id && s.shapeLabelActive]}>
                                {t(sh.labelKey)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </LockedInputWrapper>

            {locked && (
                <Pressable style={s.lockedHintRow} onPress={onUnlockPremium}>
                    <MaterialCommunityIcons name="lock-outline" style={s.lockedHintIcon} />
                    <Text style={s.lockedHintText}>Style controls are premium. Tap to unlock.</Text>
                </Pressable>
            )}

            <View style={{ height: SPACING.xxl }} />
        </ScrollView>
    );
};
const PremiumDetailsTab = ({ p, dispatch, onPickLogo, onUnlockPremium, onSave }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('personal');
    const locked = !p.isPremium;

    const personal = p.premiumProfile?.personal || {};
    const business = p.premiumProfile?.business || {};

    const updateField = (section, field, value) => {
        dispatch(setPremiumProfileField({ section, field, value }));
    };

    const handlePickLogo = async (section, field) => {
        const uri = await onPickLogo();
        if (uri) {
            updateField(section, field, uri);
        }
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={[s.sectionSlider, locked && s.lockedSection]}>
                <Pressable
                    style={[s.sectionSliderBtn, activeSection === 'personal' && s.sectionSliderBtnActive]}
                    onPress={() => setActiveSection('personal')}>
                    <Text style={[s.sectionSliderText, activeSection === 'personal' && s.sectionSliderTextActive]}>
                        {t('editor.premium.personal')}
                    </Text>
                </Pressable>
                <Pressable
                    style={[s.sectionSliderBtn, activeSection === 'business' && s.sectionSliderBtnActive]}
                    onPress={() => setActiveSection('business')}>
                    <Text style={[s.sectionSliderText, activeSection === 'business' && s.sectionSliderTextActive]}>
                        {t('editor.premium.business')}
                    </Text>
                </Pressable>
            </View>

            {locked && (
                <Pressable style={s.lockedHintRow} onPress={onUnlockPremium}>
                    <MaterialCommunityIcons name="lock-outline" style={s.lockedHintIcon} />
                    <Text style={s.lockedHintText}>These details are visible but locked for free users.</Text>
                </Pressable>
            )}

            {activeSection === 'personal' ? (
                <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium} showOverlay={false}>
                    <View>
                    <SectionLabel>{t('editor.premium.personalDetails')}</SectionLabel>
                    <AppTextInput
                        label={t('editor.premium.mobileNumber')}
                        value={personal.mobileNumber}
                        onChangeText={v => updateField('personal', 'mobileNumber', v)}
                        placeholder={t('editor.premium.mobilePlaceholder')}
                        keyboardType="phone-pad"
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <AppTextInput
                        label={t('editor.premium.address')}
                        value={personal.address}
                        onChangeText={v => updateField('personal', 'address', v)}
                        placeholder={t('editor.premium.addressPlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <AppTextInput
                        label={t('editor.premium.socialHandle')}
                        value={personal.socialHandle}
                        onChangeText={v => updateField('personal', 'socialHandle', v)}
                        placeholder={t('editor.premium.socialPlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />

                    <SectionLabel>{t('editor.premium.organizationDetails')}</SectionLabel>
                    <AppTextInput
                        label={t('editor.premium.organizationName')}
                        value={personal.organizationName}
                        onChangeText={v => updateField('personal', 'organizationName', v)}
                        placeholder={t('editor.premium.organizationPlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <Pressable
                        style={s.logoPickerBtn}
                        onPress={() => {
                            if (locked) {
                                onUnlockPremium();
                                return;
                            }
                            handlePickLogo('personal', 'organizationLogo');
                        }}>
                        <MaterialCommunityIcons name="image-outline" style={s.logoPickerIcon} />
                        <Text style={s.logoPickerText}>
                            {personal.organizationLogo
                                ? t('editor.premium.changeOrganizationLogo')
                                : t('editor.premium.uploadOrganizationLogo')}
                        </Text>
                    </Pressable>
                    {personal.organizationLogo ? (
                        <Image source={{ uri: personal.organizationLogo }} style={s.logoPreview} />
                    ) : null}
                    </View>
                </LockedInputWrapper>
            ) : (
                <LockedInputWrapper locked={locked} onUnlock={onUnlockPremium} showOverlay={false}>
                    <View>
                    <SectionLabel>{t('editor.premium.businessInfo')}</SectionLabel>
                    <AppTextInput
                        label={t('editor.premium.businessName')}
                        value={business.businessName}
                        onChangeText={v => updateField('business', 'businessName', v)}
                        placeholder={t('editor.premium.businessNamePlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <AppTextInput
                        label={t('editor.premium.businessDescription')}
                        value={business.businessDescription}
                        onChangeText={v => updateField('business', 'businessDescription', v)}
                        placeholder={t('editor.premium.businessDescriptionPlaceholder')}
                        multiline
                        maxLength={200}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />

                    <SectionLabel>{t('editor.premium.businessLogo')}</SectionLabel>
                    <Pressable
                        style={s.logoPickerBtn}
                        onPress={() => {
                            if (locked) {
                                onUnlockPremium();
                                return;
                            }
                            handlePickLogo('business', 'businessLogo');
                        }}>
                        <MaterialCommunityIcons name="image-outline" style={s.logoPickerIcon} />
                        <Text style={s.logoPickerText}>
                            {business.businessLogo
                                ? t('editor.premium.changeBusinessLogo')
                                : t('editor.premium.uploadBusinessLogo')}
                        </Text>
                    </Pressable>
                    {business.businessLogo ? (
                        <Image source={{ uri: business.businessLogo }} style={s.logoPreview} />
                    ) : null}

                    <SectionLabel>{t('editor.premium.contactDetails')}</SectionLabel>
                    <AppTextInput
                        label={t('editor.premium.mobileNumber')}
                        value={business.contactMobileNumber}
                        onChangeText={v => updateField('business', 'contactMobileNumber', v)}
                        placeholder={t('editor.premium.mobilePlaceholder')}
                        keyboardType="phone-pad"
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <AppTextInput
                        label={t('editor.premium.address')}
                        value={business.contactAddress}
                        onChangeText={v => updateField('business', 'contactAddress', v)}
                        placeholder={t('editor.premium.addressPlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    <AppTextInput
                        label={t('editor.premium.socialHandle')}
                        value={business.contactSocialHandle}
                        onChangeText={v => updateField('business', 'contactSocialHandle', v)}
                        placeholder={t('editor.premium.socialPlaceholder')}
                        editable={!locked}
                        locked={locked}
                        onLockedPress={onUnlockPremium}
                    />
                    </View>
                </LockedInputWrapper>
            )}

            <View style={s.saveRow}>
                <AppButton
                    title="Save"
                    onPress={locked ? onUnlockPremium : onSave}
                    variant="primary"
                    size="md"
                    style={s.saveBtn}
                />
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
    const [isSubscriptionVisible, setSubscriptionVisible] = useState(false);

    const openSubscriptionModal = useCallback(() => {
        setSubscriptionVisible(true);
    }, []);

    const handleSubscribe = useCallback(async () => {
        dispatch(setPremiumStatus(true));
        setSubscriptionVisible(false);
        await mergeUserProfile({ isPremium: true });
    }, [dispatch]);

    const pickLogoImage = useCallback(async () => {
        return pickImage({ autoStoreInProfilePhoto: false });
    }, [pickImage]);

    const handlePickProfileImage = useCallback(async () => {
        const uri = await pickImage();
        if (uri) {
            await mergeUserProfile({ imageUri: uri });
        }
        return uri;
    }, [pickImage]);

    const handlePreview = useCallback(() => {
        if (!p.userPhoto) {
            Alert.alert(t('editor.noPhoto.title'), t('editor.noPhoto.message'), [{ text: t('common.ok') }]);
            return;
        }
        navigation.navigate('PreviewScreen');
    }, [p.userPhoto, navigation, t]);

    const handleTextSave = useCallback(async () => {
        Keyboard.dismiss();
        await mergeUserProfile({ name: p.userName });
        setActiveTab('photo');
    }, [p.userName]);

    const handlePremiumDetailsSave = useCallback(async () => {
        Keyboard.dismiss();
        await mergeUserProfile({ premiumProfile: p.premiumProfile });
        setActiveTab('photo');
    }, [p.premiumProfile]);

    const handleTabPress = useCallback((tabId) => {
        setActiveTab(tabId);
    }, []);

    const renderPanel = useCallback(() => {
        switch (activeTab) {
            case 'photo': return <PhotoTab onPickImage={handlePickProfileImage} pickingImage={pickingImage}
                userPhoto={p.userPhoto} photoScale={p.photoScale}
                onScaleChange={scale => dispatch(setPhotoScale(scale))}
                photoFrame={p.selectedTemplate?.photoFrame}
                isPremium={p.isPremium}
                onUnlockPremium={openSubscriptionModal} />;
            case 'text': return <TextTab
                p={p}
                dispatch={dispatch}
                onSave={handleTextSave}
                onUnlockPremium={openSubscriptionModal}
            />;
            case 'details': return <PremiumDetailsTab
                p={p}
                dispatch={dispatch}
                onPickLogo={pickLogoImage}
                onUnlockPremium={openSubscriptionModal}
                onSave={handlePremiumDetailsSave}
            />;
            case 'style': return <StyleTab
                p={p}
                dispatch={dispatch}
                isPremium={p.isPremium}
                onUnlockPremium={openSubscriptionModal}
            />;
            case 'stickers': return <StickersTab stickers={p.stickers} dispatch={dispatch} />;
            default: return null;
        }
    }, [
        activeTab,
        p,
        handlePickProfileImage,
        pickingImage,
        dispatch,
        handleTextSave,
        openSubscriptionModal,
        pickLogoImage,
        handlePremiumDetailsSave,
    ]);

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
                        <PosterPreview interactive allowPinchScale={p.isPremium} />
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
                                onPress={() => handleTabPress(tab.id)}>
                                <MaterialCommunityIcons
                                    name={tab.icon}
                                    style={[s.tabIcon, isActive && s.tabIconActive]}
                                />
                                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                                    {t(tab.labelKey)}
                                </Text>
                                {isActive && <View style={s.tabIndicator} />}
                                {!p.isPremium && (tab.id === 'details' || tab.id === 'style') && (
                                    <MaterialCommunityIcons name="lock" style={s.tabLockIcon} />
                                )}
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

            <SubscriptionModal
                visible={isSubscriptionVisible}
                onClose={() => {
                    setSubscriptionVisible(false);
                }}
                onSubscribe={handleSubscribe}
            />

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
    tabLockIcon: {
        position: 'absolute',
        top: 4,
        right: 6,
        fontSize: 10,
        color: EDITOR_COLORS.textMuted,
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
    lockedFieldWrap: {
        borderRadius: BORDER_RADIUS.md,
        position: 'relative',
        overflow: 'hidden',
    },
    lockedFieldOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: 'rgba(255,255,255,0.28)',
    },
    lockedBadge: {
        position: 'absolute',
        top: 6,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(17,24,39,0.86)',
    },
    lockedBadgeIcon: {
        fontSize: 12,
        color: EDITOR_COLORS.white,
    },
    lockedBadgeText: {
        fontSize: 10,
        color: EDITOR_COLORS.white,
        fontWeight: FONTS.weights.semiBold,
        letterSpacing: 0.2,
    },
    lockedSection: {
        opacity: 0.7,
    },
    lockedHintRow: {
        marginTop: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.primary + '40',
        backgroundColor: EDITOR_COLORS.primary + '10',
    },
    lockedHintIcon: {
        fontSize: 16,
        color: EDITOR_COLORS.primaryLight,
    },
    lockedHintText: {
        flex: 1,
        fontSize: FONTS.sizes.xs,
        color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
    },
    sectionSlider: {
        flexDirection: 'row',
        backgroundColor: EDITOR_COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        padding: 4,
        marginBottom: SPACING.md,
    },
    sectionSliderBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    sectionSliderBtnActive: {
        backgroundColor: EDITOR_COLORS.primary,
    },
    sectionSliderText: {
        fontSize: FONTS.sizes.sm,
        color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.semiBold,
    },
    sectionSliderTextActive: {
        color: EDITOR_COLORS.white,
    },
    logoPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: EDITOR_COLORS.surface,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.sm,
    },
    logoPickerIcon: {
        fontSize: 18,
        color: EDITOR_COLORS.primaryLight,
    },
    logoPickerText: {
        fontSize: FONTS.sizes.sm,
        color: EDITOR_COLORS.textSecondary,
        fontWeight: FONTS.weights.semiBold,
    },
    logoPreview: {
        width: 88,
        height: 88,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: EDITOR_COLORS.border,
        backgroundColor: EDITOR_COLORS.surface,
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

