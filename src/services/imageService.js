// src/services/imageService.js
// Image saving and sharing utilities using react-native-fs and react-native-share

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

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
                title: 'Storage Permission',
                message: 'CraftoClone needs access to your storage to save posters.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
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
        Alert.alert('Permission Denied', 'Storage permission is required to save images.');
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
            title: 'Share your Crafto Poster',
            message: 'Check out my poster made with CraftoClone! 🎨',
        });
    } catch (error) {
        if (error.message !== 'User did not share') {
            Alert.alert('Share Failed', 'Could not share the poster. Please try again.');
            console.error('Share error:', error);
        }
    }
};
