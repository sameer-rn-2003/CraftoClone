// src/components/BackendMediaPicker/index.js
// Professional backend template browser.
// Renders pixel-accurate scaled mini-poster previews for each backend template —
// including the exact photoFrame position and name/message text-bar positions.
// Tapping a template dispatches setSelectedTemplate() to Redux.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { setSelectedTemplate } from '../../store/posterSlice';
import { fetchBackendTemplates } from '../../services/backendMediaService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/constants';

// ─── Poster canvas constants (must match PosterPreview) ───────────
const POSTER_W = 400;
const POSTER_H = 560;

// ─── Card size: 2 per row with gap ───────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const GAP = SPACING.md;
const H_PAD = SPACING.base;
const CARD_W = (SCREEN_W - H_PAD * 2 - GAP) / 2;
const CARD_H = CARD_W * (POSTER_H / POSTER_W);
const S = CARD_W / POSTER_W;

const PatternOverlay = ({ pattern, color }) => {
    if (pattern === 'diagonal') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(6)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', height: 12, width: '250%',
                    top: -10 + i * 20, left: -20,
                    backgroundColor: color + '22',
                    transform: [{ rotate: '-30deg' }],
                }} />
            ))}
        </View>
    );
    if (pattern === 'circles') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[60, 42, 24].map((sz, i) => (
                <View key={i} style={{
                    position: 'absolute', width: sz, height: sz,
                    borderRadius: sz / 2, borderWidth: 1.5,
                    borderColor: color + '30',
                    top: i % 2 === 0 ? -sz / 3 : undefined,
                    bottom: i % 2 !== 0 ? -sz / 3 : undefined,
                    right: i < 2 ? -sz / 3 : undefined,
                    left: i >= 2 ? -sz / 4 : undefined,
                }} />
            ))}
        </View>
    );
    if (pattern === 'dots') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(9)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', width: 4, height: 4, borderRadius: 2,
                    backgroundColor: color + '40',
                    top: Math.floor(i / 3) * 18 + 8,
                    left: (i % 3) * 22 + 8,
                }} />
            ))}
        </View>
    );
    if (pattern === 'waves') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(4)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', height: 18,
                    width: CARD_W + 20, left: -10, top: i * 22 - 8,
                    borderRadius: 10, borderWidth: 1.5,
                    borderColor: color + '28',
                    transform: [{ rotate: '-6deg' }],
                }} />
            ))}
        </View>
    );
    return null;
};

