import React, { useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    Pressable,
    TextInput,
    StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import Toast from '../../components/Toast';

const COLORS = {
    pageBackground: '#F3F2FF',
    cardBackground: '#FFFFFF',
    primary: '#5A63FF',
    primaryDark: '#4E56E8',
    textPrimary: '#1F2340',
    textSecondary: '#7A7F9A',
    border: '#E3E6F2',
    inputBorder: '#E3E6F2',
    inputBackground: '#FDFDFF',
    link: '#4F6EF7',
};

const LoginScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const toastTimer = useRef(null);

    const showToast = (message, type = 'info') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ visible: true, message, type });
        toastTimer.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 1800);
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const handleSendOtp = () => {
        const digits = phone.replace(/\D/g, '');
        if (!digits) {
            showToast(t('auth.login.errors.enterMobile'), 'error');
            return;
        }
        if (digits.length < 10) {
            showToast(t('auth.login.errors.invalidMobile'), 'error');
            return;
        }
        showToast(t('auth.login.success.otpSent'), 'success');
        navigation?.navigate?.('OtpVerification', { phone: digits });
    };
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.pageBackground} />

            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation?.goBack?.()}
                        hitSlop={{
                            top: heightPixel(12),
                            bottom: heightPixel(12),
                            left: widthPixel(12),
                            right: widthPixel(12),
                        }}
                        style={styles.backButton}>
                        <Text style={styles.backText}>{'<'}</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>{t('auth.login.headerTitle')}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.content}>
                    <View style={styles.iconWrap}>
                        <View style={styles.iconStarLarge} />
                        <View style={styles.iconStarSmall} />
                        <View style={styles.iconStarTiny} />
                    </View>

                    <Text style={styles.title}>{t('auth.login.title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.login.subtitle')}
                    </Text>

                    <View style={styles.fieldsRow}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>{t('auth.login.country')}</Text>
                            <View style={styles.countryInput}>
                                <Text style={styles.flag}>🇮🇳</Text>
                                <Text style={styles.countryCode}>+91</Text>
                                <Text style={styles.chevron}>v</Text>
                            </View>
                        </View>

                        <View style={styles.fieldGroupWide}>
                            <Text style={styles.label}>{t('auth.login.mobileNumber')}</Text>
                            <TextInput
                                style={styles.numberInput}
                                placeholder={t('auth.login.mobilePlaceholder')}
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="phone-pad"
                                value={phone}
                                maxLength={10}
                                onChangeText={text => setPhone(text.replace(/\\D/g, ''))}
                            />
                        </View>
                    </View>

                    <Pressable
                        style={styles.otpButton}
                        onPress={handleSendOtp}>
                        <Text style={styles.otpText}>{t('auth.login.sendOtp')}</Text>
                    </Pressable>
                </View>

                <Text style={styles.terms}>
                    {t('auth.login.terms.prefix')}
                    <Text style={styles.link}> {t('auth.login.terms.termsOfService')}</Text>
                    {t('auth.login.terms.and')}
                    <Text style={styles.link}> {t('auth.login.terms.privacyPolicy')}</Text>
                </Text>

                <Toast visible={toast.visible} message={toast.message} type={toast.type} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        width: widthPixel(375),
        minHeight: heightPixel(812),
        backgroundColor: COLORS.pageBackground,
    },
    container: {
        flex: 1,
        width: widthPixel(375),
        minHeight: heightPixel(812),
        backgroundColor: COLORS.pageBackground,
        paddingHorizontal: widthPixel(24),
        paddingTop: heightPixel(12),
        paddingBottom: heightPixel(20),
        position: 'relative',
    },
    header: {
        width: widthPixel(327),
        height: heightPixel(40),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(24),
    },
    backButton: {
        width: widthPixel(32),
        height: heightPixel(32),
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    backText: {
        fontSize: widthPixel(20),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textPrimary,
    },
    headerTitle: {
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
    },
    headerSpacer: {
        width: widthPixel(32),
        height: heightPixel(32),
    },
    content: {
        width: widthPixel(327),
        alignItems: 'center',
        marginTop: heightPixel(24),
    },
    iconWrap: {
        width: widthPixel(80),
        height: heightPixel(80),
        borderRadius: widthPixel(18),
        backgroundColor: '#ECECFF',
        borderWidth: widthPixel(1),
        borderColor: '#D9DDFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: heightPixel(20),
    },
    iconStarLarge: {
        width: widthPixel(18),
        height: heightPixel(18),
        borderRadius: widthPixel(3),
        backgroundColor: COLORS.primary,
        transform: [{ rotate: '45deg' }],
    },
    iconStarSmall: {
        position: 'absolute',
        top: heightPixel(18),
        right: widthPixel(20),
        width: widthPixel(8),
        height: heightPixel(8),
        borderRadius: widthPixel(2),
        backgroundColor: COLORS.primary,
        transform: [{ rotate: '45deg' }],
    },
    iconStarTiny: {
        position: 'absolute',
        bottom: heightPixel(18),
        left: widthPixel(20),
        width: widthPixel(6),
        height: heightPixel(6),
        borderRadius: widthPixel(2),
        backgroundColor: COLORS.primary,
        transform: [{ rotate: '45deg' }],
    },
    title: {
        fontSize: widthPixel(22),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
        marginBottom: heightPixel(8),
    },
    subtitle: {
        width: widthPixel(260),
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: heightPixel(18),
        marginBottom: heightPixel(28),
    },
    fieldsRow: {
        width: widthPixel(327),
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: heightPixel(24),
    },
    fieldGroup: {
        width: widthPixel(120),
    },
    fieldGroupWide: {
        width: widthPixel(190),
    },
    label: {
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
        marginBottom: heightPixel(8),
    },
    countryInput: {
        width: widthPixel(120),
        height: heightPixel(44),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.inputBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.inputBorder,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(10),
    },
    flag: {
        fontSize: widthPixel(14),
        marginRight: widthPixel(6),
    },
    countryCode: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textPrimary,
    },
    chevron: {
        marginLeft: 'auto',
        fontSize: widthPixel(10),
        color: COLORS.textSecondary,
    },
    numberInput: {
        width: widthPixel(190),
        height: heightPixel(44),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.inputBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.inputBorder,
        paddingHorizontal: widthPixel(12),
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textPrimary,
    },
    otpButton: {
        width: widthPixel(327),
        height: heightPixel(48),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: widthPixel(0), height: heightPixel(6) },
        shadowOpacity: 0.25,
        shadowRadius: widthPixel(10),
        elevation: 6,
    },
    otpText: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
    terms: {
        width: widthPixel(280),
        fontSize: widthPixel(10),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: heightPixel(16),
        position: 'absolute',
        bottom: heightPixel(20),
        left: widthPixel(48),
    },
    link: {
        color: COLORS.link,
        textDecorationLine: 'underline',
        fontFamily: fonts.FONT_FAMILY.Medium,
    },
});

export default LoginScreen;
