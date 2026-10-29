import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, Badge } from '../../components';

interface NetworkHealthCardProps {
  score: number;
  environment: 'DEMO' | 'LIVE';
  lastUpdated?: string | null;
}

export const NetworkHealthCard: React.FC<NetworkHealthCardProps> = ({
  score = 87,
  environment = 'DEMO',
  lastUpdated,
}) => {
  const isOptimal = score >= 85;
  const statusVariant = isOptimal ? 'success' : score >= 70 ? 'warning' : 'critical';
  const statusLabel = isOptimal ? 'OPERATIONAL' : score >= 70 ? 'DEGRADED' : 'CRITICAL';

  const subsystems = [
    { name: 'Logistics Fabric', status: 'Optimal', ok: true },
    { name: 'Inventory Buffers', status: 'Warning (2 SKUs)', ok: false },
    { name: 'Supplier EDI', status: 'Synced', ok: true },
    { name: 'Cognitive Copilot', status: 'Online', ok: true },
  ];

  return (
    <Card borderColor={Colors.borderCyan} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>NETWORK HEALTH INDEX</Text>
          <Text style={styles.subTitle}>Multi-Tier Global Telemetry</Text>
        </View>
        <Badge
          label={`${environment} • ${statusLabel}`}
          variant={statusVariant}
          size="small"
        />
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{score}%</Text>
          <Text style={styles.scoreScale}>/ 100%</Text>
        </View>

        <View style={styles.subsystemsContainer}>
          {subsystems.map((sub, i) => (
            <View key={i} style={styles.subsystemRow}>
              <Ionicons
                name={sub.ok ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={sub.ok ? Colors.status.success.text : Colors.status.high.text}
              />
              <Text style={styles.subsystemName}>{sub.name}</Text>
              <Text
                style={[
                  styles.subsystemStatus,
                  !sub.ok && { color: Colors.status.high.text },
                ]}
              >
                {sub.status}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {lastUpdated && (
        <View style={styles.footerRow}>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.footerText}>Telemetry synced at {lastUpdated}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.labelSmall,
    color: Colors.cyan[400],
    letterSpacing: 1.2,
  },
  subTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 2,
    borderColor: Colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...Typography.titleLarge,
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  scoreScale: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: -2,
  },
  subsystemsContainer: {
    flex: 1,
    gap: 6,
  },
  subsystemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subsystemName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  subsystemStatus: {
    ...Typography.monoSmall,
    color: Colors.status.success.text,
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
});
