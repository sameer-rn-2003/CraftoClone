// src/screens/HomeScreen/index.js

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    setActiveCategory,
    setSelectedTemplate,
    setUserName,
    setUserPhoto,
} from '../../store/posterSlice';
import { TEMPLATES } from '../../services/templateService';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import { getUserProfile } from '../../utils/userStorage';
import {
    getPosterFitLayout,
    getScaledPhotoFrameStyle,
} from '../../utils/photoFrameLayout';

const COLORS = {
    pageBackground: '#F2F4F7',
    cardBackground: '#FFFFFF',
    primary: '#4D6CFF',
    primaryLight: '#EAF0FF',
    textPrimary: '#1E293B',
    textSecondary: '#93A0B5',
    border: '#D9E0EB',
    iconBg: '#E8ECF2',
    iconDefault: '#5A667C',
    dot: '#E7384A',
};

const { height: SCREEN_H } = Dimensions.get('window');
const ITEM_HEIGHT = Math.min(heightPixel(520), SCREEN_H - heightPixel(260));
const ITEM_SPACING = heightPixel(14);
const REEL_MEDIA_HEIGHT = ITEM_HEIGHT - heightPixel(160);
const HEADER_CATEGORIES = [
    { id: 'festival', icon: 'party-popper' },
    { id: 'political', icon: 'bank' },
    { id: 'birthday', icon: 'cake-variant' },
    { id: 'business', icon: 'briefcase' },
    { id: 'motivational', icon: 'auto-fix' },
];
const CATEGORY_TARGET = {
    festival: 'festival',
    political: 'political',
    birthday: 'birthday',
    business: 'business',
    motivational: 'all',
};

const TemplatePosterPreview = ({ template, userPhoto }) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const posterLayout = useMemo(
        () => getPosterFitLayout(containerSize.width, containerSize.height),
        [containerSize.height, containerSize.width],
    );

    const photoFrameStyle = useMemo(
        () => getScaledPhotoFrameStyle({
            photoFrame: template?.photoFrame,
            posterLayout,
            photoShape: 'template',
            photoPosition: { x: 0, y: 0 },
            photoScale: 1,
        }),
        [posterLayout, template?.photoFrame],
    );

    return (
        <View
            style={styles.reelMedia}
            onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                if (width !== containerSize.width || height !== containerSize.height) {
                    setContainerSize({ width, height });
                }
            }}>
            {template?.Image ? (
                <View style={{ height: "100%", width: "100%" }} >

                    <Image
                        source={template.Image}
                        style={[
                            styles.reelImage,
                            {
                                width: "100%",
                                height: "100%",
                            },
                        ]}
                        resizeMode="stretch"
                    />

                </View>
            ) : (
                <View
                    style={[
                        styles.reelFallback,
                        {
                            width: posterLayout.width,
                            height: posterLayout.height,
                            left: posterLayout.offsetX,
                            top: posterLayout.offsetY,
                            backgroundColor: template?.accentColor,
                        },
                    ]}
                />
            )}

            {userPhoto && photoFrameStyle ? (
                <View style={[styles.userPhotoFrame, photoFrameStyle]} pointerEvents="none">
                    <Image source={{ uri: userPhoto }} style={styles.userPhoto} resizeMode="cover" />
                </View>
            ) : null}
        </View>
    );
};

