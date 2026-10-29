/**
 * ORION-9 BUTTON COMPONENT
 * Accessible touch targets with haptic feedback and distinct visual tiers.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Layout } from '../theme';
import * as Haptics from 'expo-haptics';

export interface ButtonProps {
  label?: string;
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const displayLabel = title || label || '';

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const getContainerStyles = (): ViewStyle => {
    const isSmall = size === 'sm' || size === 'small';
    const isLarge = size === 'lg' || size === 'large';

    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
      minHeight: isSmall ? 36 : isLarge ? 52 : Layout.touchTargetMin,
      paddingHorizontal: isSmall ? Spacing.sm : isLarge ? Spacing.xl : Spacing.base,
      paddingVertical: isSmall ? Spacing.xs : Spacing.sm,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: Colors.cyan[500],
          borderWidth: 1,
          borderColor: Colors.cyan[400],
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: Colors.surfaceElevated,
          borderWidth: 1,
          borderColor: Colors.borderCyan,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.borderMedium,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: Colors.status.critical.bg,
          borderWidth: 1,
          borderColor: Colors.status.critical.border,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      default:
        return base;
    }
  };

  const getTextStyles = (): TextStyle => {
    const isSmall = size === 'sm' || size === 'small';

    const base: TextStyle = {
      fontSize: isSmall ? Typography.fontSizes.sm : Typography.fontSizes.base,
      fontWeight: Typography.fontWeights.semibold,
      textAlign: 'center',
      letterSpacing: Typography.letterSpacings.wide,
    };

    switch (variant) {
      case 'primary':
        return { ...base, color: Colors.textInverse, fontWeight: '700' };
      case 'secondary':
        return { ...base, color: Colors.cyan[300] };
      case 'outline':
        return { ...base, color: Colors.textPrimary };
      case 'danger':
        return { ...base, color: Colors.status.critical.text };
      case 'ghost':
        return { ...base, color: Colors.cyan[400] };
      default:
        return base;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        getContainerStyles(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || displayLabel}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textInverse : Colors.cyan[400]}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyles(), textStyle]}>{displayLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
