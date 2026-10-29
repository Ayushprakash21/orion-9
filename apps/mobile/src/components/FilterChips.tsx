/**
 * ORION-9 FILTER CHIPS & SEARCH BAR
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

export interface FilterOption<T = string> {
  label: string;
  value?: T;
  id?: T;
  badge?: number;
  count?: number;
}

export interface FilterChipsProps<T = string> {
  options: FilterOption<T>[];
  selected?: T;
  selectedId?: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  selected,
  selectedId,
  onSelect,
}: FilterChipsProps<T>) {
  const activeValue = selected !== undefined ? selected : selectedId;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.chipsScroll}
      >
        {options.map((opt, idx) => {
          const itemVal = (opt.value !== undefined ? opt.value : opt.id) as T;
          const isSelected = itemVal === activeValue;
          const badgeCount = opt.badge !== undefined ? opt.badge : opt.count;

          return (
            <TouchableOpacity
              key={String(itemVal || idx)}
              onPress={() => onSelect(itemVal)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
              {badgeCount !== undefined && badgeCount > 0 && (
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected && styles.badgeTextSelected,
                    ]}
                  >
                    {badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    maxHeight: 44,
    marginVertical: 4,
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
    height: 38,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    maxHeight: 34,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 17,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.cyan[500],
    borderColor: Colors.cyan[400],
  },
  chipText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeights.bold,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: 'rgba(7, 10, 16, 0.25)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textMuted,
  },
  badgeTextSelected: {
    color: Colors.textInverse,
  },
});
