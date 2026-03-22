import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_STORAGE_KEY = '@CraftoClone:language';

export async function getStoredLanguage() {
    try {
        const value = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        return value || null;
    } catch {
        return null;
    }
}

export async function setStoredLanguage(language) {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        return true;
    } catch {
        return false;
    }
}

