import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii, shadows, spacing, type AppPalette, type ShadowValue } from '../theme/colors';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeType;
    isDark: boolean;
    themeColors: AppPalette;
    spacing: typeof spacing;
    radii: typeof radii;
    shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'glow', ShadowValue>;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    // Dark / green is the brand default; the system setting only applies when
    // the user explicitly picks "System" in Settings.
    const [theme, setThemeState] = useState<ThemeType>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user-theme') as ThemeType | null;
                if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                    setThemeState(savedTheme);
                }
            } catch (e) {
                console.warn(e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setThemeState(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
    const themeColors = isDark ? colors.dark : colors.light;

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider value={{ theme, isDark, themeColors, spacing, radii, shadows, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
