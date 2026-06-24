// src/utils/helpers.js
// General-purpose utility functions

import { CATEGORIES } from './constants';
import { getPresignedUrl } from '../apiService/uploadImage';
import RNFS from 'react-native-fs';

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
    if (fileUri.startsWith('http')) return fileUri;

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
