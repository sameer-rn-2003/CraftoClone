// src/navigation/AppNavigator.js

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';

import HomeScreen from '../screens/HomeScreen';
import TemplateScreen from '../screens/TemplateScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactScreen from '../screens/ContactScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import TermsScreen from '../screens/TermsScreen';
import RefundScreen from '../screens/RefundScreen';
import AboutScreen from '../screens/AboutScreen';
import ProductScreen from '../screens/ProductScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import UserSetupScreen from '../screens/UserSetupScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';

import { COLORS } from '../utils/constants';
import i18n from '../i18n';
import { getStoredLanguage } from '../i18n/storage';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

import { getUserProfile } from '../utils/userStorage';
import { setIsLoggedIn } from '../store/posterSlice';
import { setSessionExpiredCallback } from '../apiService/apiService';

const Stack = createStackNavigator();


// 🔐 AUTH FLOW
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="UserSetup" component={UserSetupScreen} />
    </Stack.Navigator>
);


// 🚀 APP FLOW
const AppStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TemplateScreen" component={TemplateScreen} />
        <Stack.Screen name="EditorScreen" component={EditorScreen} />
        <Stack.Screen name="PreviewScreen" component={PreviewScreen} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="ContactScreen" component={ContactScreen} />
        <Stack.Screen name="PrivacyScreen" component={PrivacyScreen} />
        <Stack.Screen name="TermsScreen" component={TermsScreen} />
        <Stack.Screen name="RefundScreen" component={RefundScreen} />
        <Stack.Screen name="AboutScreen" component={AboutScreen} />
        <Stack.Screen name="ProductScreen" component={ProductScreen} />
    </Stack.Navigator>
);


const AppNavigator = () => {
    const dispatch = useDispatch();
    const isLoggedIn = useSelector(state => state.poster.isLoggedIn);

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        // Register session expiry callback to switch to auth stack
        setSessionExpiredCallback(() => {
            if (mounted) dispatch(setIsLoggedIn(false));
        });

        const initApp = async () => {
            try {
                // 🌐 Language setup
                const storedLang = await getStoredLanguage();
                const isSupported =
                    storedLang &&
                    SUPPORTED_LANGUAGES.some(l => l.code === storedLang);

                if (isSupported) {
                    await i18n.changeLanguage(storedLang);
                } else {
                    await i18n.changeLanguage('en');
                }

                // 🔐 Restore login state from storage
                const user = await getUserProfile();

                if (user?.isLoggedIn) {
                    dispatch(setIsLoggedIn(true));
                }

            } catch (e) {
                console.log('App init error:', e);
            } finally {
                if (mounted) setIsReady(true);
            }
        };

        initApp();

        return () => {
            mounted = false;
            setSessionExpiredCallback(null);
        };
    }, [dispatch]);


    // ⏳ Splash
    if (!isReady) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    // 🔁 Navigation based on state
    return (
        <>
            {isLoggedIn ? <AppStack /> : <AuthStack />}
        </>
    );
};


const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AppNavigator;