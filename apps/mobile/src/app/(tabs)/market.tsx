import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Crown, CheckCircle2, Zap, Trophy, ShieldCheck, CreditCard, ChevronRight, Sparkles, Key, Send, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { webApi } from '../../api/web';
import * as Application from 'expo-application';

type MemberStatus = 'none' | 'pending' | 'approved' | 'active' | 'loading';

export default function MembershipStoreScreen() {
    const { themeColors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [vipStatus, setVipStatus] = useState<MemberStatus>('loading');
    const [paidStatus, setPaidStatus] = useState<MemberStatus>('loading');
    const [requesting, setRequesting] = useState<string | null>(null);
    const [tokenInput, setTokenInput] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [verifyingToken, setVerifyingToken] = useState(false);

    const checkStatus = useCallback(async () => {
        try {
            const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
            setDeviceId(id);

            const [vip, paid] = await Promise.all([
                webApi.getMembershipStatus(id, 'vip'),
                webApi.getMembershipStatus(id, 'paid')
            ]);

            setVipStatus(vip.status as MemberStatus);
            setPaidStatus(paid.status as MemberStatus);
        } catch (e) {
            console.error('Failed to check membership status:', e);
            setVipStatus('none');
            setPaidStatus('none');
        }
    }, []);

    useEffect(() => {
        checkStatus().finally(() => setVipStatus(prev => prev === 'loading' ? 'none' : prev));
    }, [checkStatus]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await checkStatus();
        setRefreshing(false);
    }, [checkStatus]);

    const handleRequest = async (type: 'vip' | 'paid') => {
        if (!deviceId) return;
        setRequesting(type);
        try {
            const result = await webApi.requestMembership(deviceId, type);
            if (result.success) {
                if (type === 'vip') setVipStatus('pending');
                else setPaidStatus('pending');
                Alert.alert('Success!', `Your ${type.toUpperCase()} request has been sent to admin.`);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to send request. Please try again.');
        }
        setRequesting(null);
    };

    const handleVerifyToken = async () => {
        if (!tokenInput.trim()) return;
        setVerifyingToken(true);
        try {
            const result = await webApi.verifyToken(tokenInput.trim(), deviceId);
            if (result.valid) {
                Alert.alert('Success!', 'Your token has been verified. Access granted.');
                setShowTokenInput(false);
                setTokenInput('');
                checkStatus();
            } else {
                Alert.alert('Invalid Token', result.reason || 'Token is invalid or already used.');
            }
        } catch (e) {
            Alert.alert('Error', 'Verification failed. Try again later.');
        }
        setVerifyingToken(false);
    };

    const StatusBadge = ({ status, type }: { status: MemberStatus, type: string }) => {
        if (status === 'none' || status === 'loading') return null;

        const config = {
            pending: { color: '#f59e0b', icon: Clock, label: 'PENDING' },
            approved: { color: '#10b981', icon: CheckCircle2, label: 'APPROVED' },
            active: { color: themeColors.primary, icon: Crown, label: 'ACTIVE' }
        }[status as 'pending' | 'approved' | 'active'];

        if (!config) return null;

        return (
            <View style={[styles.statusPill, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
                <config.icon size={10} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
            >
                {/* Hero section */}
                <View style={[styles.hero, { backgroundColor: themeColors.cardBg }]}>
                    <View style={styles.heroContent}>
                        <View style={[styles.heroBadge, { backgroundColor: themeColors.primary + '20' }]}>
                            <Sparkles size={14} color={themeColors.primary} />
                            <Text style={[styles.heroBadgeText, { color: themeColors.primary }]}>PREMIUM ACCESS</Text>
                        </View>
                        <Text style={[styles.heroTitle, { color: themeColors.text }]}>UNLEASH THE POWER OF AI</Text>
                        <Text style={[styles.heroSubtitle, { color: themeColors.textMuted }]}>
                            Get professional-grade predictions and insights with over 90% verified strike rate.
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Token Input Section (if approved) */}
                    {(vipStatus === 'approved' || paidStatus === 'approved' || showTokenInput) && (
                        <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.primary }]}>
                            <View style={styles.cardHeader}>
                                <Key size={20} color={themeColors.primary} />
                                <Text style={[styles.cardTitle, { color: themeColors.text }]}>ENTER ACCESS TOKEN</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: themeColors.cardBgSecondary, color: themeColors.text, borderColor: themeColors.border }]}
                                placeholder="APP-XXXX-XXXX"
                                placeholderTextColor={themeColors.textMuted}
                                value={tokenInput}
                                onChangeText={setTokenInput}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}
                                onPress={handleVerifyToken}
                                disabled={verifyingToken || !tokenInput.trim()}
                            >
                                {verifyingToken ? <ActivityIndicator color="black" size="small" /> : <Text style={styles.actionBtnText}>ACTIVATE ACCESS</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* VIP Membership Plans */}
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>MEMBERSHIP PLANS</Text>

                    {/* VIP WEEKLY */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Crown size={24} color={themeColors.primary} />
                                <View>
                                    <Text style={[styles.planTitle, { color: themeColors.text }]}>VIP WEEKLY</Text>
                                    <Text style={[styles.planSubtitle, { color: themeColors.textMuted }]}>7 Days Full Access</Text>
                                </View>
                            </View>
                            <StatusBadge status={vipStatus} type="vip" />
                        </View>

                        <View style={styles.features}>
                            {[
                                'Daily Elite AI Predictions',
                                '90%+ Strike Rate Accuracy',
                                'Exclusive Match Insights',
                                'Priority Support'
                            ].map((f, i) => (
                                <View key={i} style={styles.featureLine}>
                                    <ShieldCheck size={14} color={themeColors.primary} />
                                    <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                                </View>
                            ))}
                        </View>

                        {vipStatus === 'none' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}
                                onPress={() => handleRequest('vip')}
                                disabled={requesting === 'vip'}
                            >
                                {requesting === 'vip' ? <ActivityIndicator color="black" /> : <Text style={styles.actionBtnText}>REQUEST ACCESS</Text>}
                            </TouchableOpacity>
                        )}
                        {vipStatus === 'pending' && (
                            <View style={[styles.pendingInfo, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <Clock size={16} color={themeColors.textMuted} />
                                <Text style={[styles.pendingText, { color: themeColors.textMuted }]}>Reviewing your request...</Text>
                            </View>
                        )}
                        {vipStatus === 'active' && (
                            <View style={[styles.activeInfo, { backgroundColor: themeColors.primary + '15' }]}>
                                <CheckCircle2 size={16} color={themeColors.primary} />
                                <Text style={[styles.activeInfoText, { color: themeColors.primary }]}>Subscription Active</Text>
                            </View>
                        )}
                    </View>

                    {/* PAID TIPS */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Trophy size={24} color="#D9FF00" />
                                <View>
                                    <Text style={[styles.planTitle, { color: themeColors.text }]}>PAID TIPS</Text>
                                    <Text style={[styles.planSubtitle, { color: themeColors.textMuted }]}>Single Match Unlock</Text>
                                </View>
                            </View>
                            <StatusBadge status={paidStatus} type="paid" />
                        </View>

                        <Text style={[styles.description, { color: themeColors.textMuted }]}>
                            Perfect for those who want specific high-confidence match predictions without a subscription.
                        </Text>

                        {paidStatus === 'none' && (
                            <TouchableOpacity
                                style={[styles.outlineBtn, { borderColor: themeColors.primary }]}
                                onPress={() => handleRequest('paid')}
                                disabled={requesting === 'paid'}
                            >
                                <Text style={[styles.outlineBtnText, { color: themeColors.primary }]}>REQUEST SINGLE UNLOCK</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Support / Info */}
                    <View style={[styles.footer, { backgroundColor: themeColors.cardBgSecondary }]}>
                        <InfoSection icon={ShieldCheck} title="Verified Results" desc="All our predictions are verified by independent sources." />
                        <View style={styles.divider} />
                        <InfoSection icon={CreditCard} title="Secure Access" desc="Contact support for secure payment options." />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function InfoSection({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    const { themeColors } = useTheme();
    return (
        <View style={styles.infoSection}>
            <View style={[styles.infoIcon, { backgroundColor: themeColors.background }]}>
                <Icon size={16} color={themeColors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: themeColors.text }]}>{title}</Text>
                <Text style={[styles.infoDesc, { color: themeColors.textMuted }]}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: {
        padding: 30,
        paddingTop: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 20,
    },
    heroContent: { alignItems: 'flex-start' },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 12,
    },
    heroBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 8, lineHeight: 32 },
    heroSubtitle: { fontSize: 14, lineHeight: 20 },
    content: { paddingHorizontal: 20, gap: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: -4 },
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    planSubtitle: { fontSize: 12 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: { fontSize: 8, fontWeight: '900' },
    features: { gap: 10 },
    featureLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { fontSize: 13, fontWeight: '600' },
    description: { fontSize: 13, lineHeight: 18 },
    actionBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: { color: 'black', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
    outlineBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    outlineBtnText: { fontWeight: '900', fontSize: 13 },
    pendingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    pendingText: { fontSize: 13, fontWeight: '700' },
    activeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    activeInfoText: { fontSize: 13, fontWeight: '900' },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '700',
        borderWidth: 1,
    },
    footer: {
        padding: 24,
        borderRadius: 24,
        gap: 16,
    },
    infoSection: { flexDirection: 'row', gap: 12 },
    infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    infoDesc: { fontSize: 12, lineHeight: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
