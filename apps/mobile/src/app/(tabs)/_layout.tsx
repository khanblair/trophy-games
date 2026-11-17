import { Tabs } from 'expo-router';
import { Home, DollarSign, Crown, CheckCircle, Store, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { typography } from '../../theme/typography';
import i18n from '../../locales';

interface TabIconProps {
  icon: LucideIcon;
  focused: boolean;
  color: string;
}

function TabIcon({ icon: Icon, focused, color }: TabIconProps) {
  const { themeColors, radii, spacing } = useTheme();
  return (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? themeColors.primarySoft : 'transparent',
        borderWidth: focused ? 1 : 0,
        borderColor: themeColors.primaryBorder,
      }}
    >
      <Icon color={color} size={focused ? 21 : 20} strokeWidth={focused ? 2.4 : 1.9} />
    </View>
  );
}

export default function TabLayout() {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const { locale } = useLanguage();
  const insets = useSafeAreaInsets();

  const renderLabel = (title: string) => ({ focused, color }: { focused: boolean; color: string }) => (
    <Text
      style={[
        typography.tabLabel,
        {
          color,
          fontWeight: focused ? '800' : '600',
          marginTop: spacing.xxs,
        },
      ]}
    >
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarLabel: ({ focused, color }) => {
          void focused;
          void color;
          return null;
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          height: 76 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xs,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          ...shadows.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t('tabs.home'),
          tabBarLabel: renderLabel(i18n.t('tabs.home')),
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="paid"
        options={{
          title: i18n.t('tabs.paid'),
          tabBarLabel: renderLabel(i18n.t('tabs.paid')),
          tabBarIcon: ({ color, focused }) => <TabIcon icon={DollarSign} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vip"
        options={{
          title: i18n.t('tabs.vip'),
          tabBarLabel: renderLabel(i18n.t('tabs.vip')),
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Crown} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: i18n.t('tabs.analysis'),
          tabBarLabel: renderLabel(i18n.t('tabs.analysis')),
          tabBarIcon: ({ color, focused }) => <TabIcon icon={CheckCircle} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: i18n.t('tabs.market'),
          tabBarLabel: renderLabel(i18n.t('tabs.market')),
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Store} color={color} focused={focused} />,
        }}
      />
    </Tabs>
    </View>
  );
}
