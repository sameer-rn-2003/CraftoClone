// src/store/index.js
// Redux store configuration

import { configureStore } from '@reduxjs/toolkit';
import posterReducer from './posterSlice';

const store = configureStore({
    reducer: {
        poster: posterReducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false, // allow non-serializable values (image URIs)
        }),
});

export default store;
