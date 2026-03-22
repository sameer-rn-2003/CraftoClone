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
    pageBackground: '#F3F4FA',
    cardBackground: '#FFFFFF',
    primary: '#4F6EF7',
    primaryDark: '#3E56D8',
    textPrimary: '#1E2440',
    textSecondary: '#7C829B',
    border: '#E2E5F2',
    inputBackground: '#FFFFFF',
    inputBorder: '#D9DDEA',
    activeBorder: '#4F6EF7',
};

const OTP_LENGTH = 6;

const OtpVerificationScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const phone = route?.params?.phone || '';
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [seconds, setSeconds] = useState(48);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const toastTimer = useRef(null);
    const inputs = useRef([...Array(OTP_LENGTH)].map(() => React.createRef()));

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const timer = setInterval(() => {
            setSeconds(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [seconds]);

    const showToast = (message, type = 'info') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ visible: true, message, type });
        toastTimer.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 1800);
    };

    const formatPhone = value => {
        const digits = value.replace(/\D/g, '').slice(-10);
        if (digits.length < 10) return t('auth.otp.phoneMask');
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    };

    const handleChange = (text, index) => {
        const digit = text.replace(/\D/g, '');
        const next = [...otp];
        next[index] = digit ? digit[digit.length - 1] : '';
        setOtp(next);

        if (digit && index < OTP_LENGTH - 1) {
            inputs.current[index + 1]?.current?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.current?.focus();
        }
    };

    const handleVerify = () => {
        if (otp.some(d => !d)) {
            showToast(t('auth.otp.errors.enterCompleteCode'), 'error');
            return;
        }
        showToast(t('auth.otp.success.verified'), 'success');
        navigation?.navigate?.('LanguageSelection');
    };

    const handleResend = () => {
        if (seconds > 0) {
            showToast(t('auth.otp.errors.waitBeforeResend'), 'error');
            return;
        }
        setSeconds(48);
        showToast(t('auth.otp.success.resent'), 'success');
    };

    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');

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
                    <Text style={styles.headerTitle}>{t('auth.otp.headerTitle')}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.content}>
                    <View style={styles.iconWrap}>
                        <View style={styles.lockBody} />
                        <View style={styles.lockShackle} />
                        <View style={styles.lockDot} />
                    </View>

                    <Text style={styles.title}>{t('auth.otp.title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.otp.subtitle')}{'\n'}
                        {formatPhone(phone)}
                    </Text>

                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={`otp-${index}`}
                                ref={inputs.current[index]}
                                value={digit}
                                onChangeText={text => handleChange(text, index)}
                                onKeyPress={e => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpFilled : null,
                                ]}
                            />
                        ))}
                    </View>

                    <Text style={styles.resendLabel}>{t('auth.otp.resendIn')}</Text>
                    <View style={styles.timerRow}>
                        <View style={styles.timerBox}>
                            <Text style={styles.timerValue}>{minutes}</Text>
                        </View>
                        <Text style={styles.timerColon}>:</Text>
                        <View style={styles.timerBox}>
                            <Text style={styles.timerValue}>{secs}</Text>
                        </View>
                    </View>
                    <View style={styles.timerUnits}>
                        <Text style={styles.timerUnit}>{t('auth.otp.min')}</Text>
                        <Text style={styles.timerUnit}>{t('auth.otp.sec')}</Text>
                    </View>

                    <Pressable style={styles.verifyButton} onPress={handleVerify}>
                        <Text style={styles.verifyText}>{t('auth.otp.verifyNow')}</Text>
                    </Pressable>

                    <View style={styles.resendRow}>
                        <Text style={styles.resendText}>{t('auth.otp.didntReceive')}</Text>
                        <Pressable onPress={handleResend}>
                            <Text style={styles.resendLink}> {t('auth.otp.resendOtp')}</Text>
                        </Pressable>
                    </View>
                </View>

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
        position: 'relative',
    },
    header: {
        width: widthPixel(327),
        height: heightPixel(40),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: heightPixel(30),
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
    },
    iconWrap: {
        width: widthPixel(88),
        height: heightPixel(88),
        borderRadius: widthPixel(44),
        backgroundColor: '#E9ECFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: heightPixel(20),
    },
    lockBody: {
        width: widthPixel(28),
        height: heightPixel(24),
        borderRadius: widthPixel(6),
        backgroundColor: COLORS.primary,
    },
    lockShackle: {
        position: 'absolute',
        top: heightPixel(22),
        width: widthPixel(24),
        height: heightPixel(18),
        borderWidth: widthPixel(3),
        borderColor: COLORS.primary,
        borderRadius: widthPixel(12),
        backgroundColor: 'transparent',
    },
    lockDot: {
        position: 'absolute',
        width: widthPixel(6),
        height: heightPixel(6),
        borderRadius: widthPixel(3),
        backgroundColor: '#FFFFFF',
        bottom: heightPixel(30),
    },
    title: {
        fontSize: widthPixel(20),
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
        marginBottom: heightPixel(24),
    },
    otpRow: {
        width: widthPixel(327),
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: heightPixel(24),
    },
    otpInput: {
        width: widthPixel(44),
        height: heightPixel(48),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.inputBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.inputBorder,
        textAlign: 'center',
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.primary,
    },
    otpFilled: {
        borderColor: COLORS.activeBorder,
    },
    resendLabel: {
        fontSize: widthPixel(10),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
        marginBottom: heightPixel(10),
        letterSpacing: widthPixel(0.6),
    },
    timerRow: {
        width: widthPixel(160),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: heightPixel(6),
    },
    timerBox: {
        width: widthPixel(64),
        height: heightPixel(40),
        borderRadius: widthPixel(12),
        backgroundColor: '#EEF1F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: widthPixel(6),
    },
    timerValue: {
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
    },
    timerColon: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textSecondary,
    },
    timerUnits: {
        width: widthPixel(160),
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: widthPixel(20),
        marginBottom: heightPixel(28),
    },
    timerUnit: {
        fontSize: widthPixel(9),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    verifyButton: {
        width: widthPixel(327),
        height: heightPixel(52),
        borderRadius: widthPixel(14),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: widthPixel(0), height: heightPixel(6) },
        shadowOpacity: 0.25,
        shadowRadius: widthPixel(10),
        elevation: 6,
        marginBottom: heightPixel(20),
    },
    verifyText: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: COLORS.textSecondary,
    },
    resendLink: {
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.primary,
    },
});

export default OtpVerificationScreen;
