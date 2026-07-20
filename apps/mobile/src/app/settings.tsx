import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { typography } from '../theme/typography';
import { Settings, Globe, LogOut, ShieldAlert, Palette, Moon, Sun, Smartphone } from 'lucide-react-native';
import i18n from '../locales';

export default function SettingsScreen() {
    const { themeColors, theme, setTheme } = useTheme();
    const { locale, setLocale } = useLanguage();
    const router = useRouter();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'es', name: 'Español' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <Settings size={24} color={themeColors.text} />
                <Text style={[styles.title, { color: themeColors.text }]}>{i18n.t('settings.title')}</Text>
            </View>

            <View style={[styles.section, { backgroundColor: themeColors.cardBgSecondary }]}>
                <View style={styles.sectionHeader}>
                    <Palette size={20} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{i18n.t('settings.theme')}</Text>
                </View>
                <View style={styles.themeOptions}>
                    <TouchableOpacity 
                        style={[styles.themeBtn, theme === 'light' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '20' }, { borderColor: themeColors.border }]}
                        onPress={() => setTheme('light')}
                    >
                        <Sun size={20} color={theme === 'light' ? themeColors.primary : themeColors.textMuted} />
                        <Text style={[styles.themeBtnText, { color: theme === 'light' ? themeColors.primary : themeColors.textMuted }]}>Light</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.themeBtn, theme === 'dark' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '20' }, { borderColor: themeColors.border }]}
                        onPress={() => setTheme('dark')}
                    >
                        <Moon size={20} color={theme === 'dark' ? themeColors.primary : themeColors.textMuted} />
                        <Text style={[styles.themeBtnText, { color: theme === 'dark' ? themeColors.primary : themeColors.textMuted }]}>Dark</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.themeBtn, theme === 'system' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '20' }, { borderColor: themeColors.border }]}
                        onPress={() => setTheme('system')}
                    >
                        <Smartphone size={20} color={theme === 'system' ? themeColors.primary : themeColors.textMuted} />
                        <Text style={[styles.themeBtnText, { color: theme === 'system' ? themeColors.primary : themeColors.textMuted }]}>System</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: themeColors.cardBgSecondary }]}>
                <View style={styles.sectionHeader}>
                    <Globe size={20} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{i18n.t('settings.language')}</Text>
                </View>
                <View style={styles.langList}>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.langOption,
                                { borderColor: locale === lang.code ? themeColors.primary : themeColors.border }
                            ]}
                            onPress={() => {
                                setLocale(lang.code);
                            }}
                        >
                            <Text style={[
                                styles.langText,
                                { color: locale === lang.code ? themeColors.primary : themeColors.textMuted }
                            ]}>
                                {lang.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.btn, { backgroundColor: themeColors.cardBgSecondary }]}
                onPress={() => {
                    // Logic to clear user token / username would go here
                    // Then redirect to onboarding
                    // router.replace('/onboarding');
                }}
            >
                <LogOut size={20} color={themeColors.textMuted} />
                <Text style={[styles.btnText, { color: themeColors.textMuted }]}>Sign Out / Change Username</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    themeBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 12,
        gap: 6,
    },
    themeBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    langList: {
        gap: 10,
    },
    langOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 12,
    },
    langText: {
        fontSize: 16,
        fontWeight: '500',
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
