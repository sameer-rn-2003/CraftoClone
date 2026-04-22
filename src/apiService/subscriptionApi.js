import API from './apiService';

export const getSubscriptionPlansApi = () => API.get('/v1/subscriptions/plans');

export const getSubscriptionStatusApi = () => API.get('/v1/subscriptions/status');

export const verifySubscriptionApi = (data) => {
    console.log('Verifying subscription with data:', data);
    return API.post('/v1/subscriptions/verify', data);
};
