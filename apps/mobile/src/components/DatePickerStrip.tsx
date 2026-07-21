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
    dates = [],
    selectedDate,
    onSelectDate,
    labelOverrides = {},
}: DatePickerStripProps) {
    const { themeColors } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);

    // How wide each button should be:
    // Try to fill the screen with all items. Fall back to MIN_ITEM_WIDTH.
    const count = dates.length || 1;
    const horizontalPadding = 12 * 2; // paddingHorizontal on the strip
    const totalSpacing = ITEM_SPACING * Math.max(0, count - 1);
    const naturalWidth = (screenWidth - horizontalPadding - totalSpacing) / count;
    const itemWidth = Math.max(naturalWidth, MIN_ITEM_WIDTH);

    // Scroll so that the selected item is centred when the strip mounts or
    // when the selected date changes.
    useEffect(() => {
        if (!dates.length) return;
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
                const isSelected = dateStr === selectedDate;
                
                let label = labelOverrides[dateStr];
                let dayNum = dateStr;

                try {
                    const parsedDate = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
                    if (!isNaN(parsedDate.getTime())) {
                        if (!label) {
                            label = parsedDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        }
                        dayNum = String(parsedDate.getDate());
                    }
                } catch {
                    if (!label) label = dateStr;
                }

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
                                borderColor: isSelected
                                    ? themeColors.primary
                                    : 'transparent',
                                borderWidth: isSelected ? 1 : 0,
                                shadowColor: isSelected ? themeColors.primary : '#000',
                                shadowOffset: isSelected ? { width: 0, height: 4 } : { width: 0, height: 0 },
                                shadowOpacity: isSelected ? 0.4 : 0,
                                shadowRadius: isSelected ? 12 : 0,
                                elevation: isSelected ? 4 : 0,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.dayText,
                                { color: isSelected ? '#090A0C' : themeColors.textMuted },
                            ]}
                        >
                            {label}
                        </Text>
                        <Text
                            style={[
                                styles.numText,
                                { color: isSelected ? '#090A0C' : themeColors.text },
                            ]}
                        >
                            {dayNum}
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
