import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { Check, CreditCard, Star, Zap, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MarketScreen() {
    const [tab, setTab] = useState<'COINS' | 'PACKAGES'>('COINS');
    const { themeColors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <View style={[styles.tabWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                    <TouchableOpacity
                        style={[styles.tabButton, tab === 'COINS' && { backgroundColor: themeColors.cardBg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                        onPress={() => setTab('COINS')}
                    >
                        <Text style={[styles.tabText, { color: tab === 'COINS' ? themeColors.text : themeColors.textMuted }]}>COINS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, tab === 'PACKAGES' && { backgroundColor: themeColors.cardBg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]}
                        onPress={() => setTab('PACKAGES')}
                    >
                        <Text style={[styles.tabText, { color: tab === 'PACKAGES' ? themeColors.text : themeColors.textMuted }]}>PACKAGES</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {tab === 'COINS' ? (
                    <View style={styles.coinList}>
                        <View style={[styles.infoBanner, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Info size={16} color={themeColors.blue10} />
                            <Text style={[styles.infoText, { color: themeColors.textMuted }]}>
                                Coins can be used to unlock individual premium predictions across the app.
                            </Text>
                        </View>

                        {[
                            { amount: '1,500', price: '2.84', icon: '💰' },
                            { amount: '3,000', price: '5.91', bonus: '+500 FREE', icon: '💎' },
                            { amount: '8,000', price: '11.83', bonus: '+2,000 FREE', popular: true, icon: '🏆' },
                        ].map((item, i) => (
                            <View key={i} style={[styles.coinCard, { backgroundColor: themeColors.cardBg, borderColor: item.popular ? themeColors.primary : themeColors.border }]}>
                                {item.popular && (
                                    <View style={[styles.popularBadge, { backgroundColor: themeColors.primary }]}>
                                        <Text style={styles.popularText}>BEST VALUE</Text>
                                    </View>
                                )}
                                <View style={styles.cardMain}>
                                    <View style={[styles.iconContainer, { backgroundColor: themeColors.cardBgSecondary }]}>
                                        <Text style={styles.emojiIcon}>{item.icon}</Text>
                                    </View>
                                    <View style={styles.amountInfo}>
                                        <Text style={[styles.amountText, { color: themeColors.text }]}>{item.amount} COINS</Text>
                                        {item.bonus && <Text style={[styles.bonusText, { color: themeColors.primary }]}>{item.bonus}</Text>}
                                    </View>
                                    <TouchableOpacity style={[styles.priceButton, { backgroundColor: item.popular ? themeColors.primary : themeColors.cardBgSecondary }]}>
                                        <Text style={[styles.priceText, { color: item.popular ? 'black' : themeColors.text }]}>${item.price}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.packageList}>
                        <View style={[styles.premiumCard, { backgroundColor: 'black', borderColor: themeColors.primary }]}>
                            <View style={styles.premiumHeader}>
                                <View>
                                    <View style={[styles.eliteBadge, { backgroundColor: themeColors.primary }]}>
                                        <Star size={12} color="black" fill="black" />
                                        <Text style={styles.eliteText}>PRO UNLIMITED</Text>
                                    </View>
                                    <Text style={styles.packageTitle}>BRONZE ELITE</Text>
                                </View>
                                <Text style={[styles.packagePrice, { color: themeColors.primary }]}>$8.84<Text style={styles.periodText}>/mo</Text></Text>
                            </View>

                            <View style={[styles.highlightBox, { backgroundColor: 'rgba(217, 255, 0, 0.1)' }]}>
                                <Zap size={16} color={themeColors.primary} />
                                <Text style={[styles.highlightText, { color: themeColors.primary }]}>50 BONUS COINS DAILY</Text>
                            </View>

                            <View style={styles.featureList}>
                                {[
                                    'Instant 3,500 coins monthly',
                                    'Access all matches without ads',
                                    'Verified high-accuracy tips',
                                    'Priority support access'
                                ].map((feature, i) => (
                                    <View key={i} style={styles.featureLine}>
                                        <Check size={14} color={themeColors.primary} strokeWidth={3} />
                                        <Text style={styles.featureDesc}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: themeColors.primary }]}>
                                <CreditCard size={18} color="black" />
                                <Text style={styles.actionButtonText}>SUBSCRIBE NOW</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.footerNote, { color: themeColors.textMuted }]}>
                            Subscription can be managed or cancelled at any time in your store account settings.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    tabWrapper: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 14,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoBanner: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
    coinList: {
        gap: 12,
    },
    coinCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 1,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '900',
        color: 'black',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiIcon: {
        fontSize: 24,
    },
    amountInfo: {
        flex: 1,
    },
    amountText: {
        fontSize: 18,
        fontWeight: '900',
    },
    bonusText: {
        fontSize: 11,
        fontWeight: '900',
        marginTop: 2,
    },
    priceButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '900',
    },
    packageList: {
        gap: 20,
    },
    premiumCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 2,
    },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    eliteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    eliteText: {
        fontSize: 9,
        fontWeight: '900',
        color: 'black',
    },
    packageTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    packagePrice: {
        fontSize: 28,
        fontWeight: '900',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
    },
    highlightBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    highlightText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    featureList: {
        gap: 14,
        marginBottom: 30,
    },
    featureLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureDesc: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600',
        opacity: 0.8,
    },
    actionButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    actionButtonText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 11,
        paddingHorizontal: 40,
        lineHeight: 16,
    },
});
