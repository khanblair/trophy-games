'use client';

import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { Sun, Moon, Bell } from 'lucide-react-native';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { api } from '@trophy-games/backend';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

SplashScreen.preventAutoHideAsync();

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

    if (!convex) {
        return (
            <AppThemeProvider>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Configuration Error</Text>
                    <Text style={styles.errorText}>
                        Convex URL is not set. Please check your environment variables.
                    </Text>
                </View>
            </AppThemeProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <ConvexProvider client={convex}>
                <AppThemeProvider>
                    <RootLayoutContent />
                </AppThemeProvider>
            </ConvexProvider>
        </SafeAreaProvider>
    );
}

function RootLayoutContent() {
    const router = useRouter();
    const { theme, isDark, themeColors, toggleTheme } = useTheme();
    const { expoPushToken } = usePushNotifications();
    const insets = useSafeAreaInsets();

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

    useEffect(() => {
        const registerToken = async () => {
            if (expoPushToken && convex && deviceId) {
                try {
                    await convex.mutation(api.devices.registerPushToken, {
                        deviceId: deviceId,
                        pushToken: expoPushToken.data,
                    });
                } catch (e) {
                    console.error('Failed to register push token:', e);
                }
            }
        };
        registerToken();
    }, [expoPushToken, deviceId]);

    // Configure Android navigation bar to match theme
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (NavigationBar.setBackgroundColorAsync) {
                NavigationBar.setBackgroundColorAsync(themeColors.background).catch(() => {});
            }
            if (NavigationBar.setButtonStyleAsync) {
                NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
            }
            if (NavigationBar.setBorderColorAsync) {
                NavigationBar.setBorderColorAsync(themeColors.border).catch(() => {});
            }
        }
    }, [isDark, themeColors.background, themeColors.border]);

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: themeColors.background },
                    headerShadowVisible: false,
                    headerTintColor: themeColors.text,
                    headerTitleStyle: {
                        fontWeight: '700',
                        fontSize: 17,
                    },
                    headerTitleAlign: 'left',
                    headerLeft: () => null,
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
                        title: 'Trophy Games'
                    }} />
                    <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
            </View>
        </ThemeProvider>
    );
}

const ThemeToggle = ({ onToggle, currentTheme, themeColors }: { onToggle: () => void; currentTheme: string; themeColors: any }) => {
    return (
        <TouchableOpacity onPress={onToggle} style={styles.themeToggle}>
            {currentTheme === 'dark' ? (
                <Sun size={20} color={themeColors.primary} />
            ) : (
                <Moon size={20} color={themeColors.blue10} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 24,
    },
    errorTitle: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    errorText: {
        color: '#A1A1AA',
        fontSize: 14,
        textAlign: 'center',
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
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    badgeText: {
        color: 'white',
        fontSize: 8,
        fontWeight: '700',
    },
});
