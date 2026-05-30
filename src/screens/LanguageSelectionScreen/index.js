import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import i18n from '../../i18n';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { setStoredLanguage } from '../../i18n/storage';
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from '../../utils/constants';
import { getSupportedLanguages } from '../../apiService/langApi';
import { formatLanguages } from '../../utils/formatLanguages';

const LANGUAGE_DISPLAY = {
    hi: { nativeLabel: 'हिंदी', label: 'Hindi' },
    mr: { nativeLabel: 'मराठी', label: 'Marathi' },
    gu: { nativeLabel: 'ગુજરાતી', label: 'Gujarati' },
    kn: { nativeLabel: 'ಕನ್ನಡ', label: 'kannada' },
    te: { nativeLabel: 'తెలుగు', label: 'Telugu' },
    en: { nativeLabel: 'English', label: 'English' },
    ta: { nativeLabel: 'தமிழ்', label: 'Tamil' },
    ml: { nativeLabel: 'മലയാളം', label: 'Malayalam' },
};

const applyLanguageDisplay = lang => ({
    ...lang,
    ...(LANGUAGE_DISPLAY[lang.code] || {}),
});

const LanguageSelectionScreen = ({ navigation }) => {
    const [languages, setLanguages] = useState(SUPPORTED_LANGUAGES.map(applyLanguageDisplay));

    const handleSelect = useCallback(async (code) => {
        await setStoredLanguage(code);
        await i18n.changeLanguage(code);
        navigation.reset({ index: 0, routes: [{ name: 'UserSetup' }] });
    }, [navigation]);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await getSupportedLanguages();
                const formatted = formatLanguages(res?.data?.data || []);
                if (formatted.length) {
                    setLanguages(formatted.map(applyLanguageDisplay));
                }
            } catch (error) {
                console.log('Language fetch error', error);
            }
        };

        fetchLanguages();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Language</Text>
                    <Text style={styles.subtitle}>Please select language</Text>
                </View>

                <View style={styles.grid}>
                    {languages.map(lang => (
                        <Pressable
                            key={lang.code}
                            style={styles.card}
                            onPress={() => handleSelect(lang.code)}>
                            <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                            <Text style={styles.langLabel}>{lang.label}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: 160,
        paddingBottom: 48,
    },
    header: {
        alignItems: 'center',
        marginBottom: 54,
    },
    title: {
        fontSize: 31,
        fontWeight: FONTS.weights.black,
        color: '#050505',
        marginBottom: 22,
    },
    subtitle: {
        fontSize: 22,
        color: '#97979D',
        fontWeight: FONTS.weights.regular,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 24,
    },
    card: {
        width: '47%',
        minHeight: 146,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: '#DFDFE1',
    },
    langNative: {
        fontSize: 25,
        color: '#5E60D8',
        fontWeight: FONTS.weights.bold,
    },
    langLabel: {
        fontSize: 24,
        color: '#050505',
        fontWeight: FONTS.weights.regular,
        marginTop: 4,
    },
});

export default LanguageSelectionScreen;
