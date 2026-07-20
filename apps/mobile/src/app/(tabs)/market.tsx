import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Crown, CheckCircle2, Zap, Trophy, ShieldCheck, CreditCard, ChevronRight, Sparkles, Key, Send, Clock, ShoppingCart } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { typography } from '../../theme/typography';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@trophy-games/backend';
import { SUBSCRIPTION_PRODUCTS, getTierForProduct } from '@trophy-games/shared/subscriptions';
import { useIap, ProductSubscription } from '../../hooks/useIap';
import * as Application from 'expo-application';

type MemberStatus = 'none' | 'pending' | 'approved' | 'active' | 'loading';

export default function MembershipStoreScreen() {
    const { themeColors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [verifyingToken, setVerifyingToken] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const { username } = useUser();

    // Convex mutations
    const requestMembership = useMutation(api.tokens.requestMembership);
    const verifyTokenMutation = useMutation(api.tokens.verifyToken);
    const recordPurchase = useMutation(api.purchases.recordPurchase);

    // ── IAP hook (Google Play Billing) ──
    const {
        products: iapProducts,
        activeSubscription: iapActiveSub,
        loading: iapLoading,
        error: iapError,
        purchase: iapPurchase,
        refresh: iapRefresh,
    } = useIap({
        deviceId,
        onPurchaseSuccess: async (_tier: 'vip' | 'paid', purchaseToken: string, productId: string) => {
            try {
                const result = await recordPurchase({
                    deviceId,
                    productId,
                    purchaseToken,
                });
                if (result.success) {
                    Alert.alert('Purchase Successful!', `Your ${_tier.toUpperCase()} access is now active.`);
                } else {
                    Alert.alert('Activation Failed', result.reason || 'Could not activate your purchase.');
                }
            } catch (e) {
                console.error('[Market] recordPurchase error:', e);
            }
        },
        onPurchaseError: (msg: string) => {
            Alert.alert('Purchase Failed', msg);
        },
    });

    // Get device ID on mount
    useEffect(() => {
        const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
        setDeviceId(id);
    }, []);

    // Convex queries for membership status
    const vipStatusData = useQuery(
        api.tokens.getMembershipStatus,
        deviceId ? { deviceId, username: username || undefined, type: 'vip' } : 'skip'
    );
    const paidStatusData = useQuery(
        api.tokens.getMembershipStatus,
        deviceId ? { deviceId, username: username || undefined, type: 'paid' } : 'skip'
    );

    // Map Convex status to local status
    const getLocalStatus = (data: typeof vipStatusData): MemberStatus => {
        if (!data) return 'loading';
        if (data.status === 'active') return 'active';
        if (data.status === 'pending') return 'pending';
        if (data.status === 'approved') return 'approved';
        return 'none';
    };

    const vipTokenStatus = getLocalStatus(vipStatusData);
    const paidTokenStatus = getLocalStatus(paidStatusData);

    // Status priority: real IAP purchase > manually entered token.
    const iapConnected = !iapLoading && iapError === null;

    // VIP status is shared across weekly and monthly (same tier)
    const vipStatus: MemberStatus = iapConnected
        ? (iapActiveSub?.tier === 'vip' ? 'active' : 'none')
        : vipTokenStatus;
    const paidStatus: MemberStatus = iapConnected
        ? (iapActiveSub?.tier === 'paid' ? 'active' : 'none')
        : paidTokenStatus;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 500));
        iapRefresh();
        setRefreshing(false);
    }, [iapRefresh]);

    const handleRequest = async (type: 'vip' | 'paid') => {
        if (!deviceId) return;
        setRequesting(type);
        try {
            const result = await requestMembership({ deviceId, username: username || undefined, type });
            if (result.success) {
                Alert.alert('Success!', `Your ${type.toUpperCase()} request has been sent to admin.`);
            } else {
                Alert.alert('Notice', result.reason || 'Request could not be processed.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to send request. Please try again.');
        }
        setRequesting(null);
    };

    const handleVerifyToken = async () => {
        if (!tokenInput.trim() || !deviceId) return;
        setVerifyingToken(true);
        try {
            const result = await verifyTokenMutation({
                token: tokenInput.trim(),
                deviceId,
                username: username || undefined,
            });
            if (result.valid) {
                Alert.alert('Success!', 'Your token has been verified. Access granted.');
                setShowTokenInput(false);
                setTokenInput('');
            } else {
                Alert.alert('Invalid Token', result.reason || 'Token is invalid or already used.');
            }
        } catch (e) {
            Alert.alert('Error', 'Verification failed. Try again later.');
        }
        setVerifyingToken(false);
    };

    /** Handle Google Play subscription purchase */
    const handleSubscribe = async (productId: string, tier: 'vip' | 'paid') => {
        if (!deviceId) return;
        setPurchasing(productId);
        try {
            const result = await iapPurchase(productId);
            if (!result.success && result.reason) {
                if (!result.reason.includes('cancelled')) {
                    Alert.alert('Purchase Failed', result.reason);
                }
            }
            // On success, the onPurchaseSuccess callback above handles
            // recording the purchase in Convex.
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Subscription purchase failed.');
        }
        setPurchasing(null);
    };

    /** Find a Google Play product by exact product ID */
    const getProduct = (productId: string) =>
        iapProducts.find(p => p.id === productId);

    /** Format price string from v15 ProductSubscription */
    const formatPrice = (product: ProductSubscription | undefined): string | null => {
        if (!product) return null;
        return (product as any).displayPrice || (product as any).price || null;
    };

    // Individual product lookups — each card gets its own product
    const vipWeeklyProduct  = getProduct(SUBSCRIPTION_PRODUCTS.VIP_WEEKLY.productId);
    const vipMonthlyProduct = getProduct(SUBSCRIPTION_PRODUCTS.VIP_MONTHLY.productId);
    const paidMonthlyProduct = getProduct(SUBSCRIPTION_PRODUCTS.PAID_MONTHLY.productId);

    // Active IAP product IDs for border highlighting
    const activeProductId = iapActiveSub?.productId ?? null;

    const StatusBadge = ({ status, type, iapActive }: { status: MemberStatus; type: string; iapActive: boolean }) => {
        if (status === 'none' || status === 'loading') return null;

        const config = iapActive
            ? { color: '#10b981', icon: ShoppingCart, label: 'SUBSCRIBED' }
            : {
                pending: { color: '#f59e0b', icon: Clock, label: 'PENDING' },
                approved: { color: '#15783a', icon: CheckCircle2, label: 'APPROVED' },
                active: { color: themeColors.primary, icon: Crown, label: 'ACTIVE' },
            }[status as 'pending' | 'approved' | 'active'];

        if (!config) return null;

        return (
            <View style={[styles.statusPill, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
                <config.icon size={10} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    const isLoading = vipStatus === 'loading' || paidStatus === 'loading';

    // Helper: renders the action area for a subscription card
    const renderCardActions = (
        productId: string,
        product: ProductSubscription | undefined,
        status: MemberStatus,
        tier: 'vip' | 'paid',
        priceSuffix: string,
    ) => {
        if (isLoading) {
            return (
                <View style={styles.loadingRow}>
                    <ActivityIndicator color={themeColors.primary} size="small" />
                    <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>Checking status...</Text>
                </View>
            );
        }
        if (status === 'none') {
            return (
                <View style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[styles.subscribeBtn, { backgroundColor: themeColors.primary }]}
                        onPress={() => handleSubscribe(productId, tier)}
                        disabled={purchasing !== null || iapLoading}
                    >
                        {purchasing === productId ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <ShoppingCart size={16} color="white" />
                                <Text style={styles.subscribeBtnText}>
                                    {formatPrice(product)
                                        ? `${formatPrice(product)}${priceSuffix}`
                                        : 'SUBSCRIBE'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.textBtn}
                        onPress={() => handleRequest(tier)}
                        disabled={requesting === tier}
                    >
                        {requesting === tier ? (
                            <ActivityIndicator color={themeColors.textMuted} size="small" />
                        ) : (
                            <Text style={[styles.textBtnLabel, { color: themeColors.textMuted }]}>Request token manually</Text>
                        )}
                    </TouchableOpacity>
                </View>
            );
        }
        if (status === 'pending') {
            return (
                <View style={[styles.pendingInfo, { backgroundColor: themeColors.cardBgSecondary }]}>
                    <Clock size={16} color={themeColors.textMuted} />
                    <Text style={[styles.pendingText, { color: themeColors.textMuted }]}>Reviewing your request...</Text>
                </View>
            );
        }
        // active / approved
        return (
            <View style={[styles.activeInfo, { backgroundColor: themeColors.primary + '15' }]}>
                <CheckCircle2 size={16} color={themeColors.primary} />
                <Text style={[styles.activeInfoText, { color: themeColors.primary }]}>
                    {activeProductId === productId && iapActiveSub?.expiresAt
                        ? `Subscribed — expires ${new Date(iapActiveSub.expiresAt).toLocaleDateString()}`
                        : 'Access Active'}
                </Text>
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
                    {(vipTokenStatus === 'approved' || paidTokenStatus === 'approved' || showTokenInput) && (
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
                                {verifyingToken ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.actionBtnText}>ACTIVATE ACCESS</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* IAP status banner */}
                    {iapError && Platform.OS === 'android' && !iapLoading && (
                        <View style={[styles.iapNotice, { backgroundColor: themeColors.cardBgSecondary, borderColor: themeColors.border }]}>
                            <Text style={[styles.iapNoticeText, { color: themeColors.textMuted }]}>
                                ⚠️ Google Play Billing unavailable: {iapError.includes('not available') ? 'This device may not support Google Play Billing, or you may be running in Expo Go (use a dev build).' : iapError}
                            </Text>
                        </View>
                    )}

                    {/* MEMBERSHIP PLANS */}
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>MEMBERSHIP PLANS</Text>

                    {/* ── VIP WEEKLY CARD ── */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: activeProductId === SUBSCRIPTION_PRODUCTS.VIP_WEEKLY.productId ? themeColors.primary + '60' : 'rgba(255,255,255,0.05)' }]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Crown size={24} color={themeColors.primary} />
                                <View>
                                    <Text style={[styles.planTitle, { color: themeColors.text }]}>VIP WEEKLY</Text>
                                    <Text style={[styles.planSubtitle, { color: themeColors.textMuted }]}>7 Days Full Access</Text>
                                </View>
                            </View>
                            <StatusBadge
                                status={vipStatus}
                                type="vip"
                                iapActive={activeProductId === SUBSCRIPTION_PRODUCTS.VIP_WEEKLY.productId}
                            />
                        </View>
                        <View style={styles.features}>
                            {['Daily Elite AI Predictions', '90%+ Strike Rate Accuracy', 'Exclusive Match Insights', 'Priority Support'].map((f, i) => (
                                <View key={i} style={styles.featureLine}>
                                    <ShieldCheck size={14} color={themeColors.primary} />
                                    <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                                </View>
                            ))}
                        </View>
                        {renderCardActions(
                            SUBSCRIPTION_PRODUCTS.VIP_WEEKLY.productId,
                            vipWeeklyProduct,
                            vipStatus,
                            'vip',
                            '/week',
                        )}
                    </View>

                    {/* ── VIP MONTHLY CARD ── */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: activeProductId === SUBSCRIPTION_PRODUCTS.VIP_MONTHLY.productId ? themeColors.primary + '60' : 'rgba(255,255,255,0.05)' }]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Crown size={24} color={themeColors.primary} />
                                <View>
                                    <Text style={[styles.planTitle, { color: themeColors.text }]}>VIP MONTHLY</Text>
                                    <Text style={[styles.planSubtitle, { color: themeColors.textMuted }]}>30 Days Full Access</Text>
                                </View>
                            </View>
                            <StatusBadge
                                status={vipStatus}
                                type="vip"
                                iapActive={activeProductId === SUBSCRIPTION_PRODUCTS.VIP_MONTHLY.productId}
                            />
                        </View>
                        <View style={styles.features}>
                            {['Daily Elite AI Predictions', '90%+ Strike Rate Accuracy', 'Exclusive Match Insights', 'Priority Support'].map((f, i) => (
                                <View key={i} style={styles.featureLine}>
                                    <ShieldCheck size={14} color={themeColors.primary} />
                                    <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                                </View>
                            ))}
                        </View>
                        {/* Best value badge */}
                        <View style={[styles.savingsBadge, { backgroundColor: themeColors.primary + '15', borderColor: themeColors.primary + '30' }]}>
                            <Zap size={11} color={themeColors.primary} />
                            <Text style={[styles.savingsText, { color: themeColors.primary }]}>BEST VALUE — Save vs weekly</Text>
                        </View>
                        {renderCardActions(
                            SUBSCRIPTION_PRODUCTS.VIP_MONTHLY.productId,
                            vipMonthlyProduct,
                            vipStatus,
                            'vip',
                            '/month',
                        )}
                    </View>

                    {/* ── PAID MONTHLY CARD ── */}
                    <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: activeProductId === SUBSCRIPTION_PRODUCTS.PAID_MONTHLY.productId ? themeColors.primary + '60' : 'rgba(255,255,255,0.05)' }]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardHeader}>
                                <Trophy size={24} color={themeColors.primary} />
                                <View>
                                    <Text style={[styles.planTitle, { color: themeColors.text }]}>PAID MONTHLY</Text>
                                    <Text style={[styles.planSubtitle, { color: themeColors.textMuted }]}>30 Days Full Access</Text>
                                </View>
                            </View>
                            <StatusBadge
                                status={paidStatus}
                                type="paid"
                                iapActive={activeProductId === SUBSCRIPTION_PRODUCTS.PAID_MONTHLY.productId}
                            />
                        </View>
                        <View style={styles.features}>
                            {['Curated premium predictions', 'Detailed AI match analysis', 'Match insights & value bets', 'Higher accuracy predictions'].map((f, i) => (
                                <View key={i} style={styles.featureLine}>
                                    <ShieldCheck size={14} color={themeColors.primary} />
                                    <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                                </View>
                            ))}
                        </View>
                        {renderCardActions(
                            SUBSCRIPTION_PRODUCTS.PAID_MONTHLY.productId,
                            paidMonthlyProduct,
                            paidStatus,
                            'paid',
                            '/month',
                        )}
                    </View>

                    {/* Support / Info */}
                    <View style={[styles.footer, { backgroundColor: themeColors.cardBgSecondary }]}>
                        <InfoSection icon={ShieldCheck} title="Verified Results" desc="All our predictions are verified by independent sources." />
                        <View style={styles.divider} />
                        <InfoSection icon={CreditCard} title="Secure Payments" desc="Payments processed securely via Google Play Billing." />
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
    heroBadgeText: { ...typography.gateBadge },
    heroTitle: { ...typography.gateTitle, marginBottom: 8, lineHeight: 32 },
    heroSubtitle: { fontSize: 14, lineHeight: 20 },
    content: { paddingHorizontal: 20, gap: 20, paddingBottom: 40 },
    sectionTitle: { ...typography.cardTitle, marginBottom: -4 },
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardTitle: { ...typography.cardTitle },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planTitle: { ...typography.planTitle },
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
    statusText: { ...typography.statusText },
    features: { gap: 10 },
    featureLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { ...typography.body },
    description: { ...typography.body },
    // ── IAP / Subscribe ──
    subscribeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        borderRadius: 16,
    },
    subscribeBtnText: { ...typography.primaryBtn, color: 'white' },
    actionGroup: { gap: 10 },
    textBtn: {
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBtnLabel: { fontSize: 12, fontWeight: '500' },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
    },
    loadingText: { fontSize: 13 },
    // ── Generic ──
    actionBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: { ...typography.primaryBtn, color: 'white' },
    outlineBtn: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    outlineBtnText: { ...typography.primaryBtn },
    pendingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    pendingText: { ...typography.medium },
    activeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    activeInfoText: { ...typography.medium },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
    },
    iapNotice: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    iapNoticeText: { fontSize: 12, lineHeight: 18 },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    savingsText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    footer: {
        padding: 24,
        borderRadius: 24,
        gap: 16,
    },
    infoSection: { flexDirection: 'row', gap: 12 },
    infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoContent: { flex: 1 },
    infoTitle: { ...typography.alertTitle },
    infoDesc: { ...typography.caption, lineHeight: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
