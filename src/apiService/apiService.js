import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

console.log("Config:::", Config)

let sessionExpiredCb = null;
export const setSessionExpiredCallback = cb => { sessionExpiredCb = cb; };

const API = axios.create({
  baseURL: Config.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Config.API_KEY,
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return API(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        const res = await axios.post(
          `${Config.BASE_URL}/v1/auth/refresh`,
          {},
          {
            headers: {
              'x-api-key': Config.API_KEY,
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data?.data?.access_token;

        await AsyncStorage.setItem('access_token', newAccessToken);

        API.defaults.headers.common['Authorization'] =
          'Bearer ' + newAccessToken;

        processQueue(null, newAccessToken);

        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);

        // Refresh failed — remove tokens, keep user data, switch to auth
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        const profileRaw = await AsyncStorage.getItem('user_profile');
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          profile.isLoggedIn = false;
          await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
        }
        sessionExpiredCb?.();

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;