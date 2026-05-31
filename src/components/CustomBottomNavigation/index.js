import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import fonts, { heightPixel, widthPixel } from '../../utils/fonts';

const NAV_ITEMS = [
    { key: 'home', labelKey: 'navigation.tabs.home', icon: 'home' },
    { key: 'trending', labelKey: 'navigation.tabs.trending', icon: 'chart-line-variant' },
    { key: 'create', labelKey: 'navigation.tabs.create', icon: 'plus' },
    { key: 'saved', labelKey: 'navigation.tabs.saved', icon: 'bookmark-outline' },
    { key: 'profile', labelKey: 'navigation.tabs.profile', icon: 'account' },
];

const CustomBottomNavigation = ({
    activeKey = 'home',
    userPhoto,
    onHomePress,
    onTrendingPress,
    onCreatePress,
    onSavedPress,
    onProfilePress,
}) => {
    const { t } = useTranslation();
    const handlers = {
        home: onHomePress,
        trending: onTrendingPress,
        create: onCreatePress,
        saved: onSavedPress,
        profile: onProfilePress,
    };

    return (
        <View style={styles.wrap} pointerEvents="box-none">
            <View style={styles.navBar}>
                {NAV_ITEMS.map(item => {
                    const isActive = activeKey === item.key;
                    const isCreate = item.key === 'create';

                    return (
                        <Pressable
                            key={item.key}
                            style={[styles.navItem, isCreate && styles.createItem]}
                            onPress={handlers[item.key]}
                            hitSlop={8}>
                            {isCreate ? (
                                <View style={styles.createButton}>
                                    <MaterialCommunityIcons name={item.icon} style={styles.createIcon} />
                                </View>
                            ) : item.key === 'profile' && userPhoto ? (
                                <View style={[styles.iconShell, isActive && styles.iconShellActive]}>
                                    <Image
                                        source={{ uri: userPhoto }}
                                        style={[styles.profileThumb, isActive && styles.profileThumbActive]}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <View style={[styles.iconShell, isActive && styles.iconShellActive]}>
                                    <MaterialCommunityIcons
                                        name={isActive && item.key === 'saved' ? 'bookmark' : item.icon}
                                        style={[styles.navIcon, isActive && styles.navIconActive]}
                                    />
                                </View>
                            )}
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {t(item.labelKey)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            {/* <View style={styles.homeIndicator} /> */}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: widthPixel(18),
        paddingTop: heightPixel(10),
        paddingBottom: heightPixel(8),
        backgroundColor: '#F8F8F8',
        borderTopWidth: widthPixel(1),
        borderTopColor: '#ECECEC',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    navItem: {
        width: widthPixel(58),
        alignItems: 'center',
        gap: heightPixel(4),
    },
    createItem: {
        marginTop: -heightPixel(6),
    },
    iconShell: {
        width: widthPixel(34),
        height: widthPixel(34),
        borderRadius: widthPixel(999),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    iconShellActive: {
        backgroundColor: '#050505',
        borderRadius: widthPixel(999),
    },
    navIcon: {
        fontSize: widthPixel(20),
        color: '#68707A',
    },
    navIconActive: {
        color: '#FFFFFF',
    },
    navLabel: {
        fontSize: widthPixel(10),
        lineHeight: heightPixel(14),
        color: '#6F737C',
        fontFamily: fonts.FONT_FAMILY.Medium,
    },
    navLabelActive: {
        color: '#111111',
        fontFamily: fonts.FONT_FAMILY.Bold,
    },
    createButton: {
        width: widthPixel(34),
        height: widthPixel(34),
        borderRadius: widthPixel(27),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0D72E8',
        shadowColor: '#0D72E8',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
    },
    createIcon: {
        fontSize: widthPixel(20),
        color: '#FFFFFF',
    },
    profileThumb: {
        width: widthPixel(34),
        height: widthPixel(34),
        borderRadius: widthPixel(999),
        borderWidth: widthPixel(1),
        borderColor: '#E3E3E3',
    },
    profileThumbActive: {
        width: widthPixel(28),
        height: widthPixel(28),
        borderColor: '#FFFFFF',
    },
    homeIndicator: {
        alignSelf: 'center',
        width: widthPixel(116),
        height: heightPixel(4),
        borderRadius: heightPixel(2),
        backgroundColor: '#8B8B8B',
        marginTop: heightPixel(13),
    },
});

export default CustomBottomNavigation;
