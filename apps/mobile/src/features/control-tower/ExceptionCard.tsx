/**
 * ORION-9 EXCEPTION CARD COMPONENT
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { ExceptionRecord } from '../../types';
import { Badge } from '../../components/Badge';

export interface ExceptionCardProps {
  exception: ExceptionRecord;
  onPress: () => void;
  onQuickAction?: (exception: ExceptionRecord) => void;
  onActionPress?: () => void;
}

export const ExceptionCard: React.FC<ExceptionCardProps> = ({
  exception,
  onPress,
  onQuickAction,
  onActionPress,
}) => {
  const isCritical = exception.severity === 'Critical';

  const handleAction = () => {
    if (onActionPress) {
      onActionPress();
    } else if (onQuickAction) {
      onQuickAction(exception);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, isCritical && styles.cardCritical]}
      accessibilityRole="button"
      accessibilityLabel={`Exception ${exception.id}, ${exception.severity} severity, ${exception.type}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Badge label={exception.severity} severity={exception.severity} size="sm" />
          <Text style={styles.typeText}>{exception.type}</Text>
        </View>
        <Text style={styles.entityId}>{exception.entityId}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {exception.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.impactBox}>
          <Text style={styles.metaLabel}>EST. IMPACT</Text>
          <Text style={styles.impactValue}>
            ${(exception.estimatedImpact / 1000).toFixed(0)}k
          </Text>
        </View>

        {(onActionPress || onQuickAction) && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel={`Mitigate exception ${exception.id}`}
          >
            <Ionicons name="flash-outline" size={14} color={Colors.cyan[400]} />
            <Text style={styles.actionBtnText}>Mitigate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardCritical: {
    borderColor: Colors.status.critical.border,
    backgroundColor: Colors.surfaceElevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
  },
  entityId: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.cyan[400],
    fontFamily: 'monospace',
  },
  description: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.sm,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  impactBox: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: Typography.fontSizes.xs - 2,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textMuted,
    letterSpacing: Typography.letterSpacings.wider,
  },
  impactValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.status.critical.text,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.cyan.glow,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  actionBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.cyan[300],
  },
});
