// src/components/AppButton/index.js
// Reusable animated button with premium styling

import React, { useCallback, useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    ActivityIndicator,
    View,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/constants';

const AppButton = ({
    title,
    onPress,
    variant = 'primary',   // 'primary' | 'secondary' | 'outline' | 'ghost'
    size = 'md',           // 'sm' | 'md' | 'lg'
    loading = false,
    disabled = false,
    icon = null,
    style,
    textStyle,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 0.94,
            useNativeDriver: true,
            speed: 60,
            bounciness: 0,
        }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [scaleAnim]);

    const containerStyle = [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
    ];

    const labelStyle = [
        styles.label,
        styles[`label_${variant}`],
        styles[`labelSize_${size}`],
        textStyle,
    ];

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                style={containerStyle}
                onPress={!disabled && !loading ? onPress : undefined}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
                {loading ? (
                    <ActivityIndicator
                        color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
                        size="small"
                    />
                ) : (
                    <View style={styles.row}>
                        {icon && <View style={styles.iconWrapper}>{icon}</View>}
                        <Text style={labelStyle}>{title}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: { marginRight: SPACING.sm },

    // Variants
    variant_primary: {
        backgroundColor: COLORS.primary,
        ...SHADOW.small,
    },
    variant_secondary: {
        backgroundColor: COLORS.secondary,
        ...SHADOW.small,
    },
    variant_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    variant_ghost: {
        backgroundColor: COLORS.primary + '14',
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },

    // Sizes
    size_sm: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, minWidth: 80 },
    size_md: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, minWidth: 120 },
    size_lg: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.base, minWidth: 200 },

    // Labels
    label: {
        fontWeight: FONTS.weights.bold,
        letterSpacing: 0.3,
    },
    label_primary: { color: COLORS.white },
    label_secondary: { color: COLORS.white },
    label_outline: { color: COLORS.primaryLight },
    label_ghost: { color: COLORS.primaryLight },

    labelSize_sm: { fontSize: FONTS.sizes.sm },
    labelSize_md: { fontSize: FONTS.sizes.base },
    labelSize_lg: { fontSize: FONTS.sizes.lg },

    disabled: { opacity: 0.45 },
});

export default AppButton;
