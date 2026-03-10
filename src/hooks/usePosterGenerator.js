// src/hooks/usePosterGenerator.js
// Custom hook wrapping react-native-view-shot for poster capture/export

import { useCallback, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addSavedPoster } from '../store/posterSlice';
import { saveToGallery, shareImage } from '../services/imageService';

const usePosterGenerator = () => {
    const posterRef = useRef(null);
    const dispatch = useDispatch();
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    /**
     * Capture poster view to base64 data URI
     */
    const capturePoster = useCallback(async () => {
        if (!posterRef.current) {
            Alert.alert('Error', 'Poster view is not ready.');
            return null;
        }
        try {
            const uri = await captureRef(posterRef, {
                format: 'jpg',
                quality: 0.95,
                result: 'base64',
            });
            return `data:image/jpeg;base64,${uri}`;
        } catch (error) {
            console.error('capturePoster error:', error);
            Alert.alert('Capture Failed', 'Could not render the poster. Please try again.');
            return null;
        }
    }, []);

    /**
     * Save poster to gallery
     */
    const savePoster = useCallback(async () => {
        setIsSaving(true);
        try {
            const uri = await capturePoster();
            if (!uri) return;
            const filePath = await saveToGallery(uri);
            dispatch(addSavedPoster({ uri: filePath }));
            Alert.alert('Saved! 🎉', 'Your poster has been saved to the gallery.');
        } catch (error) {
            console.error('savePoster error:', error);
        } finally {
            setIsSaving(false);
        }
    }, [capturePoster, dispatch]);

    /**
     * Share poster via system share sheet
     */
    const sharePoster = useCallback(async () => {
        setIsSharing(true);
        try {
            const uri = await capturePoster();
            if (!uri) return;
            await shareImage(uri);
        } catch (error) {
            console.error('sharePoster error:', error);
        } finally {
            setIsSharing(false);
        }
    }, [capturePoster]);

    return {
        posterRef,
        capturePoster,
        savePoster,
        sharePoster,
        isSaving,
        isSharing,
    };
};

export default usePosterGenerator;
