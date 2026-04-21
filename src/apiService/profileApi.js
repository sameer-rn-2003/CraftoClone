import API from './apiService';

export const updateUserProfileApi = (data) => {
  console.log('Updating user profile with data:', data);
  return API.put('/v1/users/profile', data);
};