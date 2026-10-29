import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileAlertItem } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, Badge } from '../../components';

interface AlertCardProps {
  alert: MobileAlertItem;
  onPress?: () => void;
  onEntityPress?: (entityType: string, entityId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onEntityPress,
}) => {
  const isCritical = alert.severity === 'Critical';
  const badgeVariant =
    alert.severity === 'Critical'
      ? 'critical'
      : alert.severity === 'High'
      ? 'warning'
      : 'info';

  return (
    <Card
      interactive={!!onPress}
      onPress={onPress}
      borderColor={!alert.read && isCritical ? Colors.status.critical.border : undefined}
      style={[styles.card, !alert.read && styles.unreadCard]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {!alert.read && <View style={styles.unreadDot} />}
          <Badge
            label={alert.severity.toUpperCase()}
            variant={badgeVariant}
            size="small"
          />
        </View>
        <Text style={styles.timestamp}>{alert.timestamp}</Text>
      </View>

      <Text style={[styles.title, !alert.read && styles.unreadTitle]}>
        {alert.title}
      </Text>
      <Text style={styles.message}>{alert.message}</Text>

      {alert.entityId && alert.entityType && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.entityButton}
            onPress={() => onEntityPress && onEntityPress(alert.entityType!, alert.entityId!)}
            accessibilityRole="button"
            accessibilityLabel={`View ${alert.entityType} ${alert.entityId}`}
          >
            <Ionicons name="link-outline" size={14} color={Colors.cyan[400]} />
            <Text style={styles.entityText}>
              Investigate {alert.entityType.toUpperCase()}: {alert.entityId}
            </Text>
          </TouchableOpacity>

          {alert.actionRequired && (
            <Badge label="ACTION REQUIRED" variant="critical" size="small" />
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  unreadCard: {
    backgroundColor: Colors.surfaceElevated,
    borderLeftWidth: 3,
    borderLeftColor: Colors.cyan[500],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cyan[500],
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  title: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  entityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entityText: {
    ...Typography.monoSmall,
    color: Colors.cyan[400],
    fontSize: 11,
    fontWeight: '600',
  },
});
