import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CopilotPromptPreset } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { COPILOT_PRESETS } from './aiService';

interface QuickPromptsBarProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const QuickPromptsBar: React.FC<QuickPromptsBarProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        {COPILOT_PRESETS.map(preset => (
          <TouchableOpacity
            key={preset.id}
            style={[styles.pill, disabled && styles.pillDisabled]}
            onPress={() => onSelectPrompt(preset.prompt)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Quick prompt: ${preset.title}`}
          >
            {preset.icon && (
              <Ionicons
                name={preset.icon as any}
                size={14}
                color={disabled ? Colors.textDisabled : Colors.cyan[400]}
              />
            )}
            <Text style={[styles.pillText, disabled && styles.pillTextDisabled]}>
              {preset.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    maxHeight: 44,
    marginVertical: 4,
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
    height: 38,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    maxHeight: 34,
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 17,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  pillTextDisabled: {
    color: Colors.textDisabled,
  },
});
