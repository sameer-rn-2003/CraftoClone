import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, FONTS, SHADOW, SPACING } from '../../utils/constants';

const SubscriptionModal = ({
    visible,
    onClose,
    onSubscribe,
    plans = [],
    loading = false,
    submittingPlanId = null,
}) => (
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

                <View style={styles.planList}>
                    {loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Loading subscription plans...</Text>
                        </View>
                    ) : plans.length ? (
                        plans.map(plan => {
                            const isSubmitting = submittingPlanId === plan.id;
                            const planPrice = Number(plan?.price_inr);
                            const isValidPrice = Number.isFinite(planPrice);

                            return (
                                <Pressable
                                    key={plan.id}
                                    style={[styles.subscribeButton, isSubmitting && styles.subscribeButtonDisabled]}
                                    onPress={() => onSubscribe?.(plan)}
                                    disabled={isSubmitting}>
                                    <View style={styles.planMeta}>
                                        <Text style={styles.subscribeText}>{plan?.name ?? 'Premium Plan'}</Text>
                                        <Text style={styles.planDescription}>
                                            {plan?.description ?? 'Unlock premium access'}
                                        </Text>
                                    </View>
                                    <Text style={styles.planPrice}>
                                        {isValidPrice ? `Rs ${planPrice}` : 'Select'}
                                    </Text>
                                </Pressable>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>No active subscription plans are available right now.</Text>
                    )}
                </View>

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
    planList: {
        marginTop: SPACING.lg,
        gap: SPACING.sm,
    },
    loadingWrap: {
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: FONTS.sizes.sm,
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subscribeButtonDisabled: {
        opacity: 0.7,
    },
    planMeta: {
        flex: 1,
        paddingRight: SPACING.sm,
    },
    subscribeText: {
        color: COLORS.white,
        fontWeight: FONTS.weights.bold,
        fontSize: FONTS.sizes.base,
    },
    planDescription: {
        marginTop: 2,
        color: COLORS.white + 'DD',
        fontSize: FONTS.sizes.xs,
    },
    planPrice: {
        color: COLORS.white,
        fontWeight: FONTS.weights.extraBold,
        fontSize: FONTS.sizes.base,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.sm,
        textAlign: 'center',
        paddingVertical: SPACING.md,
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
