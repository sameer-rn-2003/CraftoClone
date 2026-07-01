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
    DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import usePosterGenerator from '../../hooks/usePosterGenerator';
import PosterPreview, { getPosterCompositionSize } from '../../components/PosterPreview';
import MediaAudioToggle from '../../components/MediaAudioToggle';
import AppButton from '../../components/AppButton';
import { getTemplateCanvasSize, buildTemplateRenderConfig, buildTemplateRenderContext } from '../../utils/templateConfig';
import mediaGenerationService from '../../services/mediaGenerationService';
import { shareImage } from '../../services/imageService';
import { trackTemplateActionApi } from '../../apiService/trackingApi';
import { uploadUserPhotoToS3, uploadBackgroundToS3 } from '../../utils/helpers';
import {
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    SHADOW,
} from '../../utils/constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HOME_METRIC_EVENTS_KEY = 'home_metric_events';
const HOME_METRIC_EVENT_NAME = 'home_metric_event';

const PreviewScreen = ({ navigation, route }) => {
    const posterState = useSelector(s => s.poster);
    const { selectedTemplate, userName } = posterState;
    const { t } = useTranslation();
    const { posterRef } = usePosterGenerator();
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

    const accentColor = selectedTemplate?.accentColor || COLORS.primary;

    const queueHomeMetricUpdate = useCallback(async action => {
        if (!selectedTemplate?.id) return;

        try {
            const raw = await AsyncStorage.getItem(HOME_METRIC_EVENTS_KEY);
            const events = raw ? JSON.parse(raw) : [];
            const nextEvents = Array.isArray(events) ? events : [];
            const event = {
                eventId: `${selectedTemplate.id}_${action}_${Date.now()}`,
                templateId: String(selectedTemplate.id),
                key: action === 'share' ? 'share_count' : 'download_count',
                createdAt: Date.now(),
            };
            nextEvents.push(event);
            await AsyncStorage.setItem(HOME_METRIC_EVENTS_KEY, JSON.stringify(nextEvents));
            DeviceEventEmitter.emit(HOME_METRIC_EVENT_NAME, event);
        } catch (e) {
            console.warn('Unable to queue home metric update:', e?.message || e);
        }
    }, [selectedTemplate?.id]);

    const generateMediaFile = useCallback(async () => {
        if (!selectedTemplate) return;
        const userAnimId = posterState.userPhotoAnimation || 'none';
        const mediaType = isVideoTemplate
            ? 'VIDEO'
            : (userAnimId !== 'none' ? 'VIDEO' : 'IMAGE');

        const [photoUrl, bgUrl] = await Promise.all([
            uploadUserPhotoToS3(posterState.userPhoto),
            uploadBackgroundToS3(selectedTemplate.source),
        ]);

        const templateWithBg = bgUrl ? { ...selectedTemplate, source: bgUrl } : selectedTemplate;

        const renderContext = buildTemplateRenderContext({
            template: templateWithBg,
            userPhoto: photoUrl,
            userName: posterState.userName,
            userMessage: posterState.userMessage,
            premiumProfile: posterState.premiumProfile,
        });
        const renderConfig = buildTemplateRenderConfig({
            template: templateWithBg,
            posterState: { ...posterState, userPhoto: photoUrl },
            userData: renderContext,
        });

        setGenerationMessage(`Submitting ${mediaType.toLowerCase()} render...`);
        const payload = {
            type: mediaType,
            user_data: renderContext,
            render_config: renderConfig,
        };
        if (selectedTemplate.id) {
            payload.template_id = selectedTemplate.id;
        }
        const res = await mediaGenerationService.startMediaGeneration(payload);
        const jobId = res?.jobId ?? res?.id ?? res?.job_id ?? res?.data?.jobId;
        if (!jobId) throw new Error('No job id returned by server');

        setGenerationMessage(`Rendering ${mediaType.toLowerCase()}...`);
        const status = await mediaGenerationService.pollMediaStatus(jobId, {
            interval: 2000,
            maxAttempts: 120,
            onProgress: s => {
                const state = s?.status || s?.state;
                if (state) setGenerationMessage(`Rendering ${mediaType.toLowerCase()}: ${state}`);
            },
        });

        const url = mediaGenerationService.getGeneratedMediaUrl(status);
        if (!url) throw new Error('No output URL from render');

        setGenerationMessage(`Saving ${mediaType.toLowerCase()}...`);
        return mediaGenerationService.downloadGeneratedMedia(
            url,
            `craftkaro_${mediaType.toLowerCase()}_${selectedTemplate.id}_${Date.now()}`,
            mediaType,
        );
    }, [isVideoTemplate, posterState, selectedTemplate]);

    const handleSave = useCallback(async () => {
        try {
            setIsGenerating(true);
            const filePath = await generateMediaFile();
            Alert.alert('Saved', `${isVideoTemplate ? 'Video' : 'Image'} saved to ${filePath}`);
            try { await trackTemplateActionApi(String(selectedTemplate.id), { action: 'download' }); } catch (e) { /* ignore */ }
            await queueHomeMetricUpdate('download');
        } catch (e) {
            console.error('Media save error', e);
            Alert.alert('Render failed', String(e?.message || e));
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
        }
    }, [generateMediaFile, isVideoTemplate, queueHomeMetricUpdate, selectedTemplate]);

    const handleShare = useCallback(async () => {
        try {
            setIsGenerating(true);
            const filePath = await generateMediaFile();
            const didShare = await shareImage(filePath, `Check out my ${isVideoTemplate ? 'video' : 'image'} made with CraftKaro!`);
            if (didShare) {
                try { await trackTemplateActionApi(String(selectedTemplate.id), { action: 'share' }); } catch (e) { /* ignore */ }
                await queueHomeMetricUpdate('share');
            }
        } catch (e) {
            console.error('Media share errorr', e);
            Alert.alert('Render failedd', String(e?.message || e));
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
        }
    }, [generateMediaFile, isVideoTemplate, queueHomeMetricUpdate, selectedTemplate]);

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
                    }]}>
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

                <View style={styles.actions}>
                    {isVideoTemplate ? (
                        <>
                            <Pressable
                                style={[styles.actionBtn, styles.downloadBtn, isGenerating && styles.btnDisabled]}
                                onPress={handleSave}
                                disabled={isGenerating}>
                                {isGenerating ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="download" style={styles.actionIcon} />
                                        <View>
                                            <Text style={styles.actionLabel}>
                                                {t('preview.actions.download', { defaultValue: 'Download' })}
                                            </Text>
                                            <Text style={styles.actionSub}>
                                                {t('preview.actions.downloadSub', { defaultValue: 'to Downloads' })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </Pressable>

                            <Pressable
                                style={[styles.actionBtn, styles.shareBtn, isGenerating && styles.btnDisabled]}
                                onPress={handleShare}
                                disabled={isGenerating}>
                                {isGenerating ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="share-variant-outline" style={styles.actionIcon} />
                                        <View>
                                            <Text style={styles.actionLabel}>
                                                {t('preview.actions.share')}
                                            </Text>
                                            <Text style={styles.actionSub}>
                                                {t('preview.actions.shareSub')}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                style={[styles.actionBtn, styles.saveBtn, isGenerating && styles.btnDisabled]}
                                onPress={handleSave}
                                disabled={isGenerating}>
                                {isGenerating ? (
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
                                style={[styles.actionBtn, styles.shareBtn, isGenerating && styles.btnDisabled]}
                                onPress={handleShare}
                                disabled={isGenerating}>
                                {isGenerating ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="share-variant-outline" style={styles.actionIcon} />
                                        <View>
                                            <Text style={styles.actionLabel}>
                                                {t('preview.actions.share')}
                                            </Text>
                                            <Text style={styles.actionSub}>
                                                {t('preview.actions.shareSub')}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </Pressable>
                        </>
                    )}
                </View>

                {isGenerating && generationMessage ? (
                    <Text style={styles.generationMessage}>{generationMessage}</Text>
                ) : null}

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
    saveBtn: { backgroundColor: '#5B6CFF' },
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
    generationMessage: {
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.base,
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
