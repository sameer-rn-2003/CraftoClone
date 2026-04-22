import { Alert } from 'react-native';
import API from './apiService';

export const registerFcmTokenApi = (data) => { 
    console.log('Registering FCM token with data:', data);
    // Alert.alert('FCM Token Registration', `Registering token: ${data.token} for platform: ${data.platform}`);
    return API.post('/v1/fcm/register', data); };

export const removeFcmTokenApi = (token) => { 
    console.log('Removing FCM token:', token);
    // Alert.alert('FCM Token Removal', `Removing token: ${token}`);
    return API.delete('/v1/fcm/token', {
        params: { token },
    }); };
