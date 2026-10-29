import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupplierRecord } from '../../types';
import { Colors, Typography, Spacing } from '../../theme';
import { Card, Badge } from '../../components';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface SupplierCardProps {
  supplier: SupplierRecord;
  onPress?: () => void;
  onContactPress?: (contact: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onPress,
  onContactPress,
}) => {
  const risk = supplier.riskLevel || 'Medium';
  const isHighRisk = risk === 'High' || risk === 'Critical';
  const riskVariant =
    risk === 'High' || risk === 'Critical'
      ? 'critical'
      : risk === 'Medium'
      ? 'warning'
      : 'success';

  return (
    <Card
      interactive={!!onPress}
      onPress={onPress}
      borderColor={isHighRisk ? Colors.status.critical.border : undefined}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.name}>{supplier.name}</Text>
          <Text style={styles.category}>
            {supplier.category} • {supplier.country || supplier.region}
          </Text>
        </View>
        <Badge
          label={`${risk.toUpperCase()} RISK`}
          variant={riskVariant}
          size="small"
        />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>OTIF Fulfillment</Text>
          <Text
            style={[
              styles.metricValue,
              supplier.otif < 85 && { color: Colors.status.critical.text },
            ]}
          >
            {formatPercentage(supplier.otif)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Quality Score</Text>
          <Text style={styles.metricValue}>{formatPercentage(supplier.qualityRate)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Defect Rate</Text>
          <Text
            style={[
              styles.metricValue,
              supplier.defectRate > 2.0 && { color: Colors.status.critical.text },
            ]}
          >
            {formatPercentage(supplier.defectRate)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Lead Time</Text>
          <Text style={styles.metricValue}>{supplier.leadTime}d avg</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.spendLabel}>Annual Spend Commitment</Text>
          <Text style={styles.spendValue}>{formatCurrency(supplier.spend)}</Text>
        </View>

        {onContactPress && supplier.contact && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => onContactPress(supplier.contact!)}
            accessibilityRole="button"
            accessibilityLabel={`Contact supplier ${supplier.name}`}
          >
            <Ionicons name="mail-outline" size={14} color={Colors.cyan[400]} />
            <Text style={styles.contactText}>Contact Lead</Text>
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
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  metricValue: {
    ...Typography.monoSmall,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
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
  spendLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  spendValue: {
    ...Typography.monoSmall,
    color: Colors.cyan[300],
    fontWeight: '700',
    marginTop: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cyan.glow,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  contactText: {
    ...Typography.labelSmall,
    color: Colors.cyan[300],
  },
});
