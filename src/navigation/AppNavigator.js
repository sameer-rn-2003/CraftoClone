// src/navigation/AppNavigator.js
// Root navigator: Bottom Tabs with a Stack navigator
// layered on top for the editor flow.

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import TemplateScreen from '../screens/TemplateScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import fonts, { widthPixel, heightPixel } from '../utils/fonts';
import { COLORS, FONTS } from '../utils/constants';
import i18n from '../i18n';
import { getStoredLanguage } from '../i18n/storage';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const TAB_BAR_HEIGHT = 56;

const PlaceholderScreen = ({ title }) => (
    <View style={styles.placeholder}>
        <MaterialCommunityIcons name="puzzle-outline" size={52} color="#7A7F9A" />
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSub}>{title}</Text>
    </View>
);

const CustomTabBar = ({ state, navigation, labels }) => {
    const tabMetaByRoute = {
        Home: {
            label: labels?.home || 'Home',
            icon: { active: 'home', inactive: 'home-outline' },
        },
        MyCreations: {
            label: labels?.myCreations || 'My Creations',
            icon: { active: 'image-multiple', inactive: 'image-multiple-outline' },
        },
        Trending: {
            label: labels?.trending || 'Trending',
            icon: { active: 'trending-up', inactive: 'trending-up' },
        },
        Profile: {
            label: labels?.profile || 'Profile',
            icon: { active: 'account', inactive: 'account-outline' },
        },
    };

    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const meta = tabMetaByRoute[route.name] || {
                    label: route.name,
                    icon: { active: 'circle', inactive: 'circle-outline' },
                };
                const isFocused = state.index === index;
                return (
                    <Pressable
                        key={route.key}
                        onPress={() => navigation.navigate(route.name)}
                        style={styles.tabItem}>
                        <MaterialCommunityIcons
                            name={isFocused ? meta.icon.active : meta.icon.inactive}
                            style={[styles.tabIcon, isFocused && styles.tabIconActive]}
                        />
                        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                            {meta.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

// ─── Bottom tab navigator ──────────────────────────────────────────
const HomeTabs = () => {
    const { t } = useTranslation();
    const labels = useMemo(() => ({
        home: t('navigation.tabs.home'),
        trending: t('navigation.tabs.trending'),
        profile: t('navigation.tabs.profile'),
    }), [t]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
            tabBar={(props) => <CustomTabBar {...props} labels={labels} />}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
            />
            <Tab.Screen
                name="Trending"
                component={() => <PlaceholderScreen title={t('navigation.tabs.trending')} />}
            />
            <Tab.Screen
                name="Profile"
                component={() => <PlaceholderScreen title={t('navigation.tabs.profile')} />}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const [isReady, setIsReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState('Login');

    useEffect(() => {
        let mounted = true;
        (async () => {
            const stored = await getStoredLanguage();
            const isSupported = stored && SUPPORTED_LANGUAGES.some(l => l.code === stored);

            if (isSupported) {
                await i18n.changeLanguage(stored);
            } else {
                // Default to English when language isn't selected or is invalid.
                await i18n.changeLanguage('en');
            }
            if (mounted) setInitialRoute('Login');
            if (mounted) setIsReady(true);
        })();
        return () => { mounted = false; };
    }, []);

    if (!isReady) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: COLORS.background },
                    gestureEnabled: true,
                }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
                <Stack.Screen name="HomeTabs" component={HomeTabs} />
                <Stack.Screen
                    name="TemplateScreen"
                    component={TemplateScreen}
                    options={{ gestureEnabled: true }}
                />
                <Stack.Screen
                    name="EditorScreen"
                    component={EditorScreen}
                    options={{ gestureEnabled: true }}
                />
                <Stack.Screen
                    name="PreviewScreen"
                    component={PreviewScreen}
                    options={{ gestureEnabled: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        height: TAB_BAR_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderTopWidth: widthPixel(1),
        borderTopColor: '#E3E6F2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: widthPixel(4),
        paddingVertical: heightPixel(4),
        shadowColor: '#C9CEE5',
        shadowOffset: { width: widthPixel(0), height: heightPixel(-4) },
        shadowOpacity: 0.2,
        shadowRadius: widthPixel(12),
        elevation: 8,
    },
    tabItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: heightPixel(2),
    },
    tabIcon: {
        fontSize: widthPixel(16),
        lineHeight: heightPixel(18),
        color: '#7A7F9A',
    },
    tabIconActive: {
        color: '#5B6CFF',
    },
    tabLabel: {
        marginTop: heightPixel(1),
        fontSize: widthPixel(10),
        lineHeight: heightPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#7A7F9A',
        includeFontPadding: false,
    },
    tabLabelActive: {
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#5B6CFF',
    },

    // Placeholder screen
    placeholder: {
        flex: 1,
        backgroundColor: '#F4F5FB',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: '#1F2340',
    },
    placeholderSub: {
        fontSize: FONTS.sizes.base,
        color: '#7A7F9A',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    splash: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AppNavigator;
