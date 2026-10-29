import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShipmentRecord } from '../../types';
import { Colors, Typography, Spacing } from '../../theme';
import { Card, Badge } from '../../components';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ShipmentCardProps {
  shipment: ShipmentRecord;
  onPress?: () => void;
  onActionPress?: (action: string) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onPress,
  onActionPress,
}) => {
  const isDelayed = shipment.delayDays > 0;
  const statusVariant =
    shipment.status === 'Delivered'
      ? 'success'
      : isDelayed
      ? 'critical'
      : shipment.status === 'In Transit'
      ? 'info'
      : 'default';

  return (
    <Card
      interactive={!!onPress}
      onPress={onPress}
      borderColor={isDelayed ? Colors.status.critical.border : undefined}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.idGroup}>
          <Text style={styles.id}>{shipment.id}</Text>
          <Text style={styles.carrier}>{shipment.carrier}</Text>
        </View>
        <Badge
          label={isDelayed ? `DELAYED +${shipment.delayDays}D` : shipment.status.toUpperCase()}
          variant={statusVariant}
          size="small"
        />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Ionicons name="radio-button-on" size={14} color={Colors.cyan[500]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {shipment.origin}
          </Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routePoint}>
          <Ionicons name="location" size={14} color={isDelayed ? Colors.status.critical.text : Colors.textPrimary} />
          <Text style={styles.routeText} numberOfLines={1}>
            {shipment.destination}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>PO Reference</Text>
          <Text style={styles.metaValue}>{shipment.poId}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>ETA</Text>
          <Text style={styles.metaValue}>{formatDate(shipment.expectedArrival)}</Text>
        </View>
        <View style={styles.metaItemRight}>
          <Text style={styles.metaLabel}>Freight Cost</Text>
          <Text style={styles.metaValue}>{formatCurrency(shipment.freightCost)}</Text>
        </View>
      </View>

      {isDelayed && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={16} color={Colors.status.critical.text} />
          <Text style={styles.alertBannerText}>
            Transit disruption detected. Priority rerouting advised.
          </Text>
        </View>
      )}

      {onActionPress && isDelayed && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onActionPress('REROUTE_SHIPMENT')}
            accessibilityRole="button"
            accessibilityLabel={`Reroute shipment ${shipment.id}`}
          >
            <Ionicons name="git-branch-outline" size={14} color={Colors.cyan[400]} />
            <Text style={styles.actionButtonText}>Reroute Corridor</Text>
          </TouchableOpacity>
        </View>
      )}
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
  idGroup: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  id: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
  },
  carrier: {
    ...Typography.caption,
    color: Colors.cyan[400],
    marginTop: 2,
  },
  routeContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeDivider: {
    width: 2,
    height: 12,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 6,
    marginVertical: 2,
  },
  routeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flex: 1,
  },
  metaItemRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  metaValue: {
    ...Typography.monoMedium,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.status.critical.bg,
    borderRadius: 6,
    padding: Spacing.xs,
    marginTop: Spacing.sm,
  },
  alertBannerText: {
    ...Typography.caption,
    color: Colors.status.critical.text,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cyan.glow,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  actionButtonText: {
    ...Typography.labelSmall,
    color: Colors.cyan[300],
  },
});
