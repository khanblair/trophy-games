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

const ITEM_SPACING = 4;
// Minimum width so the button is always tappable and readable
const MIN_ITEM_WIDTH = 44;

export function DatePickerStrip({
    dates,
    selectedDate,
    onSelectDate,
    labelOverrides = {},
}: DatePickerStripProps) {
    const { themeColors } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);

    // How wide each button should be:
    // Try to fill the screen with all items. Fall back to MIN_ITEM_WIDTH.
    const horizontalPadding = 12 * 2; // paddingHorizontal on the strip
    const totalSpacing = ITEM_SPACING * (dates.length - 1);
    const naturalWidth = (screenWidth - horizontalPadding - totalSpacing) / dates.length;
    const itemWidth = Math.max(naturalWidth, MIN_ITEM_WIDTH);

    // Scroll so that the selected item is centred when the strip mounts or
    // when the selected date changes.
    useEffect(() => {
        const idx = dates.indexOf(selectedDate);
        if (idx === -1 || !scrollRef.current) return;

        const itemTotalWidth = itemWidth + ITEM_SPACING;
        const itemCenter = idx * itemTotalWidth + itemWidth / 2;
        const scrollX = itemCenter - screenWidth / 2;

        scrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
    }, [selectedDate, dates, itemWidth, screenWidth]);

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
                styles.contentContainer,
                { paddingHorizontal: 12 },
            ]}
            // Snap so swiping feels intentional rather than free-scrolling
            snapToInterval={itemWidth + ITEM_SPACING}
            decelerationRate="fast"
        >
            {dates.map((dateStr) => {
                const d = new Date(dateStr + 'T12:00:00');
                const isSelected = dateStr === selectedDate;
                const label =
                    labelOverrides[dateStr] ??
                    d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

                return (
                    <TouchableOpacity
                        key={dateStr}
                        onPress={() => onSelectDate(dateStr)}
                        activeOpacity={0.7}
                        style={[
                            styles.dateButton,
                            {
                                width: itemWidth,
                                backgroundColor: isSelected
                                    ? themeColors.primary
                                    : themeColors.cardBgSecondary,
                                borderColor: 'transparent',
                                borderWidth: 0,
                                shadowColor: isSelected ? themeColors.primary : '#000',
                                shadowOffset: isSelected ? { width: 0, height: 4 } : { width: 0, height: 2 },
                                shadowOpacity: isSelected ? 0.4 : 0.1,
                                shadowRadius: isSelected ? 12 : 4,
                                elevation: isSelected ? 4 : 1,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.dayText,
                                { color: isSelected ? '#0B0E12' : themeColors.textMuted },
                            ]}
                        >
                            {label}
                        </Text>
                        <Text
                            style={[
                                styles.numText,
                                { color: isSelected ? '#0B0E12' : themeColors.text },
                            ]}
                        >
                            {d.getDate()}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ITEM_SPACING,
        paddingVertical: 6,
    },
    dateButton: {
        height: 58,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        ...typography.dayText,
        marginBottom: 3,
    },
    numText: {
        ...typography.numText,
    },
});
