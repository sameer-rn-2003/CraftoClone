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

const getMimeType = uri => {
    if (uri?.includes('data:video') || uri?.endsWith('.mp4') || uri?.endsWith('.mov')) {
        return 'video/mp4';
    }
    return 'image/jpeg';
};

const ensureFileShareUrl = async uri => {
    if (!uri) throw new Error('No media URI provided');

    if (uri.startsWith('file://')) {
        return { shareUrl: uri, type: getMimeType(uri) };
    }

    const type = getMimeType(uri);
    const extension = type.startsWith('video') ? 'mp4' : 'jpg';

    if (uri.startsWith('data:')) {
        const base64Data = uri.split(',')[1];
        const tempPath = `${RNFS.CachesDirectoryPath}/crafto_share_${Date.now()}.${extension}`;
        await RNFS.writeFile(tempPath, base64Data, 'base64');
        return { shareUrl: `file://${tempPath}`, type };
    }

    if (uri.startsWith('/')) {
        return { shareUrl: `file://${uri}`, type };
    }

    const tempPath = `${RNFS.CachesDirectoryPath}/crafto_share_${Date.now()}.${extension}`;
    await RNFS.writeFile(tempPath, uri, 'base64');
    return { shareUrl: `file://${tempPath}`, type };
};

/**
 * Share a poster image via the system share sheet
 * @param {string} uri - base64 data URI or file path
 */
export const shareImage = async (uri, message) => {
    try {
        const { shareUrl, type } = await ensureFileShareUrl(uri);

        await Share.open({
            url: shareUrl,
            type,
            title: i18n.t('alerts.shareSheetTitle'),
            message: message || i18n.t('alerts.shareSheetMessage'),
            failOnCancel: false,
        });
    } catch (error) {
        if (error?.message !== 'User did not share') {
            Alert.alert(i18n.t('alerts.shareFailedTitle'), i18n.t('alerts.shareFailedMsg'));
            console.error('Share error:', error);
        }
    }
};

/**
 * Share media directly to WhatsApp
 * @param {string} uri - base64 data URI, absolute file path, or file:// URI
 * @param {string} message - optional caption/message
 */
export const shareToWhatsApp = async (uri, message = '') => {
    try {
        const { shareUrl, type } = await ensureFileShareUrl(uri);

        await Share.shareSingle({
            social: Share.Social.WHATSAPP,
            url: shareUrl,
            type,
            message,
            failOnCancel: false,
        });
    } catch (error) {
        const rawMessage = String(error?.message || '');
        const lowerMessage = rawMessage.toLowerCase();
        const appMissing =
            lowerMessage.includes('not installed') ||
            lowerMessage.includes('cannot open') ||
            lowerMessage.includes('no activity found');

        if (appMissing) {
            Alert.alert(
                i18n.t('alerts.shareFailedTitle'),
                i18n.t('alerts.shareFailedMsg'),
            );
            return;
        }

        if (rawMessage !== 'User did not share') {
            Alert.alert(i18n.t('alerts.shareFailedTitle'), i18n.t('alerts.shareFailedMsg'));
            console.error('WhatsApp share error:', error);
        }
    }
};
