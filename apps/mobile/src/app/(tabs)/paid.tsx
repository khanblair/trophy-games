import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native';
import { DollarSign, Zap, CheckCircle2, Clock, Send, Key } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConvexReactClient } from "convex/react";
import { api } from '@trophy-games/backend';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { useTheme } from '../../context/ThemeContext';
import * as Application from 'expo-application';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type MemberStatus = 'none' | 'pending' | 'approved' | 'active' | 'loading';

export default function PaidTipsScreen() {
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
            const matchDate = match.timestamp?.split('T')[0];
            const dateMatch = matchDate === selectedDate;
            const leagueMatch = selectedLeague === 'All' || match.league === selectedLeague;
            return dateMatch && leagueMatch;
        });
    }, [matches, selectedDate, selectedLeague]);

    useEffect(() => {
        const init = async () => {
            const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
            setDeviceId(id);
            try {
                const status = await webApi.getMembershipStatus(id, 'paid');
                setMemberStatus(status.status as MemberStatus);
            } catch {
                setMemberStatus('none');
            }
        };
        init();
    }, []);

    const loadData = useCallback(async (isRefresh = false) => {
        if (memberStatus !== 'active') return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
        if (!convex) {
            console.error('[Convex] Convex client not initialized');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            // Fetch ONLY paid matches directly from Convex
            const paidMatches = await convex.query(api.matches.get, {
                matchType: 'paid',
                limit: 100
            });
            
            setMatches(paidMatches || []);
            console.log(`[Paid Screen] Loaded ${paidMatches?.length || 0} paid matches from Convex`);
        } catch (error) {
            console.error('[Paid Screen] Failed to fetch paid matches from Convex:', error);
            setMatches([]);
        }
        
        setLoading(false);
        setRefreshing(false);
    }, [memberStatus]);

    useEffect(() => {
        if (memberStatus === 'active') loadData();
    }, [memberStatus, loadData]);

    const onRefresh = useCallback(() => { loadData(true); }, [loadData]);

    const requestMembership = async () => {
        if (!deviceId) return;
        setRequesting(true);
        try {
            const result = await webApi.requestMembership(deviceId, 'paid');
            if (result.success) {
                setMemberStatus('pending');
                Alert.alert('Request Sent!', 'Your Paid access request has been submitted. You will receive a token once approved.');
            } else if (result.reason === 'Request already pending') {
                setMemberStatus('pending');
            }
        } catch {
            Alert.alert('Error', 'Failed to send request. Please try again.');
        }
        setRequesting(false);
    };

    const verifyToken = async () => {
        if (!tokenInput.trim()) return;
        setVerifyingToken(true);
        try {
            const result = await webApi.verifyToken(tokenInput.trim(), deviceId);
            if (result.valid) {
                setMemberStatus('active');
                setEnteringToken(false);
                setTokenInput('');
                Alert.alert('Access Granted!', 'You now have access to premium predictions.');
            } else {
                Alert.alert('Invalid Token', result.reason || 'This token is not valid for your device.');
            }
        } catch {
            Alert.alert('Error', 'Failed to verify token. Please try again.');
        }
        setVerifyingToken(false);
    };

    if (memberStatus === 'loading') {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={themeColors.primary} size="large" />
            </View>
        );
    }

    if (memberStatus === 'none' || memberStatus === 'pending') {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <ScrollView contentContainerStyle={styles.gateContainer}>
                    <View style={[styles.gateBadge, { backgroundColor: themeColors.orange9 }]}>
                        <DollarSign size={16} color="black" />
                        <Text style={styles.gateBadgeText}>PREMIUM ACCESS REQUIRED</Text>
                    </View>

                    <Text style={[styles.gateTitle, { color: themeColors.text }]}>PREMIUM TIPS</Text>
                    <Text style={[styles.gateSubtitle, { color: themeColors.textMuted }]}>
                        Get exclusive access to our curated premium predictions with expert analysis.
                    </Text>

                    {['Expert-curated premium picks', 'Detailed AI match analysis', 'Higher accuracy predictions', 'Match insights & value bets'].map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <CheckCircle2 size={13} color={themeColors.orange9} />
                            <Text style={[styles.featureText, { color: themeColors.text }]}>{f}</Text>
                        </View>
                    ))}

                    {memberStatus === 'none' && !enteringToken && (
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: themeColors.orange9 }]}
                            onPress={requestMembership}
                            disabled={requesting}
                        >
                            {requesting ? <ActivityIndicator color="black" size="small" /> : (
                                <>
                                    <Send size={15} color="black" />
                                    <Text style={styles.primaryBtnText}>REQUEST PAID ACCESS</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {memberStatus === 'pending' && !enteringToken && (
                        <View style={[styles.pendingCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.orange9 }]}>
                            <Clock size={18} color={themeColors.orange9} />
                            <Text style={[styles.pendingTitle, { color: themeColors.text }]}>Request Under Review</Text>
                            <Text style={[styles.pendingText, { color: themeColors.textMuted }]}>
                                Your request is pending admin approval. You will receive an access token shortly.
                            </Text>
                        </View>
                    )}

                    {!enteringToken ? (
                        <TouchableOpacity
                            style={[styles.secondaryBtn, { borderColor: themeColors.border }]}
                            onPress={() => setEnteringToken(true)}
                        >
                            <Key size={13} color={themeColors.textMuted} />
                            <Text style={[styles.secondaryBtnText, { color: themeColors.textMuted }]}>I HAVE A TOKEN</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.tokenInputCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
                            <Text style={[styles.tokenInputLabel, { color: themeColors.textMuted }]}>ENTER YOUR ACCESS TOKEN</Text>
                            <TextInput
                                value={tokenInput}
                                onChangeText={setTokenInput}
                                placeholder="e.g. PAD-XXXX-XXXX-XXXX"
                                placeholderTextColor={themeColors.textMuted}
                                style={[styles.tokenInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.cardBgSecondary }]}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                            <View style={styles.tokenBtnRow}>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { backgroundColor: themeColors.orange9, flex: 1 }]}
                                    onPress={verifyToken}
                                    disabled={verifyingToken || !tokenInput.trim()}
                                >
                                    {verifyingToken
                                        ? <ActivityIndicator color="black" size="small" />
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
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={[styles.calendarStrip, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
                    {dates.map((date) => {
                        const d = new Date(date + 'T12:00:00');
                        const isSelected = date === selectedDate;
                        return (
                            <TouchableOpacity
                                key={date}
                                onPress={() => setSelectedDate(date)}
                                style={[styles.dateButton, isSelected && { backgroundColor: themeColors.primary }]}
                            >
                                <Text style={[styles.dayName, { color: isSelected ? 'black' : themeColors.textMuted }]}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </Text>
                                <Text style={[styles.dayDate, { color: isSelected ? 'black' : themeColors.text }]}>
                                    {d.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaguesScroll}>
                    {uniqueLeagues.map(league => (
                        <TouchableOpacity
                            key={league}
                            onPress={() => setSelectedLeague(league)}
                            style={[styles.leagueChip, { backgroundColor: selectedLeague === league ? themeColors.primary : themeColors.cardBgSecondary }]}
                        >
                            <Text style={[styles.leagueChipText, { color: selectedLeague === league ? 'black' : themeColors.textMuted }]}>
                                {league.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={[styles.activeBanner, { backgroundColor: `${themeColors.orange9}15`, borderBottomColor: `${themeColors.orange9}30` }]}>
                <DollarSign size={13} color={themeColors.orange9} />
                <Text style={[styles.activeBannerText, { color: themeColors.orange9 }]}>PAID ACCESS ACTIVE</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
            >
                <View style={styles.sectionHeader}>
                    <Zap size={14} color={themeColors.orange9} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>PREMIUM PREDICTIONS</Text>
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
                            <DollarSign size={36} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Paid Tips Today</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            Our analysts are currently vetting the next set of value picks.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gateContainer: { padding: 28, paddingTop: 48, alignItems: 'center', gap: 16, paddingBottom: 48 },
    gateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginBottom: 4 },
    gateBadgeText: { fontSize: 10, fontWeight: '900', color: 'black', letterSpacing: 1 },
    gateTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    gateSubtitle: { textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', width: '100%', paddingHorizontal: 8 },
    featureText: { fontSize: 14, fontWeight: '600' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, width: '100%', marginTop: 8 },
    primaryBtnText: { color: 'black', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, width: '100%', borderWidth: 1 },
    secondaryBtnText: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
    pendingCard: { width: '100%', padding: 20, borderRadius: 18, alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed' },
    pendingTitle: { fontSize: 15, fontWeight: '900' },
    pendingText: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
    tokenInputCard: { width: '100%', padding: 20, borderRadius: 18, borderWidth: 1, gap: 12 },
    tokenInputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    tokenInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
    tokenBtnRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
    cancelBtnText: { fontSize: 12, fontWeight: '700' },
    activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, justifyContent: 'center' },
    activeBannerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    calendarStrip: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1 },
    datesContainer: { gap: 10 },
    dateButton: { width: 50, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    dayName: { fontSize: 9, fontWeight: '900', marginBottom: 3 },
    dayDate: { fontSize: 17, fontWeight: '900' },
    filterSection: { paddingHorizontal: 14, paddingTop: 8 },
    leaguesScroll: { paddingVertical: 4, gap: 8 },
    leagueChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    leagueChipText: { fontSize: 10, fontWeight: '900' },
    content: { flex: 1 },
    scrollContent: { padding: 14, paddingTop: 14, paddingBottom: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    fixtureGrid: { gap: 8 },
    emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 14 },
    emptyIconWrapper: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 16, fontWeight: '700' },
    emptySubtext: { textAlign: 'center', fontSize: 13, paddingHorizontal: 36 },
});
