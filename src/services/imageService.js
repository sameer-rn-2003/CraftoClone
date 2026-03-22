// src/services/imageService.js
// Image saving and sharing utilities using react-native-fs and react-native-share

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import i18n from '../i18n';

/**
 * Request Android storage permission (for Android < 13)
 */
const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) return true; // Android 13+ uses READ_MEDIA_IMAGES

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: i18n.t('alerts.storagePermissionTitle'),
                message: i18n.t('alerts.storagePermissionMsg'),
                buttonPositive: i18n.t('alerts.allow'),
                buttonNegative: i18n.t('alerts.deny'),
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
        console.warn('Permission error:', e);
        return false;
    }
};

/**
 * Save a poster image (base64 uri) to the device gallery
 * @param {string} uri - base64 data URI from react-native-view-shot
 * @returns {Promise<string>} - saved file path
 */
export const saveToGallery = async uri => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        Alert.alert(i18n.t('alerts.permissionDeniedTitle'), i18n.t('alerts.permissionDeniedMsg'));
        throw new Error('Storage permission denied');
    }

    // Strip base64 header if present
    const base64Data = uri.startsWith('data:image')
        ? uri.split(',')[1]
        : uri;

    const dirPath =
        Platform.OS === 'android'
            ? `${RNFS.PicturesDirectoryPath}/CraftoClone`
            : `${RNFS.DocumentDirectoryPath}/CraftoClone`;

    // Ensure directory exists
    const exists = await RNFS.exists(dirPath);
    if (!exists) {
        await RNFS.mkdir(dirPath);
    }

    const fileName = `crafto_poster_${Date.now()}.jpg`;
    const filePath = `${dirPath}/${fileName}`;

    // Write file
    await RNFS.writeFile(filePath, base64Data, 'base64');

    // On Android, scan the file so it appears in the gallery
    if (Platform.OS === 'android') {
        await RNFS.scanFile(filePath);
    }

    return filePath;
};

/**
 * Share a poster image via the system share sheet
 * @param {string} uri - base64 data URI or file path
 */
export const shareImage = async uri => {
    try {
        // If it's a base64 uri, save to temp first
        let shareUrl = uri;
        if (uri.startsWith('data:image') || !uri.startsWith('file://')) {
            const base64Data = uri.startsWith('data:image') ? uri.split(',')[1] : uri;
            const tempPath = `${RNFS.CachesDirectoryPath}/crafto_share_${Date.now()}.jpg`;
            await RNFS.writeFile(tempPath, base64Data, 'base64');
            shareUrl = `file://${tempPath}`;
        }

        await Share.open({
            url: shareUrl,
            type: 'image/jpeg',
            title: i18n.t('alerts.shareSheetTitle'),
            message: i18n.t('alerts.shareSheetMessage'),
        });
    } catch (error) {
        if (error.message !== 'User did not share') {
            Alert.alert(i18n.t('alerts.shareFailedTitle'), i18n.t('alerts.shareFailedMsg'));
            console.error('Share error:', error);
        }
    }
};
