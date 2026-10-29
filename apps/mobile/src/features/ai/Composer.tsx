import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface ComposerProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  isLoading = false,
  placeholder = 'Ask Orion AI Copilot (e.g., "Analyze shipment delays")...',
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          editable={!isLoading}
          accessibilityLabel="Message input for Orion AI"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!text.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Ionicons
              name="arrow-up"
              size={18}
              color={!text.trim() ? Colors.textDisabled : Colors.textInverse}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 46,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cyan[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
});
