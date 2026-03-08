'use client';

import { useEffect, useState } from 'react';
import { useColorScheme, View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { Sun, Moon, Menu, Home, DollarSign, Crown, CheckCircle, ShoppingCart, Zap, TrendingUp, Bell } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { api } from '@trophy-games/backend';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

SplashScreen.preventAutoHideAsync();

const menuItems = [
    { name: 'Free Tips', href: '/(tabs)', icon: Home, type: 'free' },
    { name: 'Paid Tips', href: '/(tabs)/paid', icon: DollarSign, type: 'paid' },
    { name: 'VIP Tips', href: '/(tabs)/vip', icon: Crown, type: 'vip' },
    { name: 'Wins', href: '/(tabs)/wins', icon: CheckCircle },
    { name: 'Market', href: '/(tabs)/market', icon: ShoppingCart },
    { name: 'Alerts', href: '/alerts', icon: Bell },
];

export default function RootLayout() {
    const [loaded] = useFonts({});

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    const content = (
        <AppThemeProvider>
            <RootLayoutContent />
        </AppThemeProvider>
    );

    if (convex) {
        return (
            <ConvexProvider client={convex}>
                {content}
            </ConvexProvider>
        );
    }

    return content;
}

function RootLayoutContent() {
    const router = useRouter();
    const { theme, isDark, themeColors, toggleTheme } = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { expoPushToken, notification } = usePushNotifications();

    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const getDeviceId = async () => {
            try {
                const Application = await import('expo-application');
                const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
                setDeviceId(id);
            } catch (e) {
                console.error('Failed to get deviceId:', e);
            }
        };
        getDeviceId();
    }, []);

    const alerts = useQuery(api.alerts.getAlerts, { deviceId: deviceId || "unknown" });
    const unreadCount = alerts?.filter((a: any) => !(a.readBy ?? []).includes(deviceId || "unknown")).length || 0;

    const registerDevice = useMutation(api.devices.registerPushToken || ({} as any));

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    useEffect(() => {
        const registerToken = async () => {
            if (expoPushToken && convex && deviceId) {
                try {
                    await convex.mutation(api.devices.registerPushToken, {
                        deviceId: deviceId,
                        pushToken: expoPushToken.data,
                    });
                    console.log('Push token registered');
                } catch (e) {
                    console.error('Failed to register push token:', e);
                }
            }
        };
        registerToken();
    }, [expoPushToken, deviceId]);

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: themeColors.background },
                    headerShadowVisible: false,
                    headerTintColor: themeColors.text,
                    headerTitleStyle: {
                        fontWeight: '900',
                        fontSize: 18,
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
                            <Menu size={22} color={themeColors.text} strokeWidth={2.5} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => router.push('/alerts')}
                                style={styles.bellButton}
                            >
                                <Bell size={22} color={themeColors.text} strokeWidth={2.5} />
                                {unreadCount > 0 && (
                                    <View style={[styles.badge, { backgroundColor: themeColors.primary }]}>
                                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <ThemeToggle onToggle={toggleTheme} currentTheme={theme} themeColors={themeColors} />
                        </View>
                    )
                }}>
                    <Stack.Screen name="(tabs)" options={{
                        headerShown: true,
                        title: 'TROPHY GAMES'
                    }} />
                    <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>

                {/* Drawer Overlay */}
                {drawerOpen && (
                    <TouchableOpacity
                        style={styles.drawerOverlay}
                        activeOpacity={1}
                        onPress={toggleDrawer}
                    >
                        <View style={[styles.drawer, { backgroundColor: themeColors.cardBg, borderRightColor: themeColors.border }]}>
                            <View style={[styles.drawerHeader, { borderBottomColor: themeColors.border }]}>
                                <View style={styles.logoRow}>
                                    <View style={[styles.logoDot, { backgroundColor: themeColors.primary }]} />
                                    <View>
                                        <Text style={[styles.drawerTitle, { color: themeColors.text }]}>TROPHY</Text>
                                        <Text style={[styles.drawerSubtitle, { color: themeColors.primary }]}>GAMES ELITE</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.drawerContent}>
                                {menuItems.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.drawerItem}
                                        onPress={() => {
                                            router.push(item.href as any);
                                            toggleDrawer();
                                        }}
                                    >
                                        <View style={[styles.drawerItemIcon, { backgroundColor: themeColors.cardBgSecondary }]}>
                                            <item.icon size={18} color={themeColors.text} />
                                        </View>
                                        <Text style={[styles.drawerItemText, { color: themeColors.text }]}>{item.name}</Text>
                                        {item.type === 'vip' && (
                                            <View style={[styles.vipLabel, { backgroundColor: themeColors.primary }]}>
                                                <Text style={styles.vipLabelText}>PRO</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={[styles.drawerFooter, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <View style={styles.drawerFooterRow}>
                                    <Zap size={14} color={themeColors.orange9} />
                                    <Text style={[styles.drawerFooterText, { color: themeColors.textMuted }]}>LIVE CLOUD SYNC</Text>
                                </View>
                                <View style={styles.drawerFooterRow}>
                                    <TrendingUp size={14} color={themeColors.primary} />
                                    <Text style={[styles.drawerFooterText, { color: themeColors.textMuted }]}>AI VETTING ACTIVE</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </ThemeProvider>
    );
}

const ThemeToggle = ({ onToggle, currentTheme, themeColors }: { onToggle: () => void; currentTheme: string; themeColors: any }) => {
    return (
        <TouchableOpacity
            onPress={onToggle}
            style={styles.themeToggle}
        >
            {currentTheme === 'dark' ? (
                <Sun size={20} color={themeColors.primary} />
            ) : (
                <Moon size={20} color={themeColors.blue10} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuButton: {
        padding: 12,
        marginLeft: 4,
    },
    themeToggle: {
        padding: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    bellButton: {
        padding: 12,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#D9FF00',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        borderWidth: 1.5,
        borderColor: 'white', // Will be dynamic below
    },
    badgeText: {
        color: 'black',
        fontSize: 8,
        fontWeight: '900',
    },
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '80%',
        maxWidth: 320,
        zIndex: 101,
        borderRightWidth: 1,
    },
    drawerHeader: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 30,
        borderBottomWidth: 1,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    drawerTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -1,
    },
    drawerSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    drawerContent: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 12,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
        gap: 16,
    },
    drawerItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerItemText: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    vipLabel: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    vipLabelText: {
        fontSize: 9,
        fontWeight: '900',
        color: 'black',
    },
    drawerFooter: {
        paddingHorizontal: 24,
        paddingVertical: 30,
    },
    drawerFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    drawerFooterText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
