import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import fonts, { widthPixel, heightPixel } from '../utils/fonts';

const Toast = ({ visible, message, type = 'info' }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(heightPixel(12))).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: visible ? 1 : 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: visible ? 0 : heightPixel(12),
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, opacity, translateY]);

    if (!message) return null;

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.toast,
                styles[type] || styles.info,
                {
                    opacity,
                    transform: [{ translateY }],
                    top: heightPixel(40) + insets.top,
                },
            ]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        left: widthPixel(24),
        right: widthPixel(24),
        zIndex: 50,
        elevation: 50,
        paddingVertical: heightPixel(12),
        paddingHorizontal: widthPixel(16),
        borderRadius: widthPixel(12),
        borderWidth: widthPixel(1),
        backgroundColor: '#101223',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: widthPixel(12),
        fontFamily: fonts.FONT_FAMILY.Medium,
        color: '#1F2340',
        textAlign: 'center',
    },
    info: {
        backgroundColor: '#FFFFFF',
        borderColor: '#DDE2F2',
    },
    success: {
        backgroundColor: '#EAF8F1',
        borderColor: '#BFECD6',
    },
    error: {
        backgroundColor: '#FCEDEE',
        borderColor: '#F1B6BC',
    },
});

export default Toast;
