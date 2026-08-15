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

    const safeDates = dates || [];
    const count = safeDates.length || 1;
    const horizontalPadding = 12 * 2; 
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

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
                styles.contentContainer,
                { paddingHorizontal: 12 },
            ]}
            snapToInterval={itemWidth + ITEM_SPACING}
            decelerationRate="fast"
        >
            {safeDates.map((dateStr) => {
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
                        key={safeDateStr || Math.random().toString()}
                        onPress={() => onSelectDate(safeDateStr)}
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
                            {String(label || '')}
                        </Text>
                        <Text
                            style={[
                                styles.numText,
                                { color: isSelected ? '#090A0C' : themeColors.text },
                            ]}
                        >
                            {String(dayNum || '')}
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
