'use client';

import { useEffect, useState } from 'react';
import { useColorScheme, View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Sun, Moon, Menu, Home, DollarSign, Crown, CheckCircle, ShoppingCart, Zap, TrendingUp } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { DrawerActions } from '@react-navigation/native';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

SplashScreen.preventAutoHideAsync();

const menuItems = [
    { name: 'Free Tips', href: '/(tabs)/', icon: Home, type: 'free' },
    { name: 'Paid Tips', href: '/(tabs)/paid', icon: DollarSign, type: 'paid' },
    { name: 'VIP Tips', href: '/(tabs)/vip', icon: Crown, type: 'vip' },
    { name: 'Wins', href: '/(tabs)/wins', icon: CheckCircle },
    { name: 'Market', href: '/(tabs)/market', icon: ShoppingCart },
];

export default function RootLayout() {
    const systemColorScheme = useColorScheme();
    const [themeName, setThemeName] = useState(systemColorScheme || 'dark');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [loaded] = useFonts({});

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    const toggleTheme = () => {
        setThemeName(themeName === 'dark' ? 'light' : 'dark');
    };

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    if (!loaded) {
        return null;
    }

    const isDark = themeName === 'dark';
    const themeColors = isDark ? colors.dark : colors.light;

    const content = (
        <ThemeProvider value={themeName === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: themeColors.background },
                    headerTintColor: themeColors.text,
                    headerLeft: () => (
                        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
                            <Menu size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <ThemeToggle onToggle={toggleTheme} currentTheme={themeName} themeColors={themeColors} />
                    )
                }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
                        <View style={[styles.drawer, { backgroundColor: themeColors.cardBg }]}>
                            <View style={[styles.drawerHeader, { borderBottomColor: themeColors.border }]}>
                                <Text style={[styles.drawerTitle, { color: themeColors.text }]}>Trophy Games</Text>
                                <TouchableOpacity onPress={toggleTheme}>
                                    {themeName === 'dark' ? (
                                        <Sun size={20} color="#D9FF00" />
                                    ) : (
                                        <Moon size={20} color="#3182CE" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.drawerContent}>
                                {menuItems.map((item, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.drawerItem, { borderBottomColor: themeColors.border }]}
                                        onPress={() => {
                                            toggleDrawer();
                                        }}
                                    >
                                        <item.icon size={20} color={themeColors.primary} />
                                        <Text style={[styles.drawerItemText, { color: themeColors.text }]}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <View style={[styles.drawerFooter, { borderTopColor: themeColors.border }]}>
                                <View style={styles.drawerFooterRow}>
                                    <Zap size={16} color={themeColors.orange9} />
                                    <Text style={[styles.drawerFooterText, { color: themeColors.text }]}>Live Updates</Text>
                                </View>
                                <View style={styles.drawerFooterRow}>
                                    <TrendingUp size={16} color={themeColors.primary} />
                                    <Text style={[styles.drawerFooterText, { color: themeColors.text }]}>AI Predictions</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </ThemeProvider>
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

const ThemeToggle = ({ onToggle, currentTheme, themeColors }: { onToggle: () => void; currentTheme: string; themeColors: any }) => {
    return (
        <TouchableOpacity
            onPress={onToggle}
            style={styles.themeToggle}
        >
            {currentTheme === 'dark' ? (
                <Sun size={20} color="#D9FF00" />
            ) : (
                <Moon size={20} color="#3182CE" />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuButton: {
        padding: 8,
    },
    themeToggle: {
        padding: 8,
    },
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '75%',
        maxWidth: 300,
        zIndex: 101,
        paddingTop: 60,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    drawerContent: {
        flex: 1,
        paddingTop: 10,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    drawerItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    drawerFooter: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
    },
    drawerFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    drawerFooterText: {
        fontSize: 14,
        opacity: 0.7,
    },
});
