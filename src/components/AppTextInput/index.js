// src/components/AppTextInput/index.js
// Premium reusable text input with animated focus glow

import React, { useRef, useState, useCallback } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../utils/constants';

const AppTextInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    maxLength,
    keyboardType = 'default',
    rightActionLabel,
    onRightActionPress,
    locked = false,
    onLockedPress,
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

    const isEditable = rest.editable !== false && !locked;

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
                    {rightActionLabel && onRightActionPress && (
                        <Pressable style={styles.rightAction} onPress={onRightActionPress}>
                            <Text style={styles.rightActionText}>{rightActionLabel}</Text>
                        </Pressable>
                    )}
                </View>
            )}
            <Animated.View style={[
                styles.inputWrapper,
                locked && styles.inputWrapperLocked,
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
                    style={[styles.input, multiline && styles.multiline, locked && styles.inputLocked, inputStyle]}
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
                    editable={isEditable}
                />
                {locked && (
                    <>
                        <Pressable style={styles.lockTouchOverlay} onPress={onLockedPress} />
                        <View pointerEvents="none" style={styles.lockIconWrap}>
                            <MaterialCommunityIcons name="lock-outline" style={styles.lockIcon} />
                        </View>
                    </>
                )}
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
    inputWrapperLocked: {
        backgroundColor: COLORS.card,
    },
    input: {
        fontSize: FONTS.sizes.base,
        color: COLORS.text,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        minHeight: 48,
    },
    inputLocked: {
        color: COLORS.textMuted,
        paddingRight: 42,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    lockTouchOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    lockIconWrap: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(17,24,39,0.9)',
    },
    lockIcon: {
        fontSize: 13,
        color: COLORS.white,
    },
    counter: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        fontWeight: FONTS.weights.medium,
    },
    rightAction: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.primary + '12',
    },
    rightActionText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.primary,
        fontWeight: FONTS.weights.semiBold,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
});

export default AppTextInput;
