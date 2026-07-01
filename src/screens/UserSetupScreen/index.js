import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    Pressable,
    TextInput,
    StatusBar,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import Toast from '../../components/Toast';
import useImagePicker from '../../hooks/useImagePicker';
import {
    setUserName,
    setCompanyName,
    setUserPhoto,
    setPremiumStatus,
    hydratePremiumProfile,
    setIsLoggedIn,
} from '../../store/posterSlice';
import { getUserProfile, saveUserProfile } from '../../utils/userStorage';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import { updateUserProfileApi } from '../../apiService/profileApi';
import { getPresignedUrl } from '../../apiService/uploadImage';
import { syncSubscriptionStatus } from '../../services/subscriptionService';
import i18n from '../../i18n';

const COLORS = {
    pageBackground: '#F4F5FB',
    cardBackground: '#FFFFFF',
    primary: '#5B6CFF',
    textPrimary: '#1F2340',
    textSecondary: '#7A7F9A',
    border: '#E3E6F2',
};

const UserSetupScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { pickImage, loading } = useImagePicker();
    const [name, setName] = useState('');
    const [companyName, setCompanyNameState] = useState('');
    const [imageUri, setImageUri] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const toastTimer = useRef(null);

    useEffect(() => {
        (async () => {
            const existing = await getUserProfile();
            if (existing?.name) setName(existing.name);
            if (existing?.companyName) setCompanyNameState(existing.companyName);
            if (existing?.imageUri) setImageUri(existing.imageUri);
        })();
    }, []);

    useEffect(() => () => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
    }, []);

    const showToast = (message, type = 'info') => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ visible: true, message, type });
        toastTimer.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 1800);
    };

    const handlePickImage = async () => {
        const result = await pickImage();
        if (result?.uri) {
            setImageUri(result.uri);
        }
    };

 const handleSave = async () => {
    if (isSaving) return;

    if (!imageUri) {
        showToast(t('userSetup.errors.selectImage'), 'error');
        return;
    }
    if (!name.trim()) {
        showToast(t('userSetup.errors.enterName'), 'error');
        return;
    }

    try {
        setIsSaving(true);
        // 1. Get presigned URL
        const fileName = `profile_${Date.now()}.jpg`;

        const presignRes = await getPresignedUrl({
            "fileName": fileName,
            "category": 'user_profile',
            "contentType": 'image/jpeg',
        });
        console.log('Presigned URL response:', presignRes.data);

        const { cdnUrl, fileKey } = presignRes.data.data;
console.log('Upload URL:', cdnUrl, 'File Key:', fileKey);

        // 2. Upload to S3
        // await uploadToS3(cdnUrl, imageUri, 'image/jpeg');

        // 3. Update profile API
       let updateRes = await updateUserProfileApi({
            name: name.trim(),
            profile_photo_key: fileKey,
            language: i18n.language,
            company_name: companyName.trim() || undefined,
        });

console.log('Profile update response:', updateRes.data);

        // 4. Save locally (keep your logic)
        const existing = await getUserProfile();
        console.log('Existing profile:', existing);
        const profile = {
            ...existing,
            name: name.trim(),
            companyName: companyName.trim(),
            imageUri, // keep local for UI
            isLoggedIn: true,
        };

        await saveUserProfile(profile);

        dispatch(setUserName(profile.name));
        dispatch(setCompanyName(profile.companyName));
        dispatch(setUserPhoto(profile.imageUri));
        dispatch(setPremiumStatus(!!profile.isPremium));
        dispatch(hydratePremiumProfile(profile.premiumProfile));
        await syncSubscriptionStatus(dispatch);

        // navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
 dispatch(setIsLoggedIn(true));

    } catch (error) {
        console.log('Profile save error', error);
        showToast('Something went wrong', 'error');
    } finally {
        setIsSaving(false);
    }
};

    // const handleSave = async () => {
    //     if (!imageUri) {
    //         showToast(t('userSetup.errors.selectImage'), 'error');
    //         return;
    //     }
    //     if (!name.trim()) {
    //         showToast(t('userSetup.errors.enterName'), 'error');
    //         return;
    //     }
    //     const existing = await getUserProfile();
    //     const profile = {
    //         ...existing,
    //         name: name.trim(),
    //         imageUri,
    //     };
    //     await saveUserProfile(profile);
    //     dispatch(setUserName(profile.name));
    //     dispatch(setUserPhoto(profile.imageUri));
    //     dispatch(setPremiumStatus(!!profile.isPremium));
    //     dispatch(hydratePremiumProfile(profile.premiumProfile));
    //     navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    // };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.pageBackground} />

            <View style={styles.container}>
                <Text style={styles.title}>{t('userSetup.title')}</Text>
                <Text style={styles.subtitle}>{t('userSetup.subtitle')}</Text>

                <Pressable style={styles.imagePicker} onPress={handlePickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <Text style={styles.imagePlaceholder}>
                            {loading ? t('userSetup.loading') : t('userSetup.addPhoto')}
                        </Text>
                    )}
                </Pressable>

                <Text style={styles.label}>{t('userSetup.yourName')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('userSetup.namePlaceholder')}
                    placeholderTextColor={COLORS.textSecondary}
                    value={name}
                    onChangeText={setName}
                />

                <Pressable
                    style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.saveText}>{t('userSetup.continue')}</Text>
                    )}
                </Pressable>

                <Toast visible={toast.visible} message={toast.message} type={toast.type} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.pageBackground,
    },
    container: {
        flex: 1,
        paddingHorizontal: widthPixel(24),
        paddingTop: heightPixel(24),
    },
    title: {
        fontSize: widthPixel(20),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: COLORS.textPrimary,
        marginBottom: heightPixel(6),
    },
    subtitle: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: COLORS.textSecondary,
        marginBottom: heightPixel(18),
    },
    imagePicker: {
        width: widthPixel(120),
        height: heightPixel(120),
        borderRadius: widthPixel(60),
        backgroundColor: COLORS.cardBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: heightPixel(24),
        overflow: 'hidden',
    },
    imagePreview: {
        width: widthPixel(120),
        height: heightPixel(120),
    },
    imagePlaceholder: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
    },
    label: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textSecondary,
        marginBottom: heightPixel(8),
    },
    input: {
        width: widthPixel(327),
        height: heightPixel(44),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.cardBackground,
        borderWidth: widthPixel(1),
        borderColor: COLORS.border,
        paddingHorizontal: widthPixel(12),
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: COLORS.textPrimary,
        marginBottom: heightPixel(20),
    },
    saveButton: {
        width: widthPixel(327),
        height: heightPixel(48),
        borderRadius: widthPixel(12),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: widthPixel(0), height: heightPixel(6) },
        shadowOpacity: 0.25,
        shadowRadius: widthPixel(10),
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.72,
    },
    saveText: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
});

export default UserSetupScreen;