const TemplateCard = ({ template, isSelected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const onPressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 60 }),
            Animated.timing(glowAnim, { toValue: 1, useNativeDriver: false, duration: 120 }),
        ]).start();
    };
    const onPressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
            Animated.timing(glowAnim, { toValue: 0, useNativeDriver: false, duration: 300 }),
        ]).start();
    };

    const {
        backgroundColor, accentColor, headerColor, footerColor,
        pattern, layout = 'top', photoFrame, textFields = [], name,
    } = template;

    // ── Scale photoFrame to card space ────────────────────────────
    const pf = {
        x: photoFrame.x * S,
        y: photoFrame.y * S,
        w: photoFrame.width * S,
        h: photoFrame.height * S,
        r: Math.min(photoFrame.borderRadius * S, (photoFrame.width * S) / 2),
    };
    const iconSize = Math.min(pf.w, pf.h) * 0.40;

    // ── Scale text field Y positions ──────────────────────────────
    const nameField = textFields.find(f => f.key === 'name');
    const msgField = textFields.find(f => f.key === 'message');

    const nameY = (nameField?.y ?? POSTER_H * 0.57) * S;
    const nameX = nameField?.x !== undefined ? nameField.x * S : CARD_W * 0.08;
    const nameW = nameField?.fieldWidth ? nameField.fieldWidth * S : CARD_W * 0.84;

    const msgY = (msgField?.y ?? (nameField?.y ?? POSTER_H * 0.57) + 40) * S;
    const msgX = msgField?.x !== undefined ? msgField.x * S : CARD_W * 0.16;
    const msgW = msgField?.fieldWidth ? msgField.fieldWidth * S * 0.8 : CARD_W * 0.68;

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border + '00', accentColor + '99'],
    });

    const selectedBorderColor = isSelected ? accentColor : COLORS.border + '00';

    return (
        // Outer: scale (native driver)
        <Animated.View style={[
            styles.cardOuter,
            { transform: [{ scale: scaleAnim }] },
        ]}>
            {/* Inner: border color (JS driver) */}
            <Animated.View style={[
                styles.cardInner,
                { borderColor: isSelected ? selectedBorderColor : borderColor },
            ]}>
                <Pressable
                    style={[styles.card, { backgroundColor }]}
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>

                    {/* ── 1. Background header ─────────────────── */}
                    {layout === 'left' ? (
                        <View style={[styles.leftBar, {
                            backgroundColor: headerColor,
                            width: CARD_W * 0.42,
                        }]}>
                            <PatternOverlay pattern={pattern} color={accentColor} />
                            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: accentColor }} />
                        </View>
                    ) : (
                        <View style={{ height: CARD_H * 0.48, overflow: 'hidden', backgroundColor: headerColor }}>
                            <PatternOverlay pattern={pattern} color={accentColor} />
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: accentColor }} />
                        </View>
                    )}

                    {/* ── 2. Photo frame placeholder ──────────── */}
                    <View style={{
                        position: 'absolute',
                        left: pf.x, top: pf.y, width: pf.w, height: pf.h,
                        borderRadius: pf.r,
                        borderWidth: 2, borderColor: accentColor,
                        backgroundColor: COLORS.card + 'DD',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <MaterialCommunityIcons name="account-outline" size={iconSize} color={accentColor} />
                    </View>

                    {/* ── 3. Name bar (at exact scaled Y position) ── */}
                    <View style={{
                        position: 'absolute',
                        left: nameX, top: nameY,
                        width: Math.min(nameW, CARD_W - nameX - 4),
                        height: 7, borderRadius: 4,
                        backgroundColor: accentColor + '90',
                    }} />

                    {/* ── 4. Message bar (at exact scaled Y position) */}
                    <View style={{
                        position: 'absolute',
                        left: msgX, top: msgY,
                        width: Math.min(msgW, CARD_W - msgX - 4),
                        height: 5, borderRadius: 3,
                        backgroundColor: accentColor + '50',
                    }} />

                    {/* ── 5. Footer strip ─────────────────────── */}
                    <View style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 14, backgroundColor: footerColor,
                    }} />

                    {/* ── 6. Selected checkmark ─────────────────── */}
                    {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: accentColor }]}>
                            <MaterialCommunityIcons name="check" style={styles.checkIcon} />
                        </View>
                    )}

                    {/* ── 7. Name badge at bottom ──────────────── */}
                    <View style={styles.nameBadgeWrapper}>
                        <View style={[styles.nameBadge, { borderColor: accentColor + '50' }]}>
                            <View style={[styles.nameDot, { backgroundColor: accentColor }]} />
                            <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
                        </View>
                    </View>

                </Pressable>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Category filter chip ─────────────────────────────────────────
const CategoryChip = ({ label, isActive, onPress }) => (
    <Pressable style={[styles.chip, isActive && styles.chipActive]} onPress={onPress}>
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </Pressable>
);

