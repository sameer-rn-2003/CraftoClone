// src/hooks/usePosterGenerator.js
// Custom hook wrapping react-native-view-shot for poster capture/export

import { useCallback, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addSavedPoster } from '../store/posterSlice';
import { saveToGallery, shareImage, shareToWhatsApp } from '../services/imageService';

const usePosterGenerator = () => {
    const posterRef = useRef(null);
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    /**
     * Capture poster view to base64 data URI
     */
    const capturePoster = useCallback(async () => {
        if (!posterRef.current) {
            Alert.alert(t('alerts.error'), t('alerts.posterNotReady'));
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
            Alert.alert(t('alerts.captureFailedTitle'), t('alerts.captureFailedMsg'));
            return null;
        }
    }, [t]);

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
            Alert.alert(t('alerts.savedTitle'), t('alerts.savedMsg'));
        } catch (error) {
            console.error('savePoster error:', error);
        } finally {
            setIsSaving(false);
        }
    }, [capturePoster, dispatch, t]);

    /**
     * Share poster via system share sheet
     */
    const sharePoster = useCallback(async (message) => {
        setIsSharing(true);
        try {
            const uri = await capturePoster();
            if (!uri) return;
            await shareImage(uri, message);
        } catch (error) {
            console.error('sharePoster error:', error);
        } finally {
            setIsSharing(false);
        }
    }, [capturePoster]);

    /**
     * Share poster directly to WhatsApp with optional caption
     */
    const sharePosterToWhatsApp = useCallback(async (message) => {
        setIsSharing(true);
        try {
            const uri = await capturePoster();
            if (!uri) return;
            await shareToWhatsApp(uri, message);
        } catch (error) {
            console.error('sharePosterToWhatsApp error:', error);
        } finally {
            setIsSharing(false);
        }
    }, [capturePoster]);

    return {
        posterRef,
        capturePoster,
        savePoster,
        sharePoster,
        sharePosterToWhatsApp,
        isSaving,
        isSharing,
    };
};

export default usePosterGenerator;
