import React, { useCallback, useEffect, useState } from 'react';
import {
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
        } catch (e) {
            console.log('Notifications fetch error', e);
            if (isFirst) setNotifications([]);
        } finally {
            if (isFirst) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications({ pageNumber: 1 });

        // mark all read on mount and clear badge
        (async () => {
            try {
                await markAllNotificationsReadApi();
            } catch (e) { /* ignore */ }
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
    }, [dispatch]);

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Pressable style={styles.backBtn} onPress={async () => { await markAllNotificationsReadApi(); dispatch(setUnreadNotificationCount(0)); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}>
                    <Text style={{ color: COLORS.primary }}>Mark all read</Text>
                </Pressable>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContent}
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
