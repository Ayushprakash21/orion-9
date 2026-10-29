/**
 * ORION-9 BADGE COMPONENT
 * Semantic status, severity, and environment indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../theme';
import { SeverityLevel } from '../types';

export interface BadgeProps {
  label: string;
  severity?: SeverityLevel | 'Success' | 'Warning' | 'Info' | string;
  variant?: 'solid' | 'subtle' | 'outline' | 'critical' | 'high' | 'warning' | 'info' | 'success' | 'default';
  size?: 'sm' | 'md' | 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  severity = 'Info',
  variant = 'subtle',
  size = 'md',
  style,
}) => {
  const getThemeColors = () => {
    // If variant specifies a semantic color directly
    if (variant === 'critical') return Colors.status.critical;
    if (variant === 'high' || variant === 'warning') return Colors.status.high;
    if (variant === 'info' || variant === 'default') return Colors.status.medium;
    if (variant === 'success') return Colors.status.success;

    const norm = String(severity).toLowerCase();
    switch (norm) {
      case 'critical':
        return Colors.status.critical;
      case 'high':
      case 'warning':
        return Colors.status.high;
      case 'medium':
      case 'info':
        return Colors.status.medium;
      case 'low':
        return Colors.status.low;
      case 'success':
        return Colors.status.success;
      default:
        return Colors.status.medium;
    }
  };

  const themeColors = getThemeColors();
  const isSmall = size === 'sm' || size === 'small';
  const paddingH = isSmall ? Spacing.xs + 2 : Spacing.sm;
  const paddingV = isSmall ? 2 : Spacing.xxs + 1;
  const fontSize = isSmall ? Typography.fontSizes.xs - 1 : Typography.fontSizes.xs;

  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    borderRadius: BorderRadius.round,
    backgroundColor: isSolid
      ? themeColors.solid
      : isOutline
      ? 'transparent'
      : themeColors.bg,
    borderWidth: 1,
    borderColor: isSolid
      ? themeColors.solid
      : themeColors.border,
  };

  const textStyle = {
    fontSize,
    fontWeight: Typography.fontWeights.bold,
    color: isSolid ? Colors.textInverse : themeColors.text,
    letterSpacing: Typography.letterSpacings.wider,
    textTransform: 'uppercase' as const,
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};
