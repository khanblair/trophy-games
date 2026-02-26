import "react-native-get-random-values";
import { useEffect, useState } from 'react';
import { useColorScheme, View, TouchableOpacity, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Sun, Moon } from 'lucide-react-native';
import { colors } from '../theme/colors';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const systemColorScheme = useColorScheme();
    const [themeName, setThemeName] = useState(systemColorScheme || 'dark');

    const [loaded] = useFonts({
        // Using system fonts - no custom font loading needed
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    const toggleTheme = () => {
        setThemeName(themeName === 'dark' ? 'light' : 'dark');
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
                    headerRight: () => (
                        <ThemeToggle onToggle={toggleTheme} currentTheme={themeName} themeColors={themeColors} />
                    )
                }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
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
    themeToggle: {
        padding: 8,
    }
});
