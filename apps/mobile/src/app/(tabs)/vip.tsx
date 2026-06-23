import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Crown, Calendar, Lock, Key, CheckCircle2, Clock, Send } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConvexReactClient } from "convex/react";
import { api } from '@trophy-games/backend';

import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
// Mobile reads ONLY from Convex — no direct FootyStats API calls.
import * as Application from 'expo-application';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type MemberStatus = 'none' | 'pending' | 'approved' | 'active' | 'loading';

const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export default function VIPTipsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { themeColors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [memberStatus, setMemberStatus] = useState<MemberStatus>('loading');
    const [tokenInput, setTokenInput] = useState('');
    const [enteringToken, setEnteringToken] = useState(false);
    const [verifyingToken, setVerifyingToken] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [deviceId, setDeviceId] = useState('');

    const dates = useMemo(() => {
        const d = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            d.push(date.toISOString().split('T')[0]);
        }
        return d;
    }, []);

    const uniqueLeagues = useMemo(() => {
        const leagues = Array.from(new Set(matches.map(m => m.league))).sort();
        return ['All', ...leagues];
    }, [matches]);

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const leagueMatch = selectedLeague === 'All' || match.league === selectedLeague;
            return leagueMatch;
        });
    }, [matches, selectedLeague]);

    useEffect(() => {
        const init = async () => {
            const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
            setDeviceId(id);
            // Check membership status via Convex
            if (convex) {
                try {
                    const tokens = await convex.query(api.tokens.getTokensForDevice, { deviceId: id });
                    const hasVIPToken = tokens?.some((t: any) => t.type === 'vip' && t.isActive);
                    setMemberStatus(hasVIPToken ? 'active' : 'none');
                } catch {
                    setMemberStatus('none');
                }
            } else {
                setMemberStatus('none');
            }
        };
        init();
    }, []);

    const loadData = useCallback(async (isRefresh = false) => {
        if (memberStatus !== 'active') return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        // Mobile reads ONLY from Convex.
        if (convex) {
            try {
                const vipMatches = await convex.query(api.matches.getByTypeAndDate, {
                    matchType: 'vip',
                    date: selectedDate,
                    limit: 100
                });
                setMatches(vipMatches || []);
                console.log(`[VIP Screen] Loaded ${vipMatches?.length || 0} vip matches from Convex for ${selectedDate}`);
            } catch (convexError) {
                console.warn('[VIP Screen] Convex failed:', convexError);
                setMatches([]);
            }
        } else {
            setMatches([]);
        }

        setLoading(false);
        setRefreshing(false);
    }, [memberStatus, selectedDate]);

    useEffect(() => {
        if (memberStatus === 'active') loadData();
    }, [memberStatus, loadData, selectedDate]);

    const onRefresh = useCallback(() => { loadData(true); }, [loadData]);

    const requestMembership = async () => {
        if (!deviceId || !convex) return;
        setRequesting(true);
        try {
            await convex.mutation(api.tokens.createMembershipRequest, {
                deviceId,
                type: 'vip'
            });
            setMemberStatus('pending');
            Alert.alert('Request Sent!', 'Your VIP membership request has been submitted. You will receive a token once approved by admin.');
        } catch {
            Alert.alert('Error', 'Failed to send request. Please try again.');
        }
        setRequesting(false);
    };

    const verifyToken = async () => {
        if (!tokenInput.trim() || !convex) return;
        setVerifyingToken(true);
        try {
            const result = await convex.mutation(api.tokens.claimToken, {
                token: tokenInput.trim(),
                deviceId
            });
            if (result.success) {
                setMemberStatus('active');
                setEnteringToken(false);
                setTokenInput('');
                Alert.alert('Access Granted!', 'Welcome to VIP! You now have access to elite predictions.');
            } else {
                Alert.alert('Invalid Token', result.reason || 'This token is not valid for your device.');
            }
        } catch {
            Alert.alert('Error', 'Failed to verify token. Please try again.');
        }
        setVerifyingToken(false);
    };

    // ---- Gate: loading membership ----
    if (memberStatus === 'loading') {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={themeColors.primary} size="large" />
            </View>
        );
    }

    // ---- Gate: not a member ----
    if (memberStatus === 'none' || memberStatus === 'pending' || memberStatus === 'approved') {
        return (
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: themeColors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.gateContainer}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.gateBadge, { backgroundColor: themeColors.primary }]}>
                        <Crown size={18} color="white" />
                        <Text style={styles.gateBadgeText}>ELITE ACCESS REQUIRED</Text>
                    </View>

                    <Text style={[styles.gateTitle, { color: themeColors.text }]}>JOIN THE 1%</Text>
                    <Text style={[styles.gateSubtitle, { color: themeColors.textMuted }]}>
                        Get access to our most accurate AI predictions with verified 90%+ strike rate.
                    </Text>

                    {/* Features */}
                    {['Expert AI analysis on every match', 'Verified 90%+ accuracy predictions', 'Exclusive VIP-only picks', 'Priority support'].map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <CheckCircle2 size={14} color={themeColors.primary} />
                            <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                        </View>
                    ))}

                    {/* Request membership */}
                    {memberStatus === 'none' && !enteringToken && (
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
                            onPress={requestMembership}
                            disabled={requesting}
                        >
                            {requesting ? <ActivityIndicator color="white" size="small" /> : (
                                <>
                                    <Send size={16} color="white" />
                                    <Text style={styles.primaryBtnText}>REQUEST VIP MEMBERSHIP</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Pending state */}
                    {memberStatus === 'pending' && !enteringToken && (
                        <View style={[styles.pendingCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.primary }]}>
                            <Clock size={20} color={themeColors.primary} />
                            <Text style={[styles.pendingTitle, { color: themeColors.text }]}>Request Under Review</Text>
                            <Text style={[styles.pendingText, { color: themeColors.textMuted }]}>
                                Your request is pending admin approval. Once approved, you will receive an access token.
                            </Text>
                        </View>
                    )}

                    {/* Approved state */}
                    {memberStatus === 'approved' && !enteringToken && (
                        <View style={[styles.pendingCard, { backgroundColor: themeColors.cardBg, borderColor: '#15783a' }]}>
                            <CheckCircle2 size={20} color="#15783a" />
                            <Text style={[styles.pendingTitle, { color: themeColors.text }]}>Request Approved!</Text>
                            <Text style={[styles.pendingText, { color: themeColors.textMuted }]}>
                                Your VIP access request has been approved. Please enter your token below to unlock it.
                            </Text>
                        </View>
                    )}

                    {/* Enter token */}
                    {!enteringToken ? (
                        <TouchableOpacity
                            style={[styles.secondaryBtn, { borderColor: themeColors.border }]}
                            onPress={() => setEnteringToken(true)}
                        >
                            <Key size={14} color={themeColors.textMuted} />
                            <Text style={[styles.secondaryBtnText, { color: themeColors.textMuted }]}>I HAVE A TOKEN</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.tokenInputCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
                            <Text style={[styles.tokenInputLabel, { color: themeColors.textMuted }]}>ENTER YOUR ACCESS TOKEN</Text>
                            <TextInput
                                value={tokenInput}
                                onChangeText={setTokenInput}
                                placeholder="e.g. VIP-XXXX-XXXX-XXXX"
                                placeholderTextColor={themeColors.textMuted}
                                style={[styles.tokenInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.cardBgSecondary }]}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                            <View style={styles.tokenBtnRow}>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { backgroundColor: themeColors.primary, flex: 1 }]}
                                    onPress={verifyToken}
                                    disabled={verifyingToken || !tokenInput.trim()}
                                >
                                    {verifyingToken
                                        ? <ActivityIndicator color="white" size="small" />
                                        : <Text style={styles.primaryBtnText}>VERIFY TOKEN</Text>
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: themeColors.cardBgSecondary }]}
                                    onPress={() => { setEnteringToken(false); setTokenInput(''); }}
                                >
                                    <Text style={[styles.cancelBtnText, { color: themeColors.textMuted }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ---- Approved member: show matches ----
    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Calendar strip */}
            <View style={[styles.calendarStrip, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <DatePickerStrip
                    dates={dates}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </View>

            {/* League filter */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaguesScroll}>
                    {uniqueLeagues.map(league => (
                        <TouchableOpacity
                            key={league}
                            onPress={() => setSelectedLeague(league)}
                            style={[styles.leagueChip, { backgroundColor: selectedLeague === league ? themeColors.primary : themeColors.cardBgSecondary }]}
                        >
                            <Text style={[styles.leagueChipText, { color: selectedLeague === league ? 'white' : themeColors.textMuted }]}>
                                {league === 'All' ? 'All' : toTitleCase(league)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* VIP active badge */}
            <View style={[styles.activeBanner, { backgroundColor: `${themeColors.primary}15`, borderColor: `${themeColors.primary}30` }]}>
                <Crown size={14} color={themeColors.primary} />
                <Text style={[styles.activeBannerText, { color: themeColors.primary }]}>VIP ACCESS ACTIVE</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
            >
                <View style={styles.sectionHeader}>
                    <Crown size={14} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>TODAY'S VIP PICKS</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : filteredMatches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                matchId={match.id}
                                matchData={match}
                                leagueName={match.league}
                                leagueLogo={match.leagueLogo}
                                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                homeTeam={match.homeTeam}
                                homeTeamLogo={match.homeTeamLogo}
                                awayTeam={match.awayTeam}
                                awayTeamLogo={match.awayTeamLogo}
                                isLocked={false}
                                aiInsight={match.aiPrediction}
                                prediction={match.aiPrediction?.prediction}
                                odds={match.odds?.home}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Crown size={36} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No VIP Tips Today</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            New elite predictions are being analyzed. Check back soon.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Gate screen
    gateContainer: {
        padding: 28,
        paddingTop: 48,
        alignItems: 'center',
        gap: 16,
        paddingBottom: 100,
    },
    gateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        marginBottom: 4,
    },
    gateBadgeText: { ...typography.gateBadge, color: 'white' },
    gateTitle: { ...typography.gateTitle },
    gateSubtitle: { ...typography.gateSubtitle, textAlign: 'center', paddingHorizontal: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', width: '100%', paddingHorizontal: 8 },
    featureText: { ...typography.featureText },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        marginTop: 8,
    },
    primaryBtnText: { ...typography.primaryBtn, color: 'white' },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 14,
        width: '100%',
        borderWidth: 1,
    },
    secondaryBtnText: { ...typography.secondaryBtn },
    pendingCard: {
        width: '100%',
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    pendingTitle: { ...typography.pendingTitle },
    pendingText: { ...typography.pendingText, textAlign: 'center' },
    tokenInputCard: {
        width: '100%',
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        gap: 12,
    },
    tokenInputLabel: { ...typography.tokenLabel },
    tokenInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        ...typography.tokenInput,
    },
    tokenBtnRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
    cancelBtnText: { ...typography.cancelBtn },

    // Active member screen
    activeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        justifyContent: 'center',
    },
    activeBannerText: { ...typography.sectionLabel },
    calendarStrip: { borderBottomWidth: 1, paddingBottom: 2 },
    datesContainer: { gap: 10 },
    filterSection: { paddingHorizontal: 14, paddingTop: 8 },
    leaguesScroll: { paddingVertical: 4, gap: 8 },
    leagueChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    leagueChipText: { ...typography.chipText },
    content: { flex: 1 },
    scrollContent: { padding: 14, paddingTop: 14, paddingBottom: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 6 },
    sectionTitle: { ...typography.sectionTitle },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    fixtureGrid: { gap: 8 },
    emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 14 },
    emptyIconWrapper: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...typography.emptyText },
    emptySubtext: { ...typography.emptySubtext, textAlign: 'center', paddingHorizontal: 36 },
});
