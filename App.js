// App.js
// Root application component — wraps app with all required providers

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationBanner from './src/components/NotificationBanner';
import './src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { subscribeToFcmTokenRefresh, syncFcmToken, getStoredRegisteredFcmToken } from './src/services/fcmService';
import {
    setupForegroundListener,
    setNavigationRef,
    setForegroundNotificationCallback,
} from './src/services/notificationHandler';

const navigationRef = createNavigationContainerRef();

const logAllTokens = async () => {
    try {
        const [accessToken, refreshToken, fcmToken, userProfile] = await Promise.all([
            AsyncStorage.getItem('access_token'),
            AsyncStorage.getItem('refresh_token'),
            getStoredRegisteredFcmToken(),
            AsyncStorage.getItem('user_profile'),
        ]);

        console.log('=== ALL TOKENS ===');
        console.log('[JWT] access_token:', accessToken ?? 'NOT SET');
        console.log('[JWT] refresh_token:', refreshToken ?? 'NOT SET');
        console.log('[Firebase] fcm_token:', fcmToken ?? 'NOT SET');
        console.log('[API] x-api-key:', Config?.API_KEY ?? 'NOT SET');
        console.log('[API] base_url:', Config?.BASE_URL ?? 'NOT SET');
        console.log('[User] profile:', userProfile ?? 'NOT SET');
        console.log('==================');
    } catch (error) {
        console.warn('[logAllTokens] Failed to read tokens:', error?.message || error);
    }
};

const FcmTokenManager = () => {
    const isLoggedIn = useSelector(state => state.poster.isLoggedIn);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        syncFcmToken().catch(error => {
            console.log('FCM token sync error', error);
        });

        const unsubscribe = subscribeToFcmTokenRefresh(() => {});

        return () => {
            unsubscribe?.();
        };
    }, [isLoggedIn]);

    return null;
};

const App = () => {
    const [bannerNotification, setBannerNotification] = useState(null);

    useEffect(() => {
        setNavigationRef(navigationRef);
        logAllTokens();

        const unsubscribe = setupForegroundListener();

        return () => {
            unsubscribe?.();
            setNavigationRef(null);
        };
    }, []);

    const handleBannerDismiss = useCallback(() => {
        setBannerNotification(null);
    }, []);

    const handleBannerPress = useCallback(() => {
        if (navigationRef.isReady()) {
            navigationRef.navigate('NotificationScreen');
        }
    }, []);

    useEffect(() => {
        setForegroundNotificationCallback(notification => {
            setBannerNotification(notification);
        });

        return () => setForegroundNotificationCallback(null);
    }, []);

    return (
        <GestureHandlerRootView style={styles.root}>
            <Provider store={store}>
                <SafeAreaProvider>
                    <FcmTokenManager />
                    <NavigationContainer ref={navigationRef}>
                        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                            <AppNavigator />
                        </SafeAreaView>
                    </NavigationContainer>
                    <NotificationBanner
                        notification={bannerNotification}
                        onDismiss={handleBannerDismiss}
                        onPress={handleBannerPress}
                    />
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1 },
});

export default App;
