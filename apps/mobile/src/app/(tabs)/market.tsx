import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { Bell, CheckCircle2, Clock, Zap, TrendingUp, Trophy, Info, BellOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

type NotifType = 'prediction' | 'result' | 'live' | 'system';

interface Notification {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    time: string;
    read: boolean;
}

// Static sample notifications — in production these would come from a push/API
const SAMPLE_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'prediction',
        title: 'New VIP Prediction',
        message: 'Manchester City vs Arsenal — AI confidence: 87%. Tip: Over 2.5 Goals.',
        time: '2h ago',
        read: false,
    },
    {
        id: '2',
        type: 'result',
        title: 'Match Result: WIN',
        message: 'Real Madrid vs Barcelona prediction was correct. Final: 2-1.',
        time: '5h ago',
        read: false,
    },
    {
        id: '3',
        type: 'live',
        title: 'Match Going Live',
        message: 'Liverpool vs Chelsea kicks off in 15 minutes. Check live predictions.',
        time: '6h ago',
        read: true,
    },
    {
        id: '4',
        type: 'prediction',
        title: 'New Paid Prediction',
        message: 'PSG vs Bayern Munich — AI confidence: 79%. Tip: Both Teams to Score.',
        time: '1d ago',
        read: true,
    },
    {
        id: '5',
        type: 'result',
        title: 'Match Result: WIN',
        message: 'Juventus vs Inter Milan prediction was correct. Final: 1-0.',
        time: '1d ago',
        read: true,
    },
    {
        id: '6',
        type: 'system',
        title: 'Access Token Approved',
        message: 'Your VIP membership request has been approved. Enter your token in the VIP tab to unlock access.',
        time: '2d ago',
        read: true,
    },
    {
        id: '7',
        type: 'prediction',
        title: 'High Confidence Alert',
        message: 'Atletico Madrid vs Sevilla — AI confidence: 91%. Rare high-confidence pick.',
        time: '2d ago',
        read: true,
    },
    {
        id: '8',
        type: 'system',
        title: 'Daily Sync Complete',
        message: 'Match predictions have been updated with today\'s fixtures.',
        time: '3d ago',
        read: true,
    },
];

const TYPE_CONFIG: Record<NotifType, { icon: any; color: string; label: string }> = {
    prediction: { icon: Zap, color: '#D9FF00', label: 'PREDICTION' },
    result: { icon: Trophy, color: '#22c55e', label: 'RESULT' },
    live: { icon: TrendingUp, color: '#ef4444', label: 'LIVE' },
    system: { icon: Info, color: '#60a5fa', label: 'SYSTEM' },
};

type FilterTab = 'ALL' | 'UNREAD' | 'PREDICTIONS' | 'RESULTS';

export default function AlertsScreen() {
    const { themeColors } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
    const [refreshing, setRefreshing] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = notifications.filter(n => {
        if (activeFilter === 'UNREAD') return !n.read;
        if (activeFilter === 'PREDICTIONS') return n.type === 'prediction';
        if (activeFilter === 'RESULTS') return n.type === 'result';
        return true;
    });

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const filters: FilterTab[] = ['ALL', 'UNREAD', 'PREDICTIONS', 'RESULTS'];

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                <View style={styles.headerLeft}>
                    <Bell size={18} color={themeColors.primary} />
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>ALERTS</Text>
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: themeColors.primary }]}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                        <CheckCircle2 size={14} color={themeColors.textMuted} />
                        <Text style={[styles.markAllText, { color: themeColors.textMuted }]}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter tabs */}
            <View style={[styles.filterBar, { borderBottomColor: themeColors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setActiveFilter(f)}
                            style={[
                                styles.filterChip,
                                { backgroundColor: activeFilter === f ? themeColors.primary : themeColors.cardBgSecondary }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: activeFilter === f ? 'black' : themeColors.textMuted }
                            ]}>
                                {f}{f === 'UNREAD' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={themeColors.primary}
                        colors={[themeColors.primary]}
                    />
                }
            >
                {filtered.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIcon, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <BellOff size={36} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Alerts</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            {activeFilter === 'UNREAD' ? 'You\'re all caught up!' : 'No notifications in this category.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map(notif => {
                        const cfg = TYPE_CONFIG[notif.type];
                        const IconComp = cfg.icon;
                        return (
                            <TouchableOpacity
                                key={notif.id}
                                onPress={() => markRead(notif.id)}
                                activeOpacity={0.7}
                                style={[
                                    styles.notifCard,
                                    {
                                        backgroundColor: themeColors.cardBg,
                                        borderColor: !notif.read ? cfg.color + '40' : themeColors.border,
                                        borderLeftColor: !notif.read ? cfg.color : themeColors.border,
                                    }
                                ]}
                            >
                                <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
                                    <IconComp size={18} color={cfg.color} />
                                </View>
                                <View style={styles.notifBody}>
                                    <View style={styles.notifTopRow}>
                                        <View style={[styles.typePill, { backgroundColor: cfg.color + '22' }]}>
                                            <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                        <View style={styles.timeRow}>
                                            <Clock size={10} color={themeColors.textMuted} />
                                            <Text style={[styles.timeText, { color: themeColors.textMuted }]}>{notif.time}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.notifTitle, { color: themeColors.text }]} numberOfLines={1}>
                                        {notif.title}
                                    </Text>
                                    <Text style={[styles.notifMessage, { color: themeColors.textMuted }]} numberOfLines={2}>
                                        {notif.message}
                                    </Text>
                                </View>
                                {!notif.read && (
                                    <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: { fontSize: 10, fontWeight: '900', color: 'black' },
    markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    markAllText: { fontSize: 11, fontWeight: '700' },
    filterBar: { paddingVertical: 10, borderBottomWidth: 1 },
    filterScroll: { paddingHorizontal: 14, gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    filterChipText: { fontSize: 10, fontWeight: '900' },
    list: { flex: 1 },
    listContent: { padding: 14, gap: 10, paddingBottom: 40 },
    emptyContainer: { paddingVertical: 70, alignItems: 'center', gap: 14 },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: { fontSize: 16, fontWeight: '700' },
    emptySubtext: { textAlign: 'center', fontSize: 13, paddingHorizontal: 36 },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderLeftWidth: 3,
        gap: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    notifBody: { flex: 1 },
    notifTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    typePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: { fontSize: 9, fontWeight: '900' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timeText: { fontSize: 10 },
    notifTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
    notifMessage: { fontSize: 12, lineHeight: 17 },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
        flexShrink: 0,
    },
});
