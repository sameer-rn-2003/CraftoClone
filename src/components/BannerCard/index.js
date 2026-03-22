// src/components/BannerCard/index.js
// Premium template thumbnail card — renders a pixel-accurate mini preview with
// animated press interactions and a polished name badge.

import React, { useRef, useCallback } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
    Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/constants';

// ─── Sizes ────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - SPACING.base * 2 - SPACING.md) / 2;
const POSTER_W = 400;
const POSTER_H = 560;
const CARD_H = CARD_W * (POSTER_H / POSTER_W);
const S = CARD_W / POSTER_W;

// ─── Pattern decorations (scaled) ─────────────────────────────────
const PatternOverlay = ({ pattern, color }) => {
    if (pattern === 'diagonal') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(6)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', height: 12, width: '250%',
                    top: -10 + i * 20, left: -20,
                    backgroundColor: color + '22',
                    transform: [{ rotate: '-30deg' }],
                }} />
            ))}
        </View>
    );
    if (pattern === 'circles') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[60, 42, 24].map((sz, i) => (
                <View key={i} style={{
                    position: 'absolute', width: sz, height: sz,
                    borderRadius: sz / 2, borderWidth: 1.5,
                    borderColor: color + '30',
                    top: i % 2 === 0 ? -sz / 3 : undefined,
                    bottom: i % 2 !== 0 ? -sz / 3 : undefined,
                    right: i < 2 ? -sz / 3 : undefined,
                    left: i >= 2 ? -sz / 4 : undefined,
                }} />
            ))}
        </View>
    );
    if (pattern === 'dots') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(9)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', width: 4, height: 4,
                    borderRadius: 2,
                    backgroundColor: color + '40',
                    top: Math.floor(i / 3) * 18 + 8,
                    left: (i % 3) * 22 + 8,
                }} />
            ))}
        </View>
    );
    if (pattern === 'waves') return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(4)].map((_, i) => (
                <View key={i} style={{
                    position: 'absolute', height: 18,
                    width: CARD_W + 20, left: -10,
                    top: i * 22 - 8,
                    borderRadius: 10, borderWidth: 1.5,
                    borderColor: color + '28',
                    transform: [{ rotate: '-6deg' }],
                }} />
            ))}
        </View>
    );
    return null;
};

// ─── BannerCard ───────────────────────────────────────────────────
const BannerCard = ({ template, onPress, style }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const onPressIn = useCallback(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 60 }),
            Animated.timing(glowAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        ]).start();
    }, [scaleAnim, glowAnim]);

    const onPressOut = useCallback(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
            Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]).start();
    }, [scaleAnim, glowAnim]);

    const {
        backgroundColor, accentColor, headerColor, footerColor,
        pattern, layout = 'top', photoFrame, textFields = [], name,
    } = template;

    // ── Scale photoFrame to card space ────────────────────────────
    const pf = {
        x: photoFrame.x * S,
        y: photoFrame.y * S,
        w: photoFrame.width * S,
        h: photoFrame.height * S,
        r: Math.min(photoFrame.borderRadius * S, (photoFrame.width * S) / 2),
    };

    // ── Scale text field positions ────────────────────────────────
    const nameField = textFields.find(f => f.key === 'name');
    const msgField = textFields.find(f => f.key === 'message');

    const nameY = nameField ? nameField.y * S : CARD_H * 0.66;
    const nameX = nameField?.x !== undefined ? nameField.x * S : CARD_W * 0.12;
    const nameW = nameField?.fieldWidth ? nameField.fieldWidth * S : CARD_W * 0.76;

    const msgY = msgField ? msgField.y * S : nameY + 14;
    const msgX = msgField?.x !== undefined ? msgField.x * S : CARD_W * 0.22;
    const msgW = msgField?.fieldWidth ? msgField.fieldWidth * S * 0.75 : CARD_W * 0.56;

    const iconSize = Math.min(pf.w, pf.h) * 0.45;

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border + '00', accentColor + '90'],
    });

    return (
        // Outer: scale animation (useNativeDriver: true)
        <Animated.View style={[
            {
                width: CARD_W,
                marginBottom: SPACING.md,
                borderRadius: BORDER_RADIUS.xl,
                ...SHADOW.medium,
            },
            { transform: [{ scale: scaleAnim }] },
            style,
        ]}>
            {/* Inner: borderColor animation (useNativeDriver: false) */}
            <Animated.View style={{
                borderRadius: BORDER_RADIUS.xl,
                borderWidth: 1.5,
                borderColor,
                overflow: 'hidden',
            }}>
                <Pressable
                    style={[styles.card, { backgroundColor }]}
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>

                    {/* ── Layer 1: Background ──────────────────────── */}
                    {layout === 'left' ? (
                        <View style={[styles.leftBar, { backgroundColor: headerColor, width: CARD_W * 0.42 }]}>
                            <PatternOverlay pattern={pattern} color={accentColor} />
                            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: accentColor }} />
                        </View>
                    ) : (
                        <View style={{ height: CARD_H * 0.48, overflow: 'hidden', backgroundColor: headerColor }}>
                            <PatternOverlay pattern={pattern} color={accentColor} />
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: accentColor }} />
                        </View>
                    )}

                    {/* ── Layer 2: Photo placeholder ──────────────── */}
                    <View style={{
                        position: 'absolute',
                        left: pf.x, top: pf.y, width: pf.w, height: pf.h,
                        borderRadius: pf.r,
                        borderWidth: 2, borderColor: accentColor,
                        backgroundColor: COLORS.card + 'DD',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <MaterialCommunityIcons name="account-outline" size={iconSize} color={accentColor} />
                    </View>

                    {/* ── Layer 3: Name bar ───────────────────────── */}
                    <View style={{
                        position: 'absolute', left: nameX, top: nameY,
                        width: Math.min(nameW, CARD_W - nameX - 4),
                        height: 7, borderRadius: 4,
                        backgroundColor: accentColor + '90',
                    }} />

                    {/* ── Layer 4: Message bar ────────────────────── */}
                    <View style={{
                        position: 'absolute', left: msgX, top: msgY,
                        width: Math.min(msgW, CARD_W - msgX - 4),
                        height: 5, borderRadius: 3,
                        backgroundColor: accentColor + '50',
                    }} />

                    {/* ── Layer 5: Footer strip ───────────────────── */}
                    <View style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 14, backgroundColor: footerColor,
                    }} />

                    {/* ── Template name badge ─────────────────────── */}
                    <View style={styles.nameOverlay}>
                        <View style={[styles.nameBadge, { borderColor: accentColor + '40' }]}>
                            <View style={[styles.nameDot, { backgroundColor: accentColor }]} />
                            <Text style={styles.templateName} numberOfLines={1}>{name}</Text>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_W,
        height: CARD_H,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    leftBar: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        overflow: 'hidden',
    },
    nameOverlay: {
        position: 'absolute',
        bottom: 18,
        left: SPACING.xs,
        right: SPACING.xs,
        alignItems: 'center',
    },
    nameBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(8,8,20,0.75)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        maxWidth: '90%',
    },
    nameDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        flexShrink: 0,
    },
    templateName: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.white,
        flexShrink: 1,
    },
});

export default BannerCard;
