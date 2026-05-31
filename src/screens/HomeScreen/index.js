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
    setSpecialCategoryContext,
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
import PosterPreview, {
    getPremiumDetailsForPoster,
} from '../../components/PosterPreview';
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
        case 'panchayat chunav':
        case 'panchayat':
            return 'home-city-outline';
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
const SPECIAL_CATEGORY_TYPES = {
    political: 'political',
    'panchayat chunav': 'panchayat',
    panchayat: 'panchayat',
};
const POLITICAL_PARTIES = [
    { id: 'bjp', name: 'BJP', color: '#F97316' },
    { id: 'congress', name: 'Congress', color: '#22C55E' },
    { id: 'aap', name: 'AAP', color: '#2563EB' },
    { id: 'samajwadi', name: 'Samajwadi Party', color: '#DC2626' },
];
const PANCHAYAT_ENTITIES = [
    { id: 'sarpanch', name: 'Sarpanch Candidate', color: '#0EA5E9' },
    { id: 'ward', name: 'Ward Member', color: '#8B5CF6' },
    { id: 'gram', name: 'Gram Panchayat', color: '#16A34A' },
    { id: 'zila', name: 'Zila Parishad', color: '#F59E0B' },
];
const CREATE_POSTER_PRESETS = [
    { id: 'sunrise', name: 'Sunrise Quote', color: '#F97316', source: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200' },
    { id: 'office', name: 'Business Blue', color: '#2563EB', source: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200' },
    { id: 'village', name: 'Village Ground', color: '#16A34A', source: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200' },
];
const TEMPLATE_SOCIAL_PLATFORMS = [
    { key: 'facebook', icon: 'facebook' },
    { key: 'instagram', icon: 'instagram' },
    { key: 'twitter', icon: 'twitter' },
    { key: 'snapchat', icon: 'snapchat' },
    { key: 'other', icon: 'at' },
];

const TemplatePosterPreview = ({ template, userPhoto, userName, userMessage, shouldPlay, isPremium, premiumProfile, designLayoutIndex, photoShape, photoPosition, photoScale }) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isMuted, setIsMuted] = useState(true);
    const [hasAudio, setHasAudio] = useState(true);
    const canvasSize = useMemo(() => getTemplateCanvasSize(template), [template]);
    const premiumDetails = useMemo(
        () => getPremiumDetailsForPoster({ isPremium, premiumProfile }),
        [isPremium, premiumProfile],
    );
    const topBandHeight = premiumDetails ? heightPixel(34) : 0;
    const bottomBandHeight = premiumDetails ? heightPixel(44) : 0;
    const posterLayout = useMemo(() => {
        const availableHeight = Math.max(0, containerSize.height - topBandHeight - bottomBandHeight);
        const fitLayout = getPosterFitLayout(containerSize.width, availableHeight, canvasSize);
        if (!containerSize.width || !availableHeight || !canvasSize?.width || !canvasSize?.height) {
            return fitLayout;
        }

        const scale = containerSize.width / canvasSize.width;
        const height = canvasSize.height * scale;

        return {
            width: containerSize.width,
            height,
            offsetX: 0,
            offsetY: topBandHeight + (availableHeight - height) / 2,
            scaleX: scale,
            scaleY: scale,
        };
    }, [bottomBandHeight, canvasSize, containerSize.height, containerSize.width, topBandHeight]);
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
            photoShape: photoShape || 'template',
            photoPosition: photoPosition || { x: 0, y: 0 },
            photoScale: photoScale || 1,
        }),
        [photoPosition, photoScale, photoShape, posterLayout, template?.photoFrame],
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

    const socialItems = useMemo(() => {
        if (!premiumDetails?.socials) return [];
        return premiumDetails.socials.slice(0, 3);
    }, [premiumDetails?.socials]);

    return (
        <View
            style={styles.reelMedia}
            onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                if (width !== containerSize.width || height !== containerSize.height) {
                    setContainerSize({ width, height });
                }
            }}>
            {premiumDetails ? (
                <>
                    <View style={[styles.reelPremiumTop, { height: topBandHeight }]}>
                        {premiumDetails.logo ? (
                            <Image source={{ uri: premiumDetails.logo }} style={styles.reelPremiumLogo} />
                        ) : null}
                        <View style={styles.reelPremiumTitleWrap}>
                            {premiumDetails.name ? (
                                <Text style={styles.reelPremiumName} numberOfLines={1}>{premiumDetails.name}</Text>
                            ) : null}
                            {premiumDetails.description ? (
                                <Text style={styles.reelPremiumDescription} numberOfLines={1}>
                                    {premiumDetails.description}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={[styles.reelPremiumBottom, { height: bottomBandHeight }]}>
                        <View style={styles.reelPremiumContactRow}>
                            {[
                                premiumDetails.mobile ? { icon: 'phone-outline', text: premiumDetails.mobile } : null,
                                premiumDetails.address ? { icon: 'map-marker-outline', text: premiumDetails.address } : null,
                                premiumDetails.social ? { icon: 'at', text: premiumDetails.social } : null,
                                premiumDetails.website ? { icon: 'web', text: premiumDetails.website } : null,
                            ].filter(Boolean).slice(0, 2).map(item => (
                                <View key={item.text} style={styles.reelPremiumContactItem}>
                                    <MaterialCommunityIcons name={item.icon} style={styles.reelPremiumContactIcon} />
                                    <Text style={styles.reelPremiumContact} numberOfLines={1}>{item.text}</Text>
                                </View>
                            ))}
                            {socialItems.map(item => (
                                <View key={`${item.key}_${item.text}`} style={styles.reelPremiumContactItem}>
                                    <MaterialCommunityIcons name={item.icon} style={styles.reelPremiumContactIcon} />
                                    <Text style={styles.reelPremiumContact} numberOfLines={1}>{item.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </>
            ) : null}
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
                    renderUserPhotoLayer={({ layer, layerStyle }) => {
                        const templateRadius = Number.isFinite(Number(layer?.borderRadius))
                            ? Number(layer.borderRadius)
                            : Number.isFinite(Number(layer?.border_radius))
                                ? Number(layer.border_radius)
                                : 0;
                        const shapeRadius = photoShape === 'circle' ? 999
                            : photoShape === 'square' ? 4
                            : photoShape === 'rounded' ? 24
                            : templateRadius;
                        return userPhoto ? (
                            <View style={[styles.userPhotoFrame, layerStyle, { borderRadius: shapeRadius }]} pointerEvents="none">
                                <Image source={{ uri: userPhoto }} style={styles.userPhoto} resizeMode="cover" />
                            </View>
                        ) : null;
                    }}
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

const getSpecialCategoryType = item => {
    const normalized = String(item?.id ?? item?.label ?? '').trim().toLowerCase();
    return SPECIAL_CATEGORY_TYPES[normalized] || null;
};

const buildCustomTemplate = ({ source, name = 'Custom Poster' }) => ({
    id: `custom_${Date.now()}`,
    name,
    category: 'custom',
    mediaType: 'IMAGE',
    source,
    thumbnail: source,
    accentColor: '#0D62DF',
    backgroundColor: '#DDE5EC',
    config: {
        width: 1080,
        height: 1920,
        layers: [
            { id: 'bg', type: 'image', src: '{{background_image}}', x: 0, y: 0, width: 1080, height: 1920 },
            { id: 'user_photo', type: 'image', src: '{{user_photo}}', x: 360, y: 1140, width: 360, height: 360, borderRadius: 180, borderWidth: 8, borderColor: '#FFFFFF' },
            { id: 'headline', type: 'text', text: '{{headline}}', x: 80, y: 1520, width: 920, align: 'center', color: '#FFFFFF', fontSize: 72, fontWeight: 'bold' },
            { id: 'subtext', type: 'text', text: '{{subtext}}', x: 100, y: 1620, width: 880, align: 'center', color: '#FFFFFF', fontSize: 40 },
        ],
        variables: [
            { key: 'background_image', type: 'image', default: source },
            { key: 'user_photo', type: 'image', default: '' },
            { key: 'headline', type: 'text', default: 'Your Name' },
            { key: 'subtext', type: 'text', default: 'Your Message' },
        ],
    },
});

const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userPhoto = useSelector(state => state.poster.userPhoto);
    const userName = useSelector(state => state.poster.userName);
    const userMessage = useSelector(state => state.poster.userMessage);
    const isPremium = useSelector(state => state.poster.isPremium);
    const premiumProfile = useSelector(state => state.poster.premiumProfile);
    const designLayoutIndex = useSelector(state => state.poster.designLayoutIndex);
    const photoShape = useSelector(state => state.poster.photoShape);
    const photoPosition = useSelector(state => state.poster.photoPosition);
    const photoScale = useSelector(state => state.poster.photoScale);
    const specialCategoryContext = useSelector(state => state.poster.specialCategoryContext);
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
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [createSearch, setCreateSearch] = useState('');
    const [specialPickerType, setSpecialPickerType] = useState(null);
    const [pendingSpecialCategory, setPendingSpecialCategory] = useState(null);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
    const [submittingPlanId, setSubmittingPlanId] = useState(null);

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
                ...(formatted.some(item => getSpecialCategoryType(item) === 'panchayat')
                    ? []
                    : [{ id: 'panchayat', label: t('categories.panchayat', { defaultValue: 'Panchayat Chunav' }), icon: mapCategoryIcon('panchayat'), categoryId: null }]),
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
        navigation?.navigate?.('SettingsScreen');
    }, [navigation]);

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

    const openEditorWithTemplate = useCallback((template, extraParams = {}) => {
        dispatch(setSelectedTemplate(template));
        navigation?.navigate?.('EditorScreen', {
            templateId: template.id,
            template,
            userName,
            userMessage,
            userPhoto,
            ...extraParams,
        });
    }, [dispatch, navigation, userMessage, userName, userPhoto]);

    const handleCreatePress = useCallback(() => {
        setCreateSearch('');
        setCreateModalVisible(true);
    }, []);

    const handleCreateFromGallery = useCallback(async () => {
        const backgroundUri = await pickImage({ autoStoreInProfilePhoto: false });
        if (!backgroundUri) return;

        let nextUserPhoto = userPhoto;
        if (!nextUserPhoto) {
            nextUserPhoto = await pickImage({ autoStoreInProfilePhoto: false });
            if (nextUserPhoto) {
                dispatch(setUserPhoto(nextUserPhoto));
            }
        }

        const template = buildCustomTemplate({
            source: backgroundUri,
            name: t('home.create.customPoster'),
        });
        setCreateModalVisible(false);
        openEditorWithTemplate(template, { userPhoto: nextUserPhoto || userPhoto });
    }, [dispatch, openEditorWithTemplate, pickImage, t, userPhoto]);

    const handleCreatePresetSelect = useCallback(async preset => {
        let nextUserPhoto = userPhoto;
        if (!nextUserPhoto) {
            nextUserPhoto = await pickImage({ autoStoreInProfilePhoto: false });
            if (nextUserPhoto) {
                dispatch(setUserPhoto(nextUserPhoto));
            }
        }
        setCreateModalVisible(false);
        openEditorWithTemplate(buildCustomTemplate({ source: preset.source, name: preset.name }), {
            userPhoto: nextUserPhoto || userPhoto,
        });
    }, [dispatch, openEditorWithTemplate, pickImage, userPhoto]);

    const handleDevPremiumToggle = useCallback(async () => {
        const nextValue = !isPremium;
        dispatch(setPremiumStatus(nextValue));
        try {
            await mergeUserProfile({ isPremium: nextValue });
        } catch (error) {
            console.log('Dev premium toggle persist error', error);
        }
    }, [dispatch, isPremium]);

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
    const previewChips = useMemo(() => {
        const visible = chips.slice(0, CATEGORY_PREVIEW_LIMIT);
        if (visible.some(item => item.id === activeCategory)) {
            return visible;
        }
        const activeChip = chips.find(item => item.id === activeCategory);
        if (!activeChip) return visible;
        return [activeChip, ...visible.filter(item => item.id !== activeChip.id)].slice(0, CATEGORY_PREVIEW_LIMIT);
    }, [activeCategory, chips]);
    const hasMoreCategories = chips.length > CATEGORY_PREVIEW_LIMIT;
    const filteredCreatePresets = useMemo(() => {
        const query = createSearch.trim().toLowerCase();
        if (!query) return CREATE_POSTER_PRESETS;
        return CREATE_POSTER_PRESETS.filter(item => item.name.toLowerCase().includes(query));
    }, [createSearch]);
    const specialPickerChoices = useMemo(
        () => specialPickerType === 'panchayat' ? PANCHAYAT_ENTITIES : POLITICAL_PARTIES,
        [specialPickerType],
    );
    const specialChangeLabel = specialCategoryContext?.type === 'panchayat'
        ? t('home.actions.changePanchayat', { defaultValue: 'Change Panchayat' })
        : t('home.actions.changeParty', { defaultValue: 'Change Party' });

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
        const specialType = getSpecialCategoryType(item);
        if (specialType) {
            setPendingSpecialCategory(item);
            setSpecialPickerType(specialType);
            return;
        }

        dispatch(setSpecialCategoryContext(null));
        setActiveTab('home');
        setActiveCategoryUi(item?.id);
        const categoryId = item?.categoryId === 'all' || item?.id === FAVORITES_CHIP.id
            ? null
            : item?.categoryId;
        setCategoryIdSelected(categoryId);
        dispatch(setActiveCategory(item?.id ?? 'all'));
        setPage(1);
    }, [dispatch]);

    const applySpecialCategorySelection = useCallback((choice) => {
        const item = pendingSpecialCategory || {
            id: specialPickerType === 'panchayat' ? 'panchayat' : 'political',
            label: specialPickerType === 'panchayat'
                ? t('categories.panchayat', { defaultValue: 'Panchayat Chunav' })
                : t('categories.political', { defaultValue: 'Political' }),
            categoryId: null,
        };
        setSpecialPickerType(null);
        setPendingSpecialCategory(null);
        dispatch(setSpecialCategoryContext({
            type: specialPickerType,
            id: choice.id,
            name: choice.name,
            color: choice.color,
        }));
        setActiveTab('home');
        setActiveCategoryUi(item?.id);
        const categoryId = item?.categoryId === 'all' || item?.id === FAVORITES_CHIP.id
            ? null
            : item?.categoryId;
        setCategoryIdSelected(categoryId);
        dispatch(setActiveCategory(item?.id ?? 'all'));
        setPage(1);
    }, [dispatch, pendingSpecialCategory, specialPickerType, t]);

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
                openEditorWithTemplate(item);
            });
        },
        [openEditorWithTemplate, withPremiumAccess],
    );

    const handleChangeSpecialContext = useCallback(() => {
        if (!specialCategoryContext?.type) return;
        setPendingSpecialCategory(null);
        setSpecialPickerType(specialCategoryContext.type);
    }, [specialCategoryContext?.type]);

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
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
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
                        onPress={() => navigation?.navigate?.('NotificationScreen')}
                        hitSlop={8}>
                        <MaterialCommunityIcons name="bell-outline" style={styles.notificationIcon} />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>6</Text>
                        </View>
                    </Pressable>
                </View>

                <Pressable
                    style={[styles.devPremiumToggle, isPremium && styles.devPremiumToggleActive]}
                    onPress={handleDevPremiumToggle}>
                    <MaterialCommunityIcons
                        name={isPremium ? 'crown' : 'crown-outline'}
                        style={[styles.devPremiumIcon, isPremium && styles.devPremiumIconActive]}
                    />
                    <Text style={[styles.devPremiumText, isPremium && styles.devPremiumTextActive]}>
                        {isPremium
                            ? t('home.devPremium.on', { defaultValue: 'Dev Premium: ON' })
                            : t('home.devPremium.off', { defaultValue: 'Dev Premium: OFF' })}
                    </Text>
                </Pressable>

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
                                    isPremium={isPremium}
                                    premiumProfile={premiumProfile}
                                    designLayoutIndex={designLayoutIndex}
                                    photoShape={photoShape}
                                    photoPosition={photoPosition}
                                    photoScale={photoScale}
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

                                <View style={styles.reelActionRow}>
                                    <Pressable
                                        style={[styles.changeImageBtn, specialCategoryContext?.type && styles.reelActionHalf, isActionInProgress && styles.actionBtnDisabled]}
                                        onPressIn={stopCardPress}
                                        disabled={isActionInProgress}
                                        onPress={event => {
                                            event.stopPropagation?.();
                                            handleEdit(item);
                                        }}>
                                        <Text style={styles.changeImageText} numberOfLines={1}>
                                            {t('home.actions.changeYourImage', { defaultValue: 'Change your image' })}
                                        </Text>
                                    </Pressable>
                                    {specialCategoryContext?.type ? (
                                        <Pressable
                                            style={[styles.changeImageBtn, styles.reelActionHalf, styles.changePartyBtn]}
                                            onPressIn={stopCardPress}
                                            onPress={event => {
                                                event.stopPropagation?.();
                                                handleChangeSpecialContext();
                                            }}>
                                            <Text style={styles.changePartyText} numberOfLines={1}>
                                                {specialChangeLabel}
                                            </Text>
                                        </Pressable>
                                    ) : null}
                                </View>
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

            <Modal
                visible={isCreateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCreateModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setCreateModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={stopCardPress}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {t('home.create.title', { defaultValue: 'Create Poster' })}
                            </Text>
                            <Pressable onPress={() => setCreateModalVisible(false)} hitSlop={10}>
                                <MaterialCommunityIcons name="close" style={styles.modalCloseIcon} />
                            </Pressable>
                        </View>

                        <Pressable
                            style={styles.galleryPickBtn}
                            onPress={handleCreateFromGallery}
                            disabled={isPickingProfileImage}>
                            <MaterialCommunityIcons name="image-plus" style={styles.galleryPickIcon} />
                            <View style={styles.galleryPickTextWrap}>
                                <Text style={styles.galleryPickTitle}>
                                    {t('home.create.galleryTitle', { defaultValue: 'Choose from gallery' })}
                                </Text>
                                <Text style={styles.galleryPickSub}>
                                    {t('home.create.gallerySubtitle', { defaultValue: 'Select a background poster from your device' })}
                                </Text>
                            </View>
                        </Pressable>

                        <View style={styles.createSearchBar}>
                            <MaterialCommunityIcons name="magnify" style={styles.createSearchIcon} />
                            <TextInput
                                value={createSearch}
                                onChangeText={setCreateSearch}
                                placeholder={t('home.create.searchPlaceholder', { defaultValue: 'Search background posters' })}
                                placeholderTextColor="#8A94A3"
                                style={styles.createSearchInput}
                            />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.createPresetGrid}>
                                {filteredCreatePresets.map(preset => (
                                    <Pressable
                                        key={preset.id}
                                        style={styles.createPresetCard}
                                        onPress={() => handleCreatePresetSelect(preset)}>
                                        <Image source={{ uri: preset.source }} style={styles.createPresetImage} resizeMode="cover" />
                                        <View style={[styles.createPresetAccent, { backgroundColor: preset.color }]} />
                                        <Text style={styles.createPresetName} numberOfLines={1}>{preset.name}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={!!specialPickerType}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setSpecialPickerType(null);
                    setPendingSpecialCategory(null);
                }}>
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        setSpecialPickerType(null);
                        setPendingSpecialCategory(null);
                    }}>
                    <Pressable style={styles.modalCard} onPress={stopCardPress}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {specialPickerType === 'panchayat'
                                    ? t('home.special.selectPanchayat', { defaultValue: 'Select Panchayat' })
                                    : t('home.special.selectParty', { defaultValue: 'Select Party' })}
                            </Text>
                            <Pressable
                                onPress={() => {
                                    setSpecialPickerType(null);
                                    setPendingSpecialCategory(null);
                                }}
                                hitSlop={10}>
                                <MaterialCommunityIcons name="close" style={styles.modalCloseIcon} />
                            </Pressable>
                        </View>

                        <View style={styles.specialChoiceList}>
                            {specialPickerChoices.map(choice => (
                                <Pressable
                                    key={choice.id}
                                    style={styles.specialChoice}
                                    onPress={() => applySpecialCategorySelection(choice)}>
                                    <View style={[styles.specialChoiceSwatch, { backgroundColor: choice.color }]} />
                                    <Text style={styles.specialChoiceText}>{choice.name}</Text>
                                    <MaterialCommunityIcons name="chevron-right" style={styles.specialChoiceIcon} />
                                </Pressable>
                            ))}
                        </View>
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
    devPremiumToggle: {
        alignSelf: 'flex-start',
        marginTop: heightPixel(12),
        minHeight: heightPixel(32),
        borderRadius: widthPixel(16),
        borderWidth: widthPixel(1),
        borderColor: '#93A4B8',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(7),
        paddingHorizontal: widthPixel(12),
    },
    devPremiumToggleActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    devPremiumIcon: {
        fontSize: widthPixel(16),
        color: COLORS.primary,
    },
    devPremiumIconActive: {
        color: '#FFFFFF',
    },
    devPremiumText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.primary,
    },
    devPremiumTextActive: {
        color: '#FFFFFF',
    },
    chipRow: {
        marginTop: heightPixel(12),
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
    reelPremiumTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(6),
        paddingHorizontal: widthPixel(8),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: widthPixel(1),
        borderBottomColor: '#E5E7EB',
    },
    reelPremiumLogo: {
        width: widthPixel(22),
        height: widthPixel(22),
        borderRadius: widthPixel(6),
        backgroundColor: '#EEF2FF',
    },
    reelPremiumTitleWrap: {
        flex: 1,
    },
    reelPremiumName: {
        fontSize: widthPixel(10),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#111827',
    },
    reelPremiumDescription: {
        marginTop: heightPixel(1),
        fontSize: widthPixel(8),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#6B7280',
    },
    reelPremiumBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 12,
        justifyContent: 'center',
        paddingHorizontal: widthPixel(8),
        paddingVertical: heightPixel(3),
        backgroundColor: '#FFFFFF',
        borderTopWidth: widthPixel(1),
        borderTopColor: '#E5E7EB',
    },
    reelPremiumContactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: widthPixel(4),
    },
    reelPremiumContactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(3),
    },
    reelPremiumContactIcon: {
        fontSize: widthPixel(10),
        color: '#0D62DF',
    },
    reelPremiumContact: {
        fontSize: widthPixel(8),
        lineHeight: heightPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#111827',
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
    reelActionRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(8),
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
        paddingHorizontal: widthPixel(10),
    },
    reelActionHalf: {
        flex: 1,
        width: undefined,
    },
    changePartyBtn: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    changeImageText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.primary,
    },
    changePartyText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#FFFFFF',
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
    galleryPickBtn: {
        minHeight: heightPixel(70),
        borderRadius: widthPixel(16),
        borderWidth: widthPixel(1),
        borderColor: '#D7DEE8',
        backgroundColor: '#F7FAFD',
        paddingHorizontal: widthPixel(14),
        paddingVertical: heightPixel(12),
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(12),
        marginBottom: heightPixel(12),
    },
    galleryPickIcon: {
        fontSize: widthPixel(28),
        color: COLORS.primary,
    },
    galleryPickTextWrap: {
        flex: 1,
    },
    galleryPickTitle: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#111827',
    },
    galleryPickSub: {
        marginTop: heightPixel(2),
        fontSize: widthPixel(11),
        lineHeight: heightPixel(16),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    createSearchBar: {
        height: heightPixel(42),
        borderRadius: widthPixel(21),
        borderWidth: widthPixel(1),
        borderColor: '#D7DEE8',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(13),
        marginBottom: heightPixel(12),
    },
    createSearchIcon: {
        fontSize: widthPixel(20),
        color: '#4B5563',
        marginRight: widthPixel(8),
    },
    createSearchInput: {
        flex: 1,
        paddingVertical: 0,
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#111827',
    },
    createPresetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: widthPixel(10),
        paddingBottom: heightPixel(8),
    },
    createPresetCard: {
        width: '31%',
        minWidth: widthPixel(92),
        borderRadius: widthPixel(12),
        overflow: 'hidden',
        backgroundColor: '#F3F6FA',
        borderWidth: widthPixel(1),
        borderColor: '#E1E7EF',
    },
    createPresetImage: {
        width: '100%',
        aspectRatio: 0.72,
        backgroundColor: '#DDE5EC',
    },
    createPresetAccent: {
        position: 'absolute',
        left: widthPixel(7),
        top: heightPixel(7),
        width: widthPixel(10),
        height: widthPixel(10),
        borderRadius: widthPixel(5),
        borderWidth: widthPixel(1),
        borderColor: '#FFFFFF',
    },
    createPresetName: {
        paddingHorizontal: widthPixel(7),
        paddingVertical: heightPixel(7),
        fontSize: widthPixel(10),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#111827',
    },
    specialChoiceList: {
        gap: heightPixel(9),
        paddingBottom: heightPixel(4),
    },
    specialChoice: {
        minHeight: heightPixel(52),
        borderRadius: widthPixel(14),
        borderWidth: widthPixel(1),
        borderColor: '#D7DEE8',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(14),
        gap: widthPixel(12),
    },
    specialChoiceSwatch: {
        width: widthPixel(18),
        height: widthPixel(18),
        borderRadius: widthPixel(9),
    },
    specialChoiceText: {
        flex: 1,
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#111827',
    },
    specialChoiceIcon: {
        fontSize: widthPixel(20),
        color: '#6B7280',
    },
});

export default HomeScreen;
