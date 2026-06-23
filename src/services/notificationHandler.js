// src/services/notificationHandler.js
// Central FCM notification handling — foreground display, background, tap navigation

import messaging from '@react-native-firebase/messaging';
import store from '../store';
import { setUnreadNotificationCount } from '../store/posterSlice';
import { getUnreadNotificationCountApi } from '../apiService/notificationApi';

let onForegroundNotification = null;
let navigationRef = null;

export const setNavigationRef = ref => { navigationRef = ref; };
export const setForegroundNotificationCallback = cb => { onForegroundNotification = cb; };

const navigateToNotifications = () => {
    if (!navigationRef?.current) return;
    try {
        navigationRef.current.navigate('NotificationScreen');
    } catch (e) {
        console.log('Notification navigation error:', e);
    }
};

const refreshUnreadCount = async () => {
    try {
        const res = await getUnreadNotificationCountApi();
        const count = Number(res?.data?.data ?? res?.data ?? 0) || 0;
        store.dispatch(setUnreadNotificationCount(count));
    } catch (e) { /* ignore */ }
};

/**
 * Must be called at module level (outside any component) for background handling.
 * In index.js: import and call registerBackgroundHandler() at the top.
 */
export const registerBackgroundHandler = () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('[FCM] Background message:', remoteMessage?.messageId);
        refreshUnreadCount();
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('[FCM] Notification opened (background):', remoteMessage?.messageId);
        refreshUnreadCount();
        navigateToNotifications();
    });

    messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
            console.log('[FCM] Notification opened (cold start):', remoteMessage?.messageId);
            refreshUnreadCount();
            navigateToNotifications();
        }
    });
};

/**
 * Call once when app is in foreground. Sets up the onMessage listener.
 * Pass a callback to display the banner in the UI.
 */
export const setupForegroundListener = () => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('[FCM] Foreground message:', remoteMessage?.messageId);
        refreshUnreadCount();

        if (onForegroundNotification) {
            onForegroundNotification({
                title: remoteMessage?.notification?.title || remoteMessage?.data?.title || '',
                body: remoteMessage?.notification?.body || remoteMessage?.data?.body || '',
                data: remoteMessage?.data || {},
            });
        }
    });

    return unsubscribe;
};
