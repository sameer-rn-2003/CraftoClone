// src/screens/HomeScreen/index.js

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
    setActiveCategory,
    hydratePremiumProfile,
    setPremiumStatus,
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
import usePosterGenerator from '../../hooks/usePosterGenerator';
import PosterPreview from '../../components/PosterPreview';

const COLORS = {
    pageBackground: '#F1F1F1',
    headerBackground: '#C9E6F7',
    cardBackground: '#FFFFFF',
    primary: '#0D62DF',
    textPrimary: '#101417',
    textSecondary: '#6B7280',
    border: '#9EB3C6',
    chipBackground: '#D5E5F1',
    chipActiveText: '#FFFFFF',
    chipText: '#111827',
    actionPanel: '#EFEFF0',
};

const { height: SCREEN_H } = Dimensions.get('window');
const ITEM_SPACING = heightPixel(14);
const REEL_MEDIA_HEIGHT = Math.min(heightPixel(420), SCREEN_H - heightPixel(320));
const META_HEIGHT = heightPixel(114);
const ITEM_HEIGHT = REEL_MEDIA_HEIGHT + META_HEIGHT;
const CHIP_HEIGHT = heightPixel(34);
const CHIP_GAP = widthPixel(8);
const MAX_CATEGORY_LINES = 2;
const CATEGORY_PREVIEW_HEIGHT = CHIP_HEIGHT * MAX_CATEGORY_LINES + CHIP_GAP + heightPixel(40);

const HEADER_CHIPS = [
    { id: 'all', icon: null, labelKey: 'categories.all' },
    { id: 'birthday', icon: 'cake-variant-outline', labelKey: 'categories.birthday' },
    { id: 'festival', icon: 'party-popper', labelKey: 'categories.festival' },
    { id: 'political', icon: 'bank-outline', labelKey: 'categories.political' },
    { id: 'motivational', icon: 'lightbulb-on-outline', labelKey: 'categories.motivational' },
    { id: 'business', icon: 'briefcase-outline', labelKey: 'categories.business' },
];