const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userPhoto = useSelector(state => state.poster.userPhoto);
    const { t } = useTranslation();
    const [activeCategory, setActiveCategoryUi] = useState('festival');

    const categories = useMemo(() => (
        HEADER_CATEGORIES.map(item => ({
            id: item.id,
            icon: item.icon,
            label: t(`categories.${item.id}`) || item.id,
        }))
    ), [t]);

    const reelsData = useMemo(() => TEMPLATES, []);

    useEffect(() => {
        (async () => {
            const stored = await getUserProfile();
            if (stored?.name) dispatch(setUserName(stored.name));
            if (stored?.imageUri) dispatch(setUserPhoto(stored.imageUri));
        })();
    }, [dispatch]);

    const handleCategoryPress = (id) => {
        const targetId = CATEGORY_TARGET[id] || 'all';
        setActiveCategoryUi(id);
        dispatch(setActiveCategory(targetId));
        navigation?.navigate?.('TemplateScreen', { categoryId: targetId });
    };

    const handleSeeAllPress = () => {
        setActiveCategoryUi('all');
        dispatch(setActiveCategory('all'));
        navigation?.navigate?.('TemplateScreen', { categoryId: 'all' });
    };

    const openEditor = (item) => {
        dispatch(setSelectedTemplate(item));
        navigation?.navigate?.('EditorScreen', { templateId: item.id });
    };

    const showUnderDevelopmentAlert = () => {
        Alert.alert(t('home.underDevelopment.title'), t('home.underDevelopment.message'));
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.pageBackground} />

            <View style={styles.staticHeader}>
                <View style={styles.topRow}>
                    <View style={styles.titleWrap}>
                        <View style={styles.homeBadge}>
                            <MaterialCommunityIcons name="view-grid" style={styles.homeBadgeIcon} />
                        </View>
                        <Text style={styles.homeTitle}>{t('navigation.tabs.home')}</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <Pressable style={styles.headerIconBtn} onPress={showUnderDevelopmentAlert}>
                            <MaterialCommunityIcons name="bell-outline" style={styles.headerActionIcon} />
                        </Pressable>
                        <Pressable style={styles.headerIconBtn} onPress={showUnderDevelopmentAlert}>
                            <MaterialCommunityIcons name="account-circle-outline" style={styles.headerActionIcon} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
                    <Text style={styles.searchText}>{t('home.searchPlaceholder')}</Text>
                </View>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('home.section.categories')}</Text>
                    <Pressable onPress={handleSeeAllPress}>
                        <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                    </Pressable>
                </View>

                <View style={styles.categoryRow}>
                    {categories.map(item => {
                        const isActive = activeCategory === item.id;
                        return (
                            <Pressable
                                key={item.id}
                                style={styles.categoryItem}
                                onPress={() => handleCategoryPress(item.id)}>
                                <View style={[styles.categoryIconWrap, isActive && styles.categoryIconWrapActive]}>
                                    <MaterialCommunityIcons
                                        name={item.icon}
                                        style={[styles.categoryIcon, isActive && styles.categoryIconActive]}
                                    />
                                </View>
                                <Text style={styles.categoryLabel}>{item.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <FlatList
                data={reelsData}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT + ITEM_SPACING}
                snapToAlignment="start"
                disableIntervalMomentum
                decelerationRate="fast"
                contentContainerStyle={styles.reelsContent}
                renderItem={({ item }) => (
                    <View style={{ height: ITEM_HEIGHT, marginBottom: ITEM_SPACING, width: "100%" }}   >

                        <Pressable style={styles.reelCard} onPress={() => openEditor(item)}>
                            <TemplatePosterPreview template={item} userPhoto={userPhoto} />
                            <View style={styles.reelMeta}>
                                <View style={styles.actionRow}>
                                    <Pressable style={styles.actionBtn} onPress={showUnderDevelopmentAlert}>
                                        <Text style={styles.actionText}>{t('home.actions.shareWhatsApp')}</Text>
                                    </Pressable>
                                    <Pressable style={styles.actionBtn} onPress={showUnderDevelopmentAlert}>
                                        <Text style={styles.actionText}>{t('home.actions.download')}</Text>
                                    </Pressable>
                                    <Pressable style={styles.actionBtn} onPress={showUnderDevelopmentAlert}>
                                        <Text style={styles.actionText}>{t('home.actions.edit')}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </Pressable>

                    </View>

                )}
            />

            <View style={{ height: heightPixel(30) }}>

                <Text style={{ textAlign: 'center', color: COLORS.textSecondary, fontSize: widthPixel(11), fontFamily: fonts.FONT_FAMILY.Medium }}>
                    {t('home.footerText')}
                </Text>

            </View>


        </  >
    );
};

const styles = StyleSheet.create({
    staticHeader: {
        paddingHorizontal: widthPixel(10),
        paddingTop: heightPixel(10),
        paddingBottom: heightPixel(12),
        borderBottomWidth: widthPixel(1),
        borderBottomColor: '#E6EAF1',
    },
    topRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(10),
    },
    titleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(10),
    },
    homeBadge: {
        width: widthPixel(36),
        height: heightPixel(36),
        borderRadius: widthPixel(18),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeBadgeIcon: {
        fontSize: widthPixel(14),
        color: '#FFFFFF',
    },
    homeTitle: {
        fontSize: widthPixel(18),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
        includeFontPadding: false,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(8),
    },
    headerIconBtn: {
        width: widthPixel(38),
        height: heightPixel(38),
        borderRadius: widthPixel(19),
        backgroundColor: COLORS.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionIcon: {
        fontSize: widthPixel(21),
        color: COLORS.iconDefault,
    },
    searchBar: {
        width: '100%',
        height: heightPixel(46),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.cardBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(12),
    },
    searchIcon: {
        fontSize: widthPixel(20),
        color: '#A1AECB',
        marginRight: widthPixel(8),
    },
    searchText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    dot: {
        width: widthPixel(4),
        height: heightPixel(4),
        borderRadius: widthPixel(2),
        backgroundColor: COLORS.dot,
        marginTop: heightPixel(10),
        marginBottom: heightPixel(8),
        marginLeft: widthPixel(38),
    },
    sectionHeader: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(8),
    },
    sectionTitle: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
        marginTop: heightPixel(12),
    },
    seeAllText: {
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.primary,
    },
    categoryRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoryItem: {
        width: widthPixel(64),
        alignItems: 'center',
    },
    categoryIconWrap: {
        width: widthPixel(54),
        height: heightPixel(54),
        borderRadius: widthPixel(15),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F2F6',
    },
    categoryIconWrapActive: {
        backgroundColor: COLORS.primary,
    },
    categoryIcon: {
        fontSize: widthPixel(22),
        color: COLORS.iconDefault,
    },
    categoryIconActive: {
        color: '#FFFFFF',
    },
    categoryLabel: {
        marginTop: heightPixel(6),
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#384457',
        textAlign: 'center',
    },
    reelsContent: {
        paddingHorizontal: widthPixel(20),
        // paddingBottom: heightPixel(96),
        paddingTop: ITEM_SPACING,
    },
    reelCard: {
        width: '100%',
        height: heightPixel(420),
        borderRadius: widthPixel(20),
        // backgroundColor: COLORS.cardBackground,
        backgroundColor: COLORS.cardBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: ITEM_SPACING,
        justifyContent: 'flex-start',
        shadowColor: '#15213A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    reelMedia: {
        width: '100%',
        height: REEL_MEDIA_HEIGHT,
        backgroundColor: 'red',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reelImage: {
    },
    reelFallback: {
        position: 'absolute',
        borderRadius: widthPixel(18),
    },
    userPhotoFrame: {
        position: 'absolute',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    userPhoto: {
        width: '100%',
        height: '100%',
    },
    reelMeta: {
        width: '100%',
        height: heightPixel(160),
        paddingHorizontal: widthPixel(16),
        paddingVertical: heightPixel(12),
    },
    reelTitle: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
        marginBottom: heightPixel(3),
    },
    reelTag: {
        fontSize: widthPixel(10),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    actionRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: heightPixel(10),
        gap: widthPixel(6),
    },
    actionBtn: {
        flex: 1,
        minWidth: widthPixel(92),
        height: heightPixel(34),
        borderRadius: widthPixel(10),
        backgroundColor: COLORS.primaryLight,
        borderWidth: widthPixel(1),
        borderColor: '#D5DFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: widthPixel(6),
    },
    actionText: {
        fontSize: widthPixel(9.2),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.primary,
        textAlign: 'center',
        includeFontPadding: false,
    },
    changeImageBtn: {
        height: heightPixel(34),
        borderRadius: widthPixel(10),
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFBFF',
    },
    changeImageText: {
        fontSize: widthPixel(10.5),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.primary,
    },
});

export default HomeScreen;
