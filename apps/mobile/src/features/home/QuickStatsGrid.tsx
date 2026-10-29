import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardMetrics } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface QuickStatsGridProps {
  metrics: DashboardMetrics;
  onSelectCategory: (category: 'exceptions' | 'shipments' | 'inventory' | 'orders') => void;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  metrics,
  onSelectCategory,
}) => {
  const statTiles = [
    {
      id: 'exceptions' as const,
      label: 'Critical Exceptions',
      count: metrics.criticalExceptionsCount,
      icon: 'alert-triangle' as const,
      color: Colors.status.critical.text,
      bgColor: Colors.status.critical.bg,
      borderColor: Colors.status.critical.border,
      subtext: 'Requires Immediate Action',
    },
    {
      id: 'shipments' as const,
      label: 'Delayed Shipments',
      count: metrics.delayedShipmentsCount,
      icon: 'boat-outline' as const,
      color: Colors.status.critical.text,
      bgColor: Colors.status.critical.bg,
      borderColor: Colors.status.critical.border,
      subtext: 'Transshipment & Port Delays',
    },
    {
      id: 'inventory' as const,
      label: 'Inventory At Risk',
      count: metrics.inventoryRiskCount,
      icon: 'cube-outline' as const,
      color: Colors.status.high.text,
      bgColor: Colors.status.high.bg,
      borderColor: Colors.status.high.border,
      subtext: 'Below Safety Stock Level',
    },
    {
      id: 'orders' as const,
      label: 'Overdue / Delayed POs',
      count: metrics.overduePOCount,
      icon: 'document-text-outline' as const,
      color: Colors.status.high.text,
      bgColor: Colors.status.high.bg,
      borderColor: Colors.status.high.border,
      subtext: `Total Spend: $${Math.round(metrics.totalSpendCommitment / 1000)}k`,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>OPERATIONAL HOTSPOTS</Text>
      <View style={styles.grid}>
        {statTiles.map(tile => (
          <TouchableOpacity
            key={tile.id}
            style={[
              styles.tile,
              {
                backgroundColor: tile.bgColor,
                borderColor: tile.borderColor,
              },
            ]}
            onPress={() => onSelectCategory(tile.id)}
            accessibilityRole="button"
            accessibilityLabel={`${tile.label}: ${tile.count} items. Tap to view.`}
          >
            <View style={styles.tileHeader}>
              <Ionicons name={tile.icon as any} size={20} color={tile.color} />
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
            <Text style={[styles.tileCount, { color: tile.color }]}>
              {tile.count}
            </Text>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Text style={styles.tileSubtext} numberOfLines={1}>
              {tile.subtext}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tile: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tileCount: {
    ...Typography.titleLarge,
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 2,
  },
  tileLabel: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tileSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
