import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { setUserName, setUserPhoto, setIsLoggedIn } from '../../store/posterSlice';
import fonts, { widthPixel, heightPixel } from '../../utils/fonts';
import { mergeUserProfile } from '../../utils/userStorage';
import useImagePicker from '../../hooks/useImagePicker';
import { removeFcmToken } from '../../services/fcmService';
import { logout } from '../../apiService/authApi';

const SETTINGS_OPTIONS = [
    { key: 'contact', label: 'Contact us', icon: 'headset', screen: 'ContactScreen' },
    { key: 'privacy', label: 'Privacy Policy', icon: 'shield-check', screen: 'PrivacyScreen' },
    { key: 'terms', label: 'Terms & Conditions', icon: 'file-document-outline', screen: 'TermsScreen' },
    { key: 'refund', label: 'Refund and Cancellations', icon: 'restart', screen: 'RefundScreen' },
    { key: 'about', label: 'About Us', icon: 'exclamation-thick', screen: 'AboutScreen' },
    { key: 'product', label: 'Product Description', icon: 'creation', screen: 'ProductScreen' },
    { key: 'signout', label: 'SignOut', icon: 'logout', tone: 'warning' },
    { key: 'delete', label: 'Delete Account', icon: 'delete', tone: 'danger' },
];

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userName = useSelector(state => state.poster.userName);
    const userPhoto = useSelector(state => state.poster.userPhoto);
    const { pickImage, loading: isPickingProfileImage } = useImagePicker();

    const [settingsName, setSettingsName] = useState(userName || '');
    const [settingsPhoto, setSettingsPhoto] = useState(userPhoto || '');
    const [isEditingSettingsProfile, setEditingSettingsProfile] = useState(false);

    useEffect(() => {
        setSettingsName(userName || '');
        setSettingsPhoto(userPhoto || '');
    }, [userName, userPhoto]);

    const handleLogout = useCallback(async () => {
        try {
            dispatch(setIsLoggedIn(false));
            await mergeUserProfile({ isLoggedIn: false });
        } catch (error) {
            console.log('Local logout state error:', error);
            dispatch(setIsLoggedIn(false));
        }

        try {
            await removeFcmToken();
        } catch (error) {
            console.log('FCM logout cleanup error:', error);
        }

        try {
            await logout();
        } catch (error) {
            console.log('Logout API error:', error);
        }

        try {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        } catch (e) {
            console.log('Token cleanup error:', e);
        }
    }, [dispatch]);

    const handleSettingOptionPress = useCallback((option) => {
        if (option.screen) {
            navigation?.navigate?.(option.screen);
            return;
        }

        if (option.key === 'signout') {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', style: 'destructive', onPress: handleLogout },
                ],
            );
        }
    }, [handleLogout, navigation]);

    const handleSettingsPhotoPress = useCallback(async () => {
        const uri = await pickImage({ autoStoreInProfilePhoto: false });
        if (uri) {
            setSettingsPhoto(uri);
            setEditingSettingsProfile(true);
        }
    }, [pickImage]);

    const handleSaveSettingsProfile = useCallback(async () => {
        const nextName = settingsName.trim();
        if (!nextName) {
            Alert.alert('Profile', 'Please enter your name.');
            return;
        }

        const profile = await mergeUserProfile({
            name: nextName,
            imageUri: settingsPhoto,
        });
        dispatch(setUserName(profile.name));
        dispatch(setUserPhoto(profile.imageUri));
        setEditingSettingsProfile(false);
        Alert.alert('Profile', 'Profile updated on this device.');
    }, [dispatch, settingsName, settingsPhoto]);

    return (
        <View style={styles.settingsScreen}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.settingsHeader}>
                <Pressable style={styles.settingsBackBtn} onPress={() => navigation.goBack()} hitSlop={12}>
                    <MaterialCommunityIcons name="chevron-left" style={styles.settingsBackIcon} />
                </Pressable>
                <Text style={styles.settingsTitle}>Settings</Text>
                <View style={styles.settingsHeaderSpacer} />
            </View>

            <View style={styles.settingsProfileCard}>
                <Pressable style={styles.settingsAvatarWrap} onPress={handleSettingsPhotoPress}>
                    {settingsPhoto ? (
                        <Image source={{ uri: settingsPhoto }} style={styles.settingsAvatar} resizeMode="cover" />
                    ) : (
                        <MaterialCommunityIcons name="account" style={styles.settingsAvatarIcon} />
                    )}
                    <View style={styles.settingsCameraBadge}>
                        <MaterialCommunityIcons name="camera" style={styles.settingsCameraIcon} />
                    </View>
                </Pressable>

                <View style={styles.settingsProfileTextWrap}>
                    {isEditingSettingsProfile ? (
                        <TextInput
                            style={styles.settingsNameInput}
                            value={settingsName}
                            onChangeText={setSettingsName}
                            placeholder="Your name"
                            placeholderTextColor="#9A9A9A"
                        />
                    ) : (
                        <Text style={styles.settingsName}>{settingsName || 'Your Name'}</Text>
                    )}
                    <Text style={styles.settingsProfileHint}>
                        {isEditingSettingsProfile ? 'Editing locally on this device' : 'Tap photo or edit to update'}
                    </Text>
                </View>

                <Pressable
                    style={styles.settingsEditBtn}
                    onPress={isEditingSettingsProfile ? handleSaveSettingsProfile : () => setEditingSettingsProfile(true)}
                    disabled={isPickingProfileImage}>
                    <Text style={styles.settingsEditText}>
                        {isEditingSettingsProfile ? 'Save' : 'Edit'}
                    </Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.settingsList} showsVerticalScrollIndicator={false}>
                {SETTINGS_OPTIONS.map(option => (
                    <Pressable
                        key={option.key}
                        style={styles.settingsOption}
                        onPress={() => handleSettingOptionPress(option)}>
                        <MaterialCommunityIcons
                            name={option.icon}
                            style={[
                                styles.settingsOptionIcon,
                                option.tone === 'warning' && styles.settingsOptionIconWarning,
                                option.tone === 'danger' && styles.settingsOptionIconDanger,
                            ]}
                        />
                        <Text style={styles.settingsOptionText}>{option.label}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            <Text style={styles.settingsVersion}>v 2.0.0(795)</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    settingsScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    settingsHeader: {
        height: heightPixel(50),
        paddingHorizontal: widthPixel(22),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: widthPixel(1.5),
        borderBottomColor: '#59489B',
    },
    settingsBackBtn: {
        width: widthPixel(42),
        height: widthPixel(42),
        justifyContent: 'center',
    },
    settingsBackIcon: {
        fontSize: widthPixel(38),
        color: '#080719',
    },
    settingsTitle: {
        fontSize: widthPixel(21),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#080808',
    },
    settingsHeaderSpacer: {
        width: widthPixel(42),
    },
    settingsProfileCard: {
        marginHorizontal: widthPixel(28),
        marginTop: heightPixel(22),
        marginBottom: heightPixel(6),
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(12),
    },
    settingsAvatarWrap: {
        width: widthPixel(68),
        height: widthPixel(68),
        borderRadius: widthPixel(34),
        backgroundColor: '#F2F2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: widthPixel(34),
    },
    settingsAvatarIcon: {
        fontSize: widthPixel(34),
        color: '#777777',
    },
    settingsCameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: widthPixel(24),
        height: widthPixel(24),
        borderRadius: widthPixel(12),
        backgroundColor: '#5B55D9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: widthPixel(2),
        borderColor: '#FFFFFF',
    },
    settingsCameraIcon: {
        fontSize: widthPixel(13),
        color: '#FFFFFF',
    },
    settingsProfileTextWrap: {
        flex: 1,
    },
    settingsName: {
        fontSize: widthPixel(18),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#1B1B1B',
    },
    settingsNameInput: {
        height: heightPixel(38),
        borderBottomWidth: widthPixel(1),
        borderBottomColor: '#59489B',
        paddingVertical: 0,
        fontSize: widthPixel(17),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#1B1B1B',
    },
    settingsProfileHint: {
        marginTop: heightPixel(4),
        fontSize: widthPixel(11),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#8C8C8C',
    },
    settingsEditBtn: {
        minWidth: widthPixel(58),
        height: heightPixel(34),
        borderRadius: widthPixel(17),
        backgroundColor: '#5B55D9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: widthPixel(12),
    },
    settingsEditText: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#FFFFFF',
    },
    settingsList: {
        paddingHorizontal: widthPixel(28),
        paddingTop: heightPixel(4),
        paddingBottom: heightPixel(110),
    },
    settingsOption: {
        minHeight: heightPixel(56),
        flexDirection: 'row',
        alignItems: 'center',
        gap: widthPixel(28),
        borderBottomWidth: widthPixel(1.5),
        borderBottomColor: '#59489B',
    },
    settingsOptionIcon: {
        width: widthPixel(32),
        textAlign: 'center',
        fontSize: widthPixel(22),
        color: '#1E1E1E',
    },
    settingsOptionIconWarning: {
        color: '#C63E17',
    },
    settingsOptionIconDanger: {
        color: '#FF4038',
    },
    settingsOptionText: {
        flex: 1,
        fontSize: widthPixel(16),
        fontFamily: fonts.FONT_FAMILY.Regular,
        color: '#222222',
    },
    settingsVersion: {
        position: 'absolute',
        bottom: heightPixel(28),
        alignSelf: 'center',
        fontSize: widthPixel(14),
        fontFamily: fonts.FONT_FAMILY.Bold,
        color: '#A7A7A7',
    },
});

export default SettingsScreen;
