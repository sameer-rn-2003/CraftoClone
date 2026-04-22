import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { registerFcmTokenApi, removeFcmTokenApi } from '../apiService/fcmApi';

const REGISTERED_FCM_TOKEN_KEY = 'registered_fcm_token';

const getPlatformValue = () => (Platform.OS === 'ios' ? 'ios' : 'android');

const requestAndroid13NotificationPermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
        return true;
    }

    const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const requestFcmPermission = async () => {
    if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    }

    return requestAndroid13NotificationPermission();
};

export const getStoredRegisteredFcmToken = async () =>
    AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY);

export const setStoredRegisteredFcmToken = async token => {
    if (!token) {
        await AsyncStorage.removeItem(REGISTERED_FCM_TOKEN_KEY);
        return;
    }

    await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, token);
};

export const getFcmToken = async () => {
    await messaging().registerDeviceForRemoteMessages();
    return messaging().getToken();
};

export const registerFcmToken = async token => {
    if (!token) {
        return null;
    }

    await registerFcmTokenApi({
        token,
        platform: getPlatformValue(),
    });
    await setStoredRegisteredFcmToken(token);
    return token;
};

export const syncFcmToken = async () => {
    const isAllowed = await requestFcmPermission();
    if (!isAllowed) {
        return null;
    }

    const token = await getFcmToken();
    const storedToken = await getStoredRegisteredFcmToken();

    if (storedToken === token) {
        return token;
    }

    return registerFcmToken(token);
};

export const removeFcmToken = async (tokenOverride = null) => {
    const token = tokenOverride || await getStoredRegisteredFcmToken();

    if (!token) {
        return;
    }

    try {
        await removeFcmTokenApi(token);
    } finally {
        await setStoredRegisteredFcmToken(null);
    }
};

export const subscribeToFcmTokenRefresh = onTokenRefresh =>
    messaging().onTokenRefresh(async token => {
        if (!token) {
            return;
        }

        await registerFcmToken(token);
        if (onTokenRefresh) {
            onTokenRefresh(token);
        }
    });
