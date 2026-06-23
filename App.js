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
import { subscribeToFcmTokenRefresh, syncFcmToken } from './src/services/fcmService';
import {
    setupForegroundListener,
    setNavigationRef,
    setForegroundNotificationCallback,
} from './src/services/notificationHandler';

const navigationRef = createNavigationContainerRef();

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
