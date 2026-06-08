import API from './apiService';

export const getNotificationsApi = (params = {}) => {
    return API.get('/v1/notifications', { params });
};

export const getUnreadNotificationCountApi = () => {
    return API.get('/v1/notifications/unread-count');
};

export const markNotificationReadApi = (id) => {
    if (!id) return Promise.reject(new Error('notification id required'));
    return API.patch(`/v1/notifications/${id}/read`);
};

export const markAllNotificationsReadApi = () => {
    return API.patch('/v1/notifications/read-all');
};

export default {
    getNotificationsApi,
    getUnreadNotificationCountApi,
    markNotificationReadApi,
    markAllNotificationsReadApi,
};
