import RNFS from 'react-native-fs';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { generateMediaApi, getMediaStatusApi } from '../apiService/mediaApi';
import i18n from '../i18n';
import { isMetroAssetUrl } from '../utils/helpers';

const getDownloadDir = () => {
    return Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
};

const requestDownloadPermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) return true;

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
        console.warn('Download permission error:', e);
        return false;
    }
};

export const getGeneratedMediaUrl = status => {
    const raw =
        status?.media_url
        || status?.mediaUrl
        || status?.url
        || status?.result_url
        || status?.resultUrl
        || status?.download_url
        || status?.downloadUrl
        || status?.output_url
        || status?.outputUrl;
    if (isMetroAssetUrl(raw)) return undefined;
    return raw;
};

const getFileExtension = (url, fallback = 'mp4') => {
    const cleanPath = String(url || '').split('?')[0].split('#')[0];
    const extension = cleanPath.split('.').pop();

    if (extension && /^[a-z0-9]{2,5}$/i.test(extension)) {
        return extension.toLowerCase();
    }

    return fallback;
};

const sanitizeFileName = value =>
    String(value || '')
        .trim()
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '');

export const startMediaGeneration = async (payload) => {
    // payload should include template_id, type, and user_data/context render values.
    const res = await generateMediaApi(payload);
    return res.data?.data ?? res.data;
};

export const pollMediaStatus = async (jobId, opts = {}) => {
    const { interval = 2000, maxAttempts = 30, onProgress } = opts;

    let attempt = 0;
    let currentInterval = interval;

    while (attempt < maxAttempts) {
        let state = '';
        try {
            const res = await getMediaStatusApi(jobId);
            const status = res.data?.data ?? res.data;

            if (onProgress) {
                try { onProgress(status); } catch (e) { /* ignore */ }
            }

            state = String(status?.status ?? status?.state ?? (status?.job && status.job.state) ?? '').toUpperCase();
            const url = getGeneratedMediaUrl(status);

            if (state === 'COMPLETED' || state === 'DONE' || url) {
                return status;
            }

            if (state === 'FAILED' || state === 'ERROR') {
                throw new Error(status?.error_msg || status?.errorMsg || 'Media generation failed');
            }
        } catch (err) {
            if (state === 'FAILED' || state === 'ERROR') {
                throw err;
            }
            console.warn('pollMediaStatus error:', err?.message || err);
        }

        // wait
        await new Promise(res => setTimeout(res, currentInterval));
        attempt += 1;
        currentInterval = Math.min(30000, currentInterval * 1.5);
    }

    throw new Error('Media generation timed out');
};

export const downloadGeneratedMedia = async (url, filenameHint = '', mediaType = 'VIDEO') => {
    if (!url) throw new Error('url required');
    if (isMetroAssetUrl(url)) {
        throw new Error('Invalid media URL: localhost asset URL cannot be downloaded');
    }

    const hasPermission = await requestDownloadPermission();
    if (!hasPermission) {
        Alert.alert(i18n.t('alerts.permissionDeniedTitle'), i18n.t('alerts.permissionDeniedMsg'));
        throw new Error('Storage permission denied');
    }

    const dir = `${getDownloadDir()}/CraftKaro`;
    const exists = await RNFS.exists(dir);
    if (!exists) {
        await RNFS.mkdir(dir, { NSURLIsExcludedFromBackupKey: true });
    }

    const extension = getFileExtension(url, String(mediaType).toUpperCase() === 'IMAGE' ? 'jpg' : 'mp4');
    const safeHint = sanitizeFileName(filenameHint);
    const filename = safeHint ? `${safeHint}.${extension}` : `craftkaro_media_${Date.now()}.${extension}`;
    const destPath = `${dir}/${filename}`;

    try {
        const downloadResult = await RNFS.downloadFile({ fromUrl: url, toFile: destPath }).promise;
        if (downloadResult && (downloadResult.statusCode === 200 || downloadResult.statusCode === 201)) {
            if (Platform.OS === 'android') {
                try { await RNFS.scanFile(destPath); } catch (e) { /* ignore */ }
            }
            return destPath;
        }

        throw new Error(`Download failed: ${downloadResult.statusCode}`);
    } catch (err) {
        console.error('downloadGeneratedMedia error', err);
        Alert.alert(
            i18n.t('alerts.downloadFailedTitle', { defaultValue: 'Download Failed' }),
            i18n.t('alerts.downloadFailedMsg', { defaultValue: 'Could not download the generated media. Please try again.' }),
        );
        throw err;
    }
};

export default {
    startMediaGeneration,
    pollMediaStatus,
    getGeneratedMediaUrl,
    downloadGeneratedMedia,
};
