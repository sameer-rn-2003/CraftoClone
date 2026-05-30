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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getUserProfile, mergeUserProfile } from '../../utils/userStorage';
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
import MediaAudioToggle from '../../components/MediaAudioToggle';
import CustomBottomNavigation from '../../components/CustomBottomNavigation';
import { getTemplateImageSource, getTemplateVideoSource } from '../../utils/templateMedia';
import useImagePicker from '../../hooks/useImagePicker';
import { getCategories } from '../../apiService/categoriesApi';
import { getTemplatesApi } from '../../apiService/templateApi';
import {
    addFavoriteApi,
    getFavoritesApi,
    removeFavoriteApi,
} from '../../apiService/favoriteApi';
import { getSubscriptionPlansApi } from '../../apiService/subscriptionApi';
import SubscriptionModal from '../../components/SubscriptionModal';
import {
    startRazorpayTestCheckout,
    syncSubscriptionStatus,
    verifySubscriptionPurchaseAndSync,
} from '../../services/subscriptionService';
import { removeFcmToken } from '../../services/fcmService';
import { logout } from '../../apiService/authApi';
import i18n from '../../i18n';
const getTemplateListKey = (item, index) => `${item.id}_${index}`;
const isPremiumTemplate = item => {
    const premiumValue = item?.is_premium ?? item?.isPremium;
    return premiumValue === true || premiumValue === 'true' || premiumValue === 1 || premiumValue === '1';
};