// ─── Main component ───────────────────────────────────────────────
const BackendMediaPicker = () => {
    const dispatch = useDispatch();
    const selectedId = useSelector(s => s.poster.selectedTemplate?.id);
    const { t } = useTranslation();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('all');
    const [categories, setCategories] = useState(['all']);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // ── Fetch ──────────────────────────────────────────────────────
    const load = useCallback(async (opts = {}) => {
        const pg = opts.page ?? 1;
        const cat = opts.category ?? category;
        const first = pg === 1;

        first ? setLoading(true) : setLoadingMore(true);
        setError(null);

        try {
            const items = await fetchBackendTemplates({ page: pg, limit: 20, category: cat });

            if (first) {
                setTemplates(items);
                // Build dynamic category list from results
                const cats = ['all', ...new Set(items.map(t => t.category).filter(Boolean))];
                setCategories(cats);
            } else {
                setTemplates(prev => [...prev, ...items]);
            }
            setHasMore(items.length === 20);
        } catch (e) {
            setError(e.message ?? t('backendMedia.failedToLoad'));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [category, t]);

    useEffect(() => {
        setPage(1);
        load({ page: 1, category });
    }, [category, load]);

    const handleSelect = useCallback((template) => {
        dispatch(setSelectedTemplate(template));
    }, [dispatch]);

    const handleEndReached = useCallback(() => {
        if (!loadingMore && hasMore) {
            const next = page + 1;
            setPage(next);
            load({ page: next });
        }
    }, [loadingMore, hasMore, page, load]);

    const renderItem = useCallback(({ item }) => (
        <TemplateCard
            template={item}
            isSelected={selectedId === item.id}
            onPress={() => handleSelect(item)}
        />
    ), [selectedId, handleSelect]);

    const renderFooter = () => loadingMore
        ? <View style={styles.footerLoader}><ActivityIndicator color={COLORS.primary} /></View>
        : null;

    // ── Loading ────────────────────────────────────────────────────
    if (loading) return (
        <View style={styles.stateBox}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.stateText}>{t('backendMedia.loadingTemplates')}</Text>
        </View>
    );

    // ── Error ──────────────────────────────────────────────────────
    if (error) return (
        <View style={styles.stateBox}>
            <MaterialCommunityIcons name="alert-circle-outline" style={styles.stateIcon} />
            <Text style={styles.stateTitle}>{t('backendMedia.couldntLoad')}</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load({ page: 1, category })}>
                <Text style={styles.retryText}>{t('backendMedia.retry')}</Text>
            </Pressable>
        </View>
    );

    // ── Empty ──────────────────────────────────────────────────────
    if (templates.length === 0) return (
        <View style={styles.stateBox}>
            <MaterialCommunityIcons name="inbox-outline" style={styles.stateIcon} />
            <Text style={styles.stateTitle}>{t('backendMedia.noTemplates')}</Text>
            <Text style={styles.stateText}>
                {t('backendMedia.setApiUrlIn')}{'\n'}
                <Text style={styles.codeText}>services/backendMediaService.js</Text>
            </Text>
            <Pressable style={styles.retryBtn} onPress={() => load({ page: 1, category })}>
                <Text style={styles.retryText}>{t('backendMedia.retry')}</Text>
            </Pressable>
        </View>
    );

    // ── Grid ───────────────────────────────────────────────────────
    return (
        <View style={styles.root}>

            {/* Category chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}>
                {categories.map(cat => (
                    <CategoryChip
                        key={cat}
                        label={cat === 'all'
                            ? t('categories.all')
                            : t(`categories.${cat}`, { defaultValue: cat.charAt(0).toUpperCase() + cat.slice(1) })}
                        isActive={category === cat}
                        onPress={() => setCategory(cat)}
                    />
                ))}
            </ScrollView>

            {/* Count badge + refresh */}
            <View style={styles.metaRow}>
                <Text style={styles.metaCount}>{t('backendMedia.templatesCount', { count: templates.length })}</Text>
                <Pressable style={styles.refreshBtn} onPress={() => load({ page: 1, category })}>
                    <MaterialCommunityIcons name="refresh" style={styles.refreshIcon} />
                    <Text style={styles.refreshText}>{t('backendMedia.refresh')}</Text>
                </Pressable>
            </View>

            {/* Grid */}
            <FlatList
                data={templates}
                keyExtractor={t => t.id}
                numColumns={2}
                renderItem={renderItem}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                ListFooterComponent={renderFooter}
                scrollEnabled={false}   // parent ScrollView handles scroll
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { gap: SPACING.sm },

    // ── Category chips ────────────────────────────────────────────
    chipScroll: { marginBottom: SPACING.xs },
    chipRow: { gap: SPACING.sm, paddingHorizontal: 2 },
    chip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        fontWeight: FONTS.weights.medium,
        textTransform: 'capitalize',
    },
    chipTextActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },

    // ── Meta row ─────────────────────────────────────────────────
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        marginBottom: SPACING.xs,
    },
    metaCount: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        fontWeight: FONTS.weights.medium,
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    refreshIcon: { fontSize: 14, color: COLORS.primary },
    refreshText: { fontSize: FONTS.sizes.xs, color: COLORS.primaryLight, fontWeight: FONTS.weights.semiBold },

    // ── Grid ─────────────────────────────────────────────────────
    grid: { paddingHorizontal: 0 },
    row: { justifyContent: 'space-between', marginBottom: GAP },

    // ── Template card (outer = native scale, inner = JS border) ──
    cardOuter: {
        width: CARD_W,
        ...SHADOW.medium,
    },
    cardInner: {
        width: CARD_W,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 2,
        overflow: 'hidden',
    },
    card: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    leftBar: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        overflow: 'hidden',
    },

    // Selected checkmark
    checkBadge: {
        position: 'absolute',
        top: 8, right: 8,
        width: 24, height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOW.small,
    },
    checkIcon: {
        fontSize: 13,
        color: COLORS.white,
        fontWeight: FONTS.weights.bold,
    },

    // Name badge
    nameBadgeWrapper: {
        position: 'absolute',
        bottom: 18,
        left: SPACING.xs,
        right: SPACING.xs,
        alignItems: 'center',
    },
    nameBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(8,8,20,0.80)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        maxWidth: '90%',
    },
    nameDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
    nameText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.white,
        flexShrink: 1,
    },

    // ── State screens ─────────────────────────────────────────────
    stateBox: {
        paddingVertical: SPACING.xxl,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    stateIcon: { fontSize: 36, color: COLORS.textMuted },
    stateTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    stateText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    codeText: {
        fontFamily: 'monospace',
        color: COLORS.primaryLight,
        fontSize: FONTS.sizes.xs,
    },
    retryBtn: {
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        ...SHADOW.small,
    },
    retryText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
        color: COLORS.white,
    },

    // Footer loader
    footerLoader: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
});

export default BackendMediaPicker;
