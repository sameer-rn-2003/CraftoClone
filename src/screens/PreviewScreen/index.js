// src/screens/PreviewScreen/index.js
// Premium full-screen poster preview with Save and Share actions

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { getTemplateCanvasSize } from '../../utils/templateConfig';
import {
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    SHADOW,
} from '../../utils/constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PreviewScreen = ({ navigation, route }) => {
    const { selectedTemplate, userName, isPremium } = useSelector(s => s.poster);
    const { t } = useTranslation();
    const { posterRef, savePoster, sharePoster, sharePosterToWhatsApp, isSaving, isSharing } =
        usePosterGenerator();
    const canvasSize = useMemo(() => getTemplateCanvasSize(selectedTemplate), [selectedTemplate]);
    const previewScale = useMemo(() => {
        const maxWidth = SCREEN_W - SPACING.base * 2;
        const maxHeight = SCREEN_H * 0.68;

        return Math.min(maxWidth / canvasSize.width, maxHeight / canvasSize.height);
    }, [canvasSize]);
    const previewWidth = canvasSize.width * previewScale;
    const previewHeight = canvasSize.height * previewScale;

    const handleSave = useCallback(async () => {
        await savePoster();
    }, [savePoster]);

    const handleShare = useCallback(async () => {
        if (isPremium) {
            await sharePoster();
            return;
        }
        await sharePosterToWhatsApp();
    }, [isPremium, sharePoster, sharePosterToWhatsApp]);

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
                    <View style={[styles.glowOuter, {
                        backgroundColor: accentColor + '12',
                        width: previewWidth + 40,
                        height: previewHeight + 40,
                    }]} />
                    <View style={[styles.glowInner, {
                        backgroundColor: accentColor + '1E',
                        width: Math.max(previewWidth - 20, 0),
                        height: Math.max(previewHeight - 40, 0),
                    }]} />
                    <View style={[styles.posterWrapper, {
                        borderColor: accentColor + '30',
                        width: previewWidth,
                        height: previewHeight,
                    }]} pointerEvents="none">
                        <View style={[styles.posterScaler, {
                            width: canvasSize.width,
                            height: canvasSize.height,
                            transform: [{ scale: previewScale }],
                            marginLeft: -(canvasSize.width * (1 - previewScale)) / 2,
                            marginTop: -(canvasSize.height * (1 - previewScale)) / 2,
                        }]}>
                            <PosterPreview interactive interactionScale={previewScale} />
                        </View>
                    </View>
                </View>

                <View style={[styles.hiddenCaptureStage, {
                    width: canvasSize.width,
                    height: canvasSize.height,
                    left: -canvasSize.width * 3,
                }]} pointerEvents="none">
                    <PosterPreview posterRef={posterRef} playVideo={false} preferStillImageForVideo />
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
                                    <Text style={styles.actionLabel}>
                                        {isPremium ? t('preview.actions.share') : t('home.actions.shareWhatsApp')}
                                    </Text>
                                    <Text style={styles.actionSub}>
                                        {isPremium
                                            ? t('preview.actions.shareSub')
                                            : t('preview.actions.shareWhatsAppSub')}
                                    </Text>
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
        borderRadius: 40,
        transform: [{ scaleX: 0.9 }, { translateY: 15 }],
    },
    glowInner: {
        position: 'absolute',
        borderRadius: 30,
        transform: [{ scaleX: 0.92 }, { translateY: 25 }],
    },
    posterWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        ...SHADOW.large,
    },
    posterScaler: {
    },
    hiddenCaptureStage: {
        position: 'absolute',
        opacity: 0,
        top: 0,
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
