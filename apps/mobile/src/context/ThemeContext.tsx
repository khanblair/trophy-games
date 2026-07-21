import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeType;
    isDark: boolean;
    themeColors: typeof colors.dark;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                await AsyncStorage.getItem('user-theme');
                // Enforce dark theme
            } catch (e) {
                console.warn(e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        await AsyncStorage.setItem('user-theme', 'dark');
    };

    const setTheme = async (_newTheme: ThemeType) => {
        await AsyncStorage.setItem('user-theme', 'dark');
    };

    const isDark = true;
    const themeColors = colors.dark;

    if (!isLoaded) return null; // Wait for storage (optional, but good practice)

    return (
        <ThemeContext.Provider value={{ theme: 'dark', isDark, themeColors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
