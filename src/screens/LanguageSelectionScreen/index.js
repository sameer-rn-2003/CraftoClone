import React, { useCallback } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    Pressable,
    StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { setStoredLanguage } from '../../i18n/storage';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../utils/constants';

const LanguageSelectionScreen = ({ navigation }) => {
    const { t } = useTranslation();

    const handleSelect = useCallback(async (code) => {
        await setStoredLanguage(code);
        await i18n.changeLanguage(code);
        navigation.reset({ index: 0, routes: [{ name: 'UserSetup' }] });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <View style={styles.header}>
                <Text style={styles.title}>{t('languageSelection.title')}</Text>
                <Text style={styles.subtitle}>{t('languageSelection.subtitle')}</Text>
            </View>

            <View style={styles.list}>
                {SUPPORTED_LANGUAGES.map(lang => (
                    <Pressable
                        key={lang.code}
                        style={styles.card}
                        onPress={() => handleSelect(lang.code)}
                        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
                        <View style={styles.cardLeft}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{lang.nativeLabel}</Text>
                            </View>
                            <View style={styles.cardTextWrap}>
                                <Text style={styles.langLabel}>{lang.label}</Text>
                                {lang.nativeLabel !== lang.label ? (
                                    <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                                ) : null}
                            </View>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    header: {
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
        gap: 8,
    },
    title: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.extraBold,
        color: '#1E2440',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FONTS.sizes.base,
        color: '#7C829B',
        lineHeight: 22,
    },
    list: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E2E5F2',
        shadowColor: '#9AA3C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
    cardTextWrap: { flex: 1 },
    badge: {
        minWidth: 64,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#EEF1FF',
        borderWidth: 1,
        borderColor: '#D7DDF8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 14,
        color: '#4F6EF7',
        fontWeight: FONTS.weights.bold,
    },
    langLabel: {
        fontSize: FONTS.sizes.base,
        color: '#1E2440',
        fontWeight: FONTS.weights.semiBold,
    },
    langNative: {
        fontSize: FONTS.sizes.sm,
        color: '#7C829B',
        marginTop: 2,
    },
    chevron: { fontSize: 22, color: '#9AA3C7', marginLeft: SPACING.sm },
});

export default LanguageSelectionScreen;
