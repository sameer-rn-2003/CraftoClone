import API from './apiService';

// Send OTP
export const requestOtp = phone => {
  console.log('Requesting OTP for phone:', phone);
  return API.post('/v1/auth/request-otp', {
    phone_number: `+91${phone}`,
  });
};

// Verify OTP
export const verifyOtp = data => {
  console.log('Verifying OTP with data:', data);
  return API.post('/v1/auth/verify-otp', data);
};

// Logout
export const logout = () => {
  return API.post('/v1/auth/logout');
};