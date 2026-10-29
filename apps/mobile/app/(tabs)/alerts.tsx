import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, FilterChips, EmptyState } from '../../src/components';
import { useAlerts, AlertCard } from '../../src/features/alerts';
import { Colors, Spacing } from '../../src/theme';

export default function AlertsScreen() {
  const router = useRouter();
  const {
    alerts,
    filteredAlerts,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshAlerts,
    isLoading,
    isRefreshing,
  } = useAlerts();

  const filterOptions = [
    { id: 'all', label: 'All Alerts', count: alerts.length },
    {
      id: 'unread',
      label: 'Unread',
      count: unreadCount,
    },
    {
      id: 'critical',
      label: 'Critical',
      count: alerts.filter(a => a.severity === 'Critical').length,
    },
    {
      id: 'high',
      label: 'High',
      count: alerts.filter(a => a.severity === 'High').length,
    },
  ];

  const handleEntityPress = (entityType: string, entityId: string) => {
    // Map alert entityType to detail route type
    let routeType = entityType;
    if (entityType === 'po') routeType = 'po';
    else if (entityType === 'shipment') routeType = 'shipment';
    else if (entityType === 'inventory') routeType = 'inventory';

    router.push({
      pathname: '/details/[type]/[id]',
      params: { type: routeType, id: entityId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="ALERTS"
        subtitle={unreadCount > 0 ? `${unreadCount} unread incident notifications` : 'All alerts acknowledged'}
        badgeLabel={unreadCount > 0 ? `${unreadCount} UNREAD` : 'NOMINAL'}
        badgeVariant={unreadCount > 0 ? 'critical' : 'success'}
        rightAction={{
          icon: 'settings-outline',
          onPress: () => router.push('/settings/notifications'),
          accessibilityLabel: 'Notification preferences',
        }}
      />

      <FilterChips
        options={filterOptions}
        selectedId={filter}
        onSelect={id => setFilter(id as any)}
      />

      <FlatList
        data={filteredAlerts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refreshAlerts(true)}
            tintColor={Colors.cyan[500]}
            colors={[Colors.cyan[500]]}
            progressBackgroundColor={Colors.surfaceElevated}
          />
        }
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={() => markAsRead(item.id)}
            onEntityPress={handleEntityPress}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No alerts to display"
            description="Operational telemetry is within normal tolerance bounds."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
});
