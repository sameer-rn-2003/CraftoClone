// src/screens/TemplateScreen/index.js
// Premium template grid with animated category pills

import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { setSelectedTemplate } from '../../store/posterSlice';
import { TEMPLATES } from '../../services/templateService';
import BannerCard from '../../components/BannerCard';
import {
    CATEGORIES,
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    SHADOW,
} from '../../utils/constants';

// ─── Animated Back Button ─────────────────────────────────────────
const BackButton = ({ onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                style={styles.backBtn}
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 60 }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}>
                <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
            </Pressable>
        </Animated.View>
    );
};

const TemplateScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const initialCategory = route.params?.categoryId || 'all';
    const [selected, setSelected] = useState(initialCategory);

    const filtered =
        selected === 'all'
            ? TEMPLATES
            : TEMPLATES.filter(t => t.category === selected);

    const handleTemplatePress = useCallback(
        template => {
            dispatch(setSelectedTemplate(template));
            navigation.navigate('EditorScreen', { templateId: template.id });
        },
        [dispatch, navigation],
    );

    const ALL_CATEGORIES = [
        { id: 'all', label: t('categories.all'), icon: 'star-four-points-outline', color: COLORS.primary },
        ...CATEGORIES.map(c => ({ ...c, label: t(`categories.${c.id}`) })),
    ];

    const activeCategory = ALL_CATEGORIES.find(c => c.id === selected);
    const activeCatColor = activeCategory?.color || COLORS.primary;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* ── Header ─────────────────────────────── */}
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('templates.title')}</Text>
                    <Text style={styles.headerSub}>{t('templates.designCount', { count: filtered.length })}</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {/* ── Active Category accent bar ───────────── */}
            <View style={[styles.accentBar, { backgroundColor: activeCatColor + '30' }]}>
                <View style={[styles.accentBarFill, { backgroundColor: activeCatColor }]} />
            </View>

            {/* ── Category pills ──────────────────────── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillsScroll}
                contentContainerStyle={styles.pills}>
                {ALL_CATEGORIES.map(cat => {
                    const isActive = selected === cat.id;
                    const catColor = cat.color || COLORS.primary;
                    return (
                        <Pressable
                            key={cat.id}
                            style={[
                                styles.pill,
                                isActive && {
                                    backgroundColor: catColor,
                                    borderColor: catColor,
                                    ...SHADOW.small,
                                },
                            ]}
                            onPress={() => setSelected(cat.id)}>
                            <MaterialCommunityIcons
                                name={cat.icon}
                                style={[styles.pillIcon, isActive && styles.pillIconActive]}
                            />
                            <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Grid ────────────────────────────────── */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <BannerCard
                        template={item}
                        onPress={() => handleTemplatePress(item)}
                    />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    backIcon: { fontSize: 20, color: COLORS.text },
    headerCenter: { alignItems: 'center' },
    headerTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    headerRight: { width: 42 },

    // Accent bar
    accentBar: {
        height: 3,
        borderRadius: 2,
        marginHorizontal: SPACING.base,
        marginBottom: SPACING.sm,
        overflow: 'hidden',
    },
    accentBarFill: {
        width: 40,
        height: 3,
        borderRadius: 2,
    },

    // Pills
    pillsScroll: { maxHeight: 56 },
    pills: {
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        gap: 5,
    },
    pillIcon: { fontSize: 15, color: COLORS.textSecondary },
    pillIconActive: { color: COLORS.white },
    pillLabel: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        fontWeight: FONTS.weights.semiBold,
    },
    pillLabelActive: { color: COLORS.white },

    // Grid
    grid: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.xxxl, paddingTop: SPACING.sm },
    row: { justifyContent: 'space-between' },
});

export default TemplateScreen;
