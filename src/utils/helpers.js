// src/utils/helpers.js
// General-purpose utility functions

import { CATEGORIES } from './constants';

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
