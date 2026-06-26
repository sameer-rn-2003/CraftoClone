// src/utils/helpers.js
// General-purpose utility functions

import { CATEGORIES } from './constants';
import { getPresignedUrl } from '../apiService/uploadImage';
import RNFS from 'react-native-fs';
import { Image } from 'react-native';

/**
 * Filter templates by category id
 */
export const getTemplatesByCategory = (templates, categoryId) => {
    if (!categoryId || categoryId === 'all') return templates;
    return templates.filter(t => t.category === categoryId);
};

/**
 * Get category metadata by id
 */
export const getCategoryById = categoryId => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
};

/**
 * Format a Date object to a readable string
 */
export const formatDate = (date = new Date()) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
};

/**
 * Clamp a numeric value between min and max
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Generate a short unique id
 */
export const generateId = () =>
    `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
};

/**
 * Convert hex color to rgba
 */
export const hexToRgba = (hex, alpha = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const uploadToS3 = async (uploadUrl, fileUri, contentType) => {
  let base64Data;
  if (fileUri.startsWith('file://')) {
    const filePath = fileUri.replace('file://', '');
    base64Data = await RNFS.readFile(filePath, 'base64');
  } else {
    base64Data = await RNFS.readFile(fileUri, 'base64');
  }

  const bytes = base64ToUint8Array(base64Data);

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: bytes.buffer,
  });

  if (!uploadRes.ok) {
    throw new Error('S3 upload failed');
  }
};

export const uploadUserPhotoToS3 = async (fileUri) => {
    if (!fileUri) return null;
    if (fileUri.startsWith('http')) {
        if (isMetroAssetUrl(fileUri)) return null;
        return fileUri;
    }

    const fileName = `user_photo_${Date.now()}.jpg`;
    const presignRes = await getPresignedUrl({
        fileName,
        category: 'generated',
        contentType: 'image/jpeg',
    });
    const { presignedUrl, cdnUrl } = presignRes.data.data;
    await uploadToS3(presignedUrl, fileUri, 'image/jpeg');
    return cdnUrl;
};

const resolveAssetSource = (source) => {
    if (!source) return null;
    if (typeof source === 'string') {
        if (source.startsWith('http')) return source;
        return source;
    }
    if (typeof source === 'number') {
        const resolved = Image.resolveAssetSource(source);
        return resolved?.uri ?? null;
    }
    if (typeof source === 'object' && source.uri) {
        return source.uri;
    }
    return null;
};

const isMetroAssetUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
        trimmed.startsWith('http://localhost')
        || trimmed.startsWith('http://127.0.0.1')
        || /^http:\/\/10\./.test(trimmed)
        || /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\./.test(trimmed)
        || /^http:\/\/192\.168\./.test(trimmed)
    );
};

export { isMetroAssetUrl };

export const uploadBackgroundToS3 = async (source) => {
    let fileUri = resolveAssetSource(source);
    if (!fileUri) return null;

    // Already a real HTTPS/CDN URL - pass through
    if (typeof fileUri === 'string' && /^https:\/\//i.test(fileUri)) {
        return fileUri;
    }

    // Metro bundler dev server URLs (http://localhost, 192.168.x, etc.)
    // Download the image from the dev server to a temp file, then upload to S3
    if (typeof fileUri === 'string' && fileUri.startsWith('http') && isMetroAssetUrl(fileUri)) {
        const tempPath = `${RNFS.CachesDirectoryPath}/bg_${Date.now()}.jpg`;
        const downloadResult = await RNFS.downloadFile({
            fromUrl: fileUri,
            toFile: tempPath,
        }).promise;
        if (downloadResult.statusCode !== 200) {
            return null;
        }
        fileUri = `file://${tempPath}`;
    }

    // Local file URI (file://, content://, ph://, /absolute/path) - upload to S3
    const fileName = `bg_${Date.now()}.jpg`;
    const presignRes = await getPresignedUrl({
        fileName,
        category: 'generated',
        contentType: 'image/jpeg',
    });
    const { presignedUrl, cdnUrl } = presignRes.data.data;
    await uploadToS3(presignedUrl, fileUri, 'image/jpeg');
    return cdnUrl;
};