const resData = {
  "status": true,
  "message": "Templates retrieved successfully",
  "data": {
    "data": [
      {
        "id": "4eed2def-3656-41a2-bf38-e3e9e3d90794",
        "name": "Diwali",
        "type": "VIDEO",
        "thumbnail_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "thumbnail_key": "templates/demon.jpeg",
        "template_url": "https://www.w3schools.com/tags/mov_bbb.mp4",
        "template_key": "templates/video.mp4",
        "config_json": {
          "width": 1080,
          "height": 1920,
          "layers": [
            {
              "x": 140,
              "y": 200,
              "id": "user_photo",
              "src": "{{user_photo}}",
              "type": "image",
              "width": 800,
              "height": 800
            },
            {
              "x": 0,
              "y": 0,
              "id": "frame_overlay",
              "src": "{{frame_png}}",
              "note": "Upload a PNG with transparent centre so the video shows through",
              "type": "image",
              "width": 1080,
              "height": 1920
            },
            {
              "x": 60,
              "y": 1100,
              "id": "headline",
              "text": "{{headline}}",
              "type": "text",
              "align": "center",
              "color": "#ffffff",
              "width": 960,
              "fontSize": 64,
              "fontFamily": "Poppins",
              "fontWeight": "bold"
            },
            {
              "x": 60,
              "y": 1200,
              "id": "subtext",
              "text": "{{subtext}}",
              "type": "text",
              "align": "center",
              "color": "#eeeeee",
              "width": 960,
              "fontSize": 36,
              "fontFamily": "Inter"
            }
          ],
          "version": "1.0",
          "variables": [
            {
              "key": "user_photo",
              "type": "image",
              "label": "Your Photo (placed in the frame slot)",
              "default": ""
            },
            {
              "key": "frame_png",
              "type": "image",
              "label": "Frame/Border PNG (transparent centre)",
              "default": ""
            },
            {
              "key": "headline",
              "type": "text",
              "label": "Headline Text",
              "default": "Happy Diwali!"
            },
            {
              "key": "subtext",
              "type": "text",
              "label": "Sub Text",
              "default": "Wishing you joy & prosperity"
            }
          ]
        },
        "is_premium": false,
        "language": "en",
        "is_active": true,
        "usage_count": 1,
        "createdAt": "2026-04-20T20:31:54.411Z",
        "updatedAt": "2026-04-20T20:32:13.937Z",
        "category_id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
        "category": {
          "id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
          "name": "Festival"
        }
      },
      {
        "id": "c910f1a6-3116-48c2-8f91-44943cdfe364",
        "name": "test video",
        "type": "VIDEO",
        "thumbnail_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "thumbnail_key": "templates/demon.jpeg",
        "template_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/video.mp4",
        "template_key": "templates/video.mp4",
        "config_json": {
          "width": 1080,
          "height": 1920,
          "layers": [
            {
              "x": 140,
              "y": 200,
              "id": "user_photo",
              "src": "{{user_photo}}",
              "type": "image",
              "width": 800,
              "height": 800
            },
            {
              "x": 0,
              "y": 0,
              "id": "frame_overlay",
              "src": "{{frame_png}}",
              "note": "Upload a PNG with transparent centre so the video shows through",
              "type": "image",
              "width": 1080,
              "height": 1920
            },
            {
              "x": 60,
              "y": 1100,
              "id": "headline",
              "text": "{{headline}}",
              "type": "text",
              "align": "center",
              "color": "#ffffff",
              "width": 960,
              "fontSize": 64,
              "fontFamily": "Poppins",
              "fontWeight": "bold"
            },
            {
              "x": 60,
              "y": 1200,
              "id": "subtext",
              "text": "{{subtext}}",
              "type": "text",
              "align": "center",
              "color": "#eeeeee",
              "width": 960,
              "fontSize": 36,
              "fontFamily": "Inter"
            }
          ],
          "version": "1.0",
          "variables": [
            {
              "key": "headline",
              "type": "text",
              "label": "Headline Text",
              "default": "Happy Diwali!"
            },
            {
              "key": "subtext",
              "type": "text",
              "label": "Sub Text",
              "default": "Wishing you joy & prosperity"
            },
            {
              "key": "background_image",
              "type": "image",
              "label": "Background Image",
              "default": ""
            },
            {
              "key": "logo_url",
              "type": "image",
              "label": "Your Logo",
              "default": ""
            }
          ],
          "background": "#ffffff"
        },
        "is_premium": false,
        "language": "en",
        "is_active": true,
        "usage_count": 2,
        "createdAt": "2026-04-20T20:05:54.310Z",
        "updatedAt": "2026-04-20T20:06:19.257Z",
        "category_id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
        "category": {
          "id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
          "name": "Festival"
        }
      },
      {
        "id": "22b307ad-52a8-4d0e-acf8-04675c9b7983",
        "name": "Diwali",
        "type": "IMAGE",
        "thumbnail_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "thumbnail_key": "templates/demon.jpeg",
        "template_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "template_key": "templates/demon.jpeg",
        "config_json": {
          "width": 1080,
          "height": 1920,
          "layers": [
            {
              "x": 0,
              "y": 0,
              "id": "bg",
              "src": "{{background_image}}",
              "type": "image",
              "width": 1080,
              "height": 1920,
              "opacity": 1
            },
            {
              "x": 60,
              "y": 200,
              "id": "headline",
              "text": "{{headline}}",
              "type": "text",
              "align": "center",
              "color": "#111111",
              "width": 960,
              "fontSize": 72,
              "fontFamily": "Poppins",
              "fontWeight": "bold"
            },
            {
              "x": 60,
              "y": 320,
              "id": "subtext",
              "text": "{{subtext}}",
              "type": "text",
              "align": "center",
              "color": "#555555",
              "width": 960,
              "fontSize": 36,
              "fontFamily": "Inter"
            },
            {
              "x": 440,
              "y": 1700,
              "id": "logo",
              "src": "{{logo_url}}",
              "type": "image",
              "width": 200,
              "height": 100,
              "opacity": 0.9
            }
          ],
          "version": "1.0",
          "variables": [
            {
              "key": "headline",
              "type": "text",
              "label": "Headline Text",
              "default": "Happy Diwali!"
            },
            {
              "key": "subtext",
              "type": "text",
              "label": "Sub Text",
              "default": "Wishing you joy & prosperity"
            },
            {
              "key": "background_image",
              "type": "image",
              "label": "Background Image",
              "default": ""
            },
            {
              "key": "logo_url",
              "type": "image",
              "label": "Your Logo",
              "default": ""
            }
          ],
          "background": "#ffffff"
        },
        "is_premium": false,
        "language": "en",
        "is_active": true,
        "usage_count": 7,
        "createdAt": "2026-04-20T19:05:38.184Z",
        "updatedAt": "2026-04-20T19:47:02.913Z",
        "category_id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
        "category": {
          "id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
          "name": "Festival"
        }
      },
      {
        "id": "734b7507-4f00-4561-912b-a5136abd53b3",
        "name": "Diwali",
        "type": "IMAGE",
        "thumbnail_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "thumbnail_key": "templates/demon.jpeg",
        "template_url": "https://dm8eq5jbpggtw.cloudfront.net/templates/demon.jpeg",
        "template_key": "templates/demon.jpeg",
        "config_json": null,
        "is_premium": false,
        "language": "en",
        "is_active": true,
        "usage_count": 2,
        "createdAt": "2026-04-20T19:01:36.882Z",
        "updatedAt": "2026-04-20T19:06:03.122Z",
        "category_id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
        "category": {
          "id": "8dfb1c6f-7e1e-4c4a-ba73-5df0cbe35bbf",
          "name": "Festival"
        }
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 20
  }
}


const COLORS = {
    pageBackground: '#C9E6F7',
    headerBackground: '#C9E6F7',
    cardBackground: '#FFFFFF',
    primary: '#0D62DF',
    textPrimary: '#101417',
    textSecondary: '#6B7280',
    border: '#9EB3C6',
    chipBackground: '#D5E5F1',
    chipActiveText: '#FFFFFF',
    chipText: '#111827',
    actionPanel: '#FFFFFF',
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
const REEL_MEDIA_HEIGHT = Math.round(Math.min(heightPixel(460), SCREEN_H - heightPixel(320)));
const META_HEIGHT = Math.round(heightPixel(95));
// ADD THIS: The exact height of one reel card
const ITEM_HEIGHT = REEL_MEDIA_HEIGHT + META_HEIGHT;
const CHIP_HEIGHT = heightPixel(25);
const CHIP_GAP = widthPixel(8);
const MAX_CATEGORY_LINES = 2;
const CATEGORY_PREVIEW_HEIGHT = CHIP_HEIGHT * MAX_CATEGORY_LINES + CHIP_GAP + heightPixel(24);
const CATEGORY_PREVIEW_LIMIT = 6;
const TEMPLATE_PAGE_SIZE = 30;
const FAVORITES_CHIP = {
    id: 'favorites',
    label: 'Favorites',
    icon: 'bookmark',
    categoryId: 'favorites',
};
const SETTINGS_OPTIONS = [
    { key: 'contact', label: 'Contact us', icon: 'headset' },
    { key: 'privacy', label: 'Privacy Policy', icon: 'shield-check' },
    { key: 'terms', label: 'Terms & Conditions', icon: 'file-document-outline' },
    { key: 'refund', label: 'Refund and Cancellations', icon: 'restart' },
    { key: 'about', label: 'About Us', icon: 'exclamation-thick' },
    { key: 'product', label: 'Product Description', icon: 'creation' },
    { key: 'signout', label: 'SignOut', icon: 'logout', tone: 'warning' },
    { key: 'delete', label: 'Delete Account', icon: 'delete', tone: 'danger' },
];

const TemplatePosterPreview = ({ template, userPhoto, userName, userMessage, shouldPlay }) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isMuted, setIsMuted] = useState(true);
    const [hasAudio, setHasAudio] = useState(true);
    const canvasSize = useMemo(() => getTemplateCanvasSize(template), [template]);
    const posterLayout = useMemo(() => {
        const fitLayout = getPosterFitLayout(containerSize.width, containerSize.height, canvasSize);
        if (!containerSize.width || !containerSize.height || !canvasSize?.width || !canvasSize?.height) {
            return fitLayout;
        }

        const scale = containerSize.width / canvasSize.width;
        const height = canvasSize.height * scale;

        return {
            width: containerSize.width,
            height,
            offsetX: 0,
            offsetY: (containerSize.height - height) / 2,
            scaleX: scale,
            scaleY: scale,
        };
    }, [canvasSize, containerSize.height, containerSize.width]);
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

        return {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: posterLayout.offsetX + (posterLayout.width - size) / 2,
            top: posterLayout.offsetY + (posterLayout.height - size) / 2,
            borderWidth: Math.max(2, size * 0.06),
        };
    }, [posterLayout]);
    const shouldRenderFallbackBadge = userPhoto && !photoFrameStyle;
    const isVideoTemplate = useMemo(() => !!getTemplateVideoSource(template), [template]);

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
                muted={isMuted}
                onAudioAvailabilityChange={setHasAudio}
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
            <MediaAudioToggle
                visible={isVideoTemplate}
                muted={isMuted}
                hasAudio={hasAudio}
                onPress={() => setIsMuted(prev => !prev)}
                style={styles.reelAudioToggle}
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
    const isPremium = useSelector(state => state.poster.isPremium);
    const { t } = useTranslation();
    const { posterRef, savePoster, sharePosterToWhatsApp, isSaving, isSharing } = usePosterGenerator();
    const { pickImage, loading: isPickingProfileImage } = useImagePicker();
    const [activeTab, setActiveTab] = useState('home');
    const [activeCategory, setActiveCategoryUi] = useState('all');
    const [categoryIdSelected, setCategoryIdSelected] = useState(null);
    const flatListRef = useRef(null);
    const [activeMediaKey, setActiveMediaKey] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [favoriteMap, setFavoriteMap] = useState({});
    const [favoriteLoadingMap, setFavoriteLoadingMap] = useState({});
    const isActionInProgress = isSaving || isSharing;

    const [templates, setTemplates] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [isSubscriptionVisible, setSubscriptionVisible] = useState(false);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
    const [submittingPlanId, setSubmittingPlanId] = useState(null);
    const [settingsName, setSettingsName] = useState(userName || '');
    const [settingsPhoto, setSettingsPhoto] = useState(userPhoto || '');
    const [isEditingSettingsProfile, setEditingSettingsProfile] = useState(false);
    const requestIdRef = useRef(0);
    const pendingPremiumActionRef = useRef(null);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 70,
    }).current;
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        const firstVisible = viewableItems?.find(entry => entry?.isViewable);
        if (!firstVisible?.item) return;
        setActiveMediaKey(getTemplateListKey(firstVisible.item, firstVisible.index ?? 0));
    }).current;

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getCategories();
            const apiData = res?.data?.data || [];

            const formatted = apiData.map(item => ({
                id: item.name.toLowerCase(),
                label: item.name,
                icon: mapCategoryIcon(item.name),
                categoryId: item.id,
            }));

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

    const loadFavorites = useCallback(async () => {
        try {
            const response = await getFavoritesApi({ page: 1, limit: 100 });
            const favorites = Array.isArray(response?.data?.data?.data)
                ? response.data.data.data
                : [];

            const nextFavoriteMap = favorites.reduce((accumulator, favorite) => {
                const templateId = String(favorite?.template_id ?? favorite?.template?.id ?? '');
                if (!templateId) {
                    return accumulator;
                }

                accumulator[templateId] = {
                    favoriteId: favorite?.id,
                    templateId,
                };
                return accumulator;
            }, {});

            setFavoriteMap(nextFavoriteMap);
        } catch (error) {
            console.log('Favorites load error', error);
        }
    }, []);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    useEffect(() => {
        setSettingsName(userName || '');
        setSettingsPhoto(userPhoto || '');
    }, [userName, userPhoto]);

    const handleLogout = useCallback(async () => {
        try {
            dispatch(setIsLoggedIn(false));
            await mergeUserProfile({ isLoggedIn: false });
        } catch (error) {
            console.log('Local logout state error:', error);
            dispatch(setIsLoggedIn(false));
        }

        try {
            await removeFcmToken();
        } catch (error) {
            console.log('FCM logout cleanup error:', error);
        }

        try {
            await logout();
        } catch (error) {
            console.log('Logout API error:', error);
        }

        try {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        } catch (e) {
            console.log('Token cleanup error:', e);
        }
    }, [dispatch]);

    const handleProfilePress = useCallback(() => {
        setActiveTab('profile');
    }, []);

    const handleSettingOptionPress = useCallback((option) => {
        if (option.key !== 'signout') {
            Alert.alert(option.label, 'Coming soon.');
            return;
        }

        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: handleLogout },
            ],
        );
    }, [handleLogout]);

    const handleSettingsPhotoPress = useCallback(async () => {
        const uri = await pickImage({ autoStoreInProfilePhoto: false });
        if (uri) {
            setSettingsPhoto(uri);
            setEditingSettingsProfile(true);
        }
    }, [pickImage]);

    const handleSaveSettingsProfile = useCallback(async () => {
        const nextName = settingsName.trim();
        if (!nextName) {
            Alert.alert('Profile', 'Please enter your name.');
            return;
        }

        const profile = await mergeUserProfile({
            name: nextName,
            imageUri: settingsPhoto,
        });
        dispatch(setUserName(profile.name));
        dispatch(setUserPhoto(profile.imageUri));
        setEditingSettingsProfile(false);
        Alert.alert('Profile', 'Profile updated on this device.');
    }, [dispatch, settingsName, settingsPhoto]);

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
                category_id: categoryId ,
                language: i18n.language || 'en',
                search: searchText,
                page: pageNumber,
                limit: TEMPLATE_PAGE_SIZE,
            });

            if (requestId !== requestIdRef.current) {
                return;
            }

            // const apiData = resData?.data?.data || [];
            // const parsedTotal = Number(resData?.data?.total);
             const apiData = res.data?.data?.data || [];
            const parsedTotal = Number(res.data?.data?.total);
            const hasKnownTotal = Number.isFinite(parsedTotal);
            const formatted = dedupeTemplates(apiData.map(normalizeTemplateApiItem));

            setTemplates(prev => (
                isFirstPage
                    ? formatted
                    : dedupeTemplates([...prev, ...formatted])
            ));

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

    const fetchFavoriteTemplates = useCallback(async ({ pageNumber = 1 } = {}) => {
        const requestId = ++requestIdRef.current;
        const isFirstPage = pageNumber === 1;

        try {
            if (isFirstPage) {
                setIsInitialLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const response = await getFavoritesApi({
                page: pageNumber,
                limit: TEMPLATE_PAGE_SIZE,
            });

            if (requestId !== requestIdRef.current) {
                return;
            }

            const favoriteRows = Array.isArray(response?.data?.data?.data)
                ? response.data.data.data
                : [];
            const parsedTotal = Number(response?.data?.data?.total);
            const hasKnownTotal = Number.isFinite(parsedTotal);
            const formatted = dedupeTemplates(
                favoriteRows
                    .map(row => row?.template)
                    .filter(Boolean)
                    .map(normalizeTemplateApiItem),
            );

            const nextFavoriteMap = favoriteRows.reduce((accumulator, favorite) => {
                const templateId = String(favorite?.template_id ?? favorite?.template?.id ?? '');
                if (!templateId) {
                    return accumulator;
                }

                accumulator[templateId] = {
                    favoriteId: favorite?.id,
                    templateId,
                };
                return accumulator;
            }, {});

            setFavoriteMap(prev => ({
                ...prev,
                ...nextFavoriteMap,
            }));
            setTemplates(prev => (
                isFirstPage
                    ? formatted
                    : dedupeTemplates([...prev, ...formatted])
            ));
            setPage(pageNumber);
            setHasMore(hasKnownTotal
                ? parsedTotal > pageNumber * TEMPLATE_PAGE_SIZE
                : favoriteRows.length === TEMPLATE_PAGE_SIZE);
            setHasLoadedOnce(true);
        } catch (error) {
            console.log('Favorite templates error', error);

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
        if (activeCategory === FAVORITES_CHIP.id) {
            fetchFavoriteTemplates({ pageNumber: 1 });
            return;
        }

        fetchTemplates({
            pageNumber: 1,
            searchText: debouncedSearch,
            categoryId: categoryIdSelected,
        });
    }, [activeCategory, categoryIdSelected, debouncedSearch, fetchFavoriteTemplates, fetchTemplates]);

    const handleSearch = useCallback(text => {
        setSearch(text);
    }, []);

    const handleCreatePress = useCallback(() => {
        navigation?.navigate?.('TemplateScreen', { categoryId: 'all' });
    }, [navigation]);

    const handleHomeTabPress = useCallback(() => {
        setActiveTab('home');
        setActiveCategoryUi('all');
        setCategoryIdSelected(null);
        dispatch(setActiveCategory('all'));
        setPage(1);
        flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }, [dispatch]);

    const handleTrendingPress = useCallback(() => {
        setActiveTab('trending');
        setActiveCategoryUi('all');
        setCategoryIdSelected(null);
        dispatch(setActiveCategory('all'));
        setPage(1);
    }, [dispatch]);

    const loadMore = useCallback(() => {
        if (!hasLoadedOnce || !templates.length || !hasMore || isInitialLoading || isLoadingMore) return;

        if (activeCategory === FAVORITES_CHIP.id) {
            fetchFavoriteTemplates({
                pageNumber: page + 1,
            });
            return;
        }

        fetchTemplates({
            pageNumber: page + 1,
            searchText: debouncedSearch,
            categoryId: categoryIdSelected,
        });
    }, [activeCategory, categoryIdSelected, debouncedSearch, fetchFavoriteTemplates, fetchTemplates, hasLoadedOnce, hasMore, isInitialLoading, isLoadingMore, page, templates.length]);

    const whatsappCaption = useMemo(() => {
        const text = (userMessage || '').trim();
        const name = (userName || '').trim();
        if (text && name) return `${text}\n- ${name}`;
        if (text) return text;
        if (name) return name;
        return '';
    }, [userMessage, userName]);

    const chips = useMemo(() => {
        const hasFavoritesChip = categories.some(item => item.id === FAVORITES_CHIP.id);
        return hasFavoritesChip ? categories : [...categories, FAVORITES_CHIP];
    }, [categories]);
    const previewChips = useMemo(() => chips.slice(0, CATEGORY_PREVIEW_LIMIT), [chips]);
    const hasMoreCategories = chips.length > CATEGORY_PREVIEW_LIMIT;

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
            try {
                await syncSubscriptionStatus(dispatch);
            } catch (error) {
                console.log('Subscription status sync error', error);
            }
        })();
    }, [dispatch]);

    const loadSubscriptionPlans = useCallback(async () => {
        try {
            setSubscriptionPlansLoading(true);
            const response = await getSubscriptionPlansApi();
            const nextPlans = Array.isArray(response?.data?.data)
                ? response.data.data.filter(plan => plan?.is_active !== false)
                : [];
            setSubscriptionPlans(nextPlans);
        } catch (error) {
            console.log('Subscription plans error', error);
            Alert.alert('Subscription', 'Unable to load subscription plans right now.');
        } finally {
            setSubscriptionPlansLoading(false);
        }
    }, []);

    const openSubscriptionModal = useCallback((onSubscribedAction = null) => {
        pendingPremiumActionRef.current = typeof onSubscribedAction === 'function' ? onSubscribedAction : null;
        setSubscriptionVisible(true);
        loadSubscriptionPlans();
    }, [loadSubscriptionPlans]);

    const closeSubscriptionModal = useCallback(() => {
        pendingPremiumActionRef.current = null;
        setSubscriptionVisible(false);
    }, []);

    const handleSubscribe = useCallback(async plan => {
        try {
            setSubmittingPlanId(plan?.id ?? 'pending');
            const profile = await getUserProfile();
            const checkoutResponse = await startRazorpayTestCheckout({ plan, profile });
            await verifySubscriptionPurchaseAndSync({
                checkoutResponse,
                planId: plan?.id,
                dispatch,
            });

            setSubscriptionVisible(false);
            const pendingAction = pendingPremiumActionRef.current;
            pendingPremiumActionRef.current = null;
            pendingAction?.();
            Alert.alert('Subscription', 'Premium subscription activated successfully.');
        } catch (error) {
            const code = error?.code;
            if (code === 0 || code === 'PAYMENT_CANCELLED') {
                return;
            }

            console.log('Subscription checkout error', error);
            Alert.alert(
                'Subscription',
                error?.message || 'Unable to complete subscription right now.',
            );
        } finally {
            setSubmittingPlanId(null);
        }
    }, [dispatch]);

    const withPremiumAccess = useCallback((item, action) => {
        if (!isPremiumTemplate(item) || isPremium) {
            action?.();
            return;
        }

        openSubscriptionModal(action);
    }, [isPremium, openSubscriptionModal]);

    const handleSeeAllPress = useCallback(() => {
        setCategoryModalVisible(false);
        setActiveCategoryUi('all');
        setCategoryIdSelected(null);
        dispatch(setActiveCategory('all'));
        navigation?.navigate?.('TemplateScreen', { categoryId: 'all' });
    }, [dispatch, navigation]);

    const handleCategoryPress = useCallback((item) => {
        setActiveTab('home');
        setActiveCategoryUi(item?.id);
        const categoryId = item?.categoryId === 'all' || item?.id === FAVORITES_CHIP.id
            ? null
            : item?.categoryId;
        setCategoryIdSelected(categoryId);
        dispatch(setActiveCategory(item?.id ?? 'all'));
        setPage(1);
    }, [dispatch]);

    const handleSavedPress = useCallback(() => {
        handleCategoryPress(FAVORITES_CHIP);
        setActiveTab('saved');
        flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    }, [handleCategoryPress]);

    // FIX 1: Unified edit handler — always passes full context so user photo is
    // never lost in EditorScreen regardless of which reel is tapped.
    const handleEdit = useCallback(
        item => {
            withPremiumAccess(item, () => {
                dispatch(setSelectedTemplate(item));
                navigation?.navigate?.('EditorScreen', {
                    templateId: item.id,
                    template: item,
                    userName,
                    userMessage,
                    userPhoto,
                });
            });
        },
        [dispatch, navigation, userMessage, userName, userPhoto, withPremiumAccess],
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
            withPremiumAccess(item, async () => {
                await prepareTemplateForMediaAction(item);
                await sharePosterToWhatsApp(whatsappCaption || undefined);
            });
        },
        [isActionInProgress, prepareTemplateForMediaAction, sharePosterToWhatsApp, whatsappCaption, withPremiumAccess],
    );

    const handleDownload = useCallback(
        async item => {
            if (isActionInProgress) return;
            withPremiumAccess(item, async () => {
                await prepareTemplateForMediaAction(item);
                await savePoster();
            });
        },
        [isActionInProgress, prepareTemplateForMediaAction, savePoster, withPremiumAccess],
    );

    const stopCardPress = useCallback(event => {
        event?.stopPropagation?.();
    }, []);

    const handleFavoriteToggle = useCallback(async item => {
        const templateId = String(item?.id ?? '');
        if (!templateId || favoriteLoadingMap[templateId]) {
            return;
        }

        setFavoriteLoadingMap(prev => ({ ...prev, [templateId]: true }));

        try {
            const existingFavorite = favoriteMap[templateId];

            if (existingFavorite?.favoriteId) {
                await removeFavoriteApi(existingFavorite.favoriteId);
                setFavoriteMap(prev => {
                    const next = { ...prev };
                    delete next[templateId];
                    return next;
                });
                if (activeCategory === FAVORITES_CHIP.id) {
                    setTemplates(prev => prev.filter(template => template?.id !== templateId));
                }
                return;
            }

            const response = await addFavoriteApi(templateId);
            const favorite = response?.data?.data;
            const favoriteId = favorite?.id;

            setFavoriteMap(prev => ({
                ...prev,
                [templateId]: {
                    favoriteId,
                    templateId,
                },
            }));
        } catch (error) {
            console.log('Favorite toggle error', error);
            Alert.alert(
                'Favorites',
                error?.response?.data?.message || 'Unable to update favorites right now.',
            );
        } finally {
            setFavoriteLoadingMap(prev => ({ ...prev, [templateId]: false }));
        }
    }, [activeCategory, favoriteLoadingMap, favoriteMap]);
