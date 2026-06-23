// src/components/NotificationBanner.js
// Animated in-app banner for foreground FCM notifications

import React, { useEffect, useRef, useCallback } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOW } from '../utils/constants';

const DISMISS_TIMEOUT = 5000;

const NotificationBanner = ({ notification, onDismiss, onPress }) => {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const dismissTimer = useRef(null);

    const animateIn = useCallback(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, opacityAnim]);

    const animateOut = useCallback((callback) => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(callback);
    }, [slideAnim, opacityAnim]);

    useEffect(() => {
        if (!notification) return;

        animateIn();

        dismissTimer.current = setTimeout(() => {
            animateOut(() => onDismiss?.());
        }, DISMISS_TIMEOUT);

        return () => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
        };
    }, [notification, animateIn, animateOut, onDismiss]);

    const handlePress = useCallback(() => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        animateOut(() => {
            onDismiss?.();
            onPress?.();
        });
    }, [animateOut, onDismiss, onPress]);

    const handleClose = useCallback(() => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        animateOut(() => onDismiss?.());
    }, [animateOut, onDismiss]);

    if (!notification) return null;

    const topOffset = Math.max(insets.top, 12) + 8;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    top: topOffset,
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}>
            <Pressable
                style={styles.banner}
                onPress={handlePress}
                activeOpacity={0.9}>
                <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="bell-ring-outline" style={styles.icon} />
                </View>
                <View style={styles.textWrap}>
                    {notification.title ? (
                        <Text style={styles.title} numberOfLines={1}>
                            {notification.title}
                        </Text>
                    ) : null}
                    {notification.body ? (
                        <Text style={styles.body} numberOfLines={2}>
                            {notification.body}
                        </Text>
                    ) : null}
                </View>
                <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
                    <MaterialCommunityIcons name="close" style={styles.closeIcon} />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: SPACING.base,
        right: SPACING.base,
        zIndex: 9999,
        elevation: 9999,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.medium,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    icon: {
        fontSize: 20,
        color: COLORS.primary,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    body: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
        lineHeight: 16,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.cardHover,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    closeIcon: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
});

export default NotificationBanner;
