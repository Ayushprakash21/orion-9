import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading operational telemetry...',
  subMessage,
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.pulseBox}>
        <ActivityIndicator size="large" color={Colors.cyan[500]} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pulseBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subMessage: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
