import { Tabs } from 'expo-router';
import { Home, DollarSign, Crown, CheckCircle, ShoppingCart } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { colors } from '../../theme/colors';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: themeColors.primary,
                tabBarStyle: {
                    backgroundColor: themeColors.background,
                    borderTopColor: themeColors.border,
                },
                headerStyle: {
                    backgroundColor: themeColors.background,
                },
                headerTintColor: themeColors.text,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Free',
                    tabBarIcon: ({ color }) => <Home color={color} />,
                }}
            />
            <Tabs.Screen
                name="paid"
                options={{
                    title: 'Paid',
                    tabBarIcon: ({ color }) => <DollarSign color={color} />,
                }}
            />
            <Tabs.Screen
                name="vip"
                options={{
                    title: 'VIP',
                    tabBarIcon: ({ color }) => <Crown color={color} />,
                }}
            />
            <Tabs.Screen
                name="wins"
                options={{
                    title: 'Wins',
                    tabBarIcon: ({ color }) => <CheckCircle color={color} />,
                }}
            />
            <Tabs.Screen
                name="market"
                options={{
                    title: 'Market',
                    tabBarIcon: ({ color }) => <ShoppingCart color={color} />,
                }}
            />
        </Tabs>
    );
}
