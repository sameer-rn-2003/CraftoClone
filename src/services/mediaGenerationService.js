import RNFS from 'react-native-fs';
import { Platform, Alert } from 'react-native';
import { generateMediaApi, getMediaStatusApi } from '../apiService/mediaApi';
import i18n from '../i18n';

const getDownloadDir = () => {
    return Platform.OS === 'android' ? RNFS.PicturesDirectoryPath : RNFS.DocumentDirectoryPath;
};

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
        try {
            const res = await getMediaStatusApi(jobId);
            const status = res.data?.data ?? res.data;

            if (onProgress) {
                try { onProgress(status); } catch (e) { /* ignore */ }
            }

            const state = String(status?.status ?? status?.state ?? (status?.job && status.job.state) ?? '').toUpperCase();

            if (state === 'COMPLETED' || state === 'DONE' || status?.url || status?.result_url || status?.download_url || status?.output_url) {
                return status;
            }

            if (state === 'FAILED' || state === 'ERROR') {
                throw new Error('Media generation failed');
            }
        } catch (err) {
            // swallow and continue until maxAttempts
            console.warn('pollMediaStatus error:', err?.message || err);
        }

        // wait
        await new Promise(res => setTimeout(res, currentInterval));
        attempt += 1;
        currentInterval = Math.min(30000, currentInterval * 1.5);
    }

    throw new Error('Media generation timed out');
};

export const downloadGeneratedMedia = async (url, filenameHint = '') => {
    if (!url) throw new Error('url required');

    const dir = `${getDownloadDir()}/CraftoClone`;
    const exists = await RNFS.exists(dir);
    if (!exists) {
        await RNFS.mkdir(dir);
    }

    const extension = (url.split('?')[0].split('.').pop() || 'mp4').split('/').pop();
    const filename = filenameHint ? `${filenameHint}.${extension}` : `crafto_media_${Date.now()}.${extension}`;
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
        Alert.alert(i18n.t('alerts.downloadFailedTitle'), i18n.t('alerts.downloadFailedMsg'));
        throw err;
    }
};

export default {
    startMediaGeneration,
    pollMediaStatus,
    downloadGeneratedMedia,
};
