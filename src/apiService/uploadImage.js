import API from './apiService';

export const getPresignedUrl = (data) => {
    console.log('Requesting presigned URL with data:', data);
return API.post('/v1/s3/presigned-url', data);
};