import { Tabs } from 'expo-router';
import { Home, DollarSign, Crown, CheckCircle, Bell } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
    const { themeColors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: themeColors.primary,
                tabBarInactiveTintColor: themeColors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '900',
                    marginBottom: 5,
                },
                tabBarStyle: {
                    backgroundColor: themeColors.background,
                    borderTopColor: themeColors.border,
                    height: 60,
                    paddingTop: 5,
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
                    tabBarIcon: ({ color }) => <Bell color={color} size={22} />,
                }}
            />
        </Tabs>
    );
}
