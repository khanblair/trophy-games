import { useRef, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';

interface DatePickerStripProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Override label for a specific date (e.g. 'TODAY') */
  labelOverrides?: Record<string, string>;
}

const ITEM_SPACING = 8;
const MIN_ITEM_WIDTH = 56;

export function DatePickerStrip({
  dates = [],
  selectedDate,
  onSelectDate,
  labelOverrides = {},
}: DatePickerStripProps) {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const safeDates = dates || [];
  const count = safeDates.length || 1;
  const horizontalPadding = spacing.lg * 2;
  const totalSpacing = ITEM_SPACING * Math.max(0, count - 1);
  const naturalWidth = (screenWidth - horizontalPadding - totalSpacing) / count;
  const itemWidth = Math.max(naturalWidth, MIN_ITEM_WIDTH);

  useEffect(() => {
    if (!safeDates.length) return;
    const idx = safeDates.indexOf(selectedDate);
    if (idx === -1 || !scrollRef.current) return;

    const itemTotalWidth = itemWidth + ITEM_SPACING;
    const itemCenter = idx * itemTotalWidth + itemWidth / 2;
    const scrollX = itemCenter - screenWidth / 2;

    scrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
  }, [selectedDate, safeDates, itemWidth, screenWidth]);

  const styles = StyleSheet.create({
    contentContainer: { flexDirection: 'row', alignItems: 'center', gap: ITEM_SPACING, paddingVertical: spacing.sm },
    dateButton: {
      height: 62,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    dayText: { ...typography.dayText, marginBottom: 3 },
    numText: { ...typography.numText, fontSize: 17 },
  });

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.contentContainer, { paddingHorizontal: spacing.lg }]}
      snapToInterval={itemWidth + ITEM_SPACING}
      decelerationRate="fast"
    >
      {safeDates.map((dateStr, index) => {
        const safeDateStr = String(dateStr || '');
        const isSelected = safeDateStr === selectedDate;

        let label = labelOverrides[safeDateStr];
        let dayNum = safeDateStr;

        try {
          const parsedDate = new Date(safeDateStr.includes('T') ? safeDateStr : `${safeDateStr}T12:00:00`);
          if (!isNaN(parsedDate.getTime())) {
            if (!label) {
              label = parsedDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            }
            dayNum = String(parsedDate.getDate());
          }
        } catch {
          if (!label) label = safeDateStr;
        }

        return (
          <TouchableOpacity
            key={safeDateStr || `date-${index}`}
            onPress={() => onSelectDate(safeDateStr)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.dateButton,
              {
                width: itemWidth,
                backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceElevated,
                borderColor: isSelected ? themeColors.primary : themeColors.border,
                ...(isSelected ? shadows.glow : shadows.none),
                shadowColor: isSelected ? themeColors.primary : 'transparent',
              },
            ]}
          >
            <Text style={[styles.dayText, { color: isSelected ? themeColors.onPrimary : themeColors.textMuted }]}>
              {String(label || '')}
            </Text>
            <Text style={[styles.numText, { color: isSelected ? themeColors.onPrimary : themeColors.text }]}>
              {String(dayNum || '')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default DatePickerStrip;
