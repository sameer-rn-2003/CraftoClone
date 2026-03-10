// src/screens/HomeScreen/index.js
// Premium landing screen — hero header, glassmorphism search, elevated category cards

import React, { useCallback, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { setActiveCategory } from '../../store/posterSlice';
import { TEMPLATES } from '../../services/templateService';
import BannerCard from '../../components/BannerCard';
import {
    COLORS,
    FONTS,
    SPACING,
    BORDER_RADIUS,
    CATEGORIES,
    SHADOW,
} from '../../utils/constants';

// ─── Animated Category Card ───────────────────────────────────────
const CategoryCard = ({ category, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 60 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.categoryCardWrapper]}>
            <Pressable
                style={[styles.categoryCard, { borderColor: category.color + '40' }]}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                android_ripple={{ color: category.color + '20' }}>
                {/* Gradient-like glowing bg */}
                <View style={[styles.categoryGlow, { backgroundColor: category.color + '18' }]} />

                <View style={[styles.categoryIconBg, {
                    backgroundColor: category.color + '22',
                    borderColor: category.color + '40',
                }]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryArrow}>→</Text>

                {/* Bottom accent strip */}
                <View style={[styles.categoryAccent, { backgroundColor: category.color }]} />
            </Pressable>
        </Animated.View>
    );
};

// ─── Screen ───────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const activeCategory = useSelector(s => s.poster.activeCategory);

    const featuredTemplates = TEMPLATES.slice(0, 6);

    const handleCategoryPress = useCallback(
        catId => {
            dispatch(setActiveCategory(catId));
            navigation.navigate('TemplateScreen', { categoryId: catId });
        },
        [dispatch, navigation],
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {/* ── Hero Header ─────────────────────────────── */}
                <View style={styles.hero}>
                    {/* Decorative orb */}
                    <View style={styles.heroOrb} />
                    <View style={styles.heroOrb2} />

                    <View style={styles.heroContent}>
                        <View style={styles.heroBadge}>
                            <View style={styles.heroBadgeDot} />
                            <Text style={styles.heroBadgeText}>AI Poster Studio</Text>
                        </View>
                        <Text style={styles.heroTitle}>
                            Create{'\n'}
                            <Text style={styles.heroTitleAccent}>Stunning</Text> Posters
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Pick a template, personalize, share in seconds
                        </Text>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>🎨</Text>
                        <View style={styles.avatarGlow} />
                    </View>
                </View>

                {/* ── Search bar ──────────────────────────────── */}
                <Pressable
                    style={styles.searchBar}
                    onPress={() => navigation.navigate('TemplateScreen', { categoryId: 'all' })}>
                    <View style={styles.searchIconWrapper}>
                        <Text style={styles.searchIcon}>🔍</Text>
                    </View>
                    <Text style={styles.searchPlaceholder}>Search templates…</Text>
                    <View style={styles.searchChip}>
                        <Text style={styles.searchChipText}>Explore</Text>
                    </View>
                </Pressable>

                {/* ── Section: Categories ─────────────────────── */}
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionLabel}>EXPLORE</Text>
                        <Text style={styles.sectionTitle}>Categories</Text>
                    </View>
                </View>

                <View style={styles.categoryGrid}>
                    {CATEGORIES.map(cat => (
                        <CategoryCard
                            key={cat.id}
                            category={cat}
                            onPress={() => handleCategoryPress(cat.id)}
                        />
                    ))}
                </View>

                {/* ── Section: Featured ───────────────────────── */}
                <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
                    <View>
                        <Text style={styles.sectionLabel}>HANDPICKED</Text>
                        <Text style={styles.sectionTitle}>Featured</Text>
                    </View>
                    <Pressable
                        style={styles.seeAllBtn}
                        onPress={() => navigation.navigate('TemplateScreen', { categoryId: 'all' })}>
                        <Text style={styles.seeAllText}>See all</Text>
                        <Text style={styles.seeAllArrow}>→</Text>
                    </Pressable>
                </View>

                <FlatList
                    data={featuredTemplates}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <BannerCard
                            template={item}
                            onPress={() => navigation.navigate('EditorScreen', { templateId: item.id })}
                        />
                    )}
                />

                <View style={{ height: SPACING.xxxl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },

    // ── Hero ──────────────────────────────────────────────────────
    hero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xl,
        marginTop: SPACING.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    heroOrb: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: COLORS.primary + '10',
        top: -60,
        left: -40,
    },
    heroOrb2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.secondary + '08',
        bottom: -30,
        right: 40,
    },
    heroContent: { flex: 1 },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    heroBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent,
    },
    heroBadgeText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.accent,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: FONTS.sizes.xxxl,
        fontWeight: FONTS.weights.black,
        color: COLORS.text,
        lineHeight: 42,
        marginBottom: SPACING.sm,
    },
    heroTitleAccent: {
        color: COLORS.primaryLight,
    },
    heroSubtitle: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        lineHeight: 18,
        maxWidth: 180,
    },
    avatar: {
        marginLeft: SPACING.md,
        position: 'relative',
    },
    avatarEmoji: {
        fontSize: 42,
    },
    avatarGlow: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + '15',
        top: -4,
        left: -4,
    },

    // ── Search ────────────────────────────────────────────────────
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        gap: SPACING.sm,
        ...SHADOW.small,
    },
    searchIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchIcon: { fontSize: 14 },
    searchPlaceholder: {
        flex: 1,
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.base,
    },
    searchChip: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    searchChipText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.primaryLight,
        fontWeight: FONTS.weights.semiBold,
    },

    // ── Sections ──────────────────────────────────────────────────
    sectionLabel: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: SPACING.base,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.primary + '14',
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.primary + '35',
    },
    seeAllText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.primaryLight,
        fontWeight: FONTS.weights.semiBold,
    },
    seeAllArrow: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.primaryLight,
    },

    // ── Category Grid ──────────────────────────────────────────────
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    categoryCardWrapper: {
        width: '48%',
    },
    categoryCard: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.base,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    categoryGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: BORDER_RADIUS.xl,
    },
    categoryIconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    categoryIcon: { fontSize: 26 },
    categoryLabel: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    categoryArrow: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    categoryAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },

    // ── Featured Grid ─────────────────────────────────────────────
    columnWrapper: { justifyContent: 'space-between' },
});

export default HomeScreen;
