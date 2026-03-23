import React, { useEffect, useRef, useState } from 'react';
import {
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
import { setUserName, setUserPhoto } from '../../store/posterSlice';
import { getUserProfile, saveUserProfile } from '../../utils/userStorage';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';

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
    const [imageUri, setImageUri] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const toastTimer = useRef(null);

    useEffect(() => {
        (async () => {
            const existing = await getUserProfile();
            if (existing?.name) setName(existing.name);
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
        const uri = await pickImage();
        if (uri) {
            setImageUri(uri);
        }
    };

    const handleSave = async () => {
        if (!imageUri) {
            showToast(t('userSetup.errors.selectImage'), 'error');
            return;
        }
        if (!name.trim()) {
            showToast(t('userSetup.errors.enterName'), 'error');
            return;
        }
        const profile = { name: name.trim(), imageUri };
        await saveUserProfile(profile);
        dispatch(setUserName(profile.name));
        dispatch(setUserPhoto(profile.imageUri));
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };

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

                <Pressable style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveText}>{t('userSetup.continue')}</Text>
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
    saveText: {
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
});

export default UserSetupScreen;
