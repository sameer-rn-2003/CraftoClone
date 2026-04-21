    import API from './apiService';

    export const getCategories = () => {
        return API.get('/v1/categories');
    };
   