/**
 * ORION-9 CARD COMPONENT
 * Layered dark card with subtle elevation and touch response.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  interactive?: boolean;
  borderColor?: string;
  elevated?: boolean;
  highlighted?: boolean;
  accentCyan?: boolean;
  style?: ViewStyle | ViewStyle[] | any;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  interactive,
  borderColor,
  elevated = false,
  highlighted = false,
  accentCyan = false,
  style,
}) => {
  const cardStyles: any[] = [
    styles.card,
    elevated ? styles.elevated : styles.primary,
    highlighted && styles.highlighted,
    accentCyan && styles.accentBorder,
    borderColor && { borderColor },
    elevated && Shadows.elevated,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  primary: {
    backgroundColor: Colors.surfacePrimary,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
  },
  highlighted: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.borderMedium,
  },
  accentBorder: {
    borderColor: Colors.borderCyan,
  },
});