const CATEGORY_TARGET = {
    all: 'all',
    birthday: 'birthday',
    festival: 'festival',
    political: 'political',
    motivational: 'all',
    business: 'business',
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
                <Image source={template.Image} style={styles.reelImage} resizeMode="cover" />
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
    const userName = useSelector(state => state.poster.userName);
    const userMessage = useSelector(state => state.poster.userMessage);
    const { t } = useTranslation();
    const { posterRef, savePoster, sharePosterToWhatsApp, isSaving, isSharing } = usePosterGenerator();
    const [activeCategory, setActiveCategoryUi] = useState('all');
    const flatListRef = useRef(null);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [hasOverflowCategories, setHasOverflowCategories] = useState(false);
    const isActionInProgress = isSaving || isSharing;

    const whatsappCaption = useMemo(() => {
        const text = (userMessage || '').trim();
        const name = (userName || '').trim();
        if (text && name) return `${text}\n- ${name}`;
        if (text) return text;
        if (name) return name;
        return '';
    }, [userMessage, userName]);

    const chips = useMemo(
        () =>
            HEADER_CHIPS.map(item => ({
                id: item.id,
                icon: item.icon,
                label: item.label || t(item.labelKey),
            })),
        [t],
    );

    const reelsData = useMemo(() => {
        const categoryId = CATEGORY_TARGET[activeCategory] || 'all';
        if (categoryId === 'all') return TEMPLATES;
        const filtered = TEMPLATES.filter(item => item.category === categoryId);
        return filtered.length ? filtered : TEMPLATES;
    }, [activeCategory]);

    useEffect(() => {
        (async () => {
            const stored = await getUserProfile();
            if (stored?.name) dispatch(setUserName(stored.name));
            if (stored?.imageUri) dispatch(setUserPhoto(stored.imageUri));
            dispatch(setPremiumStatus(!!stored?.isPremium));
            if (stored?.premiumProfile) {
                dispatch(hydratePremiumProfile(stored.premiumProfile));
            }
        })();
    }, [dispatch]);

    const handleSeeAllPress = useCallback(() => {
        setCategoryModalVisible(false);
        setActiveCategoryUi('all');
        dispatch(setActiveCategory('all'));
        navigation?.navigate?.('TemplateScreen', { categoryId: 'all' });
    }, [dispatch, navigation]);

    const handleCategoryPress = useCallback(
        id => {
            const targetId = CATEGORY_TARGET[id] || 'all';
            setActiveCategoryUi(id);
            dispatch(setActiveCategory(targetId));
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        },
        [dispatch],
    );

    const openEditor = useCallback(
        item => {
            dispatch(setSelectedTemplate(item));
            navigation?.navigate?.('EditorScreen', { templateId: item.id });
        },
        [dispatch, navigation],
    );

    const prepareTemplateForMediaAction = useCallback(
        async item => {
            dispatch(setSelectedTemplate(item));
            await new Promise(resolve => setTimeout(resolve, 80));
        },
        [dispatch],
    );

    const handleShareToWhatsApp = useCallback(
        async item => {
            if (isActionInProgress) return;
            await prepareTemplateForMediaAction(item);
            await sharePosterToWhatsApp(whatsappCaption || undefined);
        },
        [isActionInProgress, prepareTemplateForMediaAction, sharePosterToWhatsApp, whatsappCaption],
    );

    const handleDownload = useCallback(
        async item => {
            if (isActionInProgress) return;
            await prepareTemplateForMediaAction(item);
            await savePoster();
        },
        [isActionInProgress, prepareTemplateForMediaAction, savePoster],
    );

    const handleEdit = useCallback(
        item => {
            dispatch(setSelectedTemplate(item));
            navigation?.navigate?.('EditorScreen', {
                templateId: item.id,
                template: item,
                userName,
                userMessage,
                userPhoto,
            });
        },
        [dispatch, navigation, userMessage, userName, userPhoto],
    );

    const stopCardPress = useCallback(event => {
        event?.stopPropagation?.();
    }, []);

    const showUnderDevelopmentAlert = () => {
        Alert.alert(t('home.underDevelopment.title'), t('home.underDevelopment.message'));
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.headerBackground} />

            <LinearGradient
                colors={[COLORS.headerBackground, '#FFFFFF']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.staticHeader}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
                    <Text style={styles.searchText}>{t('home.searchPlaceholder')}</Text>
                </View>

                <ScrollView
                    style={styles.categoryPreviewScroll}
                    contentContainerStyle={styles.chipRow}
                    scrollEnabled={false}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        setHasOverflowCategories(contentHeight > CATEGORY_PREVIEW_HEIGHT + 2);
                    }}
                    showsVerticalScrollIndicator={false}>
                    {chips.map(item => {
                        const isActive = activeCategory === item.id;
                        return (
                            <Pressable
                                key={item.id}
                                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                                onPress={() => handleCategoryPress(item.id)}>
                                {item.icon ? (
                                    <MaterialCommunityIcons
                                        name={item.icon}
                                        style={[styles.categoryChipIcon, isActive && styles.categoryChipIconActive]}
                                    />
                                ) : null}
                                <Text style={[styles.categoryChipLabel, isActive && styles.categoryChipLabelActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
                {hasOverflowCategories ? (
                    <Pressable style={styles.seeMoreBtn} onPress={() => setCategoryModalVisible(true)}>
                        <Text style={styles.seeMoreText}>See more</Text>
                        <MaterialCommunityIcons name="chevron-down" style={styles.seeMoreIcon} />
                    </Pressable>
                ) : null}
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={reelsData}
                keyExtractor={(item, index) => `${item.id}_${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT + ITEM_SPACING}
                snapToAlignment="start"
                disableIntervalMomentum
                decelerationRate="fast"
                contentContainerStyle={styles.reelsContent}
                renderItem={({ item }) => (
                    <View style={styles.feedItemWrap}>
                        <View style={styles.reelCard}>
                            <Pressable style={styles.mediaTapArea} onPress={() => openEditor(item)}>
                                <TemplatePosterPreview template={item} userPhoto={userPhoto} />
                            </Pressable>

                            <Pressable style={styles.reelMeta} onPress={() => handleEdit(item)}>
                                <View style={styles.metricsRow}>
                                    <View style={styles.metricsLeft}>
                                        <Pressable
                                            style={styles.metricAction}
                                            onPressIn={stopCardPress}
                                            onPress={event => {
                                                event.stopPropagation?.();
                                                handleDownload(item);
                                            }}
                                            hitSlop={8}
                                            disabled={isActionInProgress}>
                                            <MaterialCommunityIcons
                                                name="download"
                                                style={styles.metricActionIcon}
                                            />
                                            <Text style={styles.metricCount}>99</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.metricAction}
                                            onPressIn={stopCardPress}
                                            onPress={event => {
                                                event.stopPropagation?.();
                                                handleShareToWhatsApp(item);
                                            }}
                                            hitSlop={8}
                                            disabled={isActionInProgress}>
                                            <MaterialCommunityIcons
                                                name="share-variant-outline"
                                                style={styles.metricActionIcon}
                                            />
                                            <Text style={styles.metricCount}>99</Text>
                                        </Pressable>

                                        <Pressable
                                            style={styles.metricAction}
                                            onPressIn={stopCardPress}
                                            onPress={event => {
                                                event.stopPropagation?.();
                                                handleEdit(item);
                                            }}
                                            hitSlop={8}>
                                            <MaterialCommunityIcons
                                                name="square-edit-outline"
                                                style={styles.metricActionIcon}
                                            />
                                        </Pressable>
                                    </View>

                                    <Pressable
                                        style={styles.bookmarkBtn}
                                        onPressIn={stopCardPress}
                                        onPress={event => {
                                            event.stopPropagation?.();
                                            showUnderDevelopmentAlert();
                                        }}
                                        hitSlop={10}>
                                        <MaterialCommunityIcons name="bookmark-outline" style={styles.bookmarkIcon} />
                                    </Pressable>
                                </View>

                                <Pressable
                                    style={[styles.changeImageBtn, isActionInProgress && styles.actionBtnDisabled]}
                                    onPressIn={stopCardPress}
                                    disabled={isActionInProgress}
                                    onPress={event => {
                                        event.stopPropagation?.();
                                        handleEdit(item);
                                    }}>
                                    <Text style={styles.changeImageText}>{t('home.actions.changeImage')}</Text>
                                </Pressable>
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            <View style={styles.hiddenCaptureStage} pointerEvents="none">
                <PosterPreview posterRef={posterRef} />
            </View>

            <Modal
                visible={isCategoryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCategoryModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={stopCardPress}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('home.section.categories')}</Text>
                            <Pressable onPress={() => setCategoryModalVisible(false)} hitSlop={10}>
                                <MaterialCommunityIcons name="close" style={styles.modalCloseIcon} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalChipWrap}>
                                {chips.map(item => {
                                    const isActive = activeCategory === item.id;
                                    return (
                                        <Pressable
                                            key={`modal_${item.id}`}
                                            style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                                            onPress={() => {
                                                handleCategoryPress(item.id);
                                                setCategoryModalVisible(false);
                                            }}>
                                            {item.icon ? (
                                                <MaterialCommunityIcons
                                                    name={item.icon}
                                                    style={[styles.categoryChipIcon, isActive && styles.categoryChipIconActive]}
                                                />
                                            ) : null}
                                            <Text
                                                style={[styles.categoryChipLabel, isActive && styles.categoryChipLabelActive]}>
                                                {item.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <Pressable style={styles.modalSeeAllBtn} onPress={handleSeeAllPress}>
                            <Text style={styles.modalSeeAllText}>{t('home.seeAll')}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    staticHeader: {
        paddingHorizontal: widthPixel(14),
        paddingTop: heightPixel(12),
        paddingBottom: heightPixel(14),
        backgroundColor: COLORS.headerBackground,
        // minHeight: heightPixel(120),
    },
    searchBar: {
        width: '100%',
        height: heightPixel(44),
        borderRadius: widthPixel(22),
        backgroundColor: '#FFFFFF',
        borderWidth: widthPixel(1),
        borderColor: '#A7C0D3',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(12),
    },
    searchIcon: {
        fontSize: widthPixel(20),
        color: '#5E7690',
        marginRight: widthPixel(8),
    },
    searchText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#6B839C',
    },
    chipRow: {
        marginTop: heightPixel(12),
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CHIP_GAP,
    },
    categoryPreviewScroll: {
        maxHeight: CATEGORY_PREVIEW_HEIGHT,
    },
    categoryChip: {
        height: CHIP_HEIGHT,
        borderRadius: widthPixel(17),
        paddingHorizontal: widthPixel(13),
        backgroundColor: COLORS.chipBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: widthPixel(6),
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryChipIcon: {
        fontSize: widthPixel(16),
        color: '#324153',
    },
    categoryChipIconActive: {
        color: COLORS.chipActiveText,
    },
    categoryChipLabel: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.chipText,
        includeFontPadding: false,
    },
    categoryChipLabelActive: {
        color: COLORS.chipActiveText,
        fontFamily: fonts.FONT_FAMILY.Bold,
    },
    seeMoreBtn: {
        marginTop: heightPixel(8),
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(2),
    },
    seeMoreText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.primary,
    },
    seeMoreIcon: {
        fontSize: widthPixel(16),
        color: COLORS.primary,
    },
    reelsContent: {
        paddingTop: ITEM_SPACING,
        paddingBottom: heightPixel(24),
        backgroundColor: COLORS.pageBackground,
    },
    feedItemWrap: {
        height: ITEM_HEIGHT,
        marginBottom: ITEM_SPACING,
        paddingHorizontal: widthPixel(10),
    },
    reelCard: {
        width: '100%',
        borderRadius: widthPixel(16),
        backgroundColor: COLORS.cardBackground,
        overflow: 'hidden',
        borderWidth: widthPixel(1),
        borderColor: '#DDDFE3',
    },
    mediaTapArea: {
        width: '100%',
    },
    reelMedia: {
        width: '100%',
        height: REEL_MEDIA_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DDE5EC',
    },
    reelImage: {
        width: '100%',
        height: '100%',
    },
    reelFallback: {
        position: 'absolute',
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
        height: META_HEIGHT,
        backgroundColor: COLORS.actionPanel,
        paddingHorizontal: widthPixel(14),
        paddingVertical: heightPixel(10),
    },
    metricsRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(10),
    },
    metricsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(18),
    },
    metricAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: widthPixel(6),
        minHeight: heightPixel(38),
        paddingHorizontal: widthPixel(8),
        borderRadius: widthPixel(18),
    },
    metricActionIcon: {
        fontSize: widthPixel(20),
        color: '#222A34',
    },
    metricCount: {
        fontSize: widthPixel(12),
        color: '#424A55',
        fontFamily: fonts.FONT_FAMILY.Medium,
    },
    bookmarkBtn: {
        minHeight: heightPixel(38),
        minWidth: widthPixel(38),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: widthPixel(19),
    },
    bookmarkIcon: {
        fontSize: widthPixel(22),
        color: '#222A34',
    },
    changeImageBtn: {
        height: heightPixel(36),
        borderRadius: widthPixel(18),
        borderWidth: widthPixel(1),
        borderColor: '#C7CCD2',
        backgroundColor: '#F7F7F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    changeImageText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.primary,
    },
    actionBtnDisabled: {
        opacity: 0.6,
    },
    hiddenCaptureStage: {
        position: 'absolute',
        left: -5000,
        top: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.36)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: widthPixel(20),
        borderTopRightRadius: widthPixel(20),
        paddingHorizontal: widthPixel(16),
        paddingTop: heightPixel(14),
        paddingBottom: heightPixel(22),
        maxHeight: '65%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(12),
    },
    modalTitle: {
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#111827',
    },
    modalCloseIcon: {
        fontSize: widthPixel(22),
        color: '#3D4653',
    },
    modalChipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CHIP_GAP,
    },
    modalSeeAllBtn: {
        marginTop: heightPixel(14),
        height: heightPixel(40),
        borderRadius: widthPixel(20),
        borderWidth: widthPixel(1),
        borderColor: '#D1D7DF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSeeAllText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.primary,
    },
});

export default HomeScreen;
