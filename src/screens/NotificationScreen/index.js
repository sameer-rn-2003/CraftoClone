import React from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../utils/constants';

const DUMMY_NOTIFICATIONS = [
    { id: '1', icon: 'crown', title: 'Premium Plan Activated', subtitle: 'Enjoy unlimited access to all premium templates.', time: '2 hours ago' },
    { id: '2', icon: 'download', title: 'Poster Downloaded', subtitle: 'Your Diwali poster was saved to gallery.', time: '1 day ago' },
    { id: '3', icon: 'star', title: 'New Templates Added', subtitle: 'Check out the new Holi collection in the festival category.', time: '3 days ago' },
    { id: '4', icon: 'heart', title: 'Template Liked', subtitle: 'Your political poster design was liked by others.', time: '5 days ago' },
    { id: '5', icon: 'update', title: 'App Updated', subtitle: 'Crafto v2.1.0 is here with bug fixes and new features.', time: '1 week ago' },
];

const NotificationScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {DUMMY_NOTIFICATIONS.map((item, index) => (
                    <View key={item.id} style={[styles.card, index === 0 && styles.cardFirst]}>
                        <View style={styles.iconWrap}>
                            <MaterialCommunityIcons name={item.icon} style={styles.cardIcon} />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                            <Text style={styles.cardTime}>{item.time}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.base,
        paddingBottom: SPACING.xxl,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.md,
    },
    cardFirst: {
        marginTop: 0,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.cardHover,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    cardIcon: {
        fontSize: 20,
        color: COLORS.primary,
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.text,
    },
    cardSubtitle: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
    cardTime: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 6,
    },
});

export default NotificationScreen;
