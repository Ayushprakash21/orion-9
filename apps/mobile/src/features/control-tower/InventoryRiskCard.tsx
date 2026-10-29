import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryRecord } from '../../types';
import { Colors, Typography, Spacing } from '../../theme';
import { Card, Badge } from '../../components';
import { formatNumber, formatCurrency } from '../../utils/formatters';

interface InventoryRiskCardProps {
  inventory: InventoryRecord;
  onPress?: () => void;
  onRebalancePress?: (sku: string) => void;
}

export const InventoryRiskCard: React.FC<InventoryRiskCardProps> = ({
  inventory,
  onPress,
  onRebalancePress,
}) => {
  const available = inventory.onHand - inventory.reserved;
  const isBelowSafety = available < inventory.safetyStock;
  const demand = inventory.dailyDemand || 1;
  const daysOfSupply = Math.round((available / demand) * 10) / 10;

  const severityVariant =
    daysOfSupply <= 3 ? 'critical' : daysOfSupply <= 7 ? 'warning' : 'info';

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((available / Math.max(1, inventory.safetyStock)) * 100))
  );

  return (
    <Card
      interactive={!!onPress}
      onPress={onPress}
      borderColor={isBelowSafety ? Colors.status.critical.border : undefined}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.sku}>{inventory.productId}</Text>
          <Text style={styles.warehouse}>Warehouse: {inventory.warehouseId}</Text>
        </View>
        <Badge
          label={`${daysOfSupply}D SUPPLY`}
          variant={severityVariant}
          size="small"
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Available</Text>
          <Text
            style={[
              styles.statValue,
              isBelowSafety && { color: Colors.status.critical.text },
            ]}
          >
            {formatNumber(available)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Safety Stock</Text>
          <Text style={styles.statValue}>{formatNumber(inventory.safetyStock)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>In Transit</Text>
          <Text style={styles.statValue}>{formatNumber(inventory.inTransit)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Lead Time</Text>
          <Text style={styles.statValue}>{inventory.leadTime}d</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Buffer Coverage</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isBelowSafety
                  ? Colors.status.critical.solid
                  : Colors.cyan[500],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.costText}>
          Unit Cost: {formatCurrency(inventory.unitCost)}
        </Text>
        {onRebalancePress && isBelowSafety && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onRebalancePress(inventory.productId)}
            accessibilityRole="button"
            accessibilityLabel={`Calibrate rebalance for ${inventory.productId}`}
          >
            <Ionicons name="refresh-outline" size={14} color={Colors.cyan[400]} />
            <Text style={styles.actionText}>Trigger Rebalance</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleGroup: {
    flex: 1,
  },
  sku: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
  },
  warehouse: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  statValue: {
    ...Typography.monoSmall,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  progressPercent: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  costText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cyan.glow,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  actionText: {
    ...Typography.labelSmall,
    color: Colors.cyan[300],
  },
});
