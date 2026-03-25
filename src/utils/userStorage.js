import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = 'user_profile';
const DEFAULT_PROFILE = {
    name: '',
    imageUri: '',
    isPremium: false,
    premiumProfile: {
        personal: {
            mobileNumber: '',
            address: '',
            socialHandle: '',
            organizationName: '',
            organizationLogo: '',
        },
        business: {
            businessName: '',
            businessDescription: '',
            businessLogo: '',
            contactMobileNumber: '',
            contactAddress: '',
            contactSocialHandle: '',
        },
    },
};

const normalizeProfile = (profile = {}) => ({
    ...DEFAULT_PROFILE,
    ...profile,
    premiumProfile: {
        ...DEFAULT_PROFILE.premiumProfile,
        ...(profile?.premiumProfile || {}),
        personal: {
            ...DEFAULT_PROFILE.premiumProfile.personal,
            ...(profile?.premiumProfile?.personal || {}),
        },
        business: {
            ...DEFAULT_PROFILE.premiumProfile.business,
            ...(profile?.premiumProfile?.business || {}),
        },
    },
});

export const getUserProfile = async () => {
    try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (!stored) return normalizeProfile();
        return normalizeProfile(JSON.parse(stored));
    } catch (error) {
        console.error('getUserProfile error:', error);
        return normalizeProfile();
    }
};

export const saveUserProfile = async (profile) => {
    const normalized = normalizeProfile(profile);
    try {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(normalized));
        return normalized;
    } catch (error) {
        console.error('saveUserProfile error:', error);
        return normalized;
    }
};

export const mergeUserProfile = async (patch) => {
    const current = await getUserProfile();
    const next = normalizeProfile({
        ...current,
        ...(patch || {}),
        premiumProfile: {
            ...current.premiumProfile,
            ...(patch?.premiumProfile || {}),
            personal: {
                ...current.premiumProfile?.personal,
                ...(patch?.premiumProfile?.personal || {}),
            },
            business: {
                ...current.premiumProfile?.business,
                ...(patch?.premiumProfile?.business || {}),
            },
        },
    });
    return saveUserProfile(next);
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