// console.log("reelsData", reelsData);
const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
}), []);
    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.headerBackground} />

            {activeTab === 'profile' ? (
                <View style={styles.settingsScreen}>
                    <View style={styles.settingsHeader}>
                        <Pressable style={styles.settingsBackBtn} onPress={handleHomeTabPress} hitSlop={12}>
                            <MaterialCommunityIcons name="chevron-left" style={styles.settingsBackIcon} />
                        </Pressable>
                        <Text style={styles.settingsTitle}>Settings</Text>
                        <View style={styles.settingsHeaderSpacer} />
                    </View>

                    <View style={styles.settingsProfileCard}>
                        <Pressable style={styles.settingsAvatarWrap} onPress={handleSettingsPhotoPress}>
                            {settingsPhoto ? (
                                <Image source={{ uri: settingsPhoto }} style={styles.settingsAvatar} resizeMode="cover" />
                            ) : (
                                <MaterialCommunityIcons name="account" style={styles.settingsAvatarIcon} />
                            )}
                            <View style={styles.settingsCameraBadge}>
                                <MaterialCommunityIcons name="camera" style={styles.settingsCameraIcon} />
                            </View>
                        </Pressable>

                        <View style={styles.settingsProfileTextWrap}>
                            {isEditingSettingsProfile ? (
                                <TextInput
                                    style={styles.settingsNameInput}
                                    value={settingsName}
                                    onChangeText={setSettingsName}
                                    placeholder="Your name"
                                    placeholderTextColor="#9A9A9A"
                                />
                            ) : (
                                <Text style={styles.settingsName}>{settingsName || 'Your Name'}</Text>
                            )}
                            <Text style={styles.settingsProfileHint}>
                                {isEditingSettingsProfile ? 'Editing locally on this device' : 'Tap photo or edit to update'}
                            </Text>
                        </View>

                        <Pressable
                            style={styles.settingsEditBtn}
                            onPress={isEditingSettingsProfile ? handleSaveSettingsProfile : () => setEditingSettingsProfile(true)}
                            disabled={isPickingProfileImage}>
                            <Text style={styles.settingsEditText}>
                                {isEditingSettingsProfile ? 'Save' : 'Edit'}
                            </Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.settingsList} showsVerticalScrollIndicator={false}>
                        {SETTINGS_OPTIONS.map(option => (
                            <Pressable
                                key={option.key}
                                style={styles.settingsOption}
                                onPress={() => handleSettingOptionPress(option)}>
                                <MaterialCommunityIcons
                                    name={option.icon}
                                    style={[
                                        styles.settingsOptionIcon,
                                        option.tone === 'warning' && styles.settingsOptionIconWarning,
                                        option.tone === 'danger' && styles.settingsOptionIconDanger,
                                    ]}
                                />
                                <Text style={styles.settingsOptionText}>{option.label}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Text style={styles.settingsVersion}>v 2.0.0(795)</Text>
                </View>
            ) : (
                <>
                    {activeTab === 'trending' ? (
                        <View style={styles.comingSoonScreen}>
                            <LinearGradient
                                colors={['#C9E6F7', '#FFFFFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.comingSoonCard}>
                                <MaterialCommunityIcons name="chart-line-variant" style={styles.comingSoonIcon} />
                                <Text style={styles.comingSoonTitle}>Coming soon</Text>
                                <Text style={styles.comingSoonText}>
                                    Trending posters will appear here shortly.
                                </Text>
                            </LinearGradient>
                        </View>
                    ) : (
                        <>
            <LinearGradient
                colors={['#C9E6F7', '#FFFFFF']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.staticHeader}>

                <View style={styles.headerRow}>
                    <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" style={styles.searchIcon} />
                        <TextInput
                            placeholder={t('home.searchPlaceholder')}
                            style={styles.searchInput}
                            value={search}
                            onChangeText={handleSearch}
                            placeholderTextColor="#6D7782"
                        />
                    </View>

                    <Pressable
                        style={styles.notificationBtn}
                        onPress={() => Alert.alert('Notifications', 'No new notifications right now.')}
                        hitSlop={8}>
                        <MaterialCommunityIcons name="bell-outline" style={styles.notificationIcon} />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>6</Text>
                        </View>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.categoryPreviewScroll}
                    contentContainerStyle={styles.chipRow}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}>
                    {previewChips?.map(item => {
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
                    {hasMoreCategories ? (
                        <Pressable style={styles.categoryChip} onPress={() => setCategoryModalVisible(true)}>
                            <Text style={styles.categoryChipLabel}>
                                {t('home.more', { defaultValue: 'More' })}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" style={styles.categoryChipIcon} />
                        </Pressable>
                    ) : null}
                </ScrollView>
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
                // pagingEnabled
                decelerationRate="fast"
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                contentContainerStyle={styles.reelsContent}
                snapToInterval={ITEM_HEIGHT}
    snapToAlignment="start"
    disableIntervalMomentum={true} // Forces a swipe to snap one item at a time (like Instagram)
    getItemLayout={getItemLayout}  // Prevents the drift you experienced earlier
                renderItem={({ item, index }) => (
                    <View style={styles.feedItemWrap}>
                        <View style={styles.reelCard}>
                            {/* FIX 1: media tap now uses handleEdit (same as bottom bar) so
                                selectedTemplate + full context is always dispatched together */}
                            <Pressable style={styles.mediaTapArea} onPress={() => handleEdit(item)}>
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
                                                name="download-outline"
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
                                                name="share-outline"
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
                                                name="pencil-outline"
                                                style={styles.metricActionIcon}
                                            />
                                        </Pressable>
                                    </View>

                                    <Pressable
                                        style={styles.bookmarkBtn}
                                        onPressIn={stopCardPress}
                                        onPress={event => {
                                            event.stopPropagation?.();
                                            handleFavoriteToggle(item);
                                        }}
                                        disabled={!!favoriteLoadingMap[item.id]}
                                        hitSlop={10}>
                                        <MaterialCommunityIcons
                                            name={favoriteMap[item.id] ? 'bookmark' : 'bookmark-outline'}
                                            style={[
                                                styles.bookmarkIcon,
                                                favoriteMap[item.id] && styles.bookmarkIconActive,
                                            ]}
                                        />
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
                                    <Text style={styles.changeImageText}>
                                        {t('home.actions.changeYourImage', { defaultValue: 'Change your image' })}
                                    </Text>
                                </Pressable>
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            <View style={styles.hiddenCaptureStage} pointerEvents="none">
                <PosterPreview
                    posterRef={posterRef}
                    playVideo={false}
                    preferStillImageForVideo
                    enablePhotoAnimation={false}
                />
            </View>

            <SubscriptionModal
                visible={isSubscriptionVisible}
                onClose={closeSubscriptionModal}
                plans={subscriptionPlans}
                loading={subscriptionPlansLoading}
                submittingPlanId={submittingPlanId}
                onSubscribe={handleSubscribe}
            />
                        </>
                    )}

            <CustomBottomNavigation
                activeKey={
                    activeTab === 'saved' || activeCategory === FAVORITES_CHIP.id
                        ? 'saved'
                        : activeTab === 'trending'
                            ? 'trending'
                            : 'home'
                }
                userPhoto={userPhoto}
                onHomePress={handleHomeTabPress}
                onTrendingPress={handleTrendingPress}
                onCreatePress={handleCreatePress}
                onSavedPress={handleSavedPress}
                onProfilePress={handleProfilePress}
            />

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
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.pageBackground,
    },
    comingSoonScreen: {
        flex: 1,
        paddingHorizontal: widthPixel(24),
        paddingBottom: heightPixel(128),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.pageBackground,
    },
    comingSoonCard: {
        width: '100%',
        borderRadius: widthPixel(28),
        paddingHorizontal: widthPixel(24),
        paddingVertical: heightPixel(34),
        alignItems: 'center',
        shadowColor: '#5B2BD8',
        shadowOpacity: 0.24,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    comingSoonIcon: {
        fontSize: widthPixel(54),
        color: '#FFFFFF',
        marginBottom: heightPixel(10),
    },
    comingSoonTitle: {
        fontSize: widthPixel(26),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
        marginBottom: heightPixel(8),
    },
    comingSoonText: {
        textAlign: 'center',
        fontSize: widthPixel(13),
        lineHeight: heightPixel(20),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: 'rgba(255,255,255,0.86)',
    },
    settingsScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    settingsHeader: {
        height: heightPixel(50),
        paddingHorizontal: widthPixel(22),
        // paddingTop: heightPixel(28),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: widthPixel(1.5),
        borderBottomColor: '#59489B',
    },
    settingsBackBtn: {
        width: widthPixel(42),
        height: widthPixel(42),
        justifyContent: 'center',
    },
    settingsBackIcon: {
        fontSize: widthPixel(38),
        color: '#080719',
    },
    settingsTitle: {
        fontSize: widthPixel(21),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#080808',
    },
    settingsHeaderSpacer: {
        width: widthPixel(42),
    },
    settingsProfileCard: {
        marginHorizontal: widthPixel(28),
        marginTop: heightPixel(22),
        marginBottom: heightPixel(6),
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(12),
    },
    settingsAvatarWrap: {
        width: widthPixel(68),
        height: widthPixel(68),
        borderRadius: widthPixel(34),
        backgroundColor: '#F2F2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: widthPixel(34),
    },
    settingsAvatarIcon: {
        fontSize: widthPixel(34),
        color: '#777777',
    },
    settingsCameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: widthPixel(24),
        height: widthPixel(24),
        borderRadius: widthPixel(12),
        backgroundColor: '#5B55D9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: widthPixel(2),
        borderColor: '#FFFFFF',
    },
    settingsCameraIcon: {
        fontSize: widthPixel(13),
        color: '#FFFFFF',
    },
    settingsProfileTextWrap: {
        flex: 1,
    },
    settingsName: {
        fontSize: widthPixel(18),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#1B1B1B',
    },
    settingsNameInput: {
        height: heightPixel(38),
        borderBottomWidth: widthPixel(1),
        borderBottomColor: '#59489B',
        paddingVertical: 0,
        fontSize: widthPixel(17),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#1B1B1B',
    },
    settingsProfileHint: {
        marginTop: heightPixel(4),
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#8C8C8C',
    },
    settingsEditBtn: {
        minWidth: widthPixel(58),
        height: heightPixel(34),
        borderRadius: widthPixel(17),
        backgroundColor: '#5B55D9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: widthPixel(12),
    },
    settingsEditText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
    settingsList: {
        paddingHorizontal: widthPixel(28),
        paddingTop: heightPixel(4),
        paddingBottom: heightPixel(110),
    },
    settingsOption: {
        minHeight: heightPixel(56),
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(28),
        borderBottomWidth: widthPixel(1.5),
        borderBottomColor: '#59489B',
    },
    settingsOptionIcon: {
        width: widthPixel(32),
        textAlign: 'center',
        fontSize: widthPixel(22),
        color: '#1E1E1E',
    },
    settingsOptionIconWarning: {
        color: '#C63E17',
    },
    settingsOptionIconDanger: {
        color: '#FF4038',
    },
    settingsOptionText: {
        flex: 1,
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: '#222222',
    },
    settingsVersion: {
        position: 'absolute',
        bottom: heightPixel(28),
        alignSelf: 'center',
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#A7A7A7',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: widthPixel(12),
    },

    staticHeader: {
        paddingHorizontal: widthPixel(20),
        paddingTop: heightPixel(16),
        paddingBottom: heightPixel(14),
        backgroundColor: COLORS.headerBackground,
    },
    searchBar: {
        flex: 1,
        height: heightPixel(48),
        borderRadius: widthPixel(24),
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(15),
        shadowColor: '#8DBAD2',
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    searchIcon: {
        fontSize: widthPixel(25),
        color: '#101417',
        marginRight: widthPixel(10),
    },
    searchInput: {
        flex: 1,
        fontSize: widthPixel(13),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#101417',
        paddingVertical: 0,
    },
    notificationBtn: {
        width: widthPixel(48),
        height: widthPixel(48),
        borderRadius: widthPixel(24),
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8DBAD2',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    notificationIcon: {
        fontSize: widthPixel(27),
        color: '#111111',
    },
    notificationBadge: {
        position: 'absolute',
        top: heightPixel(8),
        right: widthPixel(8),
        width: widthPixel(16),
        height: widthPixel(16),
        borderRadius: widthPixel(8),
        backgroundColor: '#FF1E2D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: widthPixel(1),
        borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
        fontSize: widthPixel(9),
        lineHeight: heightPixel(11),
        color: '#FFFFFF',
        fontFamily: fonts.FONT_FAMILY.Bold,
        includeFontPadding: false,
    },
    chipRow: {
        marginTop: heightPixel(18),
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CHIP_GAP,
        paddingVertical: heightPixel(4),
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
        fontSize: widthPixel(13),
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
        paddingTop: 0,
        paddingBottom: heightPixel(130),
        backgroundColor: COLORS.pageBackground,
    },
    feedItemWrap: {
        marginBottom: 0,
        paddingHorizontal: 0,
    },
    reelCard: {
        width: '100%',
        borderRadius: 0,
        backgroundColor: COLORS.cardBackground,
        overflow: 'hidden',
        borderWidth: 0,
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
    reelAudioToggle: {
        right: widthPixel(14),
        bottom: heightPixel(14),
        zIndex: 5,
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
        minHeight: heightPixel(30),
        paddingHorizontal: widthPixel(2),
        borderRadius: widthPixel(18),
    },
    metricActionIcon: {
        fontSize: widthPixel(22),
        color: '#222A34',
    },
    metricCount: {
        fontSize: widthPixel(12),
        color: '#424A55',
        fontFamily: fonts.FONT_FAMILY.Medium,
    },
    bookmarkBtn: {
        height: heightPixel(30),
        width: widthPixel(30),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: widthPixel(15),
        backgroundColor: '#FFFFFF',
    },
    bookmarkIcon: {
        fontSize: widthPixel(22),
        color: '#222A34',
    },
    bookmarkIconActive: {
        color: COLORS.primary,
    },
    changeImageBtn: {
        width: '100%',
        height: heightPixel(33),
        borderRadius: widthPixel(19),
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
