import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useData,
  ExceptionCard,
  ShipmentCard,
  InventoryRiskCard,
  SupplierCard,
} from '../../src/features/control-tower';
import { PurchaseOrderListView } from '../../src/features/orders';
import {
  Header,
  FilterChips,
  SearchBar,
  EmptyState,
  ConfirmationModal,
} from '../../src/components';
import { Colors, Spacing, Typography } from '../../src/theme';
import { ExceptionRecord } from '../../src/types';

type DomainTab = 'exceptions' | 'shipments' | 'inventory' | 'suppliers' | 'orders';

export default function ControlTowerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const {
    exceptions,
    shipments,
    inventory,
    suppliers,
    isRefreshing,
    refreshData,
    executeAction,
  } = useData();

  const [activeTab, setActiveTab] = useState<DomainTab>('exceptions');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High' | 'Medium'>('ALL');

  // Modal confirmation state for consequential actions
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    actionType: string;
    entityId: string;
    parameters?: Record<string, any>;
  }>({
    visible: false,
    title: '',
    description: '',
    actionType: '',
    entityId: '',
  });

  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (params.category) {
      if (['exceptions', 'shipments', 'inventory', 'suppliers', 'orders'].includes(params.category)) {
        setActiveTab(params.category as DomainTab);
      }
    }
  }, [params.category]);

  const domainTabs = [
    { id: 'exceptions', label: 'Exceptions', count: exceptions.length },
    { id: 'shipments', label: 'Shipments', count: shipments.length },
    { id: 'inventory', label: 'Inventory', count: inventory.length },
    { id: 'suppliers', label: 'Suppliers', count: suppliers.length },
    { id: 'orders', label: 'Purchase Orders' },
  ];

  const severityOptions = [
    { id: 'ALL', label: 'All Severities' },
    { id: 'Critical', label: 'Critical', count: exceptions.filter(e => e.severity === 'Critical').length },
    { id: 'High', label: 'High', count: exceptions.filter(e => e.severity === 'High').length },
    { id: 'Medium', label: 'Medium', count: exceptions.filter(e => e.severity === 'Medium').length },
  ];

  const handleActionRequest = (
    title: string,
    description: string,
    actionType: string,
    entityId: string,
    parameters?: Record<string, any>
  ) => {
    setConfirmModal({
      visible: true,
      title,
      description,
      actionType,
      entityId,
      parameters,
    });
  };

  const handleConfirmAction = async () => {
    setIsExecuting(true);
    try {
      const res = await executeAction(
        confirmModal.actionType,
        confirmModal.entityId,
        confirmModal.parameters
      );
      setConfirmModal(prev => ({ ...prev, visible: false }));
      Alert.alert('Action Confirmed', res.message);
    } catch (err: any) {
      Alert.alert('Authorization Failed', err.message || 'Could not execute operational action.');
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredExceptions = exceptions.filter(e => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredShipments = shipments.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.poId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredInventory = inventory.filter(i => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.productId.toLowerCase().includes(q) ||
        i.warehouseId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredSuppliers = suppliers.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="CONTROL TOWER"
        subtitle="Operational Exceptions & Workflows"
        rightAction={{
          icon: 'refresh-outline',
          onPress: refreshData,
          accessibilityLabel: 'Refresh Control Tower',
        }}
      />

      {/* Domain Navigation Tabs */}
      <FilterChips
        options={domainTabs}
        selectedId={activeTab}
        onSelect={id => setActiveTab(id as DomainTab)}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${activeTab}...`}
        />
      </View>

      {/* Sub-Filters for Exceptions */}
      {activeTab === 'exceptions' && (
        <FilterChips
          options={severityOptions}
          selectedId={severityFilter}
          onSelect={id => setSeverityFilter(id as any)}
        />
      )}

      {/* Domain Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'exceptions' && (
          <FlatList
            data={filteredExceptions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                tintColor={Colors.cyan[500]}
                colors={[Colors.cyan[500]]}
                progressBackgroundColor={Colors.surfaceElevated}
              />
            }
            renderItem={({ item }) => (
              <ExceptionCard
                exception={item}
                onPress={() =>
                  router.push({
                    pathname: '/details/[type]/[id]',
                    params: { type: 'exception', id: item.id },
                  })
                }
                onActionPress={() =>
                  handleActionRequest(
                    `Resolve ${item.id}`,
                    item.recommendedAction,
                    'RESOLVE_EXCEPTION',
                    item.id,
                    { action: item.recommendedAction }
                  )
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No operational exceptions found"
                description="All systems nominal or filter parameters exclude active records."
              />
            }
          />
        )}

        {activeTab === 'shipments' && (
          <FlatList
            data={filteredShipments}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                tintColor={Colors.cyan[500]}
                colors={[Colors.cyan[500]]}
                progressBackgroundColor={Colors.surfaceElevated}
              />
            }
            renderItem={({ item }) => (
              <ShipmentCard
                shipment={item}
                onPress={() =>
                  router.push({
                    pathname: '/details/[type]/[id]',
                    params: { type: 'shipment', id: item.id },
                  })
                }
                onActionPress={action =>
                  handleActionRequest(
                    `Reroute ${item.id}`,
                    `Confirm intermodal corridor change for consignment ${item.id} (${item.carrier}).`,
                    action,
                    item.id,
                    { corridor: 'PAC-04' }
                  )
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No shipments matching query"
                description="No active consignments found in this lane."
              />
            }
          />
        )}

        {activeTab === 'inventory' && (
          <FlatList
            data={filteredInventory}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                tintColor={Colors.cyan[500]}
                colors={[Colors.cyan[500]]}
                progressBackgroundColor={Colors.surfaceElevated}
              />
            }
            renderItem={({ item }) => (
              <InventoryRiskCard
                inventory={item}
                onPress={() =>
                  router.push({
                    pathname: '/details/[type]/[id]',
                    params: { type: 'inventory', id: item.productId },
                  })
                }
                onRebalancePress={sku =>
                  handleActionRequest(
                    `Trigger Rebalance for ${sku}`,
                    `Authorize emergency stock rebalance of 45 units to ${item.warehouseId}.`,
                    'CALIBRATE_BUFFER',
                    sku,
                    { warehouseId: item.warehouseId, quantity: 45 }
                  )
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No inventory records found"
                description="Adjust search query."
              />
            }
          />
        )}

        {activeTab === 'suppliers' && (
          <FlatList
            data={filteredSuppliers}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                tintColor={Colors.cyan[500]}
                colors={[Colors.cyan[500]]}
                progressBackgroundColor={Colors.surfaceElevated}
              />
            }
            renderItem={({ item }) => (
              <SupplierCard
                supplier={item}
                onPress={() =>
                  router.push({
                    pathname: '/details/[type]/[id]',
                    params: { type: 'supplier', id: item.id },
                  })
                }
                onContactPress={contact =>
                  Alert.alert('Supplier Contact', `Contacting procurement liaison: ${contact}`)
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No suppliers found"
                description="Adjust search filter."
              />
            }
          />
        )}

        {activeTab === 'orders' && (
          <PurchaseOrderListView
            onSelectPo={poId =>
              router.push({
                pathname: '/details/[type]/[id]',
                params: { type: 'po', id: poId },
              })
            }
          />
        )}
      </View>

      {/* Operational Consequential Action Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Authorize Action"
        cancelLabel="Dismiss"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        isConsequential
        isLoading={isExecuting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
});
