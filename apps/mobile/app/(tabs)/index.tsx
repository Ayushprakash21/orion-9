import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth';
import { useData } from '../../src/features/control-tower';
import { NetworkHealthCard, QuickStatsGrid, RecentActivityFeed } from '../../src/features/home';
import { Header, LoadingScreen } from '../../src/components';
import { Colors, Spacing, Typography } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { session, environment } = useAuth();
  const { metrics, recentEvents, isRefreshing, refreshData, isLoading, lastRefreshedAt } = useData();

  const handleSelectHotspot = (category: 'exceptions' | 'shipments' | 'inventory' | 'orders') => {
    router.push({
      pathname: '/(tabs)/control',
      params: { category },
    });
  };

  if (isLoading && !metrics) {
    return <LoadingScreen message="Initializing Orion-9 Telemetry Engine..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="ORION-9 CONTROL"
        subtitle={session ? `${session.user.fullName} • ${session.user.role.toUpperCase()}` : 'Enterprise Telemetry'}
        badgeLabel={environment}
        badgeVariant={environment === 'LIVE' ? 'success' : 'info'}
        rightAction={{
          icon: 'refresh-outline',
          onPress: refreshData,
          accessibilityLabel: 'Refresh operational telemetry',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={Colors.cyan[500]}
            colors={[Colors.cyan[500]]}
            progressBackgroundColor={Colors.surfaceElevated}
          />
        }
      >
        {metrics && (
          <NetworkHealthCard
            score={metrics.networkHealthIndex}
            environment={environment}
            lastUpdated={lastRefreshedAt}
          />
        )}

        {metrics && (
          <QuickStatsGrid
            metrics={metrics}
            onSelectCategory={handleSelectHotspot}
          />
        )}

        <RecentActivityFeed events={recentEvents} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
});
