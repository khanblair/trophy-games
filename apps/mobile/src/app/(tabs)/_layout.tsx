import { Tabs } from 'expo-router';
import { Home, DollarSign, Crown, CheckCircle, Store } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
    const { themeColors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: themeColors.primary,
                tabBarInactiveTintColor: themeColors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginBottom: 5,
                },
                tabBarStyle: {
                    backgroundColor: themeColors.background,
                    borderTopColor: themeColors.border,
                    height: 60 + insets.bottom,
                    paddingTop: 5,
                    paddingBottom: insets.bottom,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'FREE',
                    tabBarIcon: ({ color }) => <Home color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="paid"
                options={{
                    title: 'PAID',
                    tabBarIcon: ({ color }) => <DollarSign color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="vip"
                options={{
                    title: 'VIP',
                    tabBarIcon: ({ color }) => <Crown color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="wins"
                options={{
                    title: 'WINS',
                    tabBarIcon: ({ color }) => <CheckCircle color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="market"
                options={{
                    title: 'MEMBERSHIP',
                    tabBarIcon: ({ color }) => <Store color={color} size={22} />,
                }}
            />
        </Tabs>
    );
}
