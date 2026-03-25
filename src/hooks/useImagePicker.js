// src/hooks/useImagePicker.js
// Custom hook wrapping react-native-image-picker

import { useCallback, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch } from 'react-redux';
import { setUserPhoto } from '../store/posterSlice';

const IMAGE_PICKER_OPTIONS = {
    mediaType: 'photo',
    quality: 0.9,
    maxWidth: 1200,
    maxHeight: 1200,
    includeBase64: false,
    selectionLimit: 1,
};

const useImagePicker = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const pickImage = useCallback(async (options = {}) => {
        const { autoStoreInProfilePhoto = true } = options;
        setLoading(true);
        try {
            const result = await launchImageLibrary(IMAGE_PICKER_OPTIONS);

            if (result.didCancel) {
                setLoading(false);
                return null;
            }

            if (result.errorCode) {
                console.warn('Image picker error:', result.errorMessage);
                setLoading(false);
                return null;
            }

            const asset = result.assets?.[0];
            if (asset?.uri) {
                if (autoStoreInProfilePhoto) {
                    dispatch(setUserPhoto(asset.uri));
                }
                setLoading(false);
                return asset.uri;
            }
        } catch (error) {
            console.error('useImagePicker error:', error);
        }
        setLoading(false);
        return null;
    }, [dispatch]);

    return { pickImage, loading };
};

export default useImagePicker;
