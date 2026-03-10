// src/components/AppTextInput/index.js
// Premium reusable text input with animated focus glow

import React, { useRef, useState, useCallback } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../utils/constants';

const AppTextInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    maxLength,
    keyboardType = 'default',
    style,
    inputStyle,
    ...rest
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        Animated.timing(borderAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [borderAnim]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        Animated.timing(borderAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [borderAnim]);

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.primary],
    });

    const shadowOpacity = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.25],
    });

    return (
        <View style={[styles.container, style]}>
            {label && (
                <View style={styles.labelRow}>
                    <Text style={[styles.label, isFocused && styles.labelFocused]}>
                        {label}
                    </Text>
                    {maxLength && (
                        <Text style={styles.counter}>
                            {(value || '').length}/{maxLength}
                        </Text>
                    )}
                </View>
            )}
            <Animated.View style={[
                styles.inputWrapper,
                {
                    borderColor,
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity,
                    shadowRadius: 8,
                    elevation: isFocused ? 4 : 0,
                },
            ]}>
                <TextInput
                    style={[styles.input, multiline && styles.multiline, inputStyle]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline={multiline}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    selectionColor={COLORS.primary}
                    {...rest}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.textMuted,
        letterSpacing: 1.0,
        textTransform: 'uppercase',
    },
    labelFocused: {
        color: COLORS.primaryLight,
    },
    inputWrapper: {
        borderWidth: 1.5,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.surface,
        overflow: 'hidden',
    },
    input: {
        fontSize: FONTS.sizes.base,
        color: COLORS.text,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        minHeight: 48,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    counter: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        fontWeight: FONTS.weights.medium,
    },
});

export default AppTextInput;
