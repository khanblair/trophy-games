import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../../theme/colors';
import { Check } from 'lucide-react-native';

export default function MarketScreen() {
    const [tab, setTab] = useState<'COINS' | 'PACKAGES'>('COINS');
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.tabContainer}>
                <View style={[styles.tabWrapper, { backgroundColor: themeColors.cardBg }]}>
                    <TouchableOpacity
                        style={[styles.tabButton, tab === 'COINS' && { backgroundColor: '#FFFFFF' }]}
                        onPress={() => setTab('COINS')}
                    >
                        <Text style={[styles.tabText, tab === 'COINS' && { color: 'black' }]}>COINS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, tab === 'PACKAGES' && { backgroundColor: '#FFFFFF' }]}
                        onPress={() => setTab('PACKAGES')}
                    >
                        <Text style={[styles.tabText, tab === 'PACKAGES' && { color: 'black' }]}>PACKAGES</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {tab === 'COINS' ? (
                    <View style={styles.coinList}>
                        {[
                            { amount: '1.500', price: '2.84' },
                            { amount: '3.000', price: '5.91', bonus: '+500' },
                            { amount: '8.000', price: '11.83', bonus: '+2.000', popular: true },
                        ].map((item, i) => (
                            <View key={i} style={[styles.coinCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
                                <View style={styles.coinRow}>
                                    <View style={styles.coinInfo}>
                                        <View style={[styles.coinIcon, { backgroundColor: themeColors.orange9 }]} />
                                        <View>
                                            <Text style={[styles.coinAmount, { color: themeColors.text }]}>{item.amount}</Text>
                                            {item.bonus && <Text style={[styles.coinBonus, { color: themeColors.orange9 }]}>{item.bonus}</Text>}
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.buyButton}>
                                        <Text style={styles.buyButtonText}>US${item.price}</Text>
                                    </TouchableOpacity>
                                </View>
                                {item.popular && (
                                    <View style={[styles.popularBadge, { backgroundColor: themeColors.primary }]}>
                                        <Text style={styles.popularText}>★ POPULAR</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.packageList}>
                        <View style={[styles.packageCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
                            <Text style={[styles.packageTitle, { color: themeColors.text }]}>Bronze</Text>
                            <Text style={[styles.packagePrice, { color: themeColors.blue10 }]}>US$8.84</Text>

                            <View style={[styles.featureRow, { backgroundColor: themeColors.blue2 }]}>
                                <Text style={{ color: themeColors.blue10 }}>💰 50 coins/day</Text>
                            </View>

                            <View style={styles.features}>
                                {['Instant 3500 coins (monthly)', 'Free matches without ads (daily)', 'Automatic ad rewards (daily)'].map((text, i) => (
                                    <View key={i} style={styles.featureItem}>
                                        <Check size={16} color={themeColors.primary} />
                                        <Text style={[styles.featureText, { color: themeColors.text }]}>{text}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: themeColors.blue10 }]}>
                                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                            </TouchableOpacity>
                        </View>
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
    tabContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    tabWrapper: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    tabText: {
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    coinList: {
        gap: 16,
    },
    coinCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    coinRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    coinIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
    },
    coinAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    coinBonus: {
        fontSize: 14,
    },
    buyButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    buyButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    popularText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    packageList: {
        gap: 16,
    },
    packageCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    packageTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    packagePrice: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featureRow: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    features: {
        gap: 12,
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        opacity: 0.8,
    },
    subscribeButton: {
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
