import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OperationalEvent } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card } from '../../components';

interface RecentActivityFeedProps {
  events: OperationalEvent[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ events }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>REAL-TIME EVENT STREAM</Text>
      <Card style={styles.card}>
        {events.map((evt, index) => (
          <View
            key={evt.id}
            style={[
              styles.eventItem,
              index < events.length - 1 && styles.eventItemBorder,
            ]}
          >
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: evt.badgeColor || Colors.cyan[500] },
                ]}
              />
              {index < events.length - 1 && <View style={styles.threadLine} />}
            </View>

            <View style={styles.contentCol}>
              <View style={styles.eventHeader}>
                <Text style={styles.sourceText}>{evt.source}</Text>
                <Text style={styles.timestampText}>{evt.timestamp}</Text>
              </View>
              <Text style={styles.eventTitle}>{evt.eventType}</Text>
              <Text style={styles.eventDescription}>{evt.description}</Text>
              <View style={styles.entityRow}>
                <Ionicons name="link-outline" size={12} color={Colors.cyan[400]} />
                <Text style={styles.entityText}>{evt.entityId}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  card: {
    paddingVertical: Spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  threadLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.borderSubtle,
    marginTop: 4,
  },
  contentCol: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  timestampText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  eventTitle: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  eventDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  entityText: {
    ...Typography.monoSmall,
    color: Colors.cyan[300],
    fontSize: 10,
  },
});
