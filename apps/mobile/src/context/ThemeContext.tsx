import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
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
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('system');

    const toggleTheme = () => {
        setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setTheme = (newTheme: ThemeType) => {
        setThemeState(newTheme);
    };

    const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
    const themeColors = isDark ? colors.dark : colors.light;

    return (
        <ThemeContext.Provider value={{ theme, isDark, themeColors, toggleTheme, setTheme }}>
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
