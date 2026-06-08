// src/screens/PreviewScreen/index.js
// Premium full-screen poster preview with Save and Share actions

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import usePosterGenerator from '../../hooks/usePosterGenerator';
import PosterPreview, { getPosterCompositionSize } from '../../components/PosterPreview';
import MediaAudioToggle from '../../components/MediaAudioToggle';
import AppButton from '../../components/AppButton';
import { getTemplateCanvasSize } from '../../utils/templateConfig';
import { buildTemplateRenderContext } from '../../utils/templateConfig';
import mediaGenerationService from '../../services/mediaGenerationService';
import { trackTemplateActionApi } from '../../apiService/trackingApi';
import {
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    SHADOW,
} from '../../utils/constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PreviewScreen = ({ navigation, route }) => {
    const posterState = useSelector(s => s.poster);
    const { selectedTemplate, userName, isPremium } = posterState;
    const { t } = useTranslation();
    const { posterRef, savePoster, sharePoster, sharePosterToWhatsApp, isSaving, isSharing } =
        usePosterGenerator();
    const canvasSize = useMemo(() => getTemplateCanvasSize(selectedTemplate), [selectedTemplate]);
    const compositionSize = useMemo(
        () => getPosterCompositionSize(selectedTemplate, posterState),
        [posterState, selectedTemplate],
    );
    const previewScale = useMemo(() => {
        const maxWidth = SCREEN_W - SPACING.base * 2;
        const maxHeight = SCREEN_H * 0.68;
        return Math.min(maxWidth / compositionSize.width, maxHeight / compositionSize.height);
    }, [compositionSize]);
    const previewWidth = compositionSize.width * previewScale;
    const previewHeight = compositionSize.height * previewScale;
    const [isTemplateMuted, setIsTemplateMuted] = useState(true);
    const [templateHasAudio, setTemplateHasAudio] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationMessage, setGenerationMessage] = useState('');

    // FIX 2: Determine if the selected template is a video so we can show the
    // correct action buttons (Download-only for VIDEO, Save+Share for IMAGE).
    const isVideoTemplate = selectedTemplate?.mediaType === 'VIDEO';

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

    const handleGenerateHDVideo = useCallback(async () => {
        if (!selectedTemplate) return;
        try {
            setIsGenerating(true);
            setGenerationMessage('Submitting render job...');

            const renderContext = buildTemplateRenderContext({
                template: selectedTemplate,
                userPhoto: posterState.userPhoto,
                userName: posterState.userName,
                userMessage: posterState.userMessage,
                premiumProfile: posterState.premiumProfile,
            });

            const res = await mediaGenerationService.startMediaGeneration({ template_id: selectedTemplate.id, context: renderContext });
            const jobId = res?.jobId ?? res?.id ?? res?.job_id ?? res?.data?.jobId;
            if (!jobId) throw new Error('No job id returned by server');

            setGenerationMessage('Rendering on server...');
            const status = await mediaGenerationService.pollMediaStatus(jobId, {
                interval: 2000,
                maxAttempts: 120,
                onProgress: s => setGenerationMessage(s?.status || s?.state || JSON.stringify(s)),
            });

            const url = status?.url || status?.result_url || status?.download_url;
            if (!url) throw new Error('No output URL from render');

            setGenerationMessage('Downloading generated media...');
            const filePath = await mediaGenerationService.downloadGeneratedMedia(url, `crafto_${selectedTemplate.id}_${Date.now()}`);

            Alert.alert('Saved', `File saved to ${filePath}`);

            try { await trackTemplateActionApi(String(selectedTemplate.id), { action: 'download' }); } catch (e) { /* ignore */ }

        } catch (e) {
            console.error('Video generation error', e);
            Alert.alert('Render failed', String(e?.message || e));
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
        }
    }, [selectedTemplate, posterState]);

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
                            width: compositionSize.width,
                            height: compositionSize.height,
                            transform: [{ scale: previewScale }],
                            marginLeft: -(compositionSize.width * (1 - previewScale)) / 2,
                            marginTop: -(compositionSize.height * (1 - previewScale)) / 2,
                        }]}>
                            <PosterPreview
                                interactive
                                interactionScale={previewScale}
                                mediaMuted={isTemplateMuted}
                                onMediaAudioStateChange={setTemplateHasAudio}
                            />
                        </View>
                    </View>
                    <MediaAudioToggle
                        visible={isVideoTemplate}
                        muted={isTemplateMuted}
                        hasAudio={templateHasAudio}
                        onPress={() => setIsTemplateMuted(prev => !prev)}
                        style={styles.mediaAudioToggle}
                    />
                </View>

                <View style={[styles.hiddenCaptureStage, {
                    width: canvasSize.width,
                    height: compositionSize.height,
                    left: -canvasSize.width * 3,
                }]} pointerEvents="none">
                    <PosterPreview
                        posterRef={posterRef}
                        playVideo={false}
                        preferStillImageForVideo
                        enablePhotoAnimation={false}
                    />
                </View>

                {/* ── Action buttons ─────────────────────────────────────────
                    FIX 2:
                    • VIDEO template → single full-width Download button
                    • IMAGE template → Save + Share side by side (original layout)
                ─────────────────────────────────────────────────────────── */}
                <View style={styles.actions}>
                    {isVideoTemplate ? (
                        /* ── VIDEO: Download + Generate HD option ── */
                        <View style={{ width: '100%' }}>
                            {/* <Pressable
                                style={[styles.actionBtn, styles.downloadBtn, isSaving && styles.btnDisabled]}
                                onPress={handleSave}
                                disabled={isSaving || isSharing}>
                                {isSaving ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="download" style={styles.actionIcon} />
                                        <View>
                                            <Text style={styles.actionLabel}>
                                                {t('preview.actions.download', { defaultValue: 'Download' })}
                                            </Text>
                                            <Text style={styles.actionSub}>
                                                {t('preview.actions.downloadSub', { defaultValue: 'Save video to gallery' })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </Pressable> */}

                            <Pressable
                                style={[styles.actionBtn, { marginTop: 12, backgroundColor: '#3B82F6' }, isGenerating && styles.btnDisabled]}
                                onPress={handleGenerateHDVideo}
                                disabled={isGenerating || isSaving || isSharing}>
                                {isGenerating ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        {/* <MaterialCommunityIcons name="render" style={styles.actionIcon} /> */}
                                        <View>
                                            <Text style={styles.actionLabel}>Generate HD Video</Text>
                                            <Text style={styles.actionSub}>High-quality server render (may take longer)</Text>
                                        </View>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    ) : (
                        /* ── IMAGE: Save + Share ── */
                        <>
                            <Pressable
                                style={[styles.actionBtn, { backgroundColor: '#5B6CFF' }, isSaving && styles.btnDisabled]}
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
                        </>
                    )}
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
    mediaAudioToggle: {
        right: 12,
        bottom: 12,
        zIndex: 20,
    },
    hiddenCaptureStage: {
        position: 'absolute',
        opacity: 0,
        top: 0,
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
    // FIX 2: Download button takes full width when video template
    downloadBtn: {
        backgroundColor: '#5B6CFF',
        flex: 1,
    },
    shareBtn: { backgroundColor: '#5B6CFF' },
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
