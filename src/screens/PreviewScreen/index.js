// src/screens/PreviewScreen/index.js
// Premium full-screen poster preview with Save and Share actions

import React, { useCallback, useEffect, useRef } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import usePosterGenerator from '../../hooks/usePosterGenerator';
import PosterPreview from '../../components/PosterPreview';
import AppButton from '../../components/AppButton';
import {
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    SHADOW,
    POSTER_SIZE,
} from '../../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const SCALE = (SCREEN_W - SPACING.base * 2) / POSTER_SIZE.width;
const PREVIEW_W = POSTER_SIZE.width * SCALE;
const PREVIEW_H = POSTER_SIZE.height * SCALE;

const PreviewScreen = ({ navigation, route }) => {
    const { selectedTemplate, userName } = useSelector(s => s.poster);
    const { t } = useTranslation();
    const { posterRef, savePoster, sharePoster, isSaving, isSharing } =
        usePosterGenerator();

    const handleSave = useCallback(async () => {
        await savePoster();
    }, [savePoster]);

    const handleShare = useCallback(async () => {
        await sharePoster();
    }, [sharePoster]);

    const didAutoAction = useRef(false);
    useEffect(() => {
        if (didAutoAction.current) return;
        const action = route?.params?.action;
        if (action === 'share') {
            didAutoAction.current = true;
            handleShare();
        }
        if (action === 'save') {
            didAutoAction.current = true;
            handleSave();
        }
    }, [route, handleShare, handleSave]);

    const accentColor = selectedTemplate?.accentColor || COLORS.primary;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('preview.title')}</Text>
                    {userName ? (
                        <Text style={styles.headerSub} numberOfLines={1}>
                            {userName}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* ── Poster ────────────────────────── */}
                <View style={styles.posterContainer}>
                    <View style={[styles.glowOuter, { backgroundColor: accentColor + '12' }]} />
                    <View style={[styles.glowInner, { backgroundColor: accentColor + '1E' }]} />
                    <View style={[styles.posterWrapper, { borderColor: accentColor + '30' }]} pointerEvents="none">
                        <View style={styles.posterScaler}>
                            <PosterPreview posterRef={posterRef} interactive />
                        </View>
                    </View>
                </View>

                {/* ── Template badge ───────────────── */}
                {/* {selectedTemplate && (
                    <View style={styles.templateBadge}>
                        <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
                        <Text style={styles.templateName}>{selectedTemplate.name}</Text>
                        <View style={[styles.categoryChip, { borderColor: accentColor + '50' }]}>
                            <Text style={[styles.templateCategory, { color: accentColor }]}>
                                {t(`categories.${selectedTemplate.category}`, { defaultValue: selectedTemplate.category })}
                            </Text>
                        </View>
                    </View>
                )} */}

                {/* ── Action buttons ───────────────── */}
                <View style={styles.actions}>
                    {/* Save */}
                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: "#5B6CFF" }, isSaving && styles.btnDisabled]}
                        onPress={handleSave}
                        disabled={isSaving || isSharing}>
                        {isSaving ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="content-save-outline" style={styles.actionIcon} />
                                <View>
                                    <Text style={styles.actionLabel}>{t('preview.actions.save')}</Text>
                                    <Text style={styles.actionSub}>{t('preview.actions.saveSub')}</Text>
                                </View>
                            </>
                        )}
                    </Pressable>

                    {/* Share */}
                    <Pressable
                        style={[styles.actionBtn, styles.shareBtn, isSharing && styles.btnDisabled]}
                        onPress={handleShare}
                        disabled={isSaving || isSharing}>
                        {isSharing ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="share-variant-outline" style={styles.actionIcon} />
                                <View>
                                    <Text style={styles.actionLabel}>{t('preview.actions.share')}</Text>
                                    <Text style={styles.actionSub}>{t('preview.actions.shareSub')}</Text>
                                </View>
                            </>
                        )}
                    </Pressable>
                </View>

                {/* ── Secondary row ────────────────── */}
                <View style={styles.editRow}>
                    <AppButton
                        title={t('preview.secondary.editAgain')}
                        onPress={() => navigation.goBack()}
                        variant="outline"
                        size="md"
                        style={styles.editBtn}
                    />
                    <AppButton
                        title={t('preview.secondary.newPoster')}
                        onPress={() => navigation.popToTop()}
                        variant="ghost"
                        size="md"
                        style={styles.editBtn}
                    />
                </View>

                <View style={{ height: SPACING.xxxl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { alignItems: 'center', paddingBottom: SPACING.xxxl },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    backIcon: { fontSize: 20, color: COLORS.text },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        maxWidth: 160,
        marginTop: 2,
    },
    headerRight: { width: 42 },

    // Poster
    posterContainer: {
        marginTop: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowOuter: {
        position: 'absolute',
        width: PREVIEW_W + 40,
        height: PREVIEW_H + 40,
        borderRadius: 40,
        transform: [{ scaleX: 0.9 }, { translateY: 15 }],
    },
    glowInner: {
        position: 'absolute',
        width: PREVIEW_W - 20,
        height: PREVIEW_H - 40,
        borderRadius: 30,
        transform: [{ scaleX: 0.92 }, { translateY: 25 }],
    },
    posterWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        width: PREVIEW_W,
        height: PREVIEW_H,
        borderWidth: 1,
        ...SHADOW.large,
    },
    posterScaler: {
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        transform: [{ scale: SCALE }],
        marginLeft: -(POSTER_SIZE.width * (1 - SCALE)) / 2,
        marginTop: -(POSTER_SIZE.height * (1 - SCALE)) / 2,
    },

    // Template badge
    templateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.lg,
        gap: SPACING.sm,
        paddingHorizontal: SPACING.base,
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: '100%',
    },
    colorDot: {
        width: 10, height: 10, borderRadius: 5,
    },
    templateName: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.text,
        flex: 1,
    },
    categoryChip: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        backgroundColor: COLORS.card,
    },
    templateCategory: {
        fontSize: FONTS.sizes.xs,
        textTransform: 'capitalize',
        fontWeight: FONTS.weights.semiBold,
    },

    // Action buttons
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.lg,
        paddingHorizontal: SPACING.base,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.base,
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOW.medium,
    },
    shareBtn: { backgroundColor: "#5B6CFF" },
    btnDisabled: { opacity: 0.55 },
    actionIcon: { fontSize: 24, color: COLORS.white },
    actionLabel: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.white,
    },
    actionSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.white + 'BB',
    },

    // Edit row
    editRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.base,
        width: '100%',
    },
    editBtn: { flex: 1 },
});

export default PreviewScreen;
