import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    View,
    RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../utils/constants';
import { getNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../../apiService/notificationApi';
import { useDispatch } from 'react-redux';
import { setUnreadNotificationCount } from '../../store/posterSlice';

const NotificationScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async ({ pageNumber = 1 } = {}) => {
        const isFirst = pageNumber === 1;
        try {
            if (isFirst) setLoading(true);
            const res = await getNotificationsApi({ page: pageNumber, limit: 30 });
            const rows = res?.data?.data?.data || [];
            const total = Number(res?.data?.data?.total);
            const formatted = Array.isArray(rows) ? rows : [];
            setNotifications(prev => (isFirst ? formatted : [...prev, ...formatted]));
            setPage(pageNumber);
            setHasMore(Number.isFinite(total) ? total > pageNumber * 30 : formatted.length === 30);
            return formatted;
        } catch (e) {
            console.log('Notifications fetch error', e);
            if (isFirst) setNotifications([]);
            return [];
        } finally {
            if (isFirst) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // mark all read on mount and clear badge
        (async () => {
            const rows = await fetchNotifications({ pageNumber: 1 });
            const ids = rows.map(item => item.id).filter(Boolean);
            try { if (ids.length) await markAllNotificationsReadApi(ids); } catch (e) { /* ignore */ }
            dispatch(setUnreadNotificationCount(0));
        })();
    }, [fetchNotifications, dispatch]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications({ pageNumber: 1 });
    }, [fetchNotifications]);

    const handleLoadMore = useCallback(() => {
        if (!hasMore || loading) return;
        fetchNotifications({ pageNumber: page + 1 });
    }, [hasMore, loading, page, fetchNotifications]);

    const handleMarkRead = useCallback(async (notificationId) => {
        if (!notificationId) return;
            try {
                await markNotificationReadApi(notificationId);
                setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
            } catch (e) { console.log('mark read error', e); }
    }, []);

    const renderItem = ({ item, index }) => (
        <Pressable key={item.id} style={[styles.card, index === 0 && styles.cardFirst]} onPress={() => handleMarkRead(item.id)}>
            <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={item.icon || 'bell-outline'} style={styles.cardIcon} />
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, item.read ? { opacity: 0.6 } : {}]}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.body ?? item.subtitle ?? ''}</Text>
                <Text style={styles.cardTime}>{item.time ?? item.created_at ?? ''}</Text>
            </View>
        </Pressable>
    );

    const renderEmpty = () => {
        if (loading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.emptyText}>Loading notifications...</Text>
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off-outline" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
        );
    };

    const hasUnread = notifications.some(n => !n.read);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Pressable
                    style={[styles.markAllBtn, !hasUnread && styles.markAllBtnDisabled]}
                    disabled={!hasUnread}
                    onPress={async () => {
                        const ids = notifications.map(item => item.id).filter(Boolean);
                        try { if (ids.length) await markAllNotificationsReadApi(ids); } catch (e) { console.log('mark all read error', e); }
                        dispatch(setUnreadNotificationCount(0));
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}>
                    <MaterialCommunityIcons name="check-all" style={[styles.markAllIcon, !hasUnread && styles.markAllIconDisabled]} />
                    <Text style={[styles.markAllText, !hasUnread && styles.markAllTextDisabled]}>Mark all read</Text>
                </Pressable>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={[styles.listContent, !notifications.length && styles.listContentEmpty]}
                ListEmptyComponent={renderEmpty}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
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
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.xs,
    },
    markAllBtnDisabled: {
        backgroundColor: COLORS.border,
    },
    markAllIcon: {
        fontSize: 16,
        color: COLORS.white,
    },
    markAllIconDisabled: {
        color: COLORS.textMuted,
    },
    markAllText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.white,
    },
    markAllTextDisabled: {
        color: COLORS.textMuted,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.base,
        paddingBottom: SPACING.xxl,
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxxl,
    },
    emptyIcon: {
        fontSize: 56,
        color: COLORS.border,
        marginBottom: SPACING.base,
    },
    emptyTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.semiBold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textMuted,
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
