// src/screens/HomeScreen/index.js

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    TextInput,
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
    setIsLoggedIn,
} from '../../store/posterSlice';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import { getUserProfile } from '../../utils/userStorage';
import {
    getPosterFitLayout,
    getScaledPhotoFrameStyle,
} from '../../utils/photoFrameLayout';
import {
    buildTemplateRenderContext,
    dedupeTemplates,
    getTemplateCanvasSize,
    isConfigDrivenTemplate,
    normalizeTemplateApiItem,
} from '../../utils/templateConfig';
import usePosterGenerator from '../../hooks/usePosterGenerator';
import PosterPreview from '../../components/PosterPreview';
import TemplateMedia from '../../components/TemplateMedia';
import ConfiguredTemplateLayers from '../../components/ConfiguredTemplateLayers';
import { getTemplateImageSource, getTemplateVideoSource } from '../../utils/templateMedia';
import { getCategories } from '../../apiService/categoriesApi';
import { getTemplatesApi } from '../../apiService/templateApi';
import i18n from '../../i18n';
const getTemplateListKey = (item, index) => `${item.id}_${index}`;

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
const mapCategoryIcon = (name) => {
    switch (name.toLowerCase()) {
        case 'birthday':
            return 'cake-variant-outline';
        case 'festival':
            return 'party-popper';
        case 'business':
            return 'briefcase-outline';
        case 'motivation':
            return 'lightbulb-on-outline';
        case 'political':
            return 'bank-outline';
        case 'social':
            return 'atom';
        default:
            return null;
    }
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
const TEMPLATE_PAGE_SIZE = 30;

// const HEADER_CHIPS = [
//     { id: 'all', icon: null, labelKey: 'categories.all' },
//     { id: 'birthday', icon: 'cake-variant-outline', labelKey: 'categories.birthday' },
//     { id: 'festival', icon: 'party-popper', labelKey: 'categories.festival' },
//     { id: 'political', icon: 'bank-outline', labelKey: 'categories.political' },
//     { id: 'motivational', icon: 'lightbulb-on-outline', labelKey: 'categories.motivational' },
//     { id: 'business', icon: 'briefcase-outline', labelKey: 'categories.business' },
// ];



// const CATEGORY_TARGET = {
//     all: 'all',
//     birthday: 'birthday',
//     festival: 'festival',
//     political: 'political',
//     motivational: 'all',
//     business: 'business',
// };

const TemplatePosterPreview = ({ template, userPhoto, userName, userMessage, shouldPlay }) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const canvasSize = useMemo(() => getTemplateCanvasSize(template), [template]);
    const posterLayout = useMemo(
        () => getPosterFitLayout(containerSize.width, containerSize.height, canvasSize),
        [canvasSize, containerSize.height, containerSize.width],
    );
    const hasConfigLayers = useMemo(() => isConfigDrivenTemplate(template), [template]);
    const hasTemplateBackgroundMedia = useMemo(
        () => !!(getTemplateImageSource(template) || getTemplateVideoSource(template)),
        [template],
    );
    const renderContext = useMemo(
        () => buildTemplateRenderContext({
            template,
            userPhoto,
            userName,
            userMessage,
        }),
        [template, userMessage, userName, userPhoto],
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
    const fallbackBadgeStyle = useMemo(() => {
        if (!posterLayout?.width || !posterLayout?.height) {
            return null;
        }

        const size = Math.max(widthPixel(52), posterLayout.width * 0.18);
        const insetX = Math.max(widthPixel(12), posterLayout.width * 0.04);
        const insetY = Math.max(heightPixel(12), posterLayout.height * 0.04);

        return {
            width: size,
            height: size,
            borderRadius: size / 2,
            right: posterLayout.offsetX + insetX,
            bottom: posterLayout.offsetY + insetY,
            borderWidth: Math.max(2, size * 0.06),
        };
    }, [posterLayout]);
    const shouldRenderFallbackBadge = userPhoto && !photoFrameStyle;

    return (
        <View
            style={styles.reelMedia}
            onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                if (width !== containerSize.width || height !== containerSize.height) {
                    setContainerSize({ width, height });
                }
            }}>
            <TemplateMedia
                template={template}
                style={[styles.reelImage, {
                    width: posterLayout.width,
                    height: posterLayout.height,
                    left: posterLayout.offsetX,
                    top: posterLayout.offsetY,
                }]}
                resizeMode="cover"
                shouldPlay={shouldPlay}
                fallback={
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
                }
            />

            {hasConfigLayers ? (
                <ConfiguredTemplateLayers
                    template={template}
                    context={renderContext}
                    canvasLayout={posterLayout}
                    skipBackgroundLayers={hasTemplateBackgroundMedia}
                    renderUserPhotoLayer={({ layerStyle }) => (
                        userPhoto ? (
                            <View style={[styles.userPhotoFrame, layerStyle]} pointerEvents="none">
                                <Image source={{ uri: userPhoto }} style={styles.userPhoto} resizeMode="cover" />
                            </View>
                        ) : null
                    )}
                />
            ) : userPhoto && photoFrameStyle ? (
                <View style={[styles.userPhotoFrame, photoFrameStyle]} pointerEvents="none">
                    <Image source={{ uri: userPhoto }} style={styles.userPhoto} resizeMode="cover" />
                </View>
            ) : null}

            {shouldRenderFallbackBadge && fallbackBadgeStyle ? (
                <View style={[styles.userPhotoBadge, fallbackBadgeStyle]} pointerEvents="none">
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
    const [categoryIdSelected, setCategoryIdSelected] = useState(null);
    const flatListRef = useRef(null);
    const [activeMediaKey, setActiveMediaKey] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [hasOverflowCategories, setHasOverflowCategories] = useState(false);
    const isActionInProgress = isSaving || isSharing;

    const [templates, setTemplates] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const requestIdRef = useRef(0);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 70,
    }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        const firstVisible = viewableItems?.find(entry => entry?.isViewable);
        if (!firstVisible?.item) return;
        setActiveMediaKey(getTemplateListKey(firstVisible.item, firstVisible.index ?? 0));
    }).current;

    //     const CATEGORY_TARGET = useMemo(() => {
    //     const map = { all: 'all' };

    //     categories.forEach(cat => {
    //         const key = cat.id;

    //         // normalize mismatch
    //         if (key === 'motivation') {
    //             map[key] = 'all'; // or 'motivational' if your templates support it
    //         } else {
    //             map[key] = key;
    //         }
    //     });

    //     return map;
    // }, [categories]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getCategories();
            const apiData = res?.data?.data || [];

            const formatted = apiData.map(item => ({
                id: item.name.toLowerCase(), // IMPORTANT (used in your logic)
                label: item.name,
                icon: mapCategoryIcon(item.name),
                categoryId: item.id, // Keep original ID if needed for API calls
            }));

            // Add "All" manually (API doesn't give it)
            setCategories([
                { id: 'all', label: t('categories.all'), icon: null, categoryId: 'all' },
                ...formatted,
            ]);

        } catch (e) {
            console.log('Category fetch error', e);
        }
    }, [t]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);





    const handleLogout = async () => {
        try {

            dispatch(setIsLoggedIn(false));
        } catch (e) {
            console.log('Logout error:', e);
        }
    };

    const fetchTemplates = useCallback(async ({ pageNumber = 1, searchText = '', categoryId = null } = {}) => {
        const requestId = ++requestIdRef.current;
        const isFirstPage = pageNumber === 1;

        try {
            if (isFirstPage) {
                setIsInitialLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const res = await getTemplatesApi({
                category_id: categoryId,
                language: i18n.language || 'en',
                search: searchText,
                page: pageNumber,
                limit: TEMPLATE_PAGE_SIZE,
            });

            if (requestId !== requestIdRef.current) {
                return;
            }

            const apiData = res?.data?.data?.data || [];
            const parsedTotal = Number(res?.data?.data?.total);
            const hasKnownTotal = Number.isFinite(parsedTotal);
            const formatted = dedupeTemplates(apiData.map(normalizeTemplateApiItem));




        // ✅ FIX HERE
            setTemplates(prev => (
                isFirstPage
                    ? formatted
                    : dedupeTemplates([...prev, ...formatted])
            ));

            // 🔥 important fix
            setPage(pageNumber);
            setHasMore(hasKnownTotal
                ? parsedTotal > pageNumber * TEMPLATE_PAGE_SIZE
                : apiData.length === TEMPLATE_PAGE_SIZE);
            setHasLoadedOnce(true);

        } catch (e) {
            console.log('Template fetch error', e);

            if (requestId === requestIdRef.current && isFirstPage) {
                setTemplates([]);
                setHasMore(false);
                setHasLoadedOnce(true);
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setIsInitialLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        fetchTemplates({
            pageNumber: 1,
            searchText: debouncedSearch,
            categoryId: categoryIdSelected,
        });
    }, [categoryIdSelected, debouncedSearch, fetchTemplates]);

    const handleSearch = useCallback(text => {
        setSearch(text);
    }, []);

    const loadMore = useCallback(() => {
        if (!hasMore || isInitialLoading || isLoadingMore) return;

        fetchTemplates({
            pageNumber: page + 1,
            searchText: debouncedSearch,
            categoryId: categoryIdSelected,
        });
    }, [categoryIdSelected, debouncedSearch, fetchTemplates, hasMore, isInitialLoading, isLoadingMore, page]);




    const whatsappCaption = useMemo(() => {
        const text = (userMessage || '').trim();
        const name = (userName || '').trim();
        if (text && name) return `${text}\n- ${name}`;
        if (text) return text;
        if (name) return name;
        return '';
    }, [userMessage, userName]);

    // const chips = useMemo(
    //     () =>
    //         HEADER_CHIPS.map(item => ({
    //             id: item.id,
    //             icon: item.icon,
    //             label: item.label || t(item.labelKey),
    //         })),
    //     [t],
    // );

    const chips = useMemo(() => categories, [categories]);

    // const reelsData = useMemo(() => {
    //     const categoryId = CATEGORY_TARGET[activeCategory] || 'all';
    //     if (categoryId === 'all') return TEMPLATES;
    //     const filtered = TEMPLATES.filter(item => item.category.toLowerCase() === categoryId);
    //     return filtered.length ? filtered : TEMPLATES;
    // }, [activeCategory]);

    const reelsData = templates;
    const hasReachedEnd = hasLoadedOnce && !isInitialLoading && !hasMore && reelsData.length > 0;

    useEffect(() => {
        const firstItem = reelsData[0];
        setActiveMediaKey(firstItem ? getTemplateListKey(firstItem, 0) : null);
    }, [reelsData]);

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
        setCategoryIdSelected(null);
        dispatch(setActiveCategory('all'));
        navigation?.navigate?.('TemplateScreen', { categoryId: 'all' });
    }, [dispatch, navigation]);

    // const handleCategoryPress = useCallback(
    //     id => {
    //         const targetId = CATEGORY_TARGET[id] || 'all';
    //         console.log('Selected category:', id, 'Mapped to:', targetId);
    //         setActiveCategoryUi(id);
    //         dispatch(setActiveCategory(targetId));
    //         flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    //     },
    //     [dispatch],
    // );
    const handleCategoryPress = useCallback((item) => {
        setActiveCategoryUi(item?.id);
        const categoryId = item?.categoryId === 'all' ? null : item?.categoryId;
        setCategoryIdSelected(categoryId);
        dispatch(setActiveCategory(item?.id ?? 'all'));
        setPage(1);
    }, [dispatch]);

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
                <View style={styles.headerRow}>
                    <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
                        <TextInput
                            placeholder={t('home.searchPlaceholder')}
                            style={styles.searchText}
                            value={search}
                            onChangeText={handleSearch}
                        />
                        {/* <Text style={styles.searchText}>{t('home.searchPlaceholder')}</Text> */}
                    </View>

                    <Pressable style={styles.logoutBtn} onPress={() => Alert.alert(
                        'Logout',
                        'Are you sure you want to logout?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Logout', onPress: handleLogout },
                        ]
                    )}>
                        <MaterialCommunityIcons name="logout" style={styles.logoutIcon} />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.categoryPreviewScroll}
                    contentContainerStyle={styles.chipRow}
                    scrollEnabled={false}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        setHasOverflowCategories(contentHeight > CATEGORY_PREVIEW_HEIGHT + 2);
                    }}
                    showsVerticalScrollIndicator={false}>
                    {chips?.map(item => {
                        const isActive = activeCategory === item.id;
                        return (
                            <Pressable
                                key={item.id}
                                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                                onPress={() => handleCategoryPress(item)}>
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
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.listStateWrap}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.listStateText}>
                                {t('home.loadingMore', { defaultValue: 'Loading more...' })}
                            </Text>
                        </View>
                    ) : hasReachedEnd ? (
                        <View style={styles.listStateWrap}>
                            <Text style={styles.listStateText}>
                                {t('home.endReached', { defaultValue: "You've reached the end." })}
                            </Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    isInitialLoading ? (
                        <View style={styles.listStateWrap}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.listStateText}>
                                {t('home.loadingTemplates', { defaultValue: 'Loading templates...' })}
                            </Text>
                        </View>
                    ) : hasLoadedOnce ? (
                        <View style={styles.listStateWrap}>
                            <Text style={styles.listStateText}>
                                {t('home.noTemplates', { defaultValue: 'No templates found.' })}
                            </Text>
                        </View>
                    ) : null
                }
                keyExtractor={getTemplateListKey}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT + ITEM_SPACING}
                snapToAlignment="start"
                disableIntervalMomentum
                decelerationRate="fast"
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                contentContainerStyle={styles.reelsContent}
                renderItem={({ item, index }) => (
                    <View style={styles.feedItemWrap}>
                        <View style={styles.reelCard}>
                            <Pressable style={styles.mediaTapArea} onPress={() => openEditor(item)}>
                                <TemplatePosterPreview
                                    template={item}
                                    userPhoto={userPhoto}
                                    userName={userName}
                                    userMessage={userMessage}
                                    shouldPlay={activeMediaKey === getTemplateListKey(item, index)}
                                />
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
                <PosterPreview posterRef={posterRef} playVideo={false} preferStillImageForVideo />
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
                                                handleCategoryPress(item);
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    logoutBtn: {
        marginLeft: widthPixel(10),
        width: heightPixel(44),
        height: heightPixel(44),
        borderRadius: widthPixel(22),
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: widthPixel(1),
        borderColor: '#A7C0D3',
    },

    logoutIcon: {
        fontSize: widthPixel(20),
        color: '#E53935', // red feel
    },
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
        position: 'absolute',
    },
    reelFallback: {
        position: 'absolute',
    },
    userPhotoFrame: {
        position: 'absolute',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    userPhotoBadge: {
        position: 'absolute',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    userPhoto: {
        width: '100%',
        height: '100%',
    },
    listStateWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: heightPixel(18),
        gap: heightPixel(8),
    },
    listStateText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
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
