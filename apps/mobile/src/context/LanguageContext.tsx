import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from '../locales';

type LanguageContextType = {
    locale: string;
    setLocale: (locale: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState(i18n.locale);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadLang = async () => {
            try {
                const saved = await AsyncStorage.getItem('user-language');
                if (saved) {
                    i18n.locale = saved;
                    setLocaleState(saved);
                } else {
                    const deviceLocales = getLocales();
                    if (deviceLocales.length > 0) {
                        const deviceLang = deviceLocales[0].languageCode;
                        if (deviceLang && ['en', 'fr', 'es'].includes(deviceLang)) {
                            i18n.locale = deviceLang;
                            setLocaleState(deviceLang);
                        } else {
                            i18n.locale = 'en';
                            setLocaleState('en');
                        }
                    }
                }
            } catch (e) {
                console.warn(e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadLang();
    }, []);

    const setLocale = async (newLocale: string) => {
        i18n.locale = newLocale;
        setLocaleState(newLocale);
        await AsyncStorage.setItem('user-language', newLocale);
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
