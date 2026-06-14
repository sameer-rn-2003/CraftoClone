import API from './apiService';

export const getNotificationsApi = (params = {}) => {
    return API.get('/v1/notifications', { params });
};

export const getUnreadNotificationCountApi = () => {
    return API.get('/v1/notifications/unread-count');
};

export const markNotificationReadApi = (id) => {
    if (!id) return Promise.reject(new Error('notification id required'));
    return API.patch('/v1/notifications/mark-read', {
        notificationIds: [id],
    });
};

export const markAllNotificationsReadApi = (notificationIds = []) => {
    return API.patch('/v1/notifications/mark-read', {
        notificationIds,
    });
};

export default {
    getNotificationsApi,
    getUnreadNotificationCountApi,
    markNotificationReadApi,
    markAllNotificationsReadApi,
};
