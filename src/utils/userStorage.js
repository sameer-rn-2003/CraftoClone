import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = 'user_profile';

export const getUserProfile = async () => {
    try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (!stored) return { name: '', imageUri: '' };
        return JSON.parse(stored);
    } catch (error) {
        console.error('getUserProfile error:', error);
        return { name: '', imageUri: '' };
    }
};

export const saveUserProfile = async (profile) => {
    try {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        return profile;
    } catch (error) {
        console.error('saveUserProfile error:', error);
        return profile;
    }
};

export const updateUserImage = async (imageUri) => {
    const current = await getUserProfile();
    const next = { ...current, imageUri };
    return saveUserProfile(next);
};

export const updateUserName = async (name) => {
    const current = await getUserProfile();
    const next = { ...current, name };
    return saveUserProfile(next);
};
