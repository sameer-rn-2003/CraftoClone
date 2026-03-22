// src/screens/HomeScreen/index.js

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    SafeAreaView,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    setActiveCategory,
    setSelectedTemplate,
    setUserName,
    setUserPhoto,
} from '../../store/posterSlice';
import { TEMPLATES } from '../../services/templateService';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import { CATEGORIES as APP_CATEGORIES } from '../../utils/constants';
import { getUserProfile } from '../../utils/userStorage';

const COLORS = {
    pageBackground: '#EEF2F8',
    cardBackground: '#FFFFFF',
    primary: '#2F6BFF',
    primaryLight: '#EAF0FF',
    textPrimary: '#1B2238',
    textSecondary: '#697089',
    border: '#DCE4F2',
    pillBorder: '#F05BB5',
    pillActive: '#F05BB5',
    pillText: '#3C1A3A',
};

const { height: SCREEN_H } = Dimensions.get('window');
const ITEM_HEIGHT = Math.min(heightPixel(520), SCREEN_H - heightPixel(260));
const ITEM_SPACING = heightPixel(14);
const REEL_MEDIA_HEIGHT = ITEM_HEIGHT - heightPixel(160);

const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [activeCategory, setActiveCategoryUi] = useState('festival');

    const categories = useMemo(() => ([
        ...APP_CATEGORIES.map(item => ({
            id: item.id,
            label: t(`categories.${item.id}`) || item.label,
        })),
        { id: 'motivational', label: t('categories.motivational') },
    ]), [t]);

    const reelsData = useMemo(() => TEMPLATES, []);

    useEffect(() => {
        (async () => {
            const stored = await getUserProfile();
            if (stored?.name) dispatch(setUserName(stored.name));
            if (stored?.imageUri) dispatch(setUserPhoto(stored.imageUri));
        })();
    }, [dispatch]);

    const handleCategoryPress = (id) => {
        const isKnown = APP_CATEGORIES.some(cat => cat.id === id);
        const targetId = isKnown ? id : 'all';
        setActiveCategoryUi(id);
        dispatch(setActiveCategory(targetId));
        navigation?.navigate?.('TemplateScreen', { categoryId: targetId });
    };

    const openEditor = (item) => {
        dispatch(setSelectedTemplate(item));
        navigation?.navigate?.('EditorScreen', { templateId: item.id });
    };

    const showUnderDevelopmentAlert = () => {
        Alert.alert(t('home.underDevelopment.title'), t('home.underDevelopment.message'));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.pageBackground} />

            <View style={styles.staticHeader}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchText}>{t('home.searchPlaceholder')}</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('home.section.categories')}</Text>
                </View>

                <View style={styles.pillRow}>
                    {categories.map(item => {
                        const isActive = activeCategory === item.id;
                        return (
                            <Pressable
                                key={item.id}
                                style={[styles.pill, isActive && styles.pillActive]}
                                onPress={() => handleCategoryPress(item.id)}>
                                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <FlatList
                data={reelsData}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToInterval={ITEM_HEIGHT + ITEM_SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.reelsContent}
                renderItem={({ item }) => (
                    <Pressable style={styles.reelCard} onPress={() => openEditor(item)}>
                        <View style={styles.reelMedia}>
                            {item.Image ? (
                                <Image source={item.Image} style={styles.reelImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.reelFallback, { backgroundColor: item.accentColor }]} />
                            )}
                        </View>
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
                            <Pressable style={styles.changeImageBtn} onPress={showUnderDevelopmentAlert}>
                                <Text style={styles.changeImageText}>{t('home.actions.changeImage')}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.pageBackground,
    },
    staticHeader: {
        paddingHorizontal: widthPixel(20),
        paddingTop: heightPixel(10),
        paddingBottom: heightPixel(10),
    },
    searchBar: {
        width: '100%',
        height: heightPixel(44),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.cardBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        justifyContent: 'center',
        paddingHorizontal: widthPixel(12),
        marginBottom: heightPixel(14),
    },
    searchText: {
        fontSize: widthPixel(12.5),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    sectionHeader: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(10),
    },
    sectionTitle: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
    },
    pillRow: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: widthPixel(8),
        marginBottom: heightPixel(16),
    },
    pill: {
        paddingHorizontal: widthPixel(13),
        paddingVertical: heightPixel(7),
        borderRadius: widthPixel(16),
        borderWidth: widthPixel(1),
        borderColor: "#5B6CFF",
        backgroundColor: COLORS.cardBackground,
    },
    pillActive: {
        backgroundColor: "#5B6CFF",
    },
    pillText: {
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.pillText,
    },
    pillTextActive: {
        color: '#FFFFFF',
        fontFamily: fonts.FONT_FAMILY.Bold,
    },
    reelsContent: {
        paddingHorizontal: widthPixel(20),
        paddingBottom: heightPixel(96),
        paddingTop: heightPixel(2),
    },
    reelCard: {
        width: '100%',
        height: ITEM_HEIGHT,
        borderRadius: widthPixel(20),
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
        backgroundColor: '#F0F2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reelImage: {
        width: '100%',
        height: REEL_MEDIA_HEIGHT,
    },
    reelFallback: {
        width: widthPixel(140),
        height: heightPixel(140),
        borderRadius: widthPixel(18),
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
