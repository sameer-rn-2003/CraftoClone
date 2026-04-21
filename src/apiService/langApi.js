import API from './apiService';

// Get supported languages
export const getSupportedLanguages = () => {
  return API.get('/v1/languages');
};
