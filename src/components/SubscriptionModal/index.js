import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONTS, SHADOW, SPACING } from '../../utils/constants';

const SubscriptionModal = ({ visible, onClose, onSubscribe }) => (
    <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}>
        <View style={styles.backdrop}>
            <View style={styles.card}>
                <Text style={styles.title}>Go Premium</Text>
                <Text style={styles.subtitle}>
                    Unlock personal and business fields, full text styling, and advanced editor controls.
                </Text>

                <View style={styles.points}>
                    <Text style={styles.point}>- Personal details and organization fields</Text>
                    <Text style={styles.point}>- Business details and logo sections</Text>
                    <Text style={styles.point}>- Advanced text and style customization</Text>
                </View>

                <Pressable style={styles.subscribeButton} onPress={onSubscribe}>
                    <Text style={styles.subscribeText}>Subscribe Now</Text>
                </Pressable>

                <Pressable style={styles.laterButton} onPress={onClose}>
                    <Text style={styles.laterText}>Maybe Later</Text>
                </Pressable>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: SPACING.base,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.large,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.extraBold,
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        lineHeight: 18,
    },
    points: {
        marginTop: SPACING.md,
        gap: SPACING.xs,
    },
    point: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
    },
    subscribeButton: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    subscribeText: {
        color: COLORS.white,
        fontWeight: FONTS.weights.bold,
        fontSize: FONTS.sizes.base,
    },
    laterButton: {
        marginTop: SPACING.sm,
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    laterText: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.medium,
    },
});

export default SubscriptionModal;
